const baseConfig = require('./app.json');

module.exports = () => {
  const config = baseConfig.expo;
  const outsideCaptureEnabled = process.env.EXPO_PUBLIC_ENABLE_OUTSIDE_CAPTURE === 'true';
  const quickCaptureWidgetEnabled = process.env.EXPO_PUBLIC_ENABLE_QUICK_CAPTURE_WIDGET === 'true';
  const plugins = [...config.plugins];

  if (outsideCaptureEnabled) {
    plugins.push([
      'expo-sharing',
      {
        ios: {
          enabled: true,
          activationRule: {
            supportsText: true,
            supportsWebUrlWithMaxCount: 1,
            supportsWebPageWithMaxCount: 1,
          },
        },
        android: {
          enabled: true,
          singleShareMimeTypes: ['text/plain'],
        },
      },
    ]);
  }

  if (quickCaptureWidgetEnabled) {
    plugins.push([
      'expo-widgets',
      {
        widgets: [
          {
            name: 'QuickCaptureWidget',
            displayName: '빠른 기록',
            description: '생각난 할 일을 Dooit에 바로 적어요.',
            ios: {
              supportedFamilies: ['systemSmall'],
              contentMarginsDisabled: true,
            },
          },
        ],
      },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};
