import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import type { ReactNode } from 'react';
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
import { useDailyPlan, useReplaceDailyPlan } from '@/features/daily-plan';
import { TaskCard, useMoveTaskToToday } from '@/features/tasks';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';
import { toApiLocalDate } from '@/utils';

import { useTodayOverview } from './use-today-overview';
import { getDailyPlanFocusTasks } from './today-review-items';
import { getTodayReviewFocusPresentation, parseTodayReviewFocus } from './today-review-focus';

export function TodayReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string | string[] }>();
  const theme = useAppTheme();
  const today = toApiLocalDate();
  const overview = useTodayOverview(today);
  const dailyPlan = useDailyPlan(today);
  const replaceDailyPlan = useReplaceDailyPlan(today);
  const moveToToday = useMoveTaskToToday(today);
  const [feedback, setFeedback] = useState<string | null>(null);
  const focus = parseTodayReviewFocus(params.focus);
  const presentation = getTodayReviewFocusPresentation(focus);
  const reviewCount =
    focus === 'inbox'
      ? overview.inboxTasks.length
      : focus === 'stale'
        ? overview.staleTasks.length
        : overview.staleTasks.length + overview.recommendations.length + overview.inboxTasks.length;
  const plannedFocusTaskIds =
    dailyPlan.data && (dailyPlan.data.status !== 'DRAFT' || dailyPlan.data.focusTaskIds.length > 0)
      ? dailyPlan.data.focusTaskIds
      : undefined;
  const focusTasks = getDailyPlanFocusTasks(overview.todayTasks, plannedFocusTaskIds);

  const openTask = (taskId: number) => {
    router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(taskId) } });
  };
  const moveTask = (taskId: number, message: string) => {
    setFeedback(null);
    moveToToday.mutate(taskId, { onSuccess: () => setFeedback(message) });
  };
  const finishDailyPlan = () => {
    setFeedback(null);
    replaceDailyPlan.mutate(
      { focusTaskIds: focusTasks.map((task) => task.id), status: 'CONFIRMED' },
      { onSuccess: () => router.replace({ pathname: '/', params: { planned: '1' } }) },
    );
  };

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title={presentation.title}
        description={presentation.description}
        leading={
          <IconButton
            accessibilityLabel="Today 화면으로 돌아가기"
            onPress={router.back}
            style={styles.backButton}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
      />

      {moveToToday.error ? (
        <InlineNotice message={moveToToday.error.message} tone="danger" />
      ) : replaceDailyPlan.error ? (
        <InlineNotice
          message={getUserFacingApiErrorMessage(replaceDailyPlan.error)}
          title="오늘 계획을 저장하지 못했어요"
          tone="danger"
        />
      ) : feedback ? (
        <InlineNotice message={feedback} tone="success" />
      ) : null}

      {!focus && dailyPlan.error ? (
        <InlineNotice
          action={
            <Button size="compact" variant="ghost" onPress={() => void dailyPlan.refetch()}>
              다시 시도
            </Button>
          }
          message={getUserFacingApiErrorMessage(dailyPlan.error)}
          title="저장된 오늘 계획을 불러오지 못했어요"
          tone="danger"
        />
      ) : null}

      {!focus && !overview.isPending && !overview.error && focusTasks.length > 0 ? (
        <ReviewSection
          title="먼저 할 일"
          description="현재 Today 순서의 앞 항목이에요. 순서는 Today에서 바꿀 수 있어요."
          count={focusTasks.length}
        >
          {focusTasks.map((task) => (
            <TaskCard
              compact
              key={task.id}
              task={task}
              showCompletionControl={false}
              onOpen={() => openTask(task.id)}
            />
          ))}
        </ReviewSection>
      ) : null}

      {overview.isPending ? (
        <ListSkeleton accessibilityLabel="정리할 항목을 불러오는 중" count={4} />
      ) : overview.error ? (
        <InlineNotice
          message={overview.error.message}
          title="정리할 항목을 불러오지 못했어요"
          tone="danger"
          action={
            <Button size="compact" variant="ghost" onPress={() => void overview.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : reviewCount === 0 ? (
        <EmptyState
          icon={
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}>
              <SymbolView
                name={{ ios: 'checkmark.circle', android: 'task_alt', web: 'task_alt' }}
                size={22}
                tintColor={theme.colors.primary}
              />
            </View>
          }
          title={
            focus
              ? presentation.emptyTitle
              : focusTasks.length > 0
                ? '오늘 계획을 마칠 수 있어요'
                : presentation.emptyTitle
          }
          description={
            focus
              ? presentation.emptyDescription
              : focusTasks.length > 0
                ? '먼저 할 일을 확인했어요.'
                : presentation.emptyDescription
          }
          primaryAction={
            <Button
              disabled={!focus && (dailyPlan.isPending || Boolean(dailyPlan.error))}
              loading={!focus && replaceDailyPlan.isPending}
              onPress={() => (focus ? router.replace('/') : finishDailyPlan())}
            >
              {focus ? 'Today로 돌아가기' : '오늘 계획 마치기'}
            </Button>
          }
        />
      ) : (
        <View style={styles.sections}>
          {focus !== 'inbox' && overview.staleTasks.length > 0 ? (
            <ReviewSection
              title="지난 미완료"
              description="놓친 일을 오늘 다시 볼지 결정해요."
              count={overview.staleTasks.length}
            >
              {overview.staleTasks.map((task) => (
                <TaskCard
                  compact
                  key={task.id}
                  task={task}
                  showCompletionControl={false}
                  onOpen={() => openTask(task.id)}
                  action={
                    <ReviewMoveAction
                      disabled={moveToToday.isPending}
                      loading={moveToToday.isPending && moveToToday.variables === task.id}
                      label={`${task.title}, 오늘 할 일로 이동`}
                      text="오늘로"
                      onPress={() => moveTask(task.id, '지난 미완료를 오늘 할 일로 옮겼어요.')}
                    />
                  }
                />
              ))}
            </ReviewSection>
          ) : null}

          {!focus && overview.recommendations.length > 0 ? (
            <ReviewSection
              title="추천"
              description="오늘 처리하기 좋은 항목이에요."
              count={overview.recommendations.length}
            >
              {overview.recommendations.map(({ task }) => (
                <TaskCard
                  compact
                  key={task.id}
                  task={task}
                  showCompletionControl={false}
                  onOpen={() => openTask(task.id)}
                  action={
                    <ReviewMoveAction
                      disabled={moveToToday.isPending}
                      loading={moveToToday.isPending && moveToToday.variables === task.id}
                      label={`${task.title}, 오늘 할 일에 추가`}
                      text="추가"
                      onPress={() => moveTask(task.id, '추천 항목을 오늘 할 일에 추가했어요.')}
                    />
                  }
                />
              ))}
            </ReviewSection>
          ) : null}

          {focus !== 'stale' && overview.inboxTasks.length > 0 ? (
            <ReviewSection
              title="기록함"
              description="날짜를 정하지 않은 기록이에요."
              count={overview.inboxTasks.length}
            >
              {overview.inboxTasks.map((task) => (
                <TaskCard
                  compact
                  key={task.id}
                  task={task}
                  showCompletionControl={false}
                  onOpen={() => openTask(task.id)}
                  action={
                    <ReviewMoveAction
                      disabled={moveToToday.isPending}
                      loading={moveToToday.isPending && moveToToday.variables === task.id}
                      label={`${task.title}, 오늘 할 일에 추가`}
                      text="추가"
                      onPress={() => moveTask(task.id, '기록을 오늘 할 일에 추가했어요.')}
                    />
                  }
                />
              ))}
            </ReviewSection>
          ) : null}

          {!focus ? (
            <Button
              disabled={dailyPlan.isPending || Boolean(dailyPlan.error)}
              loading={replaceDailyPlan.isPending}
              onPress={finishDailyPlan}
            >
              오늘 계획 마치기
            </Button>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

type ReviewSectionProps = {
  title: string;
  description: string;
  count: number;
  children: ReactNode;
};

function ReviewSection({ title, description, count, children }: ReviewSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} description={description} count={count} />
      <View style={styles.list}>{children}</View>
    </View>
  );
}

type ReviewMoveActionProps = {
  disabled: boolean;
  loading: boolean;
  label: string;
  text: string;
  onPress: () => void;
};

function ReviewMoveAction({ disabled, loading, label, text, onPress }: ReviewMoveActionProps) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled }}
      disabled={disabled}
      hitSlop={4}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.moveAction,
        {
          backgroundColor: pressed ? theme.colors.highlightBlue : 'transparent',
          borderColor: isFocused ? theme.colors.primary : 'transparent',
          borderWidth: isFocused ? 2 : StyleSheet.hairlineWidth,
          opacity: disabled && !loading ? 0.45 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} size="small" />
      ) : (
        <AppText tone="primary" variant="caption" weight="semibold">
          {text} ›
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing[3],
    paddingTop: spacing[4],
  },
  backButton: {
    backgroundColor: 'transparent',
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sections: {
    gap: spacing[3],
  },
  section: {
    gap: spacing[2],
  },
  list: {
    gap: spacing[2],
  },
  moveAction: {
    alignItems: 'center',
    borderRadius: radii.full,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 54,
    paddingHorizontal: spacing[2],
  },
});
