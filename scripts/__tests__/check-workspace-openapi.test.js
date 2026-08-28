const { findOperation, validateWorkspaceOpenApi } = require('../check-workspace-openapi');

const operations = [
  ['get', '/api/v1/workspace-invitations'],
  ['get', '/api/v1/workspaces'],
  ['post', '/api/v1/workspaces'],
  ['get', '/api/v1/workspaces/{workspaceId}'],
  ['put', '/api/v1/workspaces/{workspaceId}'],
  ['delete', '/api/v1/workspaces/{workspaceId}'],
  ['get', '/api/v1/workspaces/{workspaceId}/members'],
  ['post', '/api/v1/workspaces/{workspaceId}/members'],
  ['patch', '/api/v1/workspaces/{workspaceId}/members/{memberId}'],
  ['delete', '/api/v1/workspaces/{workspaceId}/members/{memberId}'],
  ['get', '/api/v1/workspaces/{workspaceId}/tasks'],
  ['post', '/api/v1/workspaces/{workspaceId}/tasks'],
  ['get', '/api/v1/workspaces/{workspaceId}/tasks/{taskId}'],
  ['put', '/api/v1/workspaces/{workspaceId}/tasks/{taskId}'],
  ['delete', '/api/v1/workspaces/{workspaceId}/tasks/{taskId}'],
  ['patch', '/api/v1/workspaces/{workspaceId}/tasks/{taskId}/dday-goal'],
  ['delete', '/api/v1/workspaces/{workspaceId}/tasks/{taskId}/dday-goal'],
  ['get', '/api/v1/workspaces/{workspaceId}/tasks/notification-candidates'],
  ['get', '/api/v1/workspaces/{workspaceId}/dday-goals'],
  ['post', '/api/v1/workspaces/{workspaceId}/dday-goals'],
  ['get', '/api/v1/workspaces/{workspaceId}/dday-goals/{goalId}'],
  ['delete', '/api/v1/workspaces/{workspaceId}/dday-goals/{goalId}'],
  ['get', '/api/v1/workspaces/{workspaceId}/dday-goals/{goalId}/tasks'],
];

function fixture() {
  const paths = {};
  operations.forEach(([method, path]) => {
    paths[path] = { ...(paths[path] ?? {}), [method]: { responses: { 200: {} } } };
  });
  return { paths };
}

describe('Workspace OpenAPI contract', () => {
  it('23개 operation과 성공 응답을 확인한다', () => {
    expect(validateWorkspaceOpenApi(fixture())).toEqual({ operationCount: 23 });
  });

  it('성공 응답이 빠지면 실패한다', () => {
    const document = fixture();
    document.paths['/api/v1/workspaces'].get.responses = { 401: {} };

    expect(() => validateWorkspaceOpenApi(document)).toThrow('GET /api/v1/workspaces 2xx response');
  });

  it('path parameter 이름이 달라도 operation을 찾는다', () => {
    const document = fixture();
    document.paths['/api/v1/workspaces/{id}'] = document.paths['/api/v1/workspaces/{workspaceId}'];
    delete document.paths['/api/v1/workspaces/{workspaceId}'];

    expect(findOperation(document, 'get', '/api/v1/workspaces/{workspaceId}')).toBeDefined();
  });
});
