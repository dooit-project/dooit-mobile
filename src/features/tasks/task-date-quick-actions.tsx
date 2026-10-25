import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, InlineNotice, SectionHeader } from '@/components/ui';
import { useAppToday } from '@/services/time/use-app-today';
import { spacing, useMobileLayout } from '@/theme';
import type { LocalDateString, TaskResponse } from '@/types';
import { formatDateLabel, shiftLocalDate, toApiLocalDate } from '@/utils';

import { useChangeTaskDate } from './use-change-task-date';

type TaskDateQuickActionsProps = {
  task: TaskResponse;
  grouped?: boolean;
  showHeading?: boolean;
  onBusyChange?: (busy: boolean) => void;
};

export function TaskDateQuickActions({
  task,
  grouped = false,
  showHeading = true,
  onBusyChange,
}: TaskDateQuickActionsProps) {
  const { isCompact } = useMobileLayout();
  const changeTaskDate = useChangeTaskDate();
  const [feedback, setFeedback] = useState<string | null>(null);
  const today = useAppToday();
  const tomorrow = shiftLocalDate(today, 1);
  const nextWeek = shiftLocalDate(today, 7);
  useEffect(() => {
    onBusyChange?.(changeTaskDate.isPending);
    return () => onBusyChange?.(false);
  }, [changeTaskDate.isPending, onBusyChange]);
  const dateActions = [
    { label: '오늘', date: today, offset: 0 },
    { label: '내일', date: tomorrow, offset: 1 },
    { label: '7일 후', date: nextWeek, offset: 7 },
  ].filter(
    (action): action is { label: string; date: LocalDateString; offset: number } =>
      action.date !== null,
  );

  if (task.status === 'DONE') {
    return null;
  }

  const changeDate = (targetDate: LocalDateString | null) => {
    setFeedback(null);
    changeTaskDate.mutate(
      { taskId: task.id, targetDate },
      {
        onSuccess: () => {
          setFeedback(
            targetDate
              ? `${formatDateLabel(targetDate)}로 옮겼어요.`
              : '날짜를 비우고 기록함으로 옮겼어요.',
          );
        },
      },
    );
  };

  return (
    <Card variant={grouped ? 'grouped' : 'outlined'} padded={!grouped} style={styles.card}>
      {showHeading ? (
        <SectionHeader
          title="날짜 빠른 변경"
          description={`현재 ${task.plannedDate ? formatDateLabel(task.plannedDate) : '날짜 없음'}`}
        />
      ) : null}

      <View style={styles.actions}>
        {dateActions.map((action) => {
          const selected = task.plannedDate === action.date && task.status === 'TODAY';
          const loading =
            changeTaskDate.isPending && changeTaskDate.variables?.targetDate === action.date;

          return (
            <Button
              accessibilityState={{ selected }}
              disabled={changeTaskDate.isPending || selected}
              key={action.date}
              loading={loading}
              variant={selected ? 'secondary' : 'ghost'}
              onPress={() => {
                const targetDate = shiftLocalDate(toApiLocalDate(), action.offset);
                if (targetDate) changeDate(targetDate);
              }}
              size={grouped ? 'compact' : 'medium'}
              style={
                grouped
                  ? isCompact
                    ? styles.groupedCompactButton
                    : styles.groupedButton
                  : isCompact
                    ? styles.compactActionButton
                    : styles.actionButton
              }
            >
              {action.label}
            </Button>
          );
        })}
        <Button
          disabled={changeTaskDate.isPending || task.status === 'INBOX'}
          loading={changeTaskDate.isPending && changeTaskDate.variables?.targetDate === null}
          variant={task.status === 'INBOX' ? 'secondary' : 'ghost'}
          onPress={() => changeDate(null)}
          size={grouped ? 'compact' : 'medium'}
          style={
            grouped
              ? isCompact
                ? styles.groupedCompactButton
                : styles.groupedButton
              : isCompact
                ? styles.compactActionButton
                : styles.actionButton
          }
        >
          기록함
        </Button>
      </View>

      {changeTaskDate.error ? (
        <InlineNotice message={changeTaskDate.error.message} tone="danger" />
      ) : feedback ? (
        <InlineNotice message={feedback} tone="success" />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  groupedButton: { flexGrow: 1, flexBasis: '20%', minWidth: 64 },
  groupedCompactButton: { flexGrow: 1, flexBasis: '45%', minWidth: 88 },
  actionButton: {
    flexGrow: 1,
    minWidth: 88,
  },
  compactActionButton: {
    flexGrow: 1,
    minWidth: 72,
  },
});
