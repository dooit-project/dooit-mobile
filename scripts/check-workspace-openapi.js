const REQUIRED_OPERATIONS = [
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

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
const openApiUrl = process.env.OPENAPI_URL ?? `${apiBaseUrl}/v3/api-docs`;

async function checkWorkspaceOpenApi() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  let response;

  try {
    response = await fetch(openApiUrl, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (error) {
    throw new Error(`OpenAPI에 연결할 수 없습니다: ${openApiUrl}`, { cause: error });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`OpenAPI 요청에 실패했습니다: HTTP ${response.status}`);
  }

  let document;

  try {
    document = await response.json();
  } catch (error) {
    throw new Error(`OpenAPI가 JSON 응답이 아닙니다: ${openApiUrl}`, { cause: error });
  }
  const missing = REQUIRED_OPERATIONS.filter(
    ([method, path]) => !document.paths?.[path]?.[method],
  ).map(([method, path]) => `${method.toUpperCase()} ${path}`);

  if (missing.length > 0) {
    throw new Error(`Workspace OpenAPI 계약이 누락되었습니다:\n${missing.join('\n')}`);
  }

  console.log(`Workspace OpenAPI contract passed (${REQUIRED_OPERATIONS.length} operations).`);
  console.log(`Source: ${openApiUrl}`);
}

checkWorkspaceOpenApi().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
