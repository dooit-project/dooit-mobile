import { getGoalTabKeyboardTarget, getGoalTabScrollOffset } from '../goal-tab-navigation';

describe('선택 목표 탭 노출', () => {
  const base = { viewportWidth: 180, contentWidth: 560, offset: 0 };
  test('선택이 먼저 도착하면 측정을 기다리고 위치가 도착하면 탭 전체를 드러낸다', () => {
    expect(getGoalTabScrollOffset(base)).toBeUndefined();
    expect(getGoalTabScrollOffset({ ...base, tab: { x: 300, width: 160 } })).toBe(288);
  });
  test('보이는 탭은 유지하고 왼쪽 탭을 선택하면 시작으로 복귀한다', () => {
    expect(getGoalTabScrollOffset({ ...base, tab: { x: 8, width: 150 } })).toBe(0);
    expect(getGoalTabScrollOffset({ ...base, offset: 288, tab: { x: 0, width: 150 } })).toBe(0);
  });
  test('크기가 변해도 끝을 넘지 않고 뷰포트만큼 넓은 탭의 앞부분을 보존한다', () => {
    expect(getGoalTabScrollOffset({ ...base, tab: { x: 400, width: 160 } })).toBe(380);
    expect(getGoalTabScrollOffset({ ...base, tab: { x: 180, width: 180 } })).toBe(180);
    expect(
      getGoalTabScrollOffset({
        ...base,
        viewportWidth: 600,
        offset: 288,
        tab: { x: 400, width: 160 },
      }),
    ).toBe(0);
  });
  test('숨겨진 화면과 아직 측정되지 않은 내용에는 스크롤을 지시하지 않는다', () => {
    expect(
      getGoalTabScrollOffset({ ...base, viewportWidth: 0, tab: { x: 300, width: 160 } }),
    ).toBeUndefined();
    expect(
      getGoalTabScrollOffset({ ...base, contentWidth: 0, tab: { x: 300, width: 160 } }),
    ).toBeUndefined();
  });
});

test('좌우·Home·End는 목표 사이를 이동하고 Tab·Enter는 기본 조작에 남긴다', () => {
  const keys = ['first', 'middle', 'last'];
  expect(getGoalTabKeyboardTarget(keys, 'first', 'ArrowLeft')).toBe('last');
  expect(getGoalTabKeyboardTarget(keys, 'last', 'ArrowRight')).toBe('first');
  expect(getGoalTabKeyboardTarget(keys, 'middle', 'Home')).toBe('first');
  expect(getGoalTabKeyboardTarget(keys, 'middle', 'End')).toBe('last');
  expect(getGoalTabKeyboardTarget(keys, 'middle', 'Tab')).toBeUndefined();
  expect(getGoalTabKeyboardTarget(keys, 'middle', 'Enter')).toBeUndefined();
});
