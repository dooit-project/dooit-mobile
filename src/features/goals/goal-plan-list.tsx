import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, InlineNotice } from '@/components/ui';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { spacing, useAppTheme } from '@/theme';
import type { GoalResponse, GoalPlanResponse } from '@/types';

import { GoalPlanForm } from './goal-plan-form';
import { goalPlanDays } from './goal-plan-form-values';
import { useGoalPlans } from './use-goal-plans';

export function GoalPlanList({
  goal,
  disabled,
  onEditingChange,
}: {
  goal: GoalResponse;
  disabled: boolean;
  onEditingChange: (value: boolean) => void;
}) {
  const theme = useAppTheme();
  const query = useGoalPlans(goal.id);
  const [editing, setEditing] = useState<number | 'create' | null>(null);
  const [snapshot, setSnapshot] = useState<GoalPlanResponse | undefined>();
  const [showArchived, setShowArchived] = useState(false);
  const readonly = goal.status === 'ARCHIVED';
  const selected = query.data?.find((plan) => plan.id === editing);
  const plans = query.data ?? [];
  const archived = plans.filter((plan) => plan.status === 'ARCHIVED');
  const visible = plans.filter((plan) => plan.status !== 'ARCHIVED' || showArchived);
  useEffect(() => {
    onEditingChange(editing !== null);
    return () => onEditingChange(false);
  }, [editing, onEditingChange]);
  // A concurrent archive invalidates editing; never submit a new create when the original disappears.
  const unavailable =
    editing !== null && editing !== 'create' && (!selected || selected.status === 'ARCHIVED');
  if (editing !== null)
    return (
      <View style={styles.section}>
        {editing !== 'create' && !snapshot ? (
          <InlineNotice
            tone="warning"
            message="선택한 계획을 수정할 수 없어요. 목록을 다시 확인해 주세요."
            action={
              <Button variant="ghost" onPress={() => setEditing(null)}>
                목록으로
              </Button>
            }
          />
        ) : (
          <GoalPlanForm
            key={editing}
            goalId={goal.id}
            plan={snapshot}
            blocked={
              unavailable ||
              readonly ||
              Boolean(
                snapshot &&
                selected &&
                (snapshot.currentVersion !== selected.currentVersion ||
                  snapshot.status !== selected.status),
              )
            }
            onDone={() => setEditing(null)}
          />
        )}
      </View>
    );
  return (
    <View style={styles.section}>
      {query.isPending ? (
        <ActivityIndicator
          accessibilityLabel="반복 계획을 불러오는 중"
          color={theme.colors.primary}
        />
      ) : null}
      {query.error ? (
        <InlineNotice
          tone="danger"
          message={`반복 계획을 갱신하지 못했어요. ${getUserFacingApiErrorMessage(query.error)}`}
          action={
            <Button size="compact" variant="ghost" onPress={() => void query.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : null}
      {visible.map((plan) => {
        const days =
          plan.schedule.days.length === 7
            ? '매일'
            : goalPlanDays
                .filter((day) => plan.schedule.days.includes(day.value))
                .map((day) => day.label)
                .join(' · ');
        const row = (
          <>
            <MaterialCommunityIcons name="repeat" size={22} color={theme.colors.textSecondary} />
            <View style={styles.copy}>
              <AppText>{plan.name}</AppText>
              <AppText variant="caption" tone="secondary">
                {[
                  days,
                  plan.status === 'PAUSED'
                    ? '잠시 멈춤'
                    : plan.status === 'ARCHIVED'
                      ? '보관됨'
                      : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
            </View>
          </>
        );
        return readonly || plan.status === 'ARCHIVED' ? (
          <View key={plan.id} style={styles.row}>
            {row}
          </View>
        ) : (
          <Pressable
            key={plan.id}
            accessibilityRole="button"
            accessibilityLabel={`${plan.name}, ${days}, 수정`}
            disabled={disabled}
            onPress={() => {
              setSnapshot(plan);
              setEditing(plan.id);
            }}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
            ]}
          >
            {row}
          </Pressable>
        );
      })}
      {archived.length ? (
        <Button
          size="compact"
          variant="ghost"
          disabled={disabled}
          accessibilityState={{ expanded: showArchived }}
          onPress={() => setShowArchived(!showArchived)}
        >
          보관한 계획 {showArchived ? '접기' : `보기 (${archived.length})`}
        </Button>
      ) : null}
      {!readonly ? (
        <Button
          variant="ghost"
          disabled={disabled || query.isPending}
          leading={
            <MaterialCommunityIcons name="plus" size={22} color={theme.colors.textSecondary} />
          }
          onPress={() => {
            setSnapshot(undefined);
            setEditing('create');
          }}
        >
          반복 계획 추가
        </Button>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing[2] },
  row: {
    minHeight: 64,
    paddingVertical: spacing[3],
    gap: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[1] },
});
