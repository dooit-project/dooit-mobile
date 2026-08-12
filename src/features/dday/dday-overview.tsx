import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  IconButton,
  InlineNotice,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { ContextualFeatureTip } from '@/features/onboarding';
import { radii, spacing, useAppTheme } from '@/theme';
import type { DdayGoalResponse } from '@/types';
import { formatDateLabel } from '@/utils';

import { getDdayLabel } from './dday-label';
import { DdayCreateForm } from './dday-create-form';
import { DdayGoalTasks } from './dday-goal-tasks';
import { DdayTodayTaskForm } from './dday-today-task-form';
import { useDeleteDdayGoal } from './use-delete-dday-goal';
import { useDdayGoals } from './use-dday-goals';

export function DdayOverview() {
  const router = useRouter();
  const theme = useAppTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [confirmingDeleteGoalId, setConfirmingDeleteGoalId] = useState<number | null>(null);
  const [creatingTaskGoalId, setCreatingTaskGoalId] = useState<number | null>(null);
  const [expandedGoalIds, setExpandedGoalIds] = useState<number[]>([]);
  const [menuGoalId, setMenuGoalId] = useState<number | null>(null);
  const query = useDdayGoals();
  const goals = [...(query.data ?? [])].sort((left, right) =>
    left.targetDate.localeCompare(right.targetDate),
  );

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title="목표"
        leading={
          <IconButton
            accessibilityLabel="더보기 화면으로 돌아가기"
            onPress={router.back}
            style={styles.headerButton}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={theme.colors.text}
            />
          </IconButton>
        }
        action={
          isCreating ? undefined : (
            <Button
              accessibilityLabel="새 D-Day 목표 만들기"
              size="compact"
              variant="secondary"
              onPress={() => setIsCreating(true)}
            >
              새 목표
            </Button>
          )
        }
      />

      <ContextualFeatureTip
        message="중요한 날짜를 목표로 만들고 오늘 실행할 할 일을 연결해요."
        tipIds={['dday.linkedTasks']}
        title="D-Day로 목표 이어가기"
      />

      {isCreating ? (
        <DdayCreateForm
          onCancel={() => setIsCreating(false)}
          onCreated={() => setIsCreating(false)}
        />
      ) : null}

      {query.isPending ? (
        <View accessibilityLabel="D-Day 목표를 불러오는 중" style={styles.stateRow}>
          <ActivityIndicator color={theme.colors.primary} />
          <AppText tone="secondary" variant="label">
            목표를 불러오고 있어요.
          </AppText>
        </View>
      ) : query.error ? (
        <InlineNotice
          message={query.error.message}
          title="목표를 불러오지 못했어요"
          tone="danger"
          action={
            <Button size="compact" variant="ghost" onPress={() => void query.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : goals.length === 0 ? (
        <EmptyState
          title="아직 D-Day가 없어요"
          description="상단의 추가 버튼으로 첫 목표를 만들어 보세요."
        />
      ) : (
        <View style={styles.goalList}>
          <SectionHeader count={goals.length} title="나의 목표" />
          {goals.map((goal) => (
            <View key={goal.id} style={styles.goalItem}>
              <DdayGoalCard
                expanded={expandedGoalIds.includes(goal.id)}
                goal={goal}
                menuOpen={menuGoalId === goal.id}
                onCreateTodayTask={() => {
                  setMenuGoalId(null);
                  setCreatingTaskGoalId(goal.id);
                }}
                onRequestDelete={() => {
                  setMenuGoalId(null);
                  setConfirmingDeleteGoalId(goal.id);
                }}
                onToggleMenu={() =>
                  setMenuGoalId((current) => (current === goal.id ? null : goal.id))
                }
                onToggleTasks={() =>
                  setExpandedGoalIds((current) =>
                    current.includes(goal.id)
                      ? current.filter((goalId) => goalId !== goal.id)
                      : [...current, goal.id],
                  )
                }
              />
              {expandedGoalIds.includes(goal.id) ? (
                <DdayGoalTasks goalId={goal.id} goalTitle={goal.title} />
              ) : null}
              {creatingTaskGoalId === goal.id ? (
                <DdayTodayTaskForm
                  goalId={goal.id}
                  goalTitle={goal.title}
                  onCancel={() => setCreatingTaskGoalId(null)}
                  onCreated={() => {
                    setCreatingTaskGoalId(null);
                    setExpandedGoalIds((current) =>
                      current.includes(goal.id) ? current : [...current, goal.id],
                    );
                  }}
                />
              ) : null}
              {confirmingDeleteGoalId === goal.id ? (
                <DdayDeleteConfirmation
                  goal={goal}
                  onCancel={() => setConfirmingDeleteGoalId(null)}
                  onDeleted={() => setConfirmingDeleteGoalId(null)}
                />
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function DdayGoalCard({
  goal,
  expanded,
  menuOpen,
  onCreateTodayTask,
  onToggleMenu,
  onToggleTasks,
  onRequestDelete,
}: {
  goal: DdayGoalResponse;
  expanded: boolean;
  menuOpen: boolean;
  onCreateTodayTask: () => void;
  onToggleMenu: () => void;
  onToggleTasks: () => void;
  onRequestDelete: () => void;
}) {
  const theme = useAppTheme();
  const dayLabel = getDdayLabel(goal.daysLeft);
  const isToday = goal.daysLeft === 0;
  const isPast = goal.daysLeft < 0;
  const tone = isToday ? 'warning' : isPast ? 'secondary' : 'primary';

  return (
    <Card padded={false} style={styles.goalCard}>
      <View style={styles.goalContent}>
        <View
          accessible
          accessibilityLabel={`${goal.title}, ${dayLabel}, 목표일 ${formatDateLabel(goal.targetDate)}`}
          style={styles.goalCopy}
        >
          <AppText numberOfLines={2} weight="semibold">
            {goal.title}
          </AppText>
          <AppText tone="secondary" variant="caption">
            {formatDateLabel(goal.targetDate, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </AppText>
        </View>
        <View style={styles.goalTrailing}>
          <AppText tone={tone} variant="bodyLarge" weight="heavy">
            {dayLabel}
          </AppText>
          <IconButton
            accessibilityHint="Today 할 일 추가와 목표 삭제 행동을 표시합니다."
            accessibilityLabel={`${goal.title} 목표 메뉴 ${menuOpen ? '닫기' : '열기'}`}
            expanded={menuOpen}
            onPress={onToggleMenu}
          >
            <AppText tone="secondary" weight="bold">
              ⋯
            </AppText>
          </IconButton>
        </View>
      </View>
      <View style={[styles.goalFooter, { borderTopColor: theme.colors.border }]}>
        <Button
          accessibilityLabel={`${goal.title} 연결된 할 일 ${expanded ? '접기' : '펼치기'}`}
          accessibilityState={{ expanded }}
          size="compact"
          variant="ghost"
          onPress={onToggleTasks}
        >
          {expanded ? '할 일 접기' : '할 일 보기'}
        </Button>
      </View>
      {menuOpen ? (
        <View style={[styles.goalMenu, { borderTopColor: theme.colors.border }]}>
          <Button
            accessibilityLabel={`${goal.title} 목표의 Today 할 일 만들기`}
            size="compact"
            variant="ghost"
            style={styles.goalMenuAction}
            onPress={onCreateTodayTask}
          >
            할 일 추가
          </Button>
          <Button
            accessibilityLabel={`${goal.title} D-Day 삭제`}
            size="compact"
            variant="ghost"
            style={styles.goalMenuAction}
            onPress={onRequestDelete}
          >
            삭제
          </Button>
        </View>
      ) : null}
    </Card>
  );
}

function DdayDeleteConfirmation({
  goal,
  onCancel,
  onDeleted,
}: {
  goal: DdayGoalResponse;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const theme = useAppTheme();
  const deleteGoal = useDeleteDdayGoal();

  return (
    <Card
      accessibilityLiveRegion="polite"
      style={[
        styles.deleteCard,
        { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger },
      ]}
    >
      <View style={styles.errorCopy}>
        <AppText tone="danger" variant="label" weight="bold">
          “{goal.title}” 목표를 삭제할까요?
        </AppText>
        <AppText tone="secondary" variant="caption">
          목표 목록에서 사라지며 현재 앱에서는 되돌릴 수 없어요.
        </AppText>
      </View>

      {deleteGoal.error ? (
        <AppText tone="danger" variant="caption">
          {deleteGoal.error.message}
        </AppText>
      ) : null}

      <View style={styles.deleteActions}>
        <Button disabled={deleteGoal.isPending} fullWidth variant="secondary" onPress={onCancel}>
          취소
        </Button>
        <Button
          fullWidth
          loading={deleteGoal.isPending}
          variant="danger"
          onPress={() => deleteGoal.mutate(goal.id, { onSuccess: onDeleted })}
        >
          영구 삭제
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing[4],
    paddingTop: spacing[4],
  },
  headerButton: {
    backgroundColor: 'transparent',
  },
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'center',
    minHeight: 64,
  },
  errorCopy: {
    gap: spacing[1],
  },
  deleteCard: {
    gap: spacing[3],
  },
  deleteActions: {
    gap: spacing[2],
  },
  goalList: {
    gap: spacing[2],
  },
  goalItem: {
    gap: spacing[2],
  },
  goalCard: {
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  goalContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 60,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  goalTrailing: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  goalFooter: {
    alignItems: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[2],
  },
  goalMenu: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[1],
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  goalMenuAction: {
    minHeight: 36,
  },
  goalCopy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
});
