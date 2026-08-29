const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIRECTORY = path.join('docs', 'screenshots');
const MANIFEST_PATH = path.join(SCREENSHOT_DIRECTORY, 'manifest.json');
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function fail(messages) {
  console.error('Screenshot freshness check failed:');
  console.error(messages.join('\n'));
  process.exit(1);
}

const errors = [];
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const capturedAt = new Date(`${manifest.capturedAt}T00:00:00+09:00`);

if (Number.isNaN(capturedAt.getTime())) {
  errors.push(`Invalid capturedAt date: ${manifest.capturedAt}`);
}

if (!Number.isInteger(manifest.refreshAfterDays) || manifest.refreshAfterDays < 1) {
  errors.push(`refreshAfterDays must be a positive integer: ${manifest.refreshAfterDays}`);
}

const todayInSeoul = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const today = new Date(`${todayInSeoul}T00:00:00+09:00`);
const ageDays = Math.floor((today - capturedAt) / ONE_DAY_MS);

if (!Number.isNaN(ageDays) && ageDays >= manifest.refreshAfterDays) {
  errors.push(
    `Canonical screenshots are ${ageDays} days old (refresh every ${manifest.refreshAfterDays} days). Recapture and update ${MANIFEST_PATH}.`,
  );
}

if (!Array.isArray(manifest.screenshots) || manifest.screenshots.length === 0) {
  errors.push('screenshots must be a non-empty array.');
}

const listedFiles = new Set();
for (const screenshot of manifest.screenshots ?? []) {
  if (!screenshot.file || !screenshot.route || !screenshot.state) {
    errors.push(`Each screenshot needs file, route, and state: ${JSON.stringify(screenshot)}`);
    continue;
  }

  if (listedFiles.has(screenshot.file)) {
    errors.push(`Duplicate screenshot entry: ${screenshot.file}`);
  }
  listedFiles.add(screenshot.file);

  if (!fs.existsSync(path.join(SCREENSHOT_DIRECTORY, screenshot.file))) {
    errors.push(`Missing screenshot file: ${screenshot.file}`);
  }
}

const pngFiles = fs
  .readdirSync(SCREENSHOT_DIRECTORY)
  .filter((file) => file.endsWith('.png'))
  .sort();

for (const file of pngFiles) {
  if (!listedFiles.has(file)) errors.push(`PNG is not listed in manifest: ${file}`);
}

if (errors.length > 0) fail(errors);

console.log(
  `Canonical screenshots are current: ${manifest.capturedAt} (${ageDays} days old, refresh every ${manifest.refreshAfterDays} days).`,
);
