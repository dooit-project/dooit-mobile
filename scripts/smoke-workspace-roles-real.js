#!/usr/bin/env node

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `M-workspace-${runId}`;

function account(role) {
  return {
    email: `mobile-workspace-${role}-${runId}@example.com`,
    displayName: `Workspace ${role} ${runId.slice(-6)}`,
  };
}

function createCascadeTaskRequest(id) {
  return {
    title: `삭제 회귀 반복 일정 ${id}`,
    description: 'Workspace cascade smoke',
    type: 'SCHEDULE',
    startAt: '2027-01-05T09:00:00',
    endAt: '2027-01-05T10:00:00',
    category: 'QA',
    allDay: false,
    recurrence: { frequency: 'WEEKLY', interval: 1, recurrenceCount: 3 },
  };
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

async function rawRequest(path, options = {}) {
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

    return { response, body: await readJsonBody(response) };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function request(path, options = {}) {
  const { response, body } = await rawRequest(path, options);

  if (!response.ok || body?.status === 'fail') {
    const error = new Error(`${path} failed: ${body?.error?.message ?? `HTTP ${response.status}`}`);
    error.status = response.status;
    error.code = body?.error?.code;
    throw error;
  }

  return body?.data ?? null;
}

async function expectFailure(path, expectedStatus, expectedCode, options = {}) {
  const { response, body } = await rawRequest(path, options);

  if (response.status !== expectedStatus || body?.error?.code !== expectedCode) {
    throw new Error(
      `${path} expected HTTP ${expectedStatus}/${expectedCode}, received HTTP ${response.status}/${body?.error?.code ?? 'no-code'}`,
    );
  }
}

function authorization(token) {
  return { Authorization: `Bearer ${token}` };
}

async function registerAndLogin(user) {
  await request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...user, password }),
  });
  const token = await request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: user.email, password }),
  });

  if (!token?.accessToken) throw new Error(`login token missing: ${user.email}`);

  return token.accessToken;
}

async function invite(ownerToken, workspaceId, user, role) {
  return request(`/api/v1/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: authorization(ownerToken),
    body: JSON.stringify({ email: user.email, role }),
  });
}

async function accept(token, workspaceId, memberId) {
  return request(`/api/v1/workspaces/${workspaceId}/members/${memberId}`, {
    method: 'PATCH',
    headers: authorization(token),
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
}

async function main() {
  const users = {
    owner: account('owner'),
    editor: account('editor'),
    viewer: account('viewer'),
    pending: account('pending'),
    removed: account('removed'),
    outsider: account('outsider'),
  };
  const tokens = {};

  console.log(`Workspace role smoke target: ${apiUrl}`);

  for (const [role, user] of Object.entries(users)) {
    tokens[role] = await registerAndLogin(user);
  }
  console.log('✓ isolated registered accounts');

  const workspace = await request('/api/v1/workspaces', {
    method: 'POST',
    headers: authorization(tokens.owner),
    body: JSON.stringify({ name: `권한 점검 ${runId}`, description: 'mobile real API smoke' }),
  });
  const workspacePath = `/api/v1/workspaces/${workspace.id}`;
  console.log('✓ OWNER creates workspace');

  const editorMember = await invite(tokens.owner, workspace.id, users.editor, 'EDITOR');
  const viewerMember = await invite(tokens.owner, workspace.id, users.viewer, 'VIEWER');
  await invite(tokens.owner, workspace.id, users.pending, 'VIEWER');
  const removedMember = await invite(tokens.owner, workspace.id, users.removed, 'VIEWER');

  await expectFailure(workspacePath, 404, 50001, { headers: authorization(tokens.pending) });
  const pendingInvitations = await request('/api/v1/workspace-invitations', {
    headers: authorization(tokens.pending),
  });
  if (!pendingInvitations.some((invitation) => invitation.workspace.id === workspace.id)) {
    throw new Error('PENDING invitation missing');
  }
  console.log('✓ PENDING sees invitation but cannot access workspace');

  await request(`${workspacePath}/members/${removedMember.id}`, {
    method: 'DELETE',
    headers: authorization(tokens.owner),
  });
  await expectFailure(workspacePath, 404, 50001, { headers: authorization(tokens.removed) });
  const removedInvitations = await request('/api/v1/workspace-invitations', {
    headers: authorization(tokens.removed),
  });
  if (removedInvitations.some((invitation) => invitation.workspace.id === workspace.id)) {
    throw new Error('REMOVED invitation remained visible');
  }
  console.log('✓ REMOVED cannot access workspace or invitation');

  await expectFailure(workspacePath, 404, 50001, { headers: authorization(tokens.outsider) });
  console.log('✓ non-member cannot discover workspace');

  await accept(tokens.editor, workspace.id, editorMember.id);
  await accept(tokens.viewer, workspace.id, viewerMember.id);

  const task = await request(`${workspacePath}/tasks`, {
    method: 'POST',
    headers: authorization(tokens.owner),
    body: JSON.stringify({
      title: '공유 권한 점검',
      description: 'OWNER가 생성한 일정',
      type: 'SCHEDULE',
      startAt: '2026-08-20T09:00:00',
      endAt: '2026-08-20T10:00:00',
      category: 'QA',
      allDay: false,
    }),
  });

  await request(`${workspacePath}/tasks/${task.id}`, {
    method: 'PUT',
    headers: authorization(tokens.editor),
    body: JSON.stringify({
      title: '공유 권한 점검 수정',
      description: 'EDITOR가 수정한 일정',
      type: 'SCHEDULE',
      startAt: '2026-08-20T10:00:00',
      endAt: '2026-08-20T11:00:00',
      category: 'QA',
      allDay: false,
    }),
  });
  await expectFailure(workspacePath, 403, 11003, {
    method: 'PUT',
    headers: authorization(tokens.editor),
    body: JSON.stringify({ name: 'EDITOR 변경 시도', description: null }),
  });
  console.log('✓ EDITOR mutates tasks but not workspace settings');

  const visibleTask = await request(`${workspacePath}/tasks/${task.id}`, {
    headers: authorization(tokens.viewer),
  });
  if (visibleTask.title !== '공유 권한 점검 수정') throw new Error('VIEWER task read mismatch');
  await expectFailure(`${workspacePath}/tasks`, 403, 11003, {
    method: 'POST',
    headers: authorization(tokens.viewer),
    body: JSON.stringify({
      title: 'VIEWER 생성 시도',
      type: 'TODO',
      allDay: false,
    }),
  });
  console.log('✓ VIEWER reads but cannot create tasks');

  const cascadeGoal = await request(`${workspacePath}/dday-goals`, {
    method: 'POST',
    headers: authorization(tokens.owner),
    body: JSON.stringify({ title: `삭제 회귀 D-Day ${runId}`, targetDate: '2027-12-31' }),
  });
  const cascadeTask = await request(`${workspacePath}/tasks`, {
    method: 'POST',
    headers: authorization(tokens.owner),
    body: JSON.stringify(createCascadeTaskRequest(runId)),
  });
  await request(`${workspacePath}/tasks/${cascadeTask.id}/dday-goal?ddayGoalId=${cascadeGoal.id}`, {
    method: 'PATCH',
    headers: authorization(tokens.owner),
  });

  await request(workspacePath, { method: 'DELETE', headers: authorization(tokens.owner) });
  await expectFailure(workspacePath, 404, 50001, { headers: authorization(tokens.owner) });
  await expectFailure(workspacePath, 404, 50001, { headers: authorization(tokens.editor) });
  await expectFailure(workspacePath, 404, 50001, { headers: authorization(tokens.viewer) });
  console.log('✓ OWNER cascade-deletes workspace with tasks, recurrence, D-Day, and memberships');
  console.log('Workspace role smoke passed. Tokens and passwords were not printed.');
}

if (require.main === module) {
  main().catch((error) => {
    if (error?.name === 'AbortError') {
      console.error(`Workspace role smoke timed out while connecting to ${apiUrl}`);
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  });
}

module.exports = { createCascadeTaskRequest };
