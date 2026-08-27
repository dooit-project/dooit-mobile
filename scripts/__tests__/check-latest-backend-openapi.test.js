const {
  checkLatestBackendOpenApi,
  findSchemasWithFields,
  validateLatestBackendOpenApi,
} = require('../check-latest-backend-openapi');

const requiredPaths = [
  ['get', '/api/v1/system/metadata'],
  ['post', '/api/v1/auth/refresh'],
  ['post', '/api/v1/auth/guest/refresh'],
  ['post', '/api/v1/auth/logout'],
  ['post', '/api/v1/auth/password-reset/request'],
  ['post', '/api/v1/auth/password-reset/verify'],
  ['post', '/api/v1/auth/password-reset/confirm'],
];

const idempotentPaths = [
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

function documentFixture() {
  const paths = {};
  requiredPaths.forEach(([method, path]) => {
    paths[path] = { ...(paths[path] ?? {}), [method]: { responses: { 200: {} } } };
  });
  idempotentPaths.forEach((path) => {
    paths[path] = {
      ...(paths[path] ?? {}),
      post: {
        parameters: [{ $ref: '#/components/parameters/IdempotencyKey' }],
        responses: { 200: {}, 409: {} },
      },
    };
  });

  return {
    paths,
    components: {
      parameters: { IdempotencyKey: { name: 'Idempotency-Key', in: 'header' } },
      schemas: {
        TokenResponse: {
          properties: {
            accessToken: {},
            expiresAt: {},
            refreshToken: {},
            refreshExpiresAt: {},
          },
        },
        TaskRequest: { properties: { notificationEnabled: {}, notifyAt: {} } },
        TaskResponse: { properties: { notificationEnabled: {}, notifyAt: {} } },
      },
    },
  };
}

describe('latest backend OpenAPI contract', () => {
  it('최신 endpoint, 멱등성, session과 알림 schema를 확인한다', () => {
    expect(validateLatestBackendOpenApi(documentFixture())).toEqual({
      requiredOperationCount: 7,
      idempotentCreateCount: 11,
      tokenSchemas: ['TokenResponse'],
      notificationSchemas: ['TaskRequest', 'TaskResponse'],
    });
  });

  it('멱등성 409와 Task 알림 response가 빠지면 실패한다', () => {
    const document = documentFixture();
    delete document.paths['/api/v1/tasks'].post.responses[409];
    delete document.components.schemas.TaskResponse.properties.notifyAt;

    expect(() => validateLatestBackendOpenApi(document)).toThrow('POST /api/v1/tasks HTTP 409');
    expect(() => validateLatestBackendOpenApi(document)).toThrow(
      'Task request/response schemas notificationEnabled/notifyAt',
    );
  });

  it('지정한 OpenAPI URL에서 문서를 읽는다', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => documentFixture(),
    });

    await expect(
      checkLatestBackendOpenApi({ openApiUrl: 'https://api.example.com/openapi', request }),
    ).resolves.toMatchObject({ source: 'https://api.example.com/openapi' });
    expect(request).toHaveBeenCalledWith('https://api.example.com/openapi', {
      headers: { Accept: 'application/json' },
      signal: expect.any(AbortSignal),
    });
  });
});

describe('findSchemasWithFields', () => {
  it('요청한 field를 모두 가진 schema 이름만 반환한다', () => {
    expect(findSchemasWithFields(documentFixture(), ['refreshToken', 'refreshExpiresAt'])).toEqual([
      'TokenResponse',
    ]);
  });

  it('$ref와 allOf로 합성된 schema field도 찾는다', () => {
    const document = documentFixture();
    document.components.schemas.NotificationFields = {
      properties: { notificationEnabled: {}, notifyAt: {} },
    };
    document.components.schemas.ComposedTask = {
      allOf: [{ $ref: '#/components/schemas/NotificationFields' }],
    };

    expect(findSchemasWithFields(document, ['notificationEnabled', 'notifyAt'])).toContain(
      'ComposedTask',
    );
  });
});
