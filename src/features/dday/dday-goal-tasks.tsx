import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, EmptyState, InlineNotice } from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';
import { formatDateLabel } from '@/utils';

import { getRecurrenceLabel } from '../tasks/recurrence-presentation';
import { useDdayGoalTasks } from './use-dday-goal-tasks';

type DdayGoalTasksProps = {
  goalId: number;
  goalTitle: string;
};

export function DdayGoalTasks({ goalId, goalTitle }: DdayGoalTasksProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const query = useDdayGoalTasks(goalId);
  const tasks = query.data ?? [];

  if (query.isPending) {
    return (
      <View accessibilityLabel={`${goalTitle} 연결 Task를 불러오는 중`} style={styles.stateRow}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <AppText tone="secondary" variant="caption">
          연결된 할 일을 불러오고 있어요.
        </AppText>
      </View>
    );
  }

  if (query.error) {
    return (
      <InlineNotice
        message={query.error.message}
        title="연결된 할 일을 불러오지 못했어요"
        tone="danger"
        action={
          <Button size="compact" variant="ghost" onPress={() => void query.refetch()}>
            다시 시도
          </Button>
        }
      />
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="연결된 항목이 없어요"
        description="할 일이나 일정 상세에서 이 목표를 연결할 수 있어요."
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.taskList}>
        {tasks.map((task) => {
          const recurrence = getRecurrenceLabel(task);
          const date = task.targetDate ?? task.plannedDate ?? task.startAt?.slice(0, 10);
          const subtitle =
            recurrence ?? (date ? formatDateLabel(date, { month: 'long', day: 'numeric' }) : null);
          return (
            <Pressable
              key={task.id}
              accessibilityRole="button"
              accessibilityLabel={`${task.title}${subtitle ? ', ' + subtitle : ''}, 상세 보기`}
              onPress={() =>
                router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(task.id) } })
              }
              style={({ pressed }) => [
                styles.taskRow,
                { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  recurrence
                    ? 'repeat'
                    : task.type === 'SCHEDULE'
                      ? 'calendar-blank-outline'
                      : 'file-document-outline'
                }
                size={22}
                color={theme.colors.textSecondary}
              />
              <View style={styles.copy}>
                <AppText>{task.title}</AppText>
                {subtitle ? (
                  <AppText variant="caption" tone="secondary">
                    {subtitle}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: 64,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[1],
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[1] },
  taskList: {
    gap: spacing[1],
  },
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'center',
    minHeight: 72,
  },
});
