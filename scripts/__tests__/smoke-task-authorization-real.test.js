const { resolveTarget, runTaskAuthorizationSmoke } = require('../smoke-task-authorization-real');

function fakeStg(mode) {
  const tasks = new Map();
  const items = new Map();
  let guests = 0;
  let nextTask = 100;
  let nextItem = 1000;
  const calls = [];
  const reply = (status, data) => ({
    status,
    text: async () => (data === null ? '' : JSON.stringify(data)),
  });
  const ok = (data, status = 200) => reply(status, { status: 'success', data });
  const fail = (status, extra = {}) =>
    reply(status, { status: 'fail', error: { code: status }, ...extra });
  const request = jest.fn(async (target, options) => {
    const url = new URL(target);
    const path = url.pathname;
    const method = options.method;
    const token = options.headers.Authorization;
    const owner = Number(token?.match(/^Bearer access-(\d+)$/)?.[1]);
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ path, method, owner, redirect: options.redirect });
    if (path === '/actuator/health/readiness') return reply(200, { status: 'UP' });
    if (path === '/api/v1/system/metadata')
      return ok({ commitSha: 'abc1234', imageTag: 'stg-test' });
    if (path === '/api/v1/auth/guest') {
      const id = ++guests;
      return ok(
        { tokenType: 'Bearer', accessToken: `access-${id}`, refreshToken: null, user: { id } },
        201,
      );
    }
    if (!owner) return mode === 'empty401' ? reply(401, null) : fail(401);
    if (path === '/api/v1/auth/me') return ok({ id: owner });
    if (path === '/api/v1/auth/logout') return ok(null);
    if (path.startsWith('/api/tasks/')) return fail(403);
    if (path === '/api/v1/tasks' && method === 'POST') {
      const task = { ...body, id: nextTask++, owner, status: 'INBOX' };
      tasks.set(task.id, task);
      return ok(task, 201);
    }
    if (path === '/api/v1/tasks/inbox')
      return ok([...tasks.values()].filter((task) => task.owner === owner));
    const match = path.match(/^\/api\/v1\/tasks\/(\d+)(.*)$/);
    if (!match) return fail(404);
    const taskId = Number(match[1]);
    const suffix = match[2];
    const task = tasks.get(taskId);
    if (!task) return fail(404);
    if (task.owner !== owner) {
      if (mode === 'allowForeignRead' && method === 'GET' && !suffix) return ok(task);
      if (mode === 'leakIn404') return fail(404, { data: task });
      if (mode === 'leakMessage') return fail(404, { error: { message: task.title } });
      if (mode === 'badValidation' && method === 'PUT') return fail(400);
      if (mode === 'hiddenMutation' && method === 'PUT' && !suffix) task.title = 'MUTATED';
      return fail(404);
    }
    if (!suffix) {
      if (method === 'PUT') {
        if (mode === 'missingRoute') return fail(404);
        Object.assign(task, body);
      }
      if (method === 'DELETE') {
        if (mode === 'cleanupFailure') return fail(500);
        tasks.delete(taskId);
        for (const item of items.values()) if (item.taskId === taskId) items.delete(item.id);
        return ok(null);
      }
      return ok(task);
    }
    if (suffix === '/done') {
      task.status = 'DONE';
      return ok(task);
    }
    if (suffix === '/done/cancel') {
      task.status = 'TODAY';
      return ok(task);
    }
    if (suffix === '/checklist-items') {
      if (method === 'GET') return ok([...items.values()].filter((item) => item.taskId === taskId));
      if (method === 'POST') {
        const item = {
          ...body,
          id: nextItem++,
          taskId,
          done: false,
          sortOrder: 0,
          createdAt: '2026-10-25T01:00:00.123456',
        };
        items.set(item.id, item);
        // Creation and database-read timestamp precision may legitimately differ.
        return ok({ ...item, createdAt: '2026-10-25T01:00:00.123456789' }, 201);
      }
    }
    if (suffix === '/checklist-items/order')
      return ok([...items.values()].filter((item) => item.taskId === taskId));
    const itemMatch = suffix.match(/^\/checklist-items\/(\d+)(.*)$/);
    const item = itemMatch ? items.get(Number(itemMatch[1])) : null;
    if (!item || item.taskId !== taskId) return fail(404);
    if (method === 'DELETE') {
      items.delete(item.id);
      return ok(null);
    }
    if (method === 'PUT') item.title = body.title;
    if (itemMatch[2] === '/done') item.done = true;
    if (itemMatch[2] === '/done/cancel') item.done = false;
    return ok(item);
  });
  return { request, tasks, calls };
}

describe('personal Task authorization smoke', () => {
  it('only permits a fixed local STG origin without redirects, paths or credentials', () => {
    expect(resolveTarget()).toBe('http://127.0.0.1:18080');
    expect(resolveTarget('http://localhost:18080/')).toBe('http://localhost:18080');
    for (const url of [
      'https://dooitapi.hsng.pe.kr',
      'http://127.0.0.1:8080',
      'http://localhost:18080/path',
      'http://localhost:18080?x=1',
      'http://name:secret@localhost:18080',
      'http://localhost:18080#fragment',
    ]) {
      expect(() => resolveTarget(url)).toThrow();
    }
  });
  it.each([undefined, 'empty401'])(
    'verifies denial, positive controls, read-to-read preservation and cleanup (%s)',
    async (mode) => {
      const backend = fakeStg(mode);
      const report = await runTaskAuthorizationSmoke({ request: backend.request });
      expect(report.failures).toEqual([]);
      expect(report.passed).toBe(true);
      expect(report.checks.filter((check) => [401, 403, 404].includes(check.status))).toHaveLength(
        35,
      );
      expect(report.cleanup).toHaveLength(5);
      expect(backend.tasks.size).toBe(0);
      expect(backend.calls.every((call) => call.redirect === 'error')).toBe(true);
      expect(JSON.stringify(report)).not.toMatch(/access-1|access-2|Private-|Authz-|Item-/);
    },
  );
  it.each([
    'allowForeignRead',
    'leakIn404',
    'leakMessage',
    'badValidation',
    'hiddenMutation',
    'missingRoute',
  ])('fails closed for %s and still cleans up only its own fixtures', async (mode) => {
    const backend = fakeStg(mode);
    const report = await runTaskAuthorizationSmoke({ request: backend.request });
    expect(report.passed).toBe(false);
    expect(report.failures.length).toBeGreaterThan(0);
    expect(report.cleanup.every((entry) => entry.passed)).toBe(true);
    expect(backend.tasks.size).toBe(0);
    const deletes = backend.calls.filter(
      (call) => call.method === 'DELETE' && /^\/api\/v1\/tasks\/\d+$/.test(call.path),
    );
    expect(deletes.filter((call) => call.owner === 1).map((call) => call.path)).toEqual([
      '/api/v1/tasks/100',
      '/api/v1/tasks/101',
    ]);
    expect(JSON.stringify(report)).not.toMatch(/access-1|access-2|Private-|Authz-|Item-/);
  });
  it('does not report success when cleanup failed', async () => {
    const backend = fakeStg('cleanupFailure');
    const report = await runTaskAuthorizationSmoke({ request: backend.request });
    expect(report.passed).toBe(false);
    expect(report.cleanup.some((entry) => !entry.passed)).toBe(true);
  });
  it('refuses production before sending any request', async () => {
    const request = jest.fn();
    await expect(
      runTaskAuthorizationSmoke({ apiUrl: 'https://dooitapi.hsng.pe.kr', request }),
    ).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
  it('does not print transport error contents or credentials', async () => {
    const report = await runTaskAuthorizationSmoke({
      request: async () => {
        throw new Error('accessToken=private');
      },
    });
    expect(report.passed).toBe(false);
    expect(JSON.stringify(report)).not.toContain('accessToken=private');
  });
});
