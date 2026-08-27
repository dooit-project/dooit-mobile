const packageJson = require('../../package.json');

describe('backend ready command', () => {
  it('deployment, latest OpenAPI, Workspace 계약 순서로 실행한다', () => {
    expect(packageJson.scripts['check:backend-ready']).toBe(
      'npm run check:backend-deployment && npm run check:latest-backend-openapi && npm run check:workspace-openapi',
    );
  });
});
