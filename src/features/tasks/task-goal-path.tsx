import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, AppText, uiAuditProps } from '@/components/ui';
import { env } from '@/config/env';
import { useAuthState } from '@/features/auth';
import {
  getDdayGoalFallbackColor,
  useDdayGoalColors,
  type DdayGoalColor,
} from '@/features/dday/dday-goal-colors';
import { getTaskPlanGoalKey } from '@/features/goals/plan-goal-navigation';
import { readPlanGoalPreferences } from '@/features/goals/plan-goal-preferences';
import { useGoalDetail } from '@/features/goals/use-goals';
import { radii, sizes, spacing, useAppTheme } from '@/theme';
import type { TaskResponse } from '@/types';

export function TaskGoalPath({ task, disabled }: { task?: TaskResponse; disabled: boolean }) {
  const router = useRouter();
  const theme = useAppTheme();
  const auth = useAuthState();
  const key = getTaskPlanGoalKey(task);
  const goalId = key?.startsWith('goal:') ? Number(key.slice(5)) : null;
  const goal = useGoalDetail(goalId);
  const legacyColors = useDdayGoalColors(key?.startsWith('dday:') ? [Number(key.slice(5))] : []);
  const scope =
    auth.status === 'guest' || auth.status === 'registered'
      ? JSON.stringify([env.apiMode, env.apiUrl ?? null, auth.user.id])
      : null;
  const [savedColor, setSavedColor] = useState<{
    scope: string;
    key: string;
    color?: DdayGoalColor;
  } | null>(null);
  useEffect(() => {
    let active = true;
    if (scope && goalId !== null && key) {
      void readPlanGoalPreferences(scope)
        .then((preferences) => {
          if (active) setSavedColor({ scope, key, color: preferences.colors[key] });
        })
        .catch(() => {
          /* The goal remains navigable if local preferences are unavailable. */
        });
    }
    return () => {
      active = false;
    };
  }, [scope, goalId, key]);
  const title =
    goalId !== null ? (goal.data?.title ?? '연결된 목표') : (task?.ddayGoalTitle ?? '연결된 목표');
  const color = key
    ? goalId !== null
      ? ((savedColor?.scope === scope && savedColor?.key === key ? savedColor.color : undefined) ??
        getDdayGoalFallbackColor(goalId))
      : (legacyColors[String(task?.ddayGoalId)] ??
        getDdayGoalFallbackColor(Number(task?.ddayGoalId)))
    : undefined;
  if (!key) {
    return (
      <View style={styles.path}>
        <AppText variant="label" tone="secondary">
          {task ? '연결된 목표 없음' : '목표를 불러오는 중'}
        </AppText>
      </View>
    );
  }
  return (
    <Pressable
      {...uiAuditProps({ uiRow: 'task-goal-path', uiAlign: 'text-block', uiTouch: '44' })}
      accessibilityRole="button"
      accessibilityLabel={`${title}, 계획에서 목표 보기`}
      disabled={disabled}
      onPress={() => router.dismissTo({ pathname: '/plan', params: { goal: key } })}
      style={styles.path}
    >
      <View
        {...uiAuditProps({ uiIcon: 'glyph' })}
        style={[styles.dot, { backgroundColor: color }]}
      />
      <AppText
        {...uiAuditProps({ uiText: 'block' })}
        variant="label"
        numberOfLines={2}
        style={styles.title}
      >
        {title}
      </AppText>
      <AppIcon name="chevron-right" size="meta" color={theme.colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  path: {
    flex: 1,
    minWidth: 0,
    minHeight: sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: { flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: radii.full },
});
