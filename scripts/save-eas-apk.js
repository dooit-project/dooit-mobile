const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--url') {
      args.url = argv[index + 1];
      index += 1;
    } else if (value === '--out-dir') {
      args.outDir = argv[index + 1];
      index += 1;
    } else if (value === '--profile') {
      args.profile = argv[index + 1];
      index += 1;
    } else if (value === '--commit') {
      args.commit = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function getShortCommit(explicitCommit) {
  if (explicitCommit) {
    return explicitCommit.slice(0, 7);
  }

  return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim();
}

function getApkFilename({ profile, commit }) {
  const packageJson = readJson('package.json');
  const appJson = readJson('app.json').expo;
  const version = appJson.version ?? packageJson.version;
  const versionCode = appJson.android?.versionCode;

  if (!version) {
    throw new Error('app.json or package.json version is required.');
  }

  if (!Number.isInteger(versionCode)) {
    throw new Error('app.json expo.android.versionCode must be an integer.');
  }

  return `dooit-android-${profile}-v${version}-${versionCode}-${getShortCommit(commit)}.apk`;
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https
      .get(url, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
          file.close();
          fs.unlinkSync(destination);
          download(response.headers.location, destination).then(resolve, reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destination);
          reject(new Error(`APK download failed with HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      })
      .on('error', (error) => {
        file.close();
        if (fs.existsSync(destination)) {
          fs.unlinkSync(destination);
        }
        reject(error);
      });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    console.error(
      'Usage: node scripts/save-eas-apk.js --url <apk-url> [--out-dir <dir>] [--profile preview] [--commit <sha>]',
    );
    process.exit(1);
  }

  const profile = args.profile ?? 'preview';
  const outDir = path.resolve(
    args.outDir ?? path.join(process.env.HOME ?? '.', 'Downloads', 'dooit-apk'),
  );
  const filename = getApkFilename({ profile, commit: args.commit });
  const destination = path.join(outDir, filename);

  fs.mkdirSync(outDir, { recursive: true });
  await download(args.url, destination);
  console.log(destination);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
