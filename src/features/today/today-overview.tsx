import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  EmptyState,
  FadeInView,
  InlineNotice,
  ListSkeleton,
  SectionHeader,
} from '@/components/ui';
import { ScheduleCard, TaskCard, useCompleteTask, useReopenTask } from '@/features/tasks';
import { ContextualFeatureTip } from '@/features/onboarding';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { motion, radii, spacing, useAppTheme } from '@/theme';
import type { LocalDateString, TaskResponse } from '@/types';

import { getTodaySchedulePreview, splitTodayTasks } from './today-task-sections';
import { TodayTaskList } from './today-task-list';
import { useTodayOverview } from './use-today-overview';

type TodayOverviewProps = {
  date: LocalDateString;
  onOpenQuickCapture?: () => void;
  overview: ReturnType<typeof useTodayOverview>;
};

type FeedbackMessage = {
  tone: 'success' | 'default';
  message: string;
};

const COMPLETED_RENDER_BATCH_SIZE = 20;

export function TodayOverview({ date, onOpenQuickCapture, overview }: TodayOverviewProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const {
    todayTasks,
    recommendations,
    doneTasks,
    staleTasks,
    inboxTasks,
    isPending,
    error,
    supplementalError,
    refetch,
  } = overview;
  const completeTask = useCompleteTask(date);
  const reopenTask = useReopenTask(date);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [completedVisibleCount, setCompletedVisibleCount] = useState(COMPLETED_RENDER_BATCH_SIZE);
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  const { scheduleTasks, executionTasks } = splitTodayTasks(todayTasks);
  const reviewItemCount = staleTasks.length + recommendations.length + inboxTasks.length;
  const sortedScheduleTasks = [...scheduleTasks].sort(compareScheduleTasks);
  const schedulePreview = getTodaySchedulePreview(sortedScheduleTasks);
  const visibleDoneTasks = doneTasks.slice(0, completedVisibleCount);
  const remainingDoneCount = Math.max(0, doneTasks.length - visibleDoneTasks.length);
  const openTask = (taskId: number) => {
    router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(taskId) } });
  };
  const showFeedback = (message: string) => {
    setFeedback({ tone: 'success', message });
  };
  if (isPending) {
    return <ListSkeleton accessibilityLabel="Today 정보를 불러오는 중" />;
  }

  if (error) {
    return (
      <InlineNotice
        message={getUserFacingApiErrorMessage(error)}
        title="정보를 불러오지 못했어요"
        tone="danger"
        action={
          <Button size="compact" variant="ghost" onPress={() => void refetch()}>
            다시 시도
          </Button>
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <ContextualFeatureTip
        message="+ 버튼으로 할 일을 기록해요. 체크박스를 누르면 완료됩니다."
        tipIds={['today.quickCapture', 'today.completeTask']}
        title="Today를 시작하는 방법"
      />
      {sortedScheduleTasks.length > 0 ? (
        <View style={styles.scheduleSection}>
          <SectionHeader
            title="일정"
            action={
              schedulePreview.length < sortedScheduleTasks.length ? (
                <Button
                  accessibilityLabel={`전체 일정 ${sortedScheduleTasks.length}개 캘린더에서 보기`}
                  size="compact"
                  variant="ghost"
                  onPress={() => router.push('/calendar')}
                >
                  전체 {sortedScheduleTasks.length}개
                </Button>
              ) : (
                <AppText tone="secondary" variant="caption" weight="bold">
                  {sortedScheduleTasks.length}개
                </AppText>
              )
            }
          />

          <View style={styles.scheduleList}>
            {schedulePreview.map((task) => (
              <ScheduleCard
                completionDisabled={completeTask.isPending}
                isCompleting={completeTask.isPending && completeTask.variables === task.id}
                key={task.id}
                referenceDate={date}
                surfaceTone="tinted"
                task={task}
                onComplete={() =>
                  completeTask.mutate(task.id, {
                    onSuccess: () => showFeedback('일정을 완료했어요.'),
                  })
                }
                onOpen={() => openTask(task.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.taskSection}>
        <SectionHeader
          title="오늘 할 일"
          action={
            <AppText tone="primary" variant="label" weight="bold">
              {executionTasks.length}개
            </AppText>
          }
        />

        {completeTask.error ? (
          <InlineNotice message={completeTask.error.message} tone="danger" />
        ) : null}

        {executionTasks.length === 0 ? (
          <EmptyState
            icon={
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}>
                <SymbolView
                  name={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }}
                  size={22}
                  tintColor={theme.colors.primary}
                />
              </View>
            }
            title="오늘 할 일을 하나 적어볼까요?"
            description="하나면 충분해요. 생각난 일을 먼저 기록해 보세요."
            primaryAction={
              onOpenQuickCapture ? (
                <Button accessibilityLabel="첫 할 일 빠르게 기록하기" onPress={onOpenQuickCapture}>
                  첫 할 일 기록하기
                </Button>
              ) : null
            }
          />
        ) : (
          <TodayTaskList
            tasks={executionTasks}
            disabled={completeTask.isPending}
            completingTaskId={completeTask.isPending ? completeTask.variables : undefined}
            onComplete={(taskId) =>
              completeTask.mutate(taskId, {
                onSuccess: () => showFeedback('오늘 할 일을 완료했어요.'),
              })
            }
            onOpen={openTask}
          />
        )}
      </View>

      {feedback ? (
        <FadeInView duration={motion.duration.normal}>
          <InlineNotice message={feedback.message} tone={feedback.tone} />
        </FadeInView>
      ) : null}

      {supplementalError ? (
        <InlineNotice
          message={`오늘 계획은 계속 사용할 수 있어요. ${supplementalError.message}`}
          title="일부 정보를 불러오지 못했어요"
          tone="warning"
          action={
            <Button size="compact" variant="ghost" onPress={() => void refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : null}

      {reviewItemCount > 0 ? (
        <View style={styles.reviewSection}>
          <Pressable
            accessibilityHint="지난 미완료, 추천, 기록함을 정리하는 화면을 엽니다."
            accessibilityLabel={`정리할 항목 ${reviewItemCount}개`}
            accessibilityRole="button"
            onBlur={() => setIsReviewFocused(false)}
            onFocus={() => setIsReviewFocused(true)}
            onPress={() => router.push('/today/review')}
            style={({ pressed }) => [
              styles.reviewRow,
              {
                backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
                borderColor: isReviewFocused ? theme.colors.primarySoft : theme.colors.border,
              },
            ]}
          >
            <View style={styles.reviewCopy}>
              <AppText weight="semibold">정리할 항목</AppText>
              <AppText numberOfLines={1} tone="secondary" variant="caption">
                미완료 {staleTasks.length} · 추천 {recommendations.length} · 기록함{' '}
                {inboxTasks.length}
              </AppText>
            </View>
            <AppText tone="secondary" variant="label" weight="bold">
              {reviewItemCount}개 ›
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.taskSection}>
        <SectionHeader
          title="오늘 완료한 일"
          action={
            <View style={styles.completedSectionActions}>
              <AppText tone="success" variant="label" weight="bold">
                {doneTasks.length}개
              </AppText>
              {doneTasks.length > 0 ? (
                <Button
                  accessibilityLabel={`완료한 일 목록 ${isCompletedExpanded ? '접기' : '펼치기'}`}
                  variant="ghost"
                  onPress={() => setIsCompletedExpanded((current) => !current)}
                  style={styles.completedToggleButton}
                >
                  {isCompletedExpanded ? '접기' : '펼치기'}
                </Button>
              ) : null}
            </View>
          }
        />

        {isCompletedExpanded && reopenTask.error ? (
          <InlineNotice message={reopenTask.error.message} tone="danger" />
        ) : null}

        {isCompletedExpanded && doneTasks.length > 0 ? (
          <View style={styles.taskList}>
            {visibleDoneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onOpen={() => openTask(task.id)}
                completionDisabled={reopenTask.isPending}
                isCompleting={reopenTask.isPending && reopenTask.variables === task.id}
                onReopen={() =>
                  reopenTask.mutate(task.id, {
                    onSuccess: () => showFeedback('완료 항목을 오늘 할 일로 다시 열었어요.'),
                  })
                }
              />
            ))}
            {remainingDoneCount > 0 ? (
              <Button
                accessibilityLabel={`완료한 일 ${remainingDoneCount}개 더 보기`}
                onPress={() =>
                  setCompletedVisibleCount((count) => count + COMPLETED_RENDER_BATCH_SIZE)
                }
                variant="ghost"
              >
                더 보기 ({remainingDoneCount}개)
              </Button>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function compareScheduleTasks(left: TaskResponse, right: TaskResponse) {
  if (!left.startAt && !right.startAt) {
    return left.id - right.id;
  }

  if (!left.startAt) {
    return 1;
  }

  if (!right.startAt) {
    return -1;
  }

  return left.startAt.localeCompare(right.startAt);
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  taskSection: {
    gap: spacing[2],
  },
  scheduleSection: {
    gap: spacing[2],
  },
  scheduleList: {
    gap: spacing[1],
  },
  reviewSection: {
    gap: spacing[2],
  },
  reviewRow: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  reviewCopy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  completedSectionActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  completedToggleButton: {
    minWidth: 56,
  },
  taskList: {
    gap: spacing[1],
  },
});
