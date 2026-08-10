#!/usr/bin/env node

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `mobile-guest-smoke-${runId}@example.com`;
const password = `M-guest-${runId}`;
const displayName = `게스트 병합 스모크 ${runId.slice(-6)}`;
const taskTitle = `GM-${runId.slice(-12)}`;
const scheduleTitle = `GS-${runId.slice(-12)}`;
const ddayTitle = `GD-${runId.slice(-12)}`;
const ddayTaskTitle = `GDT-${runId.slice(-11)}`;
const promotionEmail = `mobile-guest-promote-${runId}@example.com`;
const promotionPassword = `M-promote-${runId}`;
const promotionTaskTitle = `GP-${runId.slice(-12)}`;

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
    const error = new Error(`${path} failed: ${message}`);
    error.status = response.status;
    error.code = body?.error?.code;
    throw error;
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

  const guestSchedule = await request('/api/v1/tasks', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({
      title: scheduleTitle,
      description: '게스트 반복 일정 병합 smoke',
      type: 'SCHEDULE',
      startAt: '2026-08-18T09:00:00',
      endAt: '2026-08-18T10:00:00',
      category: 'Smoke',
      allDay: false,
      recurrence: {
        frequency: 'DAILY',
        interval: 1,
        recurrenceCount: 2,
      },
    }),
  });
  assert(guestSchedule?.recurrenceSeriesId, 'guest recurrence series missing');
  console.log('✓ guest recurring schedule created');

  const guestDday = await request('/api/v1/dday-goals', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ title: ddayTitle, targetDate: '2026-12-31' }),
  });
  const guestDdayTask = await request(`/api/v1/dday-goals/${guestDday.id}/tasks`, {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ title: ddayTaskTitle, date: '2026-08-20' }),
  });
  assert(guestDdayTask?.ddayGoalId === guestDday.id, 'guest D-Day task relation mismatch');
  console.log('✓ guest D-Day goal and linked task created');

  let invalidLoginError;
  try {
    await request('/api/v1/auth/login', {
      method: 'POST',
      headers: guestHeaders,
      body: JSON.stringify({ email, password: `${password}-wrong` }),
    });
  } catch (error) {
    invalidLoginError = error;
  }
  assert(invalidLoginError?.status === 401, 'invalid login must fail with HTTP 401');
  const guestAfterInvalidLogin = await request('/api/v1/auth/me', { headers: guestHeaders });
  const taskAfterInvalidLogin = await request(`/api/v1/tasks/${guestTask.id}`, {
    headers: guestHeaders,
  });
  assert(guestAfterInvalidLogin.id === session.user.id, 'invalid login changed guest user');
  assert(taskAfterInvalidLogin.id === guestTask.id, 'invalid login lost guest data');
  console.log('✓ invalid login preserved guest session and data');

  const mergedSession = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ email, password }),
  });
  assert(mergedSession.user?.id === registeredUser.id, 'login did not select target account');
  assert(mergedSession.user.accountType === 'REGISTERED', 'merged account type mismatch');
  assert(mergedSession.mergeResult?.tasks === 2, 'merged task count mismatch');
  assert(mergedSession.mergeResult.schedules === 1, 'merged schedule count mismatch');
  assert(mergedSession.mergeResult.ddayGoals === 1, 'merged D-Day count mismatch');
  assert(mergedSession.mergeResult.recurrenceSeries === 1, 'merged recurrence count mismatch');
  console.log('✓ guest data merged into registered account');

  const registeredHeaders = { Authorization: `Bearer ${mergedSession.accessToken}` };
  const mergedTask = await request(`/api/v1/tasks/${guestTask.id}`, {
    headers: registeredHeaders,
  });
  assert(mergedTask?.title === taskTitle, 'merged task is not readable by target account');
  const mergedSchedule = await request(`/api/v1/tasks/${guestSchedule.id}`, {
    headers: registeredHeaders,
  });
  assert(
    mergedSchedule?.recurrenceSeriesId === guestSchedule.recurrenceSeriesId,
    'merged recurrence series relation mismatch',
  );
  const mergedDday = await request(`/api/v1/dday-goals/${guestDday.id}`, {
    headers: registeredHeaders,
  });
  assert(mergedDday?.title === ddayTitle, 'merged D-Day goal is not readable');
  const mergedDdayTasks = await request(`/api/v1/dday-goals/${guestDday.id}/tasks`, {
    headers: registeredHeaders,
  });
  assert(
    mergedDdayTasks.some(
      (task) => task.id === guestDdayTask.id && task.ddayGoalId === guestDday.id,
    ),
    'merged D-Day task relation mismatch',
  );
  console.log('✓ merged Task, recurrence, and D-Day relations verified');

  const retriedMergeSession = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ email, password }),
  });
  assert(retriedMergeSession.user.id === registeredUser.id, 'merge retry target mismatch');
  assert(retriedMergeSession.mergeResult?.tasks === 0, 'merge retry moved tasks again');
  assert(retriedMergeSession.mergeResult.schedules === 0, 'merge retry moved schedules again');
  assert(retriedMergeSession.mergeResult.ddayGoals === 0, 'merge retry moved D-Days again');
  assert(
    retriedMergeSession.mergeResult.recurrenceSeries === 0,
    'merge retry moved recurrence again',
  );
  console.log('✓ same guest token merge retry was idempotent');

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
  await request(`/api/v1/tasks/${guestSchedule.id}?recurrenceScope=ALL`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${secondLogin.accessToken}` },
  });
  await request(`/api/v1/tasks/${guestDdayTask.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${secondLogin.accessToken}` },
  });
  await request(`/api/v1/dday-goals/${guestDday.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${secondLogin.accessToken}` },
  });
  console.log('✓ merged smoke data cleaned up');

  const promotionGuest = await request('/api/v1/auth/guest', { method: 'POST' });
  const promotionGuestHeaders = {
    Authorization: `Bearer ${promotionGuest.accessToken}`,
  };
  const promotionTask = await request('/api/v1/tasks', {
    method: 'POST',
    headers: promotionGuestHeaders,
    body: JSON.stringify({
      title: promotionTaskTitle,
      description: '게스트 회원가입 승격 smoke',
      type: 'TODO',
      category: 'Smoke',
      allDay: false,
    }),
  });

  let conflictError;
  try {
    await request('/api/v1/auth/register', {
      method: 'POST',
      headers: promotionGuestHeaders,
      body: JSON.stringify({ email, password: promotionPassword, displayName }),
    });
  } catch (error) {
    conflictError = error;
  }
  assert(conflictError?.status === 409, 'existing email promotion must fail with HTTP 409');

  const guestAfterConflict = await request('/api/v1/auth/me', {
    headers: promotionGuestHeaders,
  });
  const taskAfterConflict = await request(`/api/v1/tasks/${promotionTask.id}`, {
    headers: promotionGuestHeaders,
  });
  assert(guestAfterConflict.id === promotionGuest.user.id, 'promotion conflict changed guest id');
  assert(guestAfterConflict.accountType === 'GUEST', 'promotion conflict changed account type');
  assert(taskAfterConflict.id === promotionTask.id, 'promotion conflict lost guest data');
  console.log('✓ registration conflict preserved guest session and data');

  const promotedSession = await request('/api/v1/auth/register', {
    method: 'POST',
    headers: promotionGuestHeaders,
    body: JSON.stringify({
      email: promotionEmail,
      password: promotionPassword,
      displayName: `게스트 승격 ${runId.slice(-6)}`,
    }),
  });
  assert(promotedSession.tokenType === 'Bearer', 'promoted token contract mismatch');
  assert(promotedSession.user.id === promotionGuest.user.id, 'promotion changed user id');
  assert(promotedSession.user.accountType === 'REGISTERED', 'promotion account type mismatch');

  const promotedTask = await request(`/api/v1/tasks/${promotionTask.id}`, {
    headers: { Authorization: `Bearer ${promotedSession.accessToken}` },
  });
  assert(promotedTask.id === promotionTask.id, 'promoted account cannot read guest task');
  await request(`/api/v1/tasks/${promotionTask.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${promotedSession.accessToken}` },
  });
  console.log('✓ guest registration promoted same user and preserved data');

  console.log('Guest auth and merge smoke passed. Access tokens and password were not printed.');
  console.log(
    'Note: this smoke creates merge and promotion test accounts; backend cleanup owns account removal.',
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
