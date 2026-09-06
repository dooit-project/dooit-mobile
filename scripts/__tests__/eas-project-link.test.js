const { evaluateEasProjectLink } = require('../lib/eas-project-link');

describe('EAS project link check', () => {
  it('project:info 성공을 slug 일치로 판정한다', () => {
    expect(evaluateEasProjectLink({ status: 0 }, 'dooit-mobile')).toEqual({
      passed: true,
      details: 'linked project matches dooit-mobile',
    });
  });

  it('EAS가 반환한 slug 불일치 원인을 보존한다', () => {
    const result = evaluateEasProjectLink(
      {
        status: 1,
        stderr:
          '★ eas-cli@23.2.0 is now available.\nTo upgrade, run:\nnpm install -g eas-cli\nProceeding with outdated version.\n\nProject config: Slug for project identified by "extra.eas.projectId" (todolab-mobile) does not match the "slug" field (dooit-mobile).\n',
      },
      'dooit-mobile',
    );

    expect(result.passed).toBe(false);
    expect(result.details).toContain('todolab-mobile');
    expect(result.details).toContain('dooit-mobile');
  });

  it('network timeout을 별도 원인으로 안내한다', () => {
    expect(
      evaluateEasProjectLink({ status: null, error: { code: 'ETIMEDOUT' } }, 'dooit-mobile'),
    ).toEqual({
      passed: false,
      details: 'EAS project check timed out; check network access and retry.',
    });
  });
});
