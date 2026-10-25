import { getActionMenuKeyboardIndex, getActionMenuPlacement } from '../action-menu-layout';

describe('관리 메뉴의 경계 배치', () => {
  test('패널 내부 좌표에서 버튼 오른쪽에 맞추며 본문 공간을 사용하지 않는다', () => {
    expect(
      getActionMenuPlacement({
        anchor: { x: 278, y: 20, width: 44, height: 44 },
        host: { width: 390, height: 709 },
        contentHeight: 142,
      }),
    ).toEqual({ left: 114, top: 68, width: 208, maxHeight: 633 });
  });

  test('왼쪽 끝 버튼과 작은 화면에서도 양쪽 여백을 보존한다', () => {
    const result = getActionMenuPlacement({
      anchor: { x: 0, y: 8, width: 44, height: 44 },
      host: { width: 180, height: 300 },
      contentHeight: 142,
    });
    expect(result.left).toBe(8);
    expect(result.width).toBe(164);
    expect(result.left + result.width).toBe(172);
  });

  test('아래 공간이 부족하면 위로 열고 버튼과 겹치지 않는다', () => {
    expect(
      getActionMenuPlacement({
        anchor: { x: 350, y: 240, width: 44, height: 44 },
        host: { width: 390, height: 300 },
        contentHeight: 142,
      }),
    ).toEqual({ left: 174, top: 94, width: 208, maxHeight: 228 });
  });

  test('긴 메뉴는 더 넓은 방향의 가용 높이로 제한해 스크롤할 수 있다', () => {
    expect(
      getActionMenuPlacement({
        anchor: { x: 250, y: 120, width: 44, height: 44 },
        host: { width: 320, height: 240 },
        contentHeight: 600,
      }),
    ).toEqual({ left: 86, top: 8, width: 208, maxHeight: 108 });
  });
});

describe('관리 메뉴 키보드 탐색', () => {
  test('방향키는 처음과 끝 사이에서 순환하고 아직 초점이 없을 때도 진입한다', () => {
    expect(getActionMenuKeyboardIndex(3, 2, 'ArrowDown')).toBe(0);
    expect(getActionMenuKeyboardIndex(3, 0, 'ArrowUp')).toBe(2);
    expect(getActionMenuKeyboardIndex(3, -1, 'ArrowDown')).toBe(0);
    expect(getActionMenuKeyboardIndex(3, -1, 'ArrowUp')).toBe(2);
  });

  test('Home/End는 양끝으로 이동하며 닫기/선택 키와 빈 메뉴는 탐색하지 않는다', () => {
    expect(getActionMenuKeyboardIndex(3, 1, 'Home')).toBe(0);
    expect(getActionMenuKeyboardIndex(3, 1, 'End')).toBe(2);
    for (const key of ['Escape', 'Tab', 'Enter', ' ']) {
      expect(getActionMenuKeyboardIndex(3, 1, key)).toBeNull();
    }
    expect(getActionMenuKeyboardIndex(0, -1, 'ArrowDown')).toBeNull();
  });
});
