#!/usr/bin/env node

const { randomUUID } = require('node:crypto');

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const category = `Smoke-${runId.slice(-6)}`;

function getSeoulDate(daysFromNow) {
  const date = new Date(Date.now() + daysFromNow * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertCategorySummary(items, expectedCategory, minimumTaskCount) {
  const summary = items.find((item) => item.category === expectedCategory);
  assert(summary, `category summary missing: ${expectedCategory}`);
  assert(summary.displayName === expectedCategory, 'category displayName mismatch');
  assert(summary.taskCount >= minimumTaskCount, 'category taskCount mismatch');
  assert(
    ['inboxCount', 'todayCount', 'doneCount'].every(
      (field) => Number.isInteger(summary[field]) && summary[field] >= 0,
    ),
    'category counters must be non-negative integers',
  );
}

function assertDailyPlanSummary(summary, expected) {
  for (const [field, value] of Object.entries(expected)) {
    assert(summary[field] === value, `${field} expected ${value}, received ${summary[field]}`);
  }
}

async function readJsonBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response from ${apiUrl}. HTTP ${response.status}`);
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const body = await readJsonBody(response);

    if (!response.ok || body?.status === 'fail') {
      const error = new Error(
        `${path} failed: ${body?.error?.message ?? `HTTP ${response.status}`}`,
      );
      error.status = response.status;
      error.code = body?.error?.code;
      throw error;
    }

    return body?.data ?? null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  const referenceDate = getSeoulDate(0);
  const tomorrow = getSeoulDate(1);
  const dayAfterTomorrow = getSeoulDate(2);
  const createdTaskIds = [];
  let session;

  console.log(`Daily execution smoke target: ${apiUrl}`);

  try {
    session = await request('/api/v1/auth/guest', {
      method: 'POST',
      headers: { 'Idempotency-Key': randomUUID() },
    });
    assert(session?.accessToken, 'guest access token missing');
    assert(session?.refreshToken, 'guest refresh token missing');
    const headers = { Authorization: `Bearer ${session.accessToken}` };
    console.log('✓ isolated guest session issued');

    const quickHalfHour = await request('/api/v1/tasks/quick-capture', {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      body: JSON.stringify({
        text: '낼모레 오후 3시 반 치과',
        referenceDate,
        timeZone: 'Asia/Seoul',
        defaultCategory: category,
      }),
    });
    createdTaskIds.push(quickHalfHour.task.id);
    assert(quickHalfHour.parsed === true, 'half-hour quick capture was not parsed');
    assert(quickHalfHour.parsedDate === dayAfterTomorrow, '낼모레 parsedDate mismatch');
    assert(quickHalfHour.parsedTime === '15:30:00', 'N시 반 parsedTime mismatch');

    const quickColon = await request('/api/v1/tasks/quick-capture', {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      body: JSON.stringify({
        text: '내일 14:30 발표 준비',
        referenceDate,
        timeZone: 'Asia/Seoul',
        defaultCategory: category,
      }),
    });
    createdTaskIds.push(quickColon.task.id);
    assert(quickColon.parsed === true, 'colon-time quick capture was not parsed');
    assert(quickColon.parsedDate === tomorrow, '내일 parsedDate mismatch');
    assert(quickColon.parsedTime === '14:30:00', 'HH:mm parsedTime mismatch');
    console.log('✓ quick capture parses relative dates, half-hour, and HH:mm');

    const planTasks = [];
    for (const suffix of ['완료', '기록함', '다른 날짜']) {
      const task = await request('/api/v1/tasks', {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': randomUUID() },
        body: JSON.stringify({
          title: `실행 스모크 ${suffix} ${runId.slice(-5)}`,
          type: 'TODO',
          category,
          allDay: false,
        }),
      });
      createdTaskIds.push(task.id);
      planTasks.push(
        await request(`/api/v1/tasks/${task.id}/today?date=${referenceDate}`, {
          method: 'PATCH',
          headers,
        }),
      );
    }

    const firstItem = await request(`/api/v1/tasks/${planTasks[0].id}/checklist-items`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      body: JSON.stringify({ title: '자료 확인' }),
    });
    const secondItem = await request(`/api/v1/tasks/${planTasks[0].id}/checklist-items`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      body: JSON.stringify({ title: '마감 확인' }),
    });
    const renamedItem = await request(
      `/api/v1/tasks/${planTasks[0].id}/checklist-items/${firstItem.id}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ title: '자료 재확인' }),
      },
    );
    assert(renamedItem.title === '자료 재확인', 'checklist rename mismatch');
    const completedItem = await request(
      `/api/v1/tasks/${planTasks[0].id}/checklist-items/${firstItem.id}/done`,
      { method: 'PATCH', headers },
    );
    assert(completedItem.done === true, 'checklist complete mismatch');
    const reopenedItem = await request(
      `/api/v1/tasks/${planTasks[0].id}/checklist-items/${firstItem.id}/done/cancel`,
      { method: 'PATCH', headers },
    );
    assert(reopenedItem.done === false, 'checklist reopen mismatch');
    const reorderedItems = await request(`/api/v1/tasks/${planTasks[0].id}/checklist-items/order`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ orderedItemIds: [secondItem.id, firstItem.id] }),
    });
    assert(reorderedItems[0]?.id === secondItem.id, 'checklist reorder mismatch');
    await request(`/api/v1/tasks/${planTasks[0].id}/checklist-items/${secondItem.id}`, {
      method: 'DELETE',
      headers,
    });
    const remainingItems = await request(`/api/v1/tasks/${planTasks[0].id}/checklist-items`, {
      headers,
    });
    assert(
      remainingItems.length === 1 && remainingItems[0].id === firstItem.id,
      'checklist delete mismatch',
    );
    console.log('✓ personal checklist CRUD, complete/reopen, and reorder');

    const categories = await request('/api/v1/tasks/categories', { headers });
    assertCategorySummary(categories, category, 5);
    console.log('✓ personal category summary includes smoke tasks');

    const focusTaskIds = planTasks.map((task) => task.id);
    const plan = await request(`/api/v1/daily-plans/${referenceDate}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ focusTaskIds, status: 'CONFIRMED' }),
    });
    assert(plan.status === 'CONFIRMED', 'daily plan confirmation mismatch');
    assert(plan.focusTaskIds.length === 3, 'daily plan focus count mismatch');

    await request(`/api/v1/tasks/${focusTaskIds[0]}/done`, { method: 'PATCH', headers });
    await request(`/api/v1/tasks/${focusTaskIds[1]}/inbox`, { method: 'PATCH', headers });
    await request(`/api/v1/tasks/${focusTaskIds[2]}/today?date=${tomorrow}`, {
      method: 'PATCH',
      headers,
    });

    const summary = await request(`/api/v1/daily-plans/${referenceDate}/summary`, { headers });
    assertDailyPlanSummary(summary, {
      date: referenceDate,
      status: 'CONFIRMED',
      plannedFocusCount: 3,
      completedCount: 1,
      movedToOtherDateCount: 1,
      movedToInboxCount: 1,
      undecidedCount: 0,
    });
    console.log('✓ daily plan summary preserves the confirmed focus snapshot');

    console.log('Daily execution smoke passed. Credentials were not printed.');
  } finally {
    if (session?.accessToken) {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      for (const taskId of createdTaskIds.reverse()) {
        try {
          await request(`/api/v1/tasks/${taskId}`, { method: 'DELETE', headers });
        } catch (error) {
          console.warn(`cleanup warning: task ${taskId}: ${error.message}`);
        }
      }

      if (session.refreshToken) {
        try {
          await request('/api/v1/auth/logout', {
            method: 'POST',
            headers,
            body: JSON.stringify({ refreshToken: session.refreshToken }),
          });
        } catch (error) {
          console.warn(`cleanup warning: guest logout: ${error.message}`);
        }
      }
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    if (error?.name === 'AbortError') {
      console.error(`Daily execution smoke timed out while connecting to ${apiUrl}`);
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  });
}

module.exports = { assertCategorySummary, assertDailyPlanSummary };
