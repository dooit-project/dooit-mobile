import type { TaskResponse } from '@/types';

type TodayGroup = {
  goalId: number | null;
  title: string;
  tasks: TaskResponse[];
  kind: 'goal' | 'schedule' | 'task';
  goalNamespace?: 'goal' | 'dday';
};

/** Current Today records win over a stale completed-list response with the same ID. */
export function groupTodayTaskRecords(
  todayTasks: TaskResponse[],
  doneTasks: TaskResponse[],
  goalTitles: Record<number, string> = {},
) {
  const unique = new Map([...doneTasks, ...todayTasks].map((task) => [task.id, task]));
  return groupTodayTasks(
    sortGroupTasks([...unique.values()].filter((task) => task.type !== 'IDEA')),
    goalTitles,
  );
}

function groupTodayTasks(tasks: TaskResponse[], goalTitles: Record<number, string>): TodayGroup[] {
  const goalGroups = new Map<string, TodayGroup>();
  const unlinkedSchedules: TaskResponse[] = [];
  const unlinkedTasks: TaskResponse[] = [];

  tasks.forEach((task) => {
    const linkedGoalId = task.linkedGoalId ?? null;
    const goalId = linkedGoalId ?? task.ddayGoalId;
    if (goalId !== null) {
      const goalNamespace = linkedGoalId !== null ? 'goal' : 'dday';
      const key = `${goalNamespace}:${goalId}`;
      const current = goalGroups.get(key) ?? {
        goalId,
        title:
          goalNamespace === 'goal'
            ? (goalTitles[goalId] ?? '목표')
            : (task.ddayGoalTitle ?? '목표'),
        tasks: [],
        kind: 'goal' as const,
        goalNamespace,
      };
      current.tasks.push(task);
      goalGroups.set(key, current);
    } else if (task.type === 'SCHEDULE') {
      unlinkedSchedules.push(task);
    } else {
      unlinkedTasks.push(task);
    }
  });

  const groups = [...goalGroups.values()].map((group) => ({
    ...group,
    tasks: sortGroupTasks(group.tasks),
  }));

  if (unlinkedSchedules.length > 0) {
    groups.push({
      goalId: null,
      title: '일정',
      tasks: sortGroupTasks(unlinkedSchedules),
      kind: 'schedule',
    });
  }
  if (unlinkedTasks.length > 0) {
    groups.push({
      goalId: null,
      title: '할 일',
      tasks: sortGroupTasks(unlinkedTasks),
      kind: 'task',
    });
  }

  return groups;
}

function sortGroupTasks(tasks: TaskResponse[]) {
  return [...tasks].sort((left, right) => {
    if (left.status === 'DONE' && right.status !== 'DONE') return 1;
    if (left.status !== 'DONE' && right.status === 'DONE') return -1;
    if (left.startAt && right.startAt) return left.startAt.localeCompare(right.startAt);
    return (left.todayOrder ?? left.id) - (right.todayOrder ?? right.id);
  });
}
