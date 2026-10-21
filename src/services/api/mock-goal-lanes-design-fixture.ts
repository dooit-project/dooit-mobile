import type { DdayGoalResponse, LocalDateString, TaskResponse } from '@/types';
import { shiftLocalDate } from '@/utils';

/** Opt-in visual fixture. Called only by the mock client in a development build. */
export function applyGoalLanesDesignFixture(
  goals: DdayGoalResponse[],
  tasks: TaskResponse[],
  date: LocalDateString,
) {
  const definitions = [
    { id: 1, title: '토익 900점 받기', days: 40 },
    { id: 6, seedId: 2, title: '건강한 몸 만들기', days: 90 },
  ];
  for (const definition of definitions) {
    const goal = goals.find(
      (item) => item.id === ('seedId' in definition ? definition.seedId : definition.id),
    );
    if (goal)
      Object.assign(goal, {
        id: definition.id,
        title: definition.title,
        targetDate: shiftLocalDate(date, definition.days),
        daysLeft: definition.days,
      });
  }
  const entries = [
    {
      id: 1,
      title: '영단어 30개 외우기',
      description: '아침 식사 후',
      goalId: 1,
      recurrenceRule: 'FREQ=DAILY',
    },
    { id: 2, title: '토익 문제 30개 풀기', description: '오답까지 정리하기', goalId: 1 },
    { id: 4, title: '토익 시험 접수', goalId: 1, schedule: true },
    {
      id: 3,
      title: '30분 걷기',
      description: '퇴근 후',
      goalId: 6,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
    },
    { id: 7, title: '스트레칭 5분', goalId: 6, done: true },
  ];
  const seeded: TaskResponse[] = entries.map((entry, index) => {
    const base = tasks.find((task) => task.id === entry.id);
    const goal = goals.find((item) => item.id === entry.goalId);
    if (!base || !goal) throw new Error('디자인 fixture의 기본 mock 항목이 없어요.');
    return {
      ...base,
      title: entry.title,
      description: entry.description ?? null,
      category: null,
      type: entry.schedule ? 'SCHEDULE' : 'TODO',
      status: entry.done ? 'DONE' : 'TODAY',
      plannedDate: date,
      completedAt: entry.done ? `${date}T10:00:00` : null,
      startAt: entry.schedule ? `${date}T14:00:00` : null,
      endAt: entry.schedule ? `${date}T14:30:00` : null,
      todayOrder: index + 1,
      ddayGoalId: goal.id,
      ddayGoalTitle: goal.title,
      ddayGoalTargetDate: goal.targetDate,
      ddayDaysLeft: goal.daysLeft,
      recurrenceRule: entry.recurrenceRule ?? null,
    };
  });
  tasks.splice(0, tasks.length, ...seeded);
}
