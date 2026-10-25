import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { useTaskUnloadProtection } from '../use-task-unload-protection';

function Guard({ protect }: { protect: boolean }) {
  useTaskUnloadProtection(protect);
  return null;
}

let screen: ReactTestRenderer;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const add = jest.fn();
const remove = jest.fn();
beforeEach(() => {
  add.mockClear();
  remove.mockClear();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { addEventListener: add, removeEventListener: remove },
  });
});
afterEach(() => {
  act(() => screen?.unmount());
  jest.restoreAllMocks();
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

test('Web의 무변경 상태에는 등록하지 않고 초안/저장 중 보호를 켜고 해제한다', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  act(() => {
    screen = create(<Guard protect={false} />);
  });
  expect(add).not.toHaveBeenCalled();
  act(() => screen.update(<Guard protect />));
  expect(add).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  const handler = add.mock.calls[0][1];
  const event = { preventDefault: jest.fn(), returnValue: undefined };
  handler(event);
  expect(event.preventDefault).toHaveBeenCalledTimes(1);
  expect(event.returnValue).toBe('');
  act(() => screen.update(<Guard protect={false} />));
  expect(remove).toHaveBeenLastCalledWith('beforeunload', handler);
  act(() => screen.update(<Guard protect />));
  const latestHandler = add.mock.calls[1][1];
  act(() => screen.unmount());
  expect(remove).toHaveBeenLastCalledWith('beforeunload', latestHandler);
});

test.each(['ios', 'android'] as const)('%s는 브라우저 이벤트를 등록하지 않는다', (os) => {
  jest.replaceProperty(Platform, 'OS', os);
  act(() => {
    screen = create(<Guard protect />);
  });
  expect(add).not.toHaveBeenCalled();
});
