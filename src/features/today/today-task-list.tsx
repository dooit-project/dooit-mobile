import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { TaskCard } from '@/features/tasks';
import { spacing } from '@/theme';
import type { TaskResponse } from '@/types';

type TodayTaskListProps = {
  tasks: TaskResponse[];
  disabled: boolean;
  completingTaskId?: number;
  onComplete: (taskId: number) => void;
  onOpen: (taskId: number) => void;
};

const TASK_RENDER_BATCH_SIZE = 20;

export function TodayTaskList({
  tasks,
  disabled,
  completingTaskId,
  onComplete,
  onOpen,
}: TodayTaskListProps) {
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
});
