const baseConfig = require('./app.json');

module.exports = () => {
  const config = baseConfig.expo;
  const outsideCaptureEnabled = process.env.EXPO_PUBLIC_ENABLE_OUTSIDE_CAPTURE === 'true';

  return {
    ...config,
    plugins: outsideCaptureEnabled
      ? [
          ...config.plugins,
          [
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
          ],
        ]
      : config.plugins,
  };
};
