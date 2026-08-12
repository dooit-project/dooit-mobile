import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, Button, EmptyState, InlineNotice, ListSkeleton } from '@/components/ui';
import { ScheduleCard, TaskCard, useCompleteTask } from '@/features/tasks';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';
import type { LocalDateString, TaskResponse } from '@/types';
import { formatDateLabel } from '@/utils';

import { useCalendarDayTasks } from './use-calendar-day-tasks';

type CalendarDayTasksProps = {
  date: LocalDateString;
};

export function CalendarDayTasks({ date }: CalendarDayTasksProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const completeTask = useCompleteTask(date);
  const query = useCalendarDayTasks(date);
  const { scheduledTasks, doneTasks } = query;
  const tasks = [...scheduledTasks, ...doneTasks];
  const hasTasks = tasks.length > 0;
  const dateLabel = formatDateLabel(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const openTask = (taskId: number) => {
    router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(taskId) } });
  };

  return (
    <View style={styles.container}>
      {query.isFetching && !query.isPending ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
        </View>
      ) : null}

      {completeTask.error ? (
        <InlineNotice message={completeTask.error.message} tone="danger" />
      ) : null}

      {query.isPending ? (
        <ListSkeleton accessibilityLabel={`${dateLabel} Task를 불러오는 중`} count={2} />
      ) : query.error ? (
        <InlineNotice
          action={
            <Button size="compact" variant="ghost" onPress={() => void query.refetch()}>
              다시 시도
            </Button>
          }
          message={getUserFacingApiErrorMessage(query.error)}
          title="이 날짜의 Task를 불러오지 못했어요"
          tone="danger"
        />
      ) : !hasTasks ? (
        <EmptyState
          icon={
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}>
              <SymbolView
                name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                size={22}
                tintColor={theme.colors.primary}
              />
            </View>
          }
          title="예정된 항목이 없어요"
          description="선택한 날짜에는 아직 일정이나 할 일이 없어요."
        />
      ) : (
        <>
          {scheduledTasks.length > 0 ? (
            <TaskSection
              completingTaskId={completeTask.isPending ? completeTask.variables : undefined}
              referenceDate={date}
              title="예정"
              tasks={scheduledTasks}
              onComplete={(taskId) => completeTask.mutate(taskId)}
              onOpen={(taskId) => openTask(taskId)}
            />
          ) : null}
          {doneTasks.length > 0 ? (
            <TaskSection
              referenceDate={date}
              title="완료"
              tasks={doneTasks}
              onOpen={(taskId) => openTask(taskId)}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

type TaskSectionProps = {
  referenceDate: LocalDateString;
  title: string;
  tasks: TaskResponse[];
  completingTaskId?: number;
  onComplete?: (taskId: number) => void;
  onOpen: (taskId: number) => void;
};

function TaskSection({
  referenceDate,
  title,
  tasks,
  completingTaskId,
  onComplete,
  onOpen,
}: TaskSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <AppText variant="label" weight="bold">
          {title}
        </AppText>
        <AppText tone="secondary" variant="caption" weight="semibold">
          {tasks.length}개
        </AppText>
      </View>
      <View style={styles.taskList}>
        {tasks.map((task) =>
          task.type === 'SCHEDULE' ? (
            <ScheduleCard
              completionDisabled={completingTaskId !== undefined}
              isCompleting={completingTaskId === task.id}
              key={task.id}
              referenceDate={referenceDate}
              task={task}
              onComplete={onComplete ? () => onComplete(task.id) : undefined}
              onOpen={() => onOpen(task.id)}
            />
          ) : (
            <TaskCard
              completionDisabled={completingTaskId !== undefined}
              isCompleting={completingTaskId === task.id}
              key={task.id}
              task={task}
              onComplete={onComplete ? () => onComplete(task.id) : undefined}
              onOpen={() => onOpen(task.id)}
            />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  loadingRow: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    minHeight: 20,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  section: {
    gap: spacing[3],
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskList: {
    gap: spacing[1],
  },
});
