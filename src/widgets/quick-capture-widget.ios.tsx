import { Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityAddTraits,
  accessibilityElement,
  accessibilityHint,
  accessibilityLabel,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineSpacing,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

const QuickCaptureWidgetView = (_props: object, environment: WidgetEnvironment) => {
  'widget';

  const isDark = environment.colorScheme === 'dark';
  const isTinted = environment.widgetRenderingMode === 'accented';
  const backgroundColor = isTinted ? 'clear' : isDark ? '#1E272E' : '#FFFFFF';
  const brandColor = isTinted ? 'primary' : isDark ? '#DCE5EA' : '#526879';
  const titleColor = isTinted ? 'primary' : isDark ? '#F7F9FA' : '#1F2A31';
  const mutedColor = isTinted ? 'secondary' : isDark ? '#AFBDC5' : '#7A8A94';
  const actionColor = isTinted ? 'primary' : isDark ? '#AFC6D5' : '#6F8FA3';

  return (
    <VStack
      alignment="leading"
      spacing={0}
      modifiers={[
        containerBackground(backgroundColor, 'widget'),
        widgetURL('dooit://tasks/new?quickCapture=1'),
        accessibilityElement('ignore'),
        accessibilityLabel('빠른 기록'),
        accessibilityHint('Dooit을 열고 새 할 일 제목을 입력합니다.'),
        accessibilityAddTraits(['isButton']),
        frame({ maxWidth: 1000, maxHeight: 1000, alignment: 'topLeading' }),
        padding({ all: 18 }),
      ]}
    >
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(brandColor)]}>
        dooit
      </Text>
      <Text
        modifiers={[
          font({ size: 21, weight: 'bold' }),
          foregroundStyle(titleColor),
          padding({ top: 9 }),
        ]}
      >
        빠른 기록
      </Text>
      <Text
        modifiers={[
          font({ size: 11, weight: 'regular' }),
          foregroundStyle(mutedColor),
          lineSpacing(2),
          padding({ top: 4 }),
        ]}
      >
        {'생각난 일을\n바로 적어요'}
      </Text>
      <Spacer minLength={8} />
      <Text modifiers={[font({ size: 31, weight: 'light' }), foregroundStyle(actionColor)]}>+</Text>
    </VStack>
  );
};

export default process.env.EXPO_PUBLIC_ENABLE_QUICK_CAPTURE_WIDGET === 'true'
  ? createWidget('QuickCaptureWidget', QuickCaptureWidgetView)
  : null;
