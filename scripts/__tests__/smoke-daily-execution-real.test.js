const { assertCategorySummary, assertDailyPlanSummary } = require('../smoke-daily-execution-real');

describe('daily execution real smoke contract', () => {
  it('category summary의 표시명과 count 계약을 확인한다', () => {
    expect(() =>
      assertCategorySummary(
        [
          {
            category: '업무',
            displayName: '업무',
            taskCount: 5,
            inboxCount: 1,
            todayCount: 3,
            doneCount: 1,
          },
        ],
        '업무',
        5,
      ),
    ).not.toThrow();
  });

  it('category 누락과 잘못된 count를 실패로 판정한다', () => {
    expect(() => assertCategorySummary([], '업무', 1)).toThrow('category summary missing');
    expect(() =>
      assertCategorySummary(
        [
          {
            category: '업무',
            displayName: '업무',
            taskCount: 0,
            inboxCount: 0,
            todayCount: 0,
            doneCount: 0,
          },
        ],
        '업무',
        1,
      ),
    ).toThrow('taskCount');
  });

  it('daily plan summary의 정확한 집계를 확인한다', () => {
    const expected = {
      date: '2026-09-06',
      status: 'CONFIRMED',
      plannedFocusCount: 3,
      completedCount: 1,
      movedToOtherDateCount: 1,
      movedToInboxCount: 1,
      undecidedCount: 0,
    };

    expect(() => assertDailyPlanSummary(expected, expected)).not.toThrow();
    expect(() => assertDailyPlanSummary({ ...expected, undecidedCount: 1 }, expected)).toThrow(
      'undecidedCount',
    );
  });
});
