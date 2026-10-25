import React, { useState } from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { SegmentedControl } from '../segmented-control';

jest.mock('@/theme', () => {
  const actual = jest.requireActual('@/theme');
  return { ...actual, useAppTheme: () => actual.lightTheme };
});

const options = [
  { value: 'TODO', label: '할 일' },
  { value: 'SCHEDULE', label: '일정' },
  { value: 'IDEA', label: '아이디어' },
];
let screen: ReactTestRenderer;
afterEach(() => {
  act(() => screen?.unmount());
  jest.restoreAllMocks();
});

function mount(disabled = false) {
  jest.replaceProperty(Platform, 'OS', 'web');
  const changed = jest.fn();
  function Controlled() {
    const [value, setValue] = useState('SCHEDULE');
    return (
      <SegmentedControl
        accessibilityLabel="유형"
        options={options}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          changed(next);
          setValue(next);
        }}
      />
    );
  }
  act(() => {
    screen = create(<Controlled />);
  });
  const controls = () =>
    options.map(
      (option) =>
        screen.root
          .findAllByProps({ accessibilityRole: 'radio', accessibilityLabel: option.label })
          .find((node) => typeof node.props.onKeyDown === 'function')!,
    );
  const key = (value: string, key: string, modifiers = {}) => {
    const control = controls().find((node) => node.props.accessibilityLabel === value)!;
    const event = { key, preventDefault: jest.fn(), ...modifiers };
    act(() => control.props.onKeyDown(event));
    return event;
  };
  return { changed, controls, key };
}

test.each([
  ['일정', 'ArrowRight', 'IDEA'],
  ['일정', 'ArrowLeft', 'TODO'],
  ['아이디어', 'ArrowDown', 'TODO'],
  ['할 일', 'ArrowUp', 'IDEA'],
  ['일정', 'Home', 'TODO'],
  ['일정', 'End', 'IDEA'],
])('%s의 %s는 한 항목만 선택하고 Tab 진입점도 함께 옮긴다', (label, pressed, next) => {
  const { changed, controls, key } = mount();
  const event = key(label, pressed);
  expect(event.preventDefault).toHaveBeenCalledTimes(1);
  expect(changed).toHaveBeenLastCalledWith(next);
  expect(controls().filter((node) => node.props['aria-checked'])).toHaveLength(1);
  const selected = controls()[options.findIndex((option) => option.value === next)];
  expect(selected.props['aria-checked']).toBe(true);
  expect(selected.props.tabIndex).toBe(0);
  expect(controls().filter((node) => node.props.tabIndex === 0)).toHaveLength(1);
});

test('Space는 초점 항목을 선택하고 보조키 조합은 가로채지 않는다', () => {
  const { changed, key } = mount();
  key('할 일', ' ');
  expect(changed).toHaveBeenLastCalledWith('TODO');
  changed.mockClear();
  const event = key('할 일', 'ArrowRight', { altKey: true });
  expect(changed).not.toHaveBeenCalled();
  expect(event.preventDefault).not.toHaveBeenCalled();
});

test('저장 중에는 키보드 선택을 막고 Tab 진입점을 해제한다', () => {
  const { changed, controls, key } = mount(true);
  key('일정', 'ArrowRight');
  key('일정', ' ');
  expect(changed).not.toHaveBeenCalled();
  expect(controls().every((node) => node.props.disabled && node.props.tabIndex === -1)).toBe(true);
});
