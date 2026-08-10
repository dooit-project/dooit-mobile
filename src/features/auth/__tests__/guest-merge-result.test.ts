import { createGuestMergeRouteParams, getGuestMergeNoticeMessage } from '../guest-merge-result';

describe('guest merge result', () => {
  it('백엔드 병합 건수를 Today route parameter로 변환한다', () => {
    expect(
      createGuestMergeRouteParams({
        tasks: 3,
        schedules: 2,
        ddayGoals: 1,
        recurrenceSeries: 0,
      }),
    ).toEqual({
      linked: '1',
      linkedTasks: '3',
      linkedSchedules: '2',
      linkedDdayGoals: '1',
      linkedRecurrenceSeries: '0',
    });
  });

  it('0개인 항목은 제외하고 연결 결과를 안내한다', () => {
    expect(
      getGuestMergeNoticeMessage({
        linkedTasks: '3',
        linkedSchedules: '0',
        linkedDdayGoals: '1',
        linkedRecurrenceSeries: '0',
      }),
    ).toBe('할 일 3개, D-Day 1개를 계정에 안전하게 연결했어요.');
  });

  it('병합 건수가 없거나 잘못된 값이면 기존 연결 안내를 사용한다', () => {
    expect(getGuestMergeNoticeMessage({ linkedTasks: 'invalid' })).toBe(
      '게스트로 작성한 내용을 계정에 안전하게 연결했어요.',
    );
  });
});
