const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_FALLBACK = '/* /index.html 200';

function getWebRouteFallbackErrors({ appConfig, redirects }) {
  const errors = [];

  if (appConfig?.expo?.web?.output !== 'static') {
    errors.push('expo.web.output은 static이어야 합니다.');
  }

  const rules = String(redirects ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  if (!rules.includes(EXPECTED_FALLBACK)) {
    errors.push(`public/_redirects에 "${EXPECTED_FALLBACK}" 규칙이 필요합니다.`);
  }

  return errors;
}

if (require.main === module) {
  const projectRoot = path.resolve(__dirname, '..');
  const appConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'));
  const redirectsPath = path.join(projectRoot, 'public', '_redirects');
  const redirects = fs.existsSync(redirectsPath) ? fs.readFileSync(redirectsPath, 'utf8') : '';
  const errors = getWebRouteFallbackErrors({ appConfig, redirects });

  if (errors.length > 0) {
    console.error('Web route fallback check failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log('Web route fallback check passed.');
  }
}

module.exports = { EXPECTED_FALLBACK, getWebRouteFallbackErrors };
