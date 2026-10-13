import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, EmptyState, InlineNotice, ListSkeleton } from '@/components/ui';
import { getDdayGoalFallbackColor, useDdayGoalColors } from '@/features/dday';
import { getRecurrenceLabel, useCompleteTask } from '@/features/tasks';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';
import type { LocalDateString, TaskResponse } from '@/types';
import { formatTimeLabel } from '@/utils';

import { useTodayOverview } from './use-today-overview';

type TodayOverviewProps = {
  date: LocalDateString;
  overview: ReturnType<typeof useTodayOverview>;
};

type TodayGroup = {
  goalId: number | null;
  title: string;
  tasks: TaskResponse[];
  kind: 'goal' | 'schedule' | 'task';
};

export function TodayOverview({ date, overview }: TodayOverviewProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const { todayTasks, isPending, error, refetch } = overview;
  const completeTask = useCompleteTask(date);
  const groups = groupTodayTasks(todayTasks.filter((task) => task.type !== 'IDEA'));
  const goalIds = groups.flatMap((group) => (group.goalId === null ? [] : [group.goalId]));
  const goalColors = useDdayGoalColors(goalIds);

  const openTask = (taskId: number) => {
    router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(taskId) } });
  };

  if (isPending) {
    return <ListSkeleton accessibilityLabel="오늘 정보를 불러오는 중" />;
  }

  if (error) {
    return (
      <InlineNotice
        message={getUserFacingApiErrorMessage(error)}
        title="오늘 목록을 불러오지 못했어요"
        tone="danger"
        action={
          <Button size="compact" variant="ghost" onPress={() => void refetch()}>
            다시 시도
          </Button>
        }
      />
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <MaterialCommunityIcons
              color={theme.colors.primary}
              name="checkbox-blank-circle-outline"
              size={22}
            />
          </View>
        }
        title="오늘 할 일을 가볍게 남겨보세요"
        description="목표를 향한 작은 일도, 오늘만 필요한 일도 함께 둘 수 있어요."
      />
    );
  }

  return (
    <View style={styles.container}>
      {groups.map((group) => {
        return (
          <View key={`${group.kind}-${group.goalId ?? group.title}`} style={styles.group}>
            <Pressable
              accessibilityHint={group.goalId === null ? undefined : '목표 화면을 엽니다.'}
              accessibilityLabel={group.goalId === null ? group.title : `${group.title} 목표 보기`}
              accessibilityRole={group.goalId === null ? 'header' : 'button'}
              disabled={group.goalId === null}
              onPress={() => router.push('/plan')}
              style={({ pressed }) => [styles.groupHeader, pressed && styles.groupHeaderPressed]}
            >
              {group.goalId !== null ? (
                <View
                  style={[
                    styles.goalDot,
                    {
                      backgroundColor:
                        goalColors[String(group.goalId)] ??
                        getDdayGoalFallbackColor(group.goalId),
                    },
                  ]}
                />
              ) : null}
              <AppText
                numberOfLines={2}
                style={styles.groupTitle}
                variant="bodyLarge"
                weight="semibold"
              >
                {group.title}
              </AppText>
              {group.goalId !== null ? (
                <MaterialCommunityIcons
                  color={theme.colors.textMuted}
                  name="chevron-right"
                  size={20}
                />
              ) : null}
            </Pressable>

            <View style={styles.items}>
              {group.tasks.map((task) => (
                <TodayItemRow
                  key={task.id}
                  task={task}
                  completionDisabled={completeTask.isPending}
                  isCompleting={completeTask.isPending && completeTask.variables === task.id}
                  onComplete={() => completeTask.mutate(task.id)}
                  onOpen={() => openTask(task.id)}
                />
              ))}
            </View>
          </View>
        );
      })}

      {completeTask.error ? (
        <InlineNotice message={completeTask.error.message} tone="danger" />
      ) : null}
    </View>
  );
}

function TodayItemRow({
  task,
  completionDisabled,
  isCompleting,
  onComplete,
  onOpen,
}: {
  task: TaskResponse;
  completionDisabled: boolean;
  isCompleting: boolean;
  onComplete: () => void;
  onOpen: () => void;
}) {
  const theme = useAppTheme();
  const isSchedule = task.type === 'SCHEDULE';
  const recurrenceLabel = getRecurrenceLabel(task);
  const trailingLabel = isSchedule
    ? task.allDay || !task.startAt
      ? '종일'
      : formatTimeLabel(task.startAt)
    : recurrenceLabel;

  return (
    <View style={styles.itemRow}>
      {isSchedule ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.leadingControl}
        >
          <MaterialCommunityIcons
            color={theme.colors.textSecondary}
            name="calendar-blank-outline"
            size={20}
          />
        </View>
      ) : (
        <Pressable
          accessibilityHint="이 할 일을 완료합니다."
          accessibilityLabel={`${task.title} 완료하기`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: false, busy: isCompleting, disabled: completionDisabled }}
          disabled={completionDisabled}
          hitSlop={4}
          onPress={onComplete}
          style={({ pressed }) => [styles.leadingControl, pressed && { opacity: 0.55 }]}
        >
          {isCompleting ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <View style={[styles.checkbox, { borderColor: theme.colors.borderStrong }]} />
          )}
        </Pressable>
      )}

      <Pressable
        accessibilityHint="상세 화면을 엽니다."
        accessibilityLabel={`${task.title}${trailingLabel ? `, ${trailingLabel}` : ''} 상세 보기`}
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [
          styles.itemContent,
          { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
        ]}
      >
        <AppText numberOfLines={2} style={styles.itemTitle} variant="bodyLarge">
          {task.title}
        </AppText>
        {trailingLabel ? (
          <View style={styles.metadata}>
            {!isSchedule ? (
              <MaterialCommunityIcons color={theme.colors.textMuted} name="repeat" size={14} />
            ) : null}
            <AppText tone="secondary" variant="caption" weight="medium">
              {trailingLabel}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function groupTodayTasks(tasks: TaskResponse[]): TodayGroup[] {
  const goalGroups = new Map<number, TodayGroup>();
  const unlinkedSchedules: TaskResponse[] = [];
  const unlinkedTasks: TaskResponse[] = [];

  tasks.forEach((task) => {
    if (task.ddayGoalId !== null) {
      const current = goalGroups.get(task.ddayGoalId) ?? {
        goalId: task.ddayGoalId,
        title: task.ddayGoalTitle ?? '목표',
        tasks: [],
        kind: 'goal' as const,
      };
      current.tasks.push(task);
      goalGroups.set(task.ddayGoalId, current);
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
    if (left.type === 'SCHEDULE' && right.type !== 'SCHEDULE') return -1;
    if (left.type !== 'SCHEDULE' && right.type === 'SCHEDULE') return 1;
    if (left.startAt && right.startAt) return left.startAt.localeCompare(right.startAt);
    return (left.todayOrder ?? left.id) - (right.todayOrder ?? right.id);
  });
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[7],
  },
  group: {
    gap: spacing[2],
  },
  groupHeader: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 44,
    paddingHorizontal: spacing[1],
  },
  groupHeaderPressed: {
    opacity: 0.62,
  },
  goalDot: {
    borderRadius: radii.full,
    height: 9,
    width: 9,
  },
  groupTitle: {
    flex: 1,
  },
  items: {
    gap: spacing[1],
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 50,
    paddingLeft: spacing[2],
  },
  leadingControl: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  checkbox: {
    borderRadius: radii.full,
    borderWidth: 1.5,
    height: 20,
    width: 20,
  },
  itemContent: {
    alignItems: 'center',
    borderRadius: radii.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 48,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  itemTitle: {
    flex: 1,
  },
  metadata: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing[1],
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
