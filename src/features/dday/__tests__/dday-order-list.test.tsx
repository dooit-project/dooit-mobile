import React from 'react';
import { PanResponder } from 'react-native';
import { act, create } from 'react-test-renderer';

import { DdayOrderList } from '../dday-order-list';

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'Icon' }));
jest.mock('@/components/ui', () => ({ AppText: 'AppText', IconButton: 'IconButton' }));
jest.mock('@/theme', () => ({ spacing: {}, useAppTheme: () => ({ colors: {} }) }));

test('drag handlers are registered without running and observe committed disabled props', () => {
  const registered: Parameters<typeof PanResponder.create>[0][] = [];
  const factory = jest.spyOn(PanResponder, 'create').mockImplementation((handlers) => {
    registered.push(handlers);
    return { panHandlers: {} };
  });
  const firstDragging = jest.fn();
  const latestDragging = jest.fn();
  const items = [{ id: 1, title: '계획' }];
  let screen: ReturnType<typeof create>;
  try {
    act(() => {
      screen = create(
        <DdayOrderList
          items={items}
          disabled={false}
          onMove={jest.fn()}
          onDragging={firstDragging}
        />,
      );
    });
    expect(firstDragging).not.toHaveBeenCalled();
    expect(registered).toHaveLength(1);
    expect(registered[0].onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
    act(() =>
      screen!.update(
        <DdayOrderList items={items} disabled onMove={jest.fn()} onDragging={latestDragging} />,
      ),
    );
    expect(registered).toHaveLength(1);
    expect(registered[0].onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(false);
    act(() => screen!.unmount());
    expect(latestDragging).toHaveBeenCalledWith(false);
    expect(firstDragging).not.toHaveBeenCalled();
  } finally {
    factory.mockRestore();
  }
});
