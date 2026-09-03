const assert = require('node:assert/strict');

const easConfig = require('../eas.json');
const loadAppConfig = require('../app.config.js');

const originalValue = process.env.EXPO_PUBLIC_ENABLE_QUICK_CAPTURE_WIDGET;

function plugins(config) {
  return config.plugins.map((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin));
}

try {
  delete process.env.EXPO_PUBLIC_ENABLE_QUICK_CAPTURE_WIDGET;
  const defaultConfig = loadAppConfig();
  assert.equal(
    plugins(defaultConfig).includes('expo-widgets'),
    false,
    '기본 app config에 expo-widgets가 포함되면 안 됩니다.',
  );

  process.env.EXPO_PUBLIC_ENABLE_QUICK_CAPTURE_WIDGET = 'true';
  const prototypeConfig = loadAppConfig();
  const widgetPlugin = prototypeConfig.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-widgets',
  );
  const widget = widgetPlugin?.[1]?.widgets?.[0];

  assert.ok(widgetPlugin, '전용 app config에 expo-widgets가 필요합니다.');
  assert.equal(widget.name, 'QuickCaptureWidget');
  assert.deepEqual(widget.ios.supportedFamilies, ['systemSmall']);
  assert.equal(widget.ios.contentMarginsDisabled, true);

  const profile = easConfig.build['quick-capture-widget'];
  assert.ok(profile, 'quick-capture-widget EAS profile이 필요합니다.');
  assert.equal(profile.developmentClient, true);
  assert.equal(profile.distribution, 'internal');
  assert.equal(profile.env.EXPO_PUBLIC_ENABLE_QUICK_CAPTURE_WIDGET, 'true');

  console.log('Quick capture widget config check passed.');
} finally {
  if (originalValue === undefined) {
    delete process.env.EXPO_PUBLIC_ENABLE_QUICK_CAPTURE_WIDGET;
  } else {
    process.env.EXPO_PUBLIC_ENABLE_QUICK_CAPTURE_WIDGET = originalValue;
  }
}
