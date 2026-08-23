import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useState, type ReactNode } from 'react';

import { AppText, FadeInView } from '@/components/ui';
import { motion, radii, sizes, spacing, useAppTheme } from '@/theme';
import type { TaskResponse } from '@/types';
import { formatTimeLabel } from '@/utils';

import { getOccurrenceLabel, getRecurrenceLabel } from './recurrence-presentation';

type TaskCardProps = {
  task: TaskResponse;
  compact?: boolean;
  onOpen?: () => void;
  onComplete?: () => void;
  onReopen?: () => void;
  isCompleting?: boolean;
  completionDisabled?: boolean;
  showCompletionControl?: boolean;
  trailing?: ReactNode;
  action?: ReactNode;
};

export function TaskCard({
  task,
  compact = false,
  onOpen,
  onComplete,
  onReopen,
  isCompleting = false,
  completionDisabled = false,
  showCompletionControl = true,
  trailing,
  action,
}: TaskCardProps) {
  const theme = useAppTheme();
  const [focusedControl, setFocusedControl] = useState<'checkbox' | 'content' | null>(null);
  const isDone = task.status === 'DONE';
  const onToggle = isDone ? onReopen : onComplete;
  const toggleDisabled = completionDisabled || !onToggle;
  const toggleLabel = onToggle
    ? isDone
      ? `${task.title}, 다시 열기`
      : `${task.title} 완료하기`
    : `${task.title}, ${isDone ? '완료됨' : '미완료'}`;
  const timeLabel = isDone
    ? task.completedAt
      ? `완료 ${formatTimeLabel(task.completedAt)}`
      : '완료'
    : !task.allDay && task.startAt
      ? formatTimeLabel(task.startAt)
      : null;
  const recurrenceLabel = getRecurrenceLabel(task);
  const occurrenceLabel = getOccurrenceLabel(task);
  const metadata = (
    isDone
      ? [timeLabel, recurrenceLabel, occurrenceLabel, task.category]
      : [timeLabel, task.allDay ? '종일' : null, recurrenceLabel, occurrenceLabel, task.category]
  ).filter((value): value is string => Boolean(value));
  const metadataLabel = [...metadata, task.ddayGoalTitle].filter(Boolean).join(' · ');
  const detailAccessibilityLabel = `${task.title}${metadataLabel ? `, ${metadataLabel}` : ''} 상세 보기`;

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        {
          backgroundColor: theme.colors.surface,
          borderColor: focusedControl ? theme.colors.primary : theme.colors.border,
          borderRadius: radii.md,
          borderWidth: focusedControl ? 1 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={[styles.content, compact && styles.contentCompact]}>
        {showCompletionControl ? (
          <Pressable
            accessibilityHint={
              isDone ? '완료를 취소하고 오늘 할 일로 되돌립니다.' : '할 일을 완료합니다.'
            }
            accessibilityLabel={toggleLabel}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone, busy: isCompleting, disabled: toggleDisabled }}
            disabled={toggleDisabled}
            hitSlop={4}
            onBlur={() => setFocusedControl(null)}
            onFocus={() => setFocusedControl('checkbox')}
            onPress={onToggle}
            style={({ pressed }) => [
              styles.checkboxHitArea,
              pressed && { backgroundColor: theme.colors.primarySoft },
              { opacity: completionDisabled && !isCompleting ? 0.45 : 1 },
            ]}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: isDone ? theme.colors.success : theme.colors.surface,
                  borderColor: isDone ? theme.colors.success : theme.colors.borderStrong,
                },
              ]}
            >
              {isCompleting ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : isDone ? (
                <FadeInView duration={onReopen ? motion.duration.fast : 0}>
                  <AppText
                    variant="caption"
                    style={{ color: theme.colors.textOnPrimary }}
                    weight="bold"
                  >
                    ✓
                  </AppText>
                </FadeInView>
              ) : null}
            </View>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityHint={onOpen ? '할 일 상세 화면을 엽니다.' : undefined}
          accessibilityLabel={detailAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: !onOpen }}
          disabled={!onOpen}
          onBlur={() => setFocusedControl(null)}
          onFocus={() => setFocusedControl('content')}
          onPress={onOpen}
          style={({ pressed }) => [
            styles.copyPressable,
            compact && styles.copyPressableCompact,
            {
              backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
            },
          ]}
        >
          <View style={styles.copy}>
            <AppText
              numberOfLines={2}
              tone={isDone ? 'secondary' : 'default'}
              weight="medium"
              style={isDone ? styles.doneTitle : undefined}
            >
              {task.title}
            </AppText>

            {!isDone && task.description ? (
              <AppText numberOfLines={1} tone="secondary" variant="label">
                {task.description}
              </AppText>
            ) : null}

            {metadataLabel ? (
              <AppText numberOfLines={1} tone="secondary" variant="caption">
                {metadataLabel}
              </AppText>
            ) : null}
          </View>
        </Pressable>
        {compact && action ? <View style={styles.inlineAction}>{action}</View> : null}
        {trailing}
      </View>
      {!compact && action ? <View style={styles.actionRow}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    overflow: 'hidden',
  },
  rowCompact: {
    minHeight: 52,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[1],
    minHeight: 60,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  contentCompact: {
    minHeight: 52,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  checkboxHitArea: {
    alignItems: 'center',
    borderRadius: radii.sm,
    height: sizes.touchTarget,
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 20,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  copyPressable: {
    alignItems: 'center',
    borderRadius: radii.md,
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[2],
  },
  copyPressableCompact: {
    paddingVertical: spacing[1],
  },
  actionRow: {
    alignItems: 'flex-end',
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[2],
  },
  inlineAction: {
    flexShrink: 0,
  },
  doneTitle: {
    textDecorationLine: 'line-through',
  },
});
