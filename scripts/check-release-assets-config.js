const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const readJson = (relativePath) => {
  const filePath = path.join(ROOT, relativePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const pngSize = (relativePath) => {
  const filePath = path.join(ROOT, relativePath);
  const buffer = fs.readFileSync(filePath);
  const pngSignature = '89504e470d0a1a0a';

  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    throw new Error(`${relativePath} is not a PNG file.`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
};

const expect = (condition, passMessage, failMessage, results) => {
  if (condition) {
    results.push({ ok: true, message: passMessage });
    return;
  }

  results.push({ ok: false, message: failMessage });
};

const expectFile = (relativePath, results) => {
  const exists = fs.existsSync(path.join(ROOT, relativePath));
  expect(exists, `${relativePath} exists`, `${relativePath} is missing`, results);
};

const expectPngSize = (relativePath, width, height, results) => {
  try {
    const actual = pngSize(relativePath);
    expect(
      actual.width === width && actual.height === height,
      `${relativePath} is ${width}×${height}`,
      `${relativePath} is ${actual.width}×${actual.height}; expected ${width}×${height}`,
      results,
    );
  } catch (error) {
    results.push({ ok: false, message: error.message });
  }
};

const app = readJson('app.json').expo;
const results = [];
const splashPlugin = app.plugins?.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
);
const splashOptions = Array.isArray(splashPlugin) ? splashPlugin[1] : undefined;

expect(
  app.name === 'Dooit',
  'App display name is Dooit',
  'App display name must be Dooit',
  results,
);
expect(
  app.slug === 'dooit-mobile',
  'App slug is dooit-mobile',
  'App slug must be dooit-mobile',
  results,
);
expect(
  app.scheme === 'dooit',
  'Deep link scheme is dooit',
  'Deep link scheme must stay dooit',
  results,
);
expect(
  Boolean(splashPlugin),
  'Splash screen plugin is configured',
  'expo-splash-screen plugin is missing',
  results,
);
expect(
  splashOptions?.backgroundColor === '#526879',
  'Splash background keeps the white mark visible',
  'Splash background must be #526879 so the white mark stays visible',
  results,
);

[
  app.icon,
  app.ios?.icon,
  app.android?.adaptiveIcon?.foregroundImage,
  app.android?.adaptiveIcon?.backgroundImage,
  app.android?.adaptiveIcon?.monochromeImage,
  app.web?.favicon,
].forEach((assetPath) => {
  if (assetPath) {
    expectFile(assetPath.replace(/^\.\//, ''), results);
  }
});

expectPngSize('assets/images/icon.png', 1024, 1024, results);
expectPngSize('assets/images/android-icon-foreground.png', 512, 512, results);
expectPngSize('assets/images/android-icon-background.png', 512, 512, results);
expectPngSize('assets/images/android-icon-monochrome.png', 432, 432, results);
expectPngSize('assets/images/favicon.png', 48, 48, results);
expectPngSize('assets/images/splash-icon.png', 228, 213, results);

for (const result of results) {
  console.log(`${result.ok ? '✓' : '!'} ${result.message}`);
}

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(`\nRelease assets/config check failed with ${failed.length} issue(s).`);
  process.exit(1);
}

console.log('\nRelease assets/config check passed.');
