const {
  checkBackendDeployment,
  findDeploymentVersion,
  normalizeMetadata,
} = require('../check-backend-deployment');

function response(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name.toLowerCase()] },
    json: async () => body,
  };
}

describe('checkBackendDeployment', () => {
  it('readiness와 system metadata를 확인한다', async () => {
    const request = jest
      .fn()
      .mockResolvedValueOnce(response(200, { status: 'UP' }))
      .mockResolvedValueOnce(
        response(200, {
          status: 'success',
          data: { commitSha: 'abc1234', imageTag: 'backend:2026-08-27', version: '1.2.3' },
        }),
      );

    await expect(checkBackendDeployment('https://api.example.com/', request)).resolves.toEqual({
      readiness: 'UP',
      deploymentVersion: 'abc1234',
      metadata: {
        commitSha: 'abc1234',
        imageTag: 'backend:2026-08-27',
        version: '1.2.3',
      },
    });
    expect(request).toHaveBeenCalledWith('https://api.example.com/actuator/health/readiness', {
      redirect: 'manual',
    });
    expect(request).toHaveBeenCalledWith('https://api.example.com/api/v1/system/metadata', {
      redirect: 'manual',
    });
  });

  it('인증 화면 redirect를 배포 정보 누락으로 판정한다', async () => {
    const request = jest
      .fn()
      .mockResolvedValueOnce(response(200, { status: 'UP' }))
      .mockResolvedValueOnce(
        response(302, undefined, { location: 'http://api.example.com/login' }),
      );

    await expect(checkBackendDeployment('https://api.example.com', request)).rejects.toThrow(
      'HTTP 302, location http://api.example.com/login',
    );
  });

  it('readiness가 UP이 아니면 배포 확인을 중단한다', async () => {
    const request = jest.fn().mockResolvedValueOnce(response(503, { status: 'DOWN' }));

    await expect(checkBackendDeployment('https://api.example.com', request)).rejects.toThrow(
      'HTTP 503, status DOWN',
    );
  });
});

describe('findDeploymentVersion', () => {
  it('image tag 형식도 인식한다', () => {
    expect(findDeploymentVersion({ image: { tag: 'backend:2026-08-21' } })).toBe(
      'backend:2026-08-21',
    );
  });
});

describe('normalizeMetadata', () => {
  it('API envelope과 빈 값을 정규화한다', () => {
    expect(
      normalizeMetadata({
        status: 'success',
        data: { commitSha: ' abc1234 ', imageTag: '', version: '1.2.3' },
      }),
    ).toEqual({ commitSha: 'abc1234', imageTag: undefined, version: '1.2.3' });
  });
});
