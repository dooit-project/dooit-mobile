import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button, IconButton } from '@/components/ui';
import { TaskCard } from '@/features/tasks';
import { spacing, useAppTheme } from '@/theme';
import type { TaskResponse } from '@/types';

type TodayTaskListProps = {
  tasks: TaskResponse[];
  disabled: boolean;
  completingTaskId?: number;
  onComplete: (taskId: number) => void;
  onFocus: (taskId: number) => void;
  onOpen: (taskId: number) => void;
};

const TASK_RENDER_BATCH_SIZE = 20;

export function TodayTaskList({
  tasks,
  disabled,
  completingTaskId,
  onComplete,
  onFocus,
  onOpen,
}: TodayTaskListProps) {
  const theme = useAppTheme();
  const [visibleCount, setVisibleCount] = useState(TASK_RENDER_BATCH_SIZE);
  const visibleTasks = tasks.slice(0, visibleCount);
  const remainingCount = Math.max(0, tasks.length - visibleTasks.length);

  return (
    <View style={styles.list}>
      {visibleTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          completionDisabled={disabled}
          isCompleting={completingTaskId === task.id}
          onComplete={() => onComplete(task.id)}
          onOpen={() => onOpen(task.id)}
          trailing={
            <IconButton
              accessibilityHint="이 할 일만 보이는 집중 모드를 시작합니다."
              accessibilityLabel={`${task.title}, 한 가지 실행하기`}
              disabled={disabled}
              onPress={() => onFocus(task.id)}
              style={styles.focusButton}
            >
              <MaterialCommunityIcons color={theme.colors.primary} name="target" size={20} />
            </IconButton>
          }
        />
      ))}
      {remainingCount > 0 ? (
        <Button
          accessibilityLabel={`오늘 할 일 ${remainingCount}개 더 보기`}
          onPress={() => setVisibleCount((count) => count + TASK_RENDER_BATCH_SIZE)}
          variant="ghost"
        >
          더 보기 ({remainingCount}개)
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing[1],
  },
  focusButton: { backgroundColor: 'transparent' },
});
