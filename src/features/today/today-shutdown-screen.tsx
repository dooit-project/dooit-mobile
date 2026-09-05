import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  EmptyState,
  IconButton,
  InlineNotice,
  ListSkeleton,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { useDailyPlanSummary } from '@/features/daily-plan';
import { useChangeTaskDate } from '@/features/tasks';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, sizes, spacing, useAppTheme } from '@/theme';
import type { DailyPlanSummaryResponse, LocalDateString, TaskResponse } from '@/types';
import { shiftLocalDate, toApiLocalDate } from '@/utils';

import {
  getDailyPlanSummaryAccessibilityLabel,
  getDailyPlanSummaryItems,
  shouldShowDailyPlanSummary,
  type DailyPlanSummaryTone,
} from './daily-plan-summary-presentation';
import { getDailyShutdownTasks } from './today-review-items';
import { useTodayOverview } from './use-today-overview';

type ShutdownDestination = 'tomorrow' | 'inbox';

export function TodayShutdownScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const today = toApiLocalDate();
  const tomorrow = shiftLocalDate(today, 1) ?? today;
  const overview = useTodayOverview(today);
  const dailyPlanSummary = useDailyPlanSummary(today);
  const changeDate = useChangeTaskDate();
  const [resolvedTaskIds, setResolvedTaskIds] = useState<number[]>([]);
  const [movedTomorrowCount, setMovedTomorrowCount] = useState(0);
  const [movedInboxCount, setMovedInboxCount] = useState(0);
  const shutdownTasks = getDailyShutdownTasks(overview.todayTasks).filter(
    (task) => !resolvedTaskIds.includes(task.id),
  );

  const moveTask = (
    taskId: number,
    targetDate: LocalDateString | null,
    destination: ShutdownDestination,
  ) => {
    changeDate.mutate(
      { taskId, targetDate },
      {
        onSuccess: () => {
          setResolvedTaskIds((ids) => [...ids, taskId]);
          if (destination === 'tomorrow') {
            setMovedTomorrowCount((count) => count + 1);
          } else {
            setMovedInboxCount((count) => count + 1);
          }
        },
      },
    );
  };

  const moveSummary = `내일 ${movedTomorrowCount}개 · 기록함 ${movedInboxCount}개`;

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title="하루 마감"
        description="끝내지 못한 일을 내일로 옮기거나 기록함에 내려놓아요."
        leading={
          <IconButton accessibilityLabel="Today 화면으로 돌아가기" onPress={router.back}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
      />

      {changeDate.error ? (
        <InlineNotice
          tone="danger"
          title="이 항목을 옮기지 못했어요"
          message={changeDate.error.message}
        />
      ) : resolvedTaskIds.length > 0 ? (
        <InlineNotice tone="success" message={moveSummary} />
      ) : null}

      {dailyPlanSummary.isPending ? (
        <ListSkeleton accessibilityLabel="오늘 계획 결과를 불러오는 중" count={1} />
      ) : dailyPlanSummary.error ? (
        <InlineNotice
          tone="danger"
          title="오늘 계획 결과를 불러오지 못했어요"
          message={getUserFacingApiErrorMessage(dailyPlanSummary.error)}
          action={
            <Button size="compact" variant="ghost" onPress={() => void dailyPlanSummary.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : dailyPlanSummary.data && shouldShowDailyPlanSummary(dailyPlanSummary.data) ? (
        <DailyPlanOutcomeSummary summary={dailyPlanSummary.data} />
      ) : null}

      {overview.isPending ? (
        <ListSkeleton accessibilityLabel="마감할 항목을 불러오는 중" count={4} />
      ) : overview.error ? (
        <InlineNotice
          tone="danger"
          title="오늘 할 일을 불러오지 못했어요"
          message={overview.error.message}
          action={
            <Button size="compact" variant="ghost" onPress={() => void overview.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : shutdownTasks.length === 0 ? (
        <EmptyState
          icon={
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}>
              <SymbolView
                name={{ ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' }}
                size={22}
                tintColor={theme.colors.primary}
              />
            </View>
          }
          title="오늘 정리가 끝났어요"
          description={resolvedTaskIds.length > 0 ? moveSummary : '옮길 미완료 항목이 없어요.'}
          primaryAction={<Button onPress={() => router.replace('/')}>Today로 돌아가기</Button>}
        />
      ) : (
        <View style={styles.section}>
          <SectionHeader
            title="미완료 할 일"
            description="처리한 항목은 목록에서 바로 사라져요."
            count={shutdownTasks.length}
          />
          <View
            style={[
              styles.list,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            {shutdownTasks.map((task, index) => (
              <ShutdownTaskRow
                key={task.id}
                task={task}
                disabled={changeDate.isPending}
                isLast={index === shutdownTasks.length - 1}
                loadingDestination={
                  changeDate.isPending && changeDate.variables?.taskId === task.id
                    ? changeDate.variables.targetDate
                      ? 'tomorrow'
                      : 'inbox'
                    : null
                }
                onMoveToInbox={() => moveTask(task.id, null, 'inbox')}
                onMoveToTomorrow={() => moveTask(task.id, tomorrow, 'tomorrow')}
                onOpen={() =>
                  router.push({
                    pathname: '/tasks/[taskId]',
                    params: { taskId: String(task.id) },
                  })
                }
              />
            ))}
          </View>
          <AppText tone="secondary" variant="caption">
            그대로 둘 항목은 처리하지 않고 Today로 돌아가도 돼요.
          </AppText>
        </View>
      )}
    </Screen>
  );
}

function DailyPlanOutcomeSummary({ summary }: { summary: DailyPlanSummaryResponse }) {
  const theme = useAppTheme();
  const items = getDailyPlanSummaryItems(summary);

  return (
    <View
      accessible
      accessibilityLabel={getDailyPlanSummaryAccessibilityLabel(summary)}
      style={[
        styles.summary,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.summaryHeading}>
        <AppText variant="bodyLarge" weight="bold">
          오늘 계획 결과
        </AppText>
        <AppText tone="secondary" variant="label">
          집중 {summary.plannedFocusCount}개
        </AppText>
      </View>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryGridRow}>
          <SummaryTile item={items[0]} />
          <SummaryTile item={items[1]} />
        </View>
        <View style={styles.summaryGridRow}>
          <SummaryTile item={items[2]} />
          <SummaryTile item={items[3]} />
        </View>
      </View>
    </View>
  );
}

function SummaryTile({ item }: { item: ReturnType<typeof getDailyPlanSummaryItems>[number] }) {
  const theme = useAppTheme();
  const appearances: Record<
    DailyPlanSummaryTone,
    { backgroundColor: string; color: string; icon: ReactNode }
  > = {
    success: {
      backgroundColor: theme.colors.successSoft,
      color: theme.colors.success,
      icon: (
        <SymbolView
          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
          size={17}
          tintColor={theme.colors.success}
        />
      ),
    },
    primary: {
      backgroundColor: theme.colors.highlightBlue,
      color: theme.colors.primary,
      icon: (
        <SymbolView
          name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          size={17}
          tintColor={theme.colors.primary}
        />
      ),
    },
    warning: {
      backgroundColor: theme.colors.warningSoft,
      color: theme.colors.warning,
      icon: (
        <SymbolView
          name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
          size={17}
          tintColor={theme.colors.warning}
        />
      ),
    },
    muted: {
      backgroundColor: theme.colors.surfaceMuted,
      color: theme.colors.textSecondary,
      icon: (
        <SymbolView
          name={{ ios: 'questionmark', android: 'question_mark', web: 'question_mark' }}
          size={17}
          tintColor={theme.colors.textSecondary}
        />
      ),
    },
  };
  const appearance = appearances[item.tone];

  return (
    <View style={[styles.summaryTile, { backgroundColor: appearance.backgroundColor }]}>
      <View style={[styles.summaryIcon, { borderColor: appearance.color }]}>{appearance.icon}</View>
      <View style={styles.summaryTileCopy}>
        <AppText variant="label" weight="medium">
          {item.label}
        </AppText>
        <AppText variant="title" weight="bold">
          {item.count}
        </AppText>
      </View>
    </View>
  );
}

type ShutdownTaskRowProps = {
  task: TaskResponse;
  disabled: boolean;
  isLast: boolean;
  loadingDestination: ShutdownDestination | null;
  onOpen: () => void;
  onMoveToInbox: () => void;
  onMoveToTomorrow: () => void;
};

function ShutdownTaskRow({
  task,
  disabled,
  isLast,
  loadingDestination,
  onOpen,
  onMoveToInbox,
  onMoveToTomorrow,
}: ShutdownTaskRowProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.taskRow,
        !isLast && {
          borderBottomColor: theme.colors.rule,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Pressable
        accessibilityHint="할 일 상세 화면을 엽니다."
        accessibilityLabel={`${task.title} 상세 보기`}
        accessibilityRole="button"
        hitSlop={4}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.taskTitleButton,
          pressed && { backgroundColor: theme.colors.surfaceMuted },
        ]}
      >
        <AppText numberOfLines={2} weight="medium">
          {task.title}
        </AppText>
      </Pressable>
      <View style={styles.taskMetaRow}>
        <AppText numberOfLines={1} tone="secondary" variant="caption" style={styles.category}>
          {task.category ?? '미분류'}
        </AppText>
        <View style={styles.actions}>
          <ShutdownDestinationButton
            destination="inbox"
            disabled={disabled}
            loading={loadingDestination === 'inbox'}
            taskTitle={task.title}
            onPress={onMoveToInbox}
          />
          <ShutdownDestinationButton
            destination="tomorrow"
            disabled={disabled}
            loading={loadingDestination === 'tomorrow'}
            taskTitle={task.title}
            onPress={onMoveToTomorrow}
          />
        </View>
      </View>
    </View>
  );
}

type ShutdownDestinationButtonProps = {
  destination: ShutdownDestination;
  disabled: boolean;
  loading: boolean;
  taskTitle: string;
  onPress: () => void;
};

function ShutdownDestinationButton({
  destination,
  disabled,
  loading,
  taskTitle,
  onPress,
}: ShutdownDestinationButtonProps) {
  const theme = useAppTheme();
  const isTomorrow = destination === 'tomorrow';
  const color = isTomorrow ? theme.colors.primary : theme.colors.textSecondary;

  return (
    <Pressable
      accessibilityLabel={`${taskTitle}, ${isTomorrow ? '내일로 이동' : '기록함으로 이동'}`}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.destinationButton,
        {
          backgroundColor: isTomorrow ? theme.colors.primarySoft : theme.colors.surface,
          borderColor: isTomorrow ? theme.colors.primary : theme.colors.borderStrong,
          opacity: disabled && !loading ? 0.5 : pressed ? 0.72 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <>
          <SymbolView
            name={
              isTomorrow
                ? { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }
                : { ios: 'tray', android: 'inbox', web: 'inbox' }
            }
            size={15}
            tintColor={color}
          />
          <AppText variant="label" weight="medium" style={{ color }}>
            {isTomorrow ? '내일' : '기록함'}
          </AppText>
          {isTomorrow ? (
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={13}
              tintColor={color}
            />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing[3], paddingTop: spacing[4] },
  section: { gap: spacing[2] },
  list: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  summary: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
    padding: spacing[3],
  },
  summaryHeading: { gap: spacing[1] },
  summaryGrid: { gap: spacing[2] },
  summaryGridRow: { flexDirection: 'row', gap: spacing[2] },
  summaryTile: {
    alignItems: 'center',
    borderRadius: radii.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 68,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  summaryIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  summaryTileCopy: { flex: 1, minWidth: 0 },
  taskRow: {
    minHeight: 84,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  taskTitleButton: {
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing[1],
  },
  taskMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'space-between',
    minHeight: sizes.touchTarget,
  },
  category: { flex: 1, minWidth: 0 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing[1], flexShrink: 0 },
  destinationButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[1],
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    minWidth: 68,
    paddingHorizontal: spacing[2],
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
