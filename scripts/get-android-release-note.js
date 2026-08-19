const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      throw new Error(`Unexpected argument: ${value}`);
    }

    const name = value.slice(2);
    const argumentValue = argv[index + 1];
    if (!argumentValue || argumentValue.startsWith('--')) {
      throw new Error(`Missing value for --${name}`);
    }

    args[name] = argumentValue;
    index += 1;
  }

  return args;
}

function getCommit(explicitCommit) {
  return (
    explicitCommit ??
    process.env.APK_COMMIT?.trim() ??
    execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  );
}

function createReleaseNote(args) {
  const appConfig = readJson('app.json').expo;
  const packageJson = readJson('package.json');
  const easConfig = readJson('eas.json');
  const profile = args.profile ?? 'preview';
  const profileConfig = easConfig.build?.[profile];

  if (!profileConfig) {
    throw new Error(`Unknown EAS build profile: ${profile}`);
  }

  const version = appConfig.version ?? packageJson.version;
  const versionCode = appConfig.android?.versionCode;
  const apiMode = profileConfig.env?.EXPO_PUBLIC_API_MODE ?? '확인 필요';
  const apiUrl = profileConfig.env?.EXPO_PUBLIC_API_URL ?? '확인 필요';
  const commit = getCommit(args.commit);
  const shortCommit = commit.slice(0, 7);
  const apk =
    args.apk ?? `todolab-android-${profile}-v${version}-${versionCode}-${shortCommit}.apk`;

  return `ToDoLab Android APK
Date: ${args.date ?? new Date().toISOString().slice(0, 10)}
Version: ${version}
VersionCode: ${versionCode}
Profile: ${profile}
Frontend commit: ${commit}
Backend commit/image: ${args.backend ?? '확인 필요'}
EAS build id: ${args['build-id'] ?? '확인 필요'}
APK file: ${apk}
API mode / URL: ${apiMode} / ${apiUrl}
Device / OS: ${args.device ?? '확인 필요'}
Required backend migration: ${args.migration ?? '확인 필요'}
Breaking API dependency: ${args.breaking ?? '확인 필요'}
Smoke result: ${args.result ?? 'BLOCKED - 실기기 검증 전'}
Rollback target: ${args.rollback ?? '확인 필요'}
Notes: ${args.notes ?? ''}`;
}

try {
  console.log(createReleaseNote(parseArgs(process.argv.slice(2))));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
