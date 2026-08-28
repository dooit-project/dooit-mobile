const { normalizePathTemplate } = require('./check-latest-backend-openapi');

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

function findOperation(document, method, expectedPath) {
  const normalizedExpected = normalizePathTemplate(expectedPath);
  const actualPath = Object.keys(document.paths ?? {}).find(
    (path) => normalizePathTemplate(path) === normalizedExpected,
  );
  return actualPath ? document.paths[actualPath]?.[method] : undefined;
}

function validateWorkspaceOpenApi(document) {
  const missing = [];
  for (const [method, path] of REQUIRED_OPERATIONS) {
    const operation = findOperation(document, method, path);
    if (!operation) {
      missing.push(`${method.toUpperCase()} ${path}`);
      continue;
    }
    if (!Object.keys(operation.responses ?? {}).some((status) => /^2\d\d$/.test(status))) {
      missing.push(`${method.toUpperCase()} ${path} 2xx response`);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Workspace OpenAPI 계약이 누락되었습니다:\n${missing.join('\n')}`);
  }
  return { operationCount: REQUIRED_OPERATIONS.length };
}

async function checkWorkspaceOpenApi({
  apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
  openApiUrl = process.env.OPENAPI_URL,
  request = fetch,
} = {}) {
  const source = openApiUrl ?? `${apiUrl.replace(/\/+$/, '')}/v3/api-docs`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  let response;

  try {
    response = await request(source, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (error) {
    throw new Error(`OpenAPI에 연결할 수 없습니다: ${source}`, { cause: error });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) throw new Error(`OpenAPI 요청에 실패했습니다: HTTP ${response.status}`);

  let document;
  try {
    document = await response.json();
  } catch (error) {
    throw new Error(`OpenAPI가 JSON 응답이 아닙니다: ${source}`, { cause: error });
  }

  return { ...validateWorkspaceOpenApi(document), source };
}

async function main() {
  const result = await checkWorkspaceOpenApi();
  console.log(`Workspace OpenAPI contract passed (${result.operationCount} operations).`);
  console.log(`Source: ${result.source}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = { checkWorkspaceOpenApi, findOperation, validateWorkspaceOpenApi };
