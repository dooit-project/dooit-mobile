#!/usr/bin/env node

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');

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

  console.log('Guest auth smoke passed. Access token was not printed.');
  console.log(
    'Note: this smoke creates one guest account; backend expiration cleanup owns removal.',
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
