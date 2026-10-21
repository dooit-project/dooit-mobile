import type { TaskResponse } from '@/types';
import { groupTodayTaskRecords } from '../today-task-groups';

const task = (value: Partial<TaskResponse>): TaskResponse =>
  ({
    id: 1,
    title: '할 일',
    type: 'TODO',
    status: 'TODAY',
    ddayGoalId: null,
    todayOrder: 1,
    ...value,
  }) as TaskResponse;

describe('오늘의 할 일과 완료 기록 묶음', () => {
  it('완료 기록이 먼저 도착해도 할 일 순서에 따라 목표를 표시한다', () => {
    const groups = groupTodayTaskRecords(
      [
        task({ id: 1, ddayGoalId: 1, todayOrder: 1 }),
        task({ id: 2, ddayGoalId: 2, todayOrder: 2 }),
      ],
      [task({ id: 7, ddayGoalId: 2, status: 'DONE', todayOrder: 7 })],
    );
    expect(groups.map((group) => group.goalId)).toEqual([1, 2]);
    expect(groups[1].tasks.map((item) => item.id)).toEqual([2, 7]);
  });
  it('재개한 항목이 예전 완료 조회에도 남아 있어도 현재 상태로 한 번만 표시한다', () => {
    const groups = groupTodayTaskRecords([task({ status: 'TODAY' })], [task({ status: 'DONE' })]);
    expect(groups[0].tasks).toHaveLength(1);
    expect(groups[0].tasks[0].status).toBe('TODAY');
  });
  it('완료한 항목만 있는 날에도 실제 기록을 유지한다', () => {
    const groups = groupTodayTaskRecords([], [task({ status: 'DONE', ddayGoalId: 1 })]);
    expect(groups[0].tasks[0].status).toBe('DONE');
  });
  it('아이디어를 오늘 체크 목록에 섞지 않는다', () => {
    expect(groupTodayTaskRecords([task({ type: 'IDEA' })], [])).toEqual([]);
  });
});
