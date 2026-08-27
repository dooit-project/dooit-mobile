const REQUIRED_OPERATIONS = [
  ['get', '/api/v1/system/metadata'],
  ['post', '/api/v1/auth/guest'],
  ['post', '/api/v1/auth/login'],
  ['post', '/api/v1/auth/refresh'],
  ['post', '/api/v1/auth/guest/refresh'],
  ['post', '/api/v1/auth/logout'],
  ['post', '/api/v1/auth/password-reset/request'],
  ['post', '/api/v1/auth/password-reset/verify'],
  ['post', '/api/v1/auth/password-reset/confirm'],
];

const IDEMPOTENT_CREATE_PATHS = [
  '/api/v1/auth/guest',
  '/api/v1/tasks',
  '/api/v1/tasks/quick-capture',
  '/api/v1/task-templates',
  '/api/v1/task-templates/{templateId}/tasks',
  '/api/v1/dday-goals',
  '/api/v1/dday-goals/{goalId}/tasks',
  '/api/v1/workspaces',
  '/api/v1/workspaces/{workspaceId}/members',
  '/api/v1/workspaces/{workspaceId}/tasks',
  '/api/v1/workspaces/{workspaceId}/dday-goals',
];

function resolveReference(document, value) {
  if (!value?.$ref?.startsWith('#/')) return value;
  return value.$ref
    .slice(2)
    .split('/')
    .reduce((current, key) => current?.[key], document);
}

function getParameterName(document, parameter) {
  return resolveReference(document, parameter)?.name;
}

function collectSchemaFields(document, schema, seen = new Set()) {
  const resolved = resolveReference(document, schema);
  if (!resolved || seen.has(resolved)) return new Set();
  seen.add(resolved);

  const fields = new Set(Object.keys(resolved.properties ?? {}));
  for (const child of [...(resolved.allOf ?? []), ...(resolved.oneOf ?? [])]) {
    collectSchemaFields(document, child, seen).forEach((field) => fields.add(field));
  }
  return fields;
}

function findSchemasWithFields(document, fields) {
  return Object.entries(document.components?.schemas ?? {})
    .filter(([, schema]) => {
      const available = collectSchemaFields(document, schema);
      return fields.every((field) => available.has(field));
    })
    .map(([name]) => name);
}

function normalizePathTemplate(path) {
  return path.replace(/\{[^}]+\}/g, '{}');
}

function findPathItem(document, expectedPath) {
  const normalizedExpected = normalizePathTemplate(expectedPath);
  const actualPath = Object.keys(document.paths ?? {}).find(
    (path) => normalizePathTemplate(path) === normalizedExpected,
  );
  return actualPath ? document.paths[actualPath] : undefined;
}

function hasSuccessResponse(operation) {
  return Object.keys(operation?.responses ?? {}).some((status) => /^2\d\d$/.test(status));
}

function validateLatestBackendOpenApi(document) {
  const missing = [];

  for (const [method, path] of REQUIRED_OPERATIONS) {
    const operation = findPathItem(document, path)?.[method];
    if (!operation) {
      missing.push(`${method.toUpperCase()} ${path}`);
    } else if (!hasSuccessResponse(operation)) {
      missing.push(`${method.toUpperCase()} ${path} 2xx response`);
    }
  }

  for (const path of IDEMPOTENT_CREATE_PATHS) {
    const pathItem = findPathItem(document, path);
    const operation = pathItem?.post;
    if (!operation) {
      missing.push(`POST ${path}`);
      continue;
    }

    const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])];
    if (
      !parameters.some(
        (parameter) => getParameterName(document, parameter)?.toLowerCase() === 'idempotency-key',
      )
    ) {
      missing.push(`POST ${path} Idempotency-Key`);
    }
    if (!operation.responses?.['409']) missing.push(`POST ${path} HTTP 409`);
  }

  const tokenSchemas = findSchemasWithFields(document, [
    'accessToken',
    'expiresAt',
    'refreshToken',
    'refreshExpiresAt',
  ]);
  if (tokenSchemas.length === 0) missing.push('Token schema refreshToken/refreshExpiresAt');

  const notificationSchemas = findSchemasWithFields(document, ['notificationEnabled', 'notifyAt']);
  if (notificationSchemas.length < 2) {
    missing.push('Task request/response schemas notificationEnabled/notifyAt');
  }

  if (missing.length > 0) {
    throw new Error(`최신 백엔드 OpenAPI 계약이 누락되었습니다:\n${missing.join('\n')}`);
  }

  return {
    idempotentCreateCount: IDEMPOTENT_CREATE_PATHS.length,
    notificationSchemas,
    requiredOperationCount: REQUIRED_OPERATIONS.length,
    tokenSchemas,
  };
}

async function checkLatestBackendOpenApi({
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

  return { ...validateLatestBackendOpenApi(document), source };
}

async function main() {
  const result = await checkLatestBackendOpenApi();
  console.log(
    `Latest backend OpenAPI passed (${result.requiredOperationCount} operations, ${result.idempotentCreateCount} idempotent creates).`,
  );
  console.log(`Token schemas: ${result.tokenSchemas.join(', ')}`);
  console.log(`Task notification schemas: ${result.notificationSchemas.join(', ')}`);
  console.log(`Source: ${result.source}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = {
  checkLatestBackendOpenApi,
  findPathItem,
  findSchemasWithFields,
  normalizePathTemplate,
  validateLatestBackendOpenApi,
};
