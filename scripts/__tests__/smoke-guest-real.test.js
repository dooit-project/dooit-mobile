const { getSeoulDate, hasSameResourceId } = require('../smoke-guest-real');

describe('guest real smoke helpers', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('실행 시점 기준 서울 날짜를 계산한다', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-27T16:00:00.000Z'));

    expect(getSeoulDate(0)).toBe('2026-08-28');
    expect(getSeoulDate(2)).toBe('2026-08-30');
  });

  it('동일 resource replay를 id로 판정한다', () => {
    expect(hasSameResourceId({ id: 7 }, { id: 7 })).toBe(true);
    expect(hasSameResourceId({ id: 7 }, { id: 8 })).toBe(false);
    expect(hasSameResourceId({}, {})).toBe(false);
  });
});
