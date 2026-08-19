function getPluginName(plugin) {
  return Array.isArray(plugin) ? plugin[0] : plugin;
}

function getNotificationBuildConfigFailures(appConfig, packageJson) {
  const failures = [];
  const plugins = appConfig.plugins ?? [];

  if (!packageJson.dependencies?.['expo-notifications']) {
    failures.push('expo-notifications must be installed as a production dependency');
  }

  if (!plugins.some((plugin) => getPluginName(plugin) === 'expo-notifications')) {
    failures.push('app.json plugins must include expo-notifications for native builds');
  }

  return failures;
}

module.exports = { getNotificationBuildConfigFailures };
