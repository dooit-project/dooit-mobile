import type { TaskResponse, TaskType } from '@/types';

import {
  getTodayCompletedPreview,
  getTodaySchedulePreview,
  splitTodayTasks,
} from '../today-task-sections';

function createTask(id: number, type: TaskType): TaskResponse {
  return {
    id,
    type,
    title: `Task ${id}`,
    description: null,
    startAt: null,
    endAt: null,
    allDay: false,
    unscheduled: false,
    category: null,
    status: 'TODAY',
    plannedDate: '2026-06-28',
    targetDate: null,
    todayOrder: id,
    completedAt: null,
    carryOverCount: 0,
    staleCarryOver: false,
    deferReason: null,
    deferReasonLabel: null,
    ddayGoalId: null,
    ddayGoalTitle: null,
    ddayGoalTargetDate: null,
    ddayDaysLeft: null,
    createdAt: '2026-06-28T09:00:00',
    updatedAt: null,
  };
}

describe('splitTodayTasks', () => {
  it('일정과 실행 항목을 원래 순서를 유지해 분리한다', () => {
    const schedule = createTask(1, 'SCHEDULE');
    const todo = createTask(2, 'TODO');
    const idea = createTask(3, 'IDEA');

    expect(splitTodayTasks([schedule, todo, idea])).toEqual({
      scheduleTasks: [schedule],
      executionTasks: [todo, idea],
    });
  });

  it('범위 조회에서 같은 일정 ID가 반복되어도 한 번만 표시한다', () => {
    const schedule = createTask(1, 'SCHEDULE');
    const duplicate = { ...schedule, title: '중복 응답' };

    expect(splitTodayTasks([schedule, duplicate])).toEqual({
      scheduleTasks: [schedule],
      executionTasks: [],
    });
  });
});

describe('getTodaySchedulePreview', () => {
  it('일정이 많아도 첫 두 개만 Today 상단에 표시한다', () => {
    const schedules = [1, 2, 3].map((id) => createTask(id, 'SCHEDULE'));

    expect(getTodaySchedulePreview(schedules)).toEqual(schedules.slice(0, 2));
  });
});

describe('getTodayCompletedPreview', () => {
  it('완료 항목이 많아도 최근 세 개만 기본으로 표시한다', () => {
    const completedTasks = [2, 4, 1, 3].map((id) => ({
      ...createTask(id, 'TODO'),
      status: 'DONE' as const,
      completedAt: `2026-06-28T0${id}:00:00`,
    }));

    expect(getTodayCompletedPreview(completedTasks).map((task) => task.id)).toEqual([4, 3, 2]);
  });
});
