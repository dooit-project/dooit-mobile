const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function getShortCommit() {
  const explicitCommit = process.env.APK_COMMIT?.trim();
  if (explicitCommit) {
    return explicitCommit.slice(0, 7);
  }

  return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim();
}

const packageJson = readJson('package.json');
const appJson = readJson('app.json').expo;
const profile = process.env.APK_PROFILE?.trim() || 'preview';
const version = appJson.version ?? packageJson.version;
const versionCode = appJson.android?.versionCode;

if (!version) {
  throw new Error('app.json or package.json version is required.');
}

if (!Number.isInteger(versionCode)) {
  throw new Error('app.json expo.android.versionCode must be an integer.');
}

const filename = `dooit-android-${profile}-v${version}-${versionCode}-${getShortCommit()}.apk`;

console.log(filename);
