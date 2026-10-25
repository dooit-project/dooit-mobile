import React from 'react';
import { Modal, Platform } from 'react-native';
import { act, create } from 'react-test-renderer';

import { Button } from '../button';
import { ConfirmDialog } from '../confirm-dialog';

jest.mock('@/theme', () => {
  const actual = jest.requireActual('@/theme');
  return { ...actual, useAppTheme: () => actual.lightTheme };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

test.each(['android', 'ios'] as const)(
  '%s의 시스템 닫기·배경·계속 작성은 보존하며 명시한 버리기만 확정한다',
  (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    let screen: ReturnType<typeof create>;
    act(() => {
      screen = create(
        <ConfirmDialog
          title="변경 내용을 버릴까요?"
          message="저장하지 않은 변경 내용이 사라져요."
          confirmLabel="변경 내용 버리기"
          cancelLabel="계속 작성"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
      );
    });
    act(() => screen!.root.findByType(Modal).props.onRequestClose());
    act(() => screen!.root.findAllByProps({ testID: 'confirmation-backdrop' })[0].props.onPress());
    const buttons = screen!.root.findAllByType(Button);
    const keep = buttons.find((button) => button.props.children === '계속 작성')!;
    act(() => keep.props.onPress());
    expect(onCancel).toHaveBeenCalledTimes(3);
    expect(onConfirm).not.toHaveBeenCalled();
    const discard = buttons.find((button) => button.props.children === '변경 내용 버리기')!;
    act(() => discard.props.onPress());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(3);
    act(() => screen!.unmount());
    jest.restoreAllMocks();
  },
);
