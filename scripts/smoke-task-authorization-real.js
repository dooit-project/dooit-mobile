#!/usr/bin/env node

const { randomUUID } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');

/** Deliberately refuses production, redirects, and arbitrary resource IDs. */
function resolveTarget(value = 'http://127.0.0.1:18080') {
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost'].includes(url.hostname) ||
    url.port !== '18080' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error('Task authorization smoke only permits localhost STG port 18080.');
  return url.origin;
}

async function runTaskAuthorizationSmoke({ apiUrl, request = fetch } = {}) {
  const target = resolveTarget(apiUrl);
  const report = { target, metadata: null, checks: [], failures: [], cleanup: [], passed: false };
  const sessions = [];
  const fixtures = [];
  const secrets = [];
  const runId = randomUUID().slice(0, 8);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const taskBody = (name) => ({
    title: `Authz-${runId}-${name}`,
    description: `Private-${runId}-${name}`,
    type: 'TODO',
    allDay: false,
    notificationEnabled: false,
  });
  async function call(path, { session, method = 'GET', body } = {}) {
    const response = await request(target + path, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        ...(path === '/api/v1/auth/guest' ? { 'Idempotency-Key': randomUUID() } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    let parsed;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Non-JSON HTTP ${response.status} response`);
    }
    return { status: response.status, body: parsed };
  }
  function requireSuccess(reply, label) {
    if (reply.status < 200 || reply.status >= 300 || reply.body?.status !== 'success') {
      throw new Error(`${label}: expected success, received HTTP ${reply.status}`);
    }
    return reply.body.data;
  }
  async function success(path, options, label) {
    return requireSuccess(await call(path, options), label);
  }
  function check(condition, label) {
    if (!condition) throw new Error(label);
  }
  async function denied(label, path, options, status) {
    const reply = await call(path, options);
    // A validation error, server error or masked successful payload is never a pass.
    const serialized = JSON.stringify(reply.body);
    check(
      reply.status === status &&
        (reply.body === null ? [401, 403].includes(status) : reply.body?.status === 'fail') &&
        reply.body?.data == null &&
        !secrets.some((secret) => serialized.includes(secret)),
      `${label}: expected non-disclosing HTTP ${status}, received HTTP ${reply.status}`,
    );
    report.checks.push({ label, status });
  }
  async function createTask(session, name) {
    const body = taskBody(name);
    secrets.push(body.title, body.description);
    const task = await success(
      '/api/v1/tasks',
      { session, method: 'POST', body },
      'create test Task',
    );
    check(Number.isSafeInteger(task?.id) && task.id > 0, 'Task fixture has no valid ID');
    fixtures.push({ id: task.id, session });
    return task;
  }
  const checklist = (id) => `/api/v1/tasks/${id}/checklist-items`;
  try {
    const readiness = await call('/actuator/health/readiness');
    check(readiness.status === 200 && readiness.body?.status === 'UP', 'STG is not ready');
    const metadata = await success('/api/v1/system/metadata', {}, 'STG metadata');
    check(
      typeof metadata?.imageTag === 'string' && metadata.imageTag.startsWith('stg-'),
      'Server must identify itself with an stg- image tag',
    );
    report.metadata = { commitSha: metadata.commitSha, imageTag: metadata.imageTag };
    for (let i = 0; i < 2; i++) {
      const session = await success('/api/v1/auth/guest', { method: 'POST' }, 'create test guest');
      check(
        session?.tokenType === 'Bearer' && session?.accessToken && session?.user?.id,
        'Guest credential contract mismatch',
      );
      sessions.push(session);
      const me = await success('/api/v1/auth/me', { session }, 'guest identity');
      check(me?.id === session.user.id, 'Guest identity mismatch');
    }
    const [owner, other] = sessions;
    check(owner.user.id !== other.user.id, 'Test users must be distinct');
    const task = await createTask(owner, 'A');
    const sibling = await createTask(owner, 'A2');
    const otherTask = await createTask(other, 'B');
    const items = [];
    for (const [parent, session, name] of [
      [task, owner, 'A'],
      [sibling, owner, 'A2'],
      [otherTask, other, 'B'],
    ]) {
      const title = `Item-${runId}-${name}`;
      secrets.push(title);
      const item = await success(
        checklist(parent.id),
        { session, method: 'POST', body: { title } },
        'create test checklist',
      );
      check(Number.isSafeInteger(item?.id) && item.id > 0, 'Checklist fixture has no valid ID');
      items.push(item);
    }
    const [item, siblingItem] = items;
    const taskPath = `/api/v1/tasks/${task.id}`;
    const itemPath = `${checklist(task.id)}/${item.id}`;
    // Verify these operations exist and work for an owner; a missing route's 404
    // must not masquerade as successful authorization enforcement.
    const positiveTask = `/api/v1/tasks/${otherTask.id}`;
    const positiveItem = `${checklist(otherTask.id)}/${items[2].id}`;
    const controls = [
      ['owner Task update', positiveTask, 'PUT', taskBody('B-updated')],
      ['owner Task complete', `${positiveTask}/done`, 'PATCH'],
      ['owner Task reopen', `${positiveTask}/done/cancel?date=${today}`, 'PATCH'],
      ['owner checklist read', checklist(otherTask.id), 'GET'],
      ['owner checklist update', positiveItem, 'PUT', { title: 'Owner update' }],
      ['owner checklist complete', `${positiveItem}/done`, 'PATCH'],
      ['owner checklist reopen', `${positiveItem}/done/cancel`, 'PATCH'],
      [
        'owner checklist reorder',
        `${checklist(otherTask.id)}/order`,
        'PUT',
        { orderedItemIds: [items[2].id] },
      ],
    ];
    for (const [label, path, method, body] of controls) {
      await success(path, { session: other, method, body }, label);
      report.checks.push({ label, status: 200 });
    }
    const before = await success(taskPath, { session: owner }, 'owner Task read');
    const beforeItems = await success(
      checklist(task.id),
      { session: owner },
      'owner checklist read',
    );
    const beforeSiblingItems = await success(
      checklist(sibling.id),
      { session: owner },
      'owner sibling checklist read',
    );
    check(
      before.id === task.id && beforeItems.some((entry) => entry.id === item.id),
      'Owner positive control failed',
    );
    report.checks.push({ label: 'owner reads own Task and checklist', status: 200 });

    const attempts = [
      ['Task read', taskPath, 'GET'],
      ['Task update', taskPath, 'PUT', taskBody('forbidden')],
      ['Task complete', `${taskPath}/done`, 'PATCH'],
      ['Task reopen', `${taskPath}/done/cancel?date=${today}`, 'PATCH'],
      ['checklist read', checklist(task.id), 'GET'],
      ['checklist create', checklist(task.id), 'POST', { title: 'Forbidden item' }],
      ['checklist update', itemPath, 'PUT', { title: 'Forbidden change' }],
      ['checklist complete', `${itemPath}/done`, 'PATCH'],
      ['checklist reopen', `${itemPath}/done/cancel`, 'PATCH'],
      ['checklist reorder', `${checklist(task.id)}/order`, 'PUT', { orderedItemIds: [item.id] }],
      ['checklist delete', itemPath, 'DELETE'],
      ['Task delete', taskPath, 'DELETE'],
    ];
    for (const [label, path, method, body] of attempts) {
      await denied(`anonymous ${label}`, path, { method, body }, 401);
      await denied(`other user ${label}`, path, { session: other, method, body }, 404);
    }
    await denied(
      'invalid token Task read',
      taskPath,
      { session: { accessToken: 'invalid-task-authz-smoke-token' } },
      401,
    );
    for (const session of [undefined, other]) {
      await denied(
        session ? 'authenticated legacy bypass' : 'anonymous legacy bypass',
        `/api/tasks/${task.id}`,
        { session },
        session ? 403 : 401,
      );
    }
    // Valid owned parent + foreign child catches checks that only validate the parent.
    for (const [parent, session, child] of [
      [task, owner, siblingItem],
      [otherTask, other, item],
    ]) {
      for (const [method, suffix, body] of [
        ['PUT', '', { title: 'Wrong parent' }],
        ['PATCH', '/done'],
        ['PATCH', '/done/cancel'],
        ['DELETE', ''],
      ]) {
        await denied(
          'checklist child cannot cross parent',
          `${checklist(parent.id)}/${child.id}${suffix}`,
          { session, method, body },
          404,
        );
      }
    }
    const after = await success(taskPath, { session: owner }, 'owner Task after denials');
    const afterItems = await success(
      checklist(task.id),
      { session: owner },
      'owner checklist after denials',
    );
    check(
      isDeepStrictEqual(before, after) && isDeepStrictEqual(beforeItems, afterItems),
      'Denied requests changed owner data',
    );
    const siblingItems = await success(
      checklist(sibling.id),
      { session: owner },
      'sibling checklist after denials',
    );
    check(
      isDeepStrictEqual(siblingItems, beforeSiblingItems),
      'Wrong-parent requests changed sibling checklist',
    );
    const otherInbox = await success('/api/v1/tasks/inbox', { session: other }, 'other user inbox');
    check(
      Array.isArray(otherInbox) &&
        !otherInbox.some((entry) => [task.id, sibling.id].includes(entry.id)),
      'Other user list exposed owner Tasks',
    );
    const finalMetadata = await success('/api/v1/system/metadata', {}, 'STG final metadata');
    check(
      finalMetadata.commitSha === report.metadata.commitSha &&
        finalMetadata.imageTag === report.metadata.imageTag,
      'STG deployment changed during verification',
    );
    await success(positiveItem, { session: other, method: 'DELETE' }, 'owner checklist delete');
    report.checks.push({ label: 'owner checklist delete', status: 200 });
    report.checks.push({
      label: 'denied requests preserve owner data and list isolation',
      status: 200,
    });
  } catch (error) {
    // Only our fixed labels/statuses enter the report; never server bodies or credentials.
    report.failures.push(
      error instanceof Error &&
        /^(STG|Server must|Guest|Task fixture|Checklist fixture|Test users|Owner|owner |create test |guest |other user|anonymous|invalid token|authenticated legacy|checklist child|Denied|Wrong-parent|Other user|Non-JSON)/.test(
          error.message,
        )
        ? error.message
        : 'Transport or unexpected contract failure (response omitted)',
    );
  } finally {
    for (const [index, fixture] of fixtures.entries()) {
      try {
        const reply = await call(`/api/v1/tasks/${fixture.id}`, {
          session: fixture.session,
          method: 'DELETE',
        });
        check(
          [200, 204].includes(reply.status) && reply.body?.status === 'success',
          'cleanup failed',
        );
        const gone = await call(`/api/v1/tasks/${fixture.id}`, { session: fixture.session });
        check(gone.status === 404 && gone.body?.data == null, 'cleanup verification failed');
        report.cleanup.push({ label: `test Task ${index + 1}`, passed: true });
      } catch {
        report.cleanup.push({ label: `test Task ${index + 1}`, passed: false });
      }
    }
    for (const [index, session] of sessions.entries()) {
      try {
        requireSuccess(
          await call('/api/v1/auth/logout', {
            session,
            method: 'POST',
            body: session.refreshToken ? { refreshToken: session.refreshToken } : undefined,
          }),
          'logout',
        );
        report.cleanup.push({ label: `test session ${index + 1}`, passed: true });
      } catch {
        report.cleanup.push({ label: `test session ${index + 1}`, passed: false });
      }
    }
  }
  report.passed =
    report.failures.length === 0 &&
    report.checks.length > 0 &&
    report.cleanup.every((result) => result.passed);
  return report;
}

if (require.main === module) {
  runTaskAuthorizationSmoke({ apiUrl: process.env.DOOIT_AUTHZ_API_URL })
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (!report.passed) process.exitCode = 1;
    })
    .catch(() => {
      console.error('Task authorization smoke refused the target or failed before execution.');
      process.exitCode = 1;
    });
}
module.exports = { resolveTarget, runTaskAuthorizationSmoke };
