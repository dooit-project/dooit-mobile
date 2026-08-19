const fs = require('node:fs');
const { getNotificationBuildConfigFailures } = require('./lib/check-notification-build-config');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function fail(message) {
  console.error(`Android APK config check failed: ${message}`);
  process.exitCode = 1;
}

const appConfig = readJson('app.json').expo;
const easConfig = readJson('eas.json');
const packageJson = readJson('package.json');

const androidPackage = appConfig.android?.package;
const iosBundleIdentifier = appConfig.ios?.bundleIdentifier;
const androidVersionCode = appConfig.android?.versionCode;
const androidUsesCleartextTraffic = appConfig.android?.usesCleartextTraffic;

if (androidPackage !== 'com.todolab.mobile') {
  fail(`android.package must be com.todolab.mobile, got ${androidPackage ?? 'undefined'}`);
}

if (iosBundleIdentifier !== 'com.todolab.mobile') {
  fail(
    `ios.bundleIdentifier must be com.todolab.mobile, got ${iosBundleIdentifier ?? 'undefined'}`,
  );
}

if (!Number.isInteger(androidVersionCode) || androidVersionCode < 1) {
  fail(`android.versionCode must be a positive integer, got ${androidVersionCode}`);
}

if (androidUsesCleartextTraffic === true) {
  fail('android.usesCleartextTraffic must not be enabled for production APK config');
}

const buildProfiles = easConfig.build ?? {};
const requiredProfiles = ['development', 'preview', 'production'];

for (const profileName of requiredProfiles) {
  if (!buildProfiles[profileName]) {
    fail(`eas.json build.${profileName} profile is missing`);
  }
}

if (buildProfiles.development?.env?.EXPO_PUBLIC_API_MODE !== 'mock') {
  fail('development profile must use EXPO_PUBLIC_API_MODE=mock');
}

for (const profileName of ['preview', 'production']) {
  const profile = buildProfiles[profileName];

  if (profile?.env?.EXPO_PUBLIC_API_MODE !== 'real') {
    fail(`${profileName} profile must use EXPO_PUBLIC_API_MODE=real`);
  }

  const apiUrl = profile?.env?.EXPO_PUBLIC_API_URL;

  if (apiUrl && /localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|172\.16\.|0\.0\.0\.0/.test(apiUrl)) {
    fail(`${profileName} profile must not commit local API URL: ${apiUrl}`);
  }

  if (apiUrl && !apiUrl.startsWith('https://')) {
    fail(`${profileName} profile must use HTTPS API URL when EXPO_PUBLIC_API_URL is committed`);
  }
}

if (buildProfiles.preview?.android?.buildType !== 'apk') {
  fail('preview profile must build an installable Android APK');
}

for (const message of getNotificationBuildConfigFailures(appConfig, packageJson)) {
  fail(message);
}

if (!process.exitCode) {
  console.log('Android APK config check passed.');
}
