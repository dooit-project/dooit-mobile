#!/usr/bin/env node

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `mobile-guest-smoke-${runId}@example.com`;
const password = `M-guest-${runId}`;
const displayName = `게스트 병합 스모크 ${runId.slice(-6)}`;
const taskTitle = `GM-${runId.slice(-12)}`;

async function readJsonBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response from ${apiUrl}. HTTP ${response.status}`);
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    signal: controller.signal,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  }).finally(() => clearTimeout(timeoutId));
  const body = await readJsonBody(response);

  if (!response.ok || body?.status === 'fail') {
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`${path} failed: ${message}`);
  }

  return body?.data ?? null;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log(`Guest auth smoke target: ${apiUrl}`);

  const registeredUser = await request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  assert(registeredUser?.email === email, 'merge target registration mismatch');
  console.log('✓ merge target registered');

  const session = await request('/api/v1/auth/guest', { method: 'POST' });
  assert(session?.tokenType === 'Bearer', 'guest tokenType must be Bearer');
  assert(typeof session.accessToken === 'string' && session.accessToken, 'guest token missing');
  assert(typeof session.expiresAt === 'string' && session.expiresAt, 'guest expiresAt missing');
  assert(session.user?.accountType === 'GUEST', 'guest user accountType mismatch');
  assert(session.user.email === null, 'guest user email must be null');
  assert(session.user.displayName === null, 'guest user displayName must be null');
  console.log('✓ guest session issued');

  const me = await request('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  assert(me?.id === session.user.id, 'guest /me user id mismatch');
  assert(me.accountType === 'GUEST', 'guest /me accountType mismatch');
  assert(me.email === null, 'guest /me email must be null');
  assert(me.displayName === null, 'guest /me displayName must be null');
  console.log('✓ guest /me');

  const refreshedSession = await request('/api/v1/auth/guest/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  assert(refreshedSession.user?.id === session.user.id, 'guest refresh changed user id');
  assert(refreshedSession.accessToken, 'refreshed guest token missing');
  console.log('✓ guest token refreshed with same user id');

  const guestHeaders = { Authorization: `Bearer ${refreshedSession.accessToken}` };
  const guestTask = await request('/api/v1/tasks', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({
      title: taskTitle,
      description: '게스트 병합 smoke',
      type: 'TODO',
      category: 'Smoke',
      allDay: false,
    }),
  });
  assert(guestTask?.title === taskTitle, 'guest task creation mismatch');
  console.log('✓ guest task created');

  const mergedSession = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ email, password }),
  });
  assert(mergedSession.user?.id === registeredUser.id, 'login did not select target account');
  assert(mergedSession.user.accountType === 'REGISTERED', 'merged account type mismatch');
  assert(mergedSession.mergeResult?.tasks === 1, 'merged task count mismatch');
  console.log('✓ guest data merged into registered account');

  const registeredHeaders = { Authorization: `Bearer ${mergedSession.accessToken}` };
  const mergedTask = await request(`/api/v1/tasks/${guestTask.id}`, {
    headers: registeredHeaders,
  });
  assert(mergedTask?.title === taskTitle, 'merged task is not readable by target account');
  console.log('✓ merged task ownership verified');

  const secondLogin = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: registeredHeaders,
    body: JSON.stringify({ email, password }),
  });
  assert(secondLogin.mergeResult === null, 'normal login must not report another guest merge');

  const inbox = await request('/api/v1/tasks/inbox', {
    headers: { Authorization: `Bearer ${secondLogin.accessToken}` },
  });
  assert(
    inbox.filter((task) => task.id === guestTask.id).length === 1,
    'subsequent login duplicated the merged task',
  );
  console.log('✓ subsequent login did not duplicate merged data');

  await request(`/api/v1/tasks/${guestTask.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${secondLogin.accessToken}` },
  });
  console.log('✓ merged smoke task cleaned up');

  console.log('Guest auth and merge smoke passed. Access tokens and password were not printed.');
  console.log(
    'Note: this smoke creates one registered and one merged guest account; backend cleanup owns removal.',
  );
}

main().catch((error) => {
  if (error?.name === 'AbortError') {
    console.error(`Guest auth smoke timed out while connecting to ${apiUrl}`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
