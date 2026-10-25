import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import {
  AppIcon,
  AppText,
  Button,
  EmptyState,
  IconButton,
  InlineNotice,
  ItemCopy,
  ListSkeleton,
  uiAuditProps,
} from '@/components/ui';
import { getDdayGoalFallbackColor, useDdayGoalColors } from '@/features/dday';
import { getRecurrenceLabel, useCompleteTask, useReopenTask } from '@/features/tasks';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, sizes, spacing, typography, useAppTheme, useMobileLayout } from '@/theme';
import type { LocalDateString, TaskResponse } from '@/types';
import { formatTimeLabel } from '@/utils';

import { useTodayOverview } from './use-today-overview';
import { groupTodayTaskRecords } from './today-task-groups';

type TodayOverviewProps = {
  date: LocalDateString;
  overview: ReturnType<typeof useTodayOverview>;
};

export function TodayOverview({ date, overview }: TodayOverviewProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const { todayTasks, doneTasks, isPending, error, refetch } = overview;
  const completeTask = useCompleteTask(date);
  const reopenTask = useReopenTask(date);
  const [menuGoalId, setMenuGoalId] = useState<number | null>(null);
  const groups = groupTodayTaskRecords(todayTasks, doneTasks);
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
            <AppIcon color={theme.colors.primary} name="circle" />
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
        const goalColor =
          group.goalId === null
            ? theme.colors.textMuted
            : (goalColors[String(group.goalId)] ?? getDdayGoalFallbackColor(group.goalId));
        return (
          <View key={`${group.kind}-${group.goalId ?? group.title}`} style={styles.group}>
            {group.goalId !== null ? (
              <View
                accessible={false}
                style={[
                  styles.goalRail,
                  {
                    backgroundColor: goalColor,
                  },
                ]}
              />
            ) : null}
            <View style={styles.groupHeader}>
              {group.goalId !== null ? (
                <View
                  style={[
                    styles.goalDot,
                    {
                      backgroundColor: goalColor,
                    },
                  ]}
                />
              ) : null}
              <AppText
                accessibilityRole="header"
                numberOfLines={2}
                style={styles.groupTitle}
                variant="sectionTitle"
                weight="bold"
              >
                {group.title}
              </AppText>
              {group.goalId !== null ? (
                <IconButton
                  variant="plain"
                  accessibilityLabel={`${group.title} 메뉴`}
                  expanded={menuGoalId === group.goalId}
                  onPress={() => setMenuGoalId(menuGoalId === group.goalId ? null : group.goalId)}
                >
                  <AppIcon color={theme.colors.textMuted} name="more-horizontal" />
                </IconButton>
              ) : null}
            </View>
            {group.goalId !== null && menuGoalId === group.goalId ? (
              <View style={styles.menu}>
                <Button
                  size="compact"
                  variant="secondary"
                  onPress={() => {
                    setMenuGoalId(null);
                    router.push('/plan');
                  }}
                >
                  계획으로 이동
                </Button>
                <Button size="compact" variant="ghost" onPress={() => setMenuGoalId(null)}>
                  닫기
                </Button>
              </View>
            ) : null}

            <View style={styles.items}>
              {group.tasks.map((task) => (
                <TodayItemRow
                  key={task.id}
                  task={task}
                  doneColor={goalColor}
                  completionDisabled={completeTask.isPending || reopenTask.isPending}
                  isCompleting={
                    (completeTask.isPending && completeTask.variables === task.id) ||
                    (reopenTask.isPending && reopenTask.variables === task.id)
                  }
                  onComplete={() =>
                    task.status === 'DONE'
                      ? reopenTask.mutate(task.id)
                      : completeTask.mutate(task.id)
                  }
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
      {reopenTask.error ? <InlineNotice message={reopenTask.error.message} tone="danger" /> : null}
    </View>
  );
}

function TodayItemRow({
  task,
  doneColor,
  completionDisabled,
  isCompleting,
  onComplete,
  onOpen,
}: {
  task: TaskResponse;
  doneColor: string;
  completionDisabled: boolean;
  isCompleting: boolean;
  onComplete: () => void;
  onOpen: () => void;
}) {
  const theme = useAppTheme();
  const { fontScale } = useMobileLayout();
  const titleLineHeight = typography.lineHeight.bodyLarge * fontScale;
  const leadingHeight = Math.max(sizes.touchTarget, titleLineHeight);
  const isSchedule = task.type === 'SCHEDULE';
  const done = task.status === 'DONE';
  const recurrenceLabel = getRecurrenceLabel(task);
  const trailingLabel = done
    ? '완료'
    : isSchedule
      ? task.allDay || !task.startAt
        ? '종일'
        : formatTimeLabel(task.startAt, { hour12: true })
      : [
          recurrenceLabel?.startsWith('매주 ')
            ? recurrenceLabel.slice(3).replaceAll('·', ' · ')
            : recurrenceLabel,
          task.description?.split('\n')[0],
        ]
          .filter(Boolean)
          .join(' · ');

  return (
    <View {...uiAuditProps({ uiRow: 'today-item', uiAlign: 'title-line' })} style={styles.itemRow}>
      <Pressable
        accessibilityHint={
          done ? '완료를 취소하고 오늘 목록으로 되돌립니다.' : '이 항목을 완료합니다.'
        }
        accessibilityLabel={`${task.title} ${done ? '완료 취소' : '완료하기'}`}
        accessibilityRole="checkbox"
        {...uiAuditProps({ uiIcon: 'control', uiTouch: '44' })}
        accessibilityState={{ checked: done, busy: isCompleting, disabled: completionDisabled }}
        aria-checked={done}
        disabled={completionDisabled}
        hitSlop={4}
        onPress={onComplete}
        style={({ pressed }) => [
          styles.leadingControl,
          { height: leadingHeight },
          pressed && { opacity: 0.55 },
        ]}
      >
        {isCompleting ? (
          <ActivityIndicator color={theme.colors.primary} size="small" />
        ) : done ? (
          <MaterialCommunityIcons name="checkbox-marked-circle" color={doneColor} size={24} />
        ) : (
          <MaterialCommunityIcons
            name="checkbox-blank-circle-outline"
            color={theme.isDark ? theme.colors.textSecondary : '#8793A3'}
            size={24}
          />
        )}
      </Pressable>

      <Pressable
        accessibilityHint="상세 화면을 엽니다."
        accessibilityLabel={`${task.title}${trailingLabel ? `, ${trailingLabel}` : ''} 상세 보기`}
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [
          styles.itemContent,
          { paddingTop: (leadingHeight - titleLineHeight) / 2 },
          { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
        ]}
      >
        <ItemCopy
          title={task.title}
          metadata={trailingLabel}
          completed={done}
          numberOfLines={fontScale > 1 ? undefined : 2}
          metadataLeading={
            isSchedule && !done ? (
              <AppIcon color={theme.colors.textMuted} name="calendar" size="meta" />
            ) : undefined
          }
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[8],
  },
  group: {
    gap: 0,
    paddingLeft: spacing[4],
  },
  goalRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: radii.full,
    opacity: 0.5,
  },
  groupHeader: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 44,
    paddingHorizontal: spacing[1],
  },
  menu: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  goalDot: {
    borderRadius: radii.full,
    height: 13,
    width: 13,
  },
  groupTitle: {
    flex: 1,
  },
  items: {
    gap: 0,
    marginLeft: -spacing[2],
  },
  itemRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    minHeight: 64,
  },
  leadingControl: {
    alignItems: 'center',
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
  itemContent: {
    alignItems: 'stretch',
    borderRadius: radii.md,
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 64,
    paddingLeft: spacing[3],
    paddingRight: spacing[1],
    paddingBottom: spacing[2],
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
