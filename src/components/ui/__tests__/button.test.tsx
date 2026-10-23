import React from 'react';
import { act, create } from 'react-test-renderer';

import { AppText } from '../app-text';
import { Button } from '../button';

jest.mock('@/theme', () => {
  const actual = jest.requireActual('@/theme');
  return { ...actual, useAppTheme: () => actual.lightTheme };
});

test('로딩 중에도 버튼 이름과 선택 상태를 유지하고 동작을 잠근 뒤 복구한다', () => {
  let screen: ReturnType<typeof create>;
  const onPress = jest.fn();
  const render = (loading: boolean) => (
    <Button loading={loading} onPress={onPress} accessibilityState={{ selected: true }}>
      목표 만들기
    </Button>
  );
  act(() => {
    screen = create(render(false));
  });
  const control = () => screen!.root.findAllByProps({ accessibilityRole: 'button' })[0];
  act(() => screen!.update(render(true)));
  expect(screen!.root.findByType(AppText).props.children).toBe('목표 만들기');
  expect(control().props.accessibilityLabel).toBe('목표 만들기');
  expect(control().props.accessibilityState).toEqual({
    selected: true,
    disabled: true,
    busy: true,
  });
  act(() => screen!.update(render(false)));
  expect(screen!.root.findByType(AppText).props.children).toBe('목표 만들기');
  expect(control().props.accessibilityState).toEqual({
    selected: true,
    disabled: false,
    busy: false,
  });
  act(() => screen!.unmount());
});
