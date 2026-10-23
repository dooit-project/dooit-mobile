import React from 'react';
import { create, act } from 'react-test-renderer';

import { QuickCapture } from '../quick-capture';

const mockMutate = jest.fn();
jest.mock('@/features/tasks', () => ({
  getQuickCaptureResultMessage: jest.fn(),
  useQuickCaptureTask: () => ({ mutate: mockMutate, reset: jest.fn(), isPending: false }),
  useMoveTaskToToday: () => ({ reset: jest.fn(), isPending: false }),
}));
jest.mock('@/services/time/use-app-today', () => ({ useAppToday: () => '2026-10-18' }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/theme', () => ({
  radii: {},
  sizes: {},
  spacing: { 3: 12 },
  useMobileLayout: () => ({ screenPadding: 16 }),
  useAppTheme: () => ({ colors: {} }),
}));
jest.mock('@/components/ui', () => ({
  AppIcon: 'AppIcon',
  AppText: 'AppText',
  Button: 'Button',
  Card: 'Card',
  IconButton: 'IconButton',
  InlineNotice: 'InlineNotice',
}));

test('할 일 메뉴의 한 줄 기록은 TODO를 명시해 날짜가 있어도 유형을 보존한다', () => {
  jest.useFakeTimers();
  let screen: ReturnType<typeof create>;
  act(() => {
    screen = create(<QuickCapture isExpanded onExpandedChange={jest.fn()} />);
  });
  const input = screen!.root.findByProps({ accessibilityLabel: '빠르게 할 일 기록' });
  act(() => input.props.onChangeText('내일 영단어 30개'));
  act(() => screen!.root.findByType('Button' as never).props.onPress());
  expect(mockMutate).toHaveBeenCalledWith(
    expect.objectContaining({
      text: '내일 영단어 30개',
      requestedType: 'TODO',
      timeZone: 'Asia/Seoul',
    }),
    expect.any(Object),
  );
  act(() => screen!.unmount());
  jest.clearAllTimers();
  jest.useRealTimers();
});
