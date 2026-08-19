function getWebProductionConfigErrors(environment) {
  const apiMode = (environment.EXPO_PUBLIC_API_MODE_OVERRIDE ?? environment.EXPO_PUBLIC_API_MODE)
    ?.trim()
    .toLowerCase();
  const apiUrl = (
    environment.EXPO_PUBLIC_API_URL_OVERRIDE ?? environment.EXPO_PUBLIC_API_URL
  )?.trim();
  const errors = [];

  if (apiMode !== 'real') {
    errors.push('EXPO_PUBLIC_API_MODE 또는 override가 real이어야 합니다.');
  }

  if (!apiUrl) {
    errors.push('EXPO_PUBLIC_API_URL 또는 override가 필요합니다.');
    return errors;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    errors.push('API URL은 올바른 절대 URL이어야 합니다.');
    return errors;
  }

  if (parsedUrl.protocol !== 'https:') {
    errors.push('운영 Web API URL은 HTTPS를 사용해야 합니다.');
  }

  if (parsedUrl.username || parsedUrl.password) {
    errors.push('운영 Web API URL에 인증 정보를 포함할 수 없습니다.');
  }

  return errors;
}

if (require.main === module) {
  const errors = getWebProductionConfigErrors(process.env);

  if (errors.length > 0) {
    console.error('Web production config check failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL_OVERRIDE ?? process.env.EXPO_PUBLIC_API_URL;
    console.log('Web production config check passed.');
    console.log(`API mode: real`);
    console.log(`API origin: ${new URL(apiUrl).origin}`);
  }
}

module.exports = { getWebProductionConfigErrors };
