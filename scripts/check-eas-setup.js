const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function exists(path) {
  return fs.existsSync(path);
}

const appConfig = readJson('app.json').expo;
const easConfig = readJson('eas.json');
const checks = [];

function addCheck(name, passed, details) {
  checks.push({ name, passed, details });
}

const easVersion = spawnSync('eas', ['--version'], {
  encoding: 'utf8',
  shell: false,
});

const easIdentity = spawnSync('eas', ['whoami'], {
  encoding: 'utf8',
  shell: false,
  timeout: 15_000,
});

const expoStateIgnored = spawnSync('git', ['check-ignore', '-q', '.expo'], {
  encoding: 'utf8',
  shell: false,
});

addCheck(
  'EAS CLI installed',
  easVersion.status === 0,
  easVersion.status === 0
    ? easVersion.stdout.trim()
    : 'Install with `npm install --global eas-cli` or use `npx eas-cli` when network is available.',
);

addCheck(
  'Expo account authenticated',
  easIdentity.status === 0,
  easIdentity.status === 0
    ? easIdentity.stdout.trim().split('\n')[0]
    : easIdentity.error?.code === 'ETIMEDOUT'
      ? 'EAS account check timed out; check network access and retry.'
      : 'Run `eas login`, then retry while api.expo.dev is reachable.',
);

addCheck(
  'Android package configured',
  appConfig.android?.package === 'com.todolab.mobile',
  appConfig.android?.package ?? 'missing',
);

addCheck(
  'iOS bundle identifier configured',
  appConfig.ios?.bundleIdentifier === 'com.todolab.mobile',
  appConfig.ios?.bundleIdentifier ?? 'missing',
);

addCheck(
  'EAS profiles configured',
  Boolean(easConfig.build?.development && easConfig.build?.preview && easConfig.build?.production),
  Object.keys(easConfig.build ?? {}).join(', ') || 'missing',
);

addCheck(
  'Expo project id linked',
  Boolean(appConfig.extra?.eas?.projectId),
  appConfig.extra?.eas?.projectId ?? 'missing; run `eas init` after logging in.',
);

addCheck(
  'Local Expo state ignored',
  expoStateIgnored.status === 0,
  expoStateIgnored.status === 0
    ? exists('.expo')
      ? '.expo exists locally and is ignored by Git.'
      : '.expo is ignored and may be created by Expo/EAS commands.'
    : 'Add .expo to .gitignore before running Expo/EAS commands.',
);

for (const check of checks) {
  const mark = check.passed ? '✓' : '!';
  console.log(`${mark} ${check.name}: ${check.details}`);
}

const blockingFailures = checks.filter(
  (check) =>
    !check.passed &&
    [
      'EAS CLI installed',
      'Expo account authenticated',
      'Expo project id linked',
      'Local Expo state ignored',
    ].includes(check.name),
);

if (blockingFailures.length > 0) {
  console.log('\nEAS setup is not complete yet. This is expected before Expo login/init.');
  process.exitCode = 1;
}
