const { execFileSync } = require('node:child_process');

describe('get-android-release-note', () => {
  it('preview 빌드 메타데이터 양식을 생성한다', () => {
    const output = execFileSync(
      process.execPath,
      [
        'scripts/get-android-release-note.js',
        '--date',
        '2026-08-20',
        '--commit',
        '1234567890abcdef',
        '--backend',
        'backend-image:42',
        '--build-id',
        'eas-build-id',
      ],
      { encoding: 'utf8' },
    );

    expect(output).toContain('Date: 2026-08-20');
    expect(output).toContain('Frontend commit: 1234567890abcdef');
    expect(output).toContain('Backend commit/image: backend-image:42');
    expect(output).toContain('EAS build id: eas-build-id');
    expect(output).toContain('API mode / URL: real / https://macmini.tail68d2d1.ts.net');
    expect(output).toContain('APK file: todolab-android-preview-v1.0.0-1-1234567.apk');
  });

  it('존재하지 않는 profile을 거부한다', () => {
    expect(() =>
      execFileSync(
        process.execPath,
        ['scripts/get-android-release-note.js', '--profile', 'missing'],
        { encoding: 'utf8', stdio: 'pipe' },
      ),
    ).toThrow();
  });
});
