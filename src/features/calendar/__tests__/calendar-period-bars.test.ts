import type { TaskResponse } from '@/types';

import {
  buildCalendarPeriodSegments,
  buildCalendarSingleDayLabels,
  getCalendarScheduleAccessibilityLabel,
  getCalendarSingleDayLabel,
  layoutCalendarPeriodSegments,
} from '../calendar-period-bars';

const schedule: TaskResponse = {
  id: 1,
  type: 'SCHEDULE',
  title: '기간 일정',
  description: null,
  startAt: '2026-07-03T09:00:00',
  endAt: '2026-07-08T18:00:00',
  allDay: false,
  unscheduled: false,
  category: null,
  status: 'TODAY',
  plannedDate: '2026-07-03',
  targetDate: null,
  todayOrder: null,
  completedAt: null,
  carryOverCount: 0,
  staleCarryOver: false,
  deferReason: null,
  deferReasonLabel: null,
  ddayGoalId: null,
  ddayGoalTitle: null,
  ddayGoalTargetDate: null,
  ddayDaysLeft: null,
  createdAt: '2026-07-03T08:00:00',
  updatedAt: null,
};

describe('buildCalendarPeriodSegments', () => {
  it('월요일 자정에 끝나는 일정은 일요일 뒤에 계속되는 화살표를 표시하지 않는다', () => {
    const endingAtBoundary = {
      ...schedule,
      startAt: '2026-10-30T09:00:00',
      endAt: '2026-11-02T00:00:00',
    } satisfies TaskResponse;
    const dates = [
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ];

    expect(buildCalendarPeriodSegments([endingAtBoundary], dates)).toEqual([
      {
        task: endingAtBoundary,
        startIndex: 4,
        endIndex: 6,
        continuesBefore: false,
        continuesAfter: false,
      },
    ]);
  });

  it('월 경계를 넘어 월요일 이후에도 진행되면 다음 주로 이어짐을 표시한다', () => {
    const continuing = {
      ...schedule,
      startAt: '2026-10-30T09:00:00',
      endAt: '2026-11-02T09:00:00',
    } satisfies TaskResponse;
    const dates = [
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ];

    expect(buildCalendarPeriodSegments([continuing], dates)[0].continuesAfter).toBe(true);
  });

  it('주 경계에서 이어지는 기간과 continuation을 계산한다', () => {
    const dates = [
      '2026-07-06',
      '2026-07-07',
      '2026-07-08',
      '2026-07-09',
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
    ] as const;

    expect(buildCalendarPeriodSegments([schedule], [...dates])).toEqual([
      {
        task: schedule,
        startIndex: 0,
        endIndex: 2,
        continuesBefore: true,
        continuesAfter: false,
      },
    ]);
  });

  it('표시 범위와 겹치지 않는 일정은 bar를 만들지 않는다', () => {
    expect(
      buildCalendarPeriodSegments(
        [schedule],
        [
          '2026-07-13',
          '2026-07-14',
          '2026-07-15',
          '2026-07-16',
          '2026-07-17',
          '2026-07-18',
          '2026-07-19',
        ],
      ),
    ).toEqual([]);
  });

  it('하루 일정은 기간 bar로 표시하지 않는다', () => {
    const singleDay = {
      ...schedule,
      startAt: '2026-07-06T09:00:00',
      endAt: '2026-07-06T18:00:00',
    } satisfies TaskResponse;

    expect(
      buildCalendarPeriodSegments(
        [singleDay],
        [
          '2026-07-06',
          '2026-07-07',
          '2026-07-08',
          '2026-07-09',
          '2026-07-10',
          '2026-07-11',
          '2026-07-12',
        ],
      ),
    ).toEqual([]);
  });
});

describe('buildCalendarSingleDayLabels', () => {
  const dates = [
    '2026-07-06',
    '2026-07-07',
    '2026-07-08',
    '2026-07-09',
    '2026-07-10',
    '2026-07-11',
    '2026-07-12',
  ] as const;

  it('하루 일정만 해당 날짜 label에 배치한다', () => {
    const singleDay = {
      ...schedule,
      id: 2,
      title: '주간 회의',
      startAt: '2026-07-09T09:00:00',
      endAt: '2026-07-09T10:00:00',
    } satisfies TaskResponse;
    const labels = buildCalendarSingleDayLabels([schedule, singleDay], [...dates]);

    expect(labels.map((items) => items.map((task) => task.id))).toEqual([
      [],
      [],
      [],
      [2],
      [],
      [],
      [],
    ]);
  });

  it('시간이 있는 하루 일정은 달력 label에 시작 시간을 함께 표시한다', () => {
    const timed = {
      ...schedule,
      title: '백엔드 회의',
      startAt: '2026-07-09T14:00:00',
      endAt: '2026-07-09T14:30:00',
    } satisfies TaskResponse;

    expect(getCalendarSingleDayLabel(timed)).toBe('14:00 백엔드 회의');
    expect(getCalendarSingleDayLabel(timed, false, true)).toBe('백엔드 회의');
    expect(getCalendarSingleDayLabel(timed, true)).toBe('백엔드 회의');
    expect(getCalendarSingleDayLabel({ ...timed, allDay: true })).toBe('백엔드 회의');
    expect(getCalendarSingleDayLabel({ ...timed, allDay: true }, false, true)).toBe('백엔드 회의');
  });

  it('반복 일정은 달력 접근성 label에 반복 정보를 포함한다', () => {
    const recurring = {
      ...schedule,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU',
    } satisfies TaskResponse;

    expect(getCalendarScheduleAccessibilityLabel(recurring, '하루 일정')).toBe(
      '기간 일정, 하루 일정, 09:00, 매주 화',
    );
  });

  it('실행 Task는 달력 일정 label에서 제외한다', () => {
    const task = {
      ...schedule,
      id: 3,
      type: 'TODO',
      startAt: '2026-07-09T09:00:00',
      endAt: '2026-07-09T10:00:00',
    } satisfies TaskResponse;

    expect(buildCalendarSingleDayLabels([task], [...dates]).every((items) => !items.length)).toBe(
      true,
    );
  });
});

describe('layoutCalendarPeriodSegments', () => {
  const dates = [
    '2026-07-06',
    '2026-07-07',
    '2026-07-08',
    '2026-07-09',
    '2026-07-10',
    '2026-07-11',
    '2026-07-12',
  ] as const;

  it('겹치지 않는 기간은 같은 lane을 재사용한다', () => {
    const later = {
      ...schedule,
      id: 2,
      startAt: '2026-07-10T09:00:00',
      endAt: '2026-07-11T18:00:00',
    } satisfies TaskResponse;
    const layout = layoutCalendarPeriodSegments([schedule, later], [...dates]);

    expect(layout.segments.map(({ task, lane }) => [task.id, lane])).toEqual([
      [1, 0],
      [2, 0],
    ]);
    expect(layout.overflowCount).toBe(0);
  });

  it('두 lane을 넘는 겹침은 +N 대상으로 축약한다', () => {
    const overlapping = [1, 2, 3].map(
      (id) =>
        ({
          ...schedule,
          id,
          startAt: '2026-07-06T09:00:00',
          endAt: '2026-07-08T18:00:00',
        }) satisfies TaskResponse,
    );
    const layout = layoutCalendarPeriodSegments(overlapping, [...dates]);

    expect(layout.segments.map(({ lane }) => lane)).toEqual([0, 1]);
    expect(layout.overflowCount).toBe(1);
    expect(layout.overflowSegments.map(({ task }) => task.id)).toEqual([3]);
  });
});
