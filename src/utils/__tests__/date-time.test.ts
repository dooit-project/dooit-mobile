import {
  getMillisecondsUntilNextAppDate,
  isLocalDateString,
  isLocalDateTimeString,
  parseApiLocalDateTime,
  shiftLocalDate,
  toApiLocalDateTime,
} from '@/utils/date-time';

describe('API 날짜·시간 변환', () => {
  test('서울 자정 직전과 직후의 다음 날짜 갱신 시점을 계산한다', () => {
    expect(getMillisecondsUntilNextAppDate(new Date('2026-10-18T14:59:59.900Z'))).toBe(100);
    expect(getMillisecondsUntilNextAppDate(new Date('2026-10-18T15:00:00.000Z'))).toBe(86_400_000);
  });

  test('연말과 윤년의 날짜 경계도 서울 자정을 기준으로 계산한다', () => {
    expect(getMillisecondsUntilNextAppDate(new Date('2026-12-31T14:00:00Z'))).toBe(3_600_000);
    expect(getMillisecondsUntilNextAppDate(new Date('2024-02-28T14:59:59Z'))).toBe(1_000);
  });

  test('UTC 시각을 서울 wall-clock 문자열로 변환한다', () => {
    const date = new Date('2026-06-23T06:30:45.000Z');

    expect(toApiLocalDateTime(date)).toBe('2026-06-23T15:30:45');
  });

  test('서울 wall-clock 문자열을 같은 instant로 해석한다', () => {
    const date = parseApiLocalDateTime('2026-06-23T15:30:45.123456');

    expect(date?.toISOString()).toBe('2026-06-23T06:30:45.123Z');
  });

  test('윤년과 잘못된 날짜를 구분한다', () => {
    expect(isLocalDateString('2024-02-29')).toBe(true);
    expect(isLocalDateString('2026-02-29')).toBe(false);
    expect(isLocalDateTimeString('2026-06-23T24:00:00')).toBe(false);
  });

  test('기기 시간대와 무관하게 월말 날짜를 이동한다', () => {
    expect(shiftLocalDate('2026-01-31', 1)).toBe('2026-02-01');
    expect(shiftLocalDate('2026-03-01', -1)).toBe('2026-02-28');
  });
});
