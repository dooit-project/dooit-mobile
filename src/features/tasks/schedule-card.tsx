import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AppText } from '@/components/ui';
import { radii, sizes, spacing, useAppTheme } from '@/theme';
import type { LocalDateString, TaskResponse } from '@/types';

import { getOccurrenceLabel, getRecurrenceLabel } from './recurrence-presentation';
import { getSchedulePresentation } from './schedule-presentation';

type ScheduleCardProps = {
  task: TaskResponse;
  surfaceTone?: 'default' | 'tinted';
  onOpen?: () => void;
  onComplete?: () => void;
  completionDisabled?: boolean;
  isCompleting?: boolean;
  referenceDate: LocalDateString;
};

export function ScheduleCard({
  task,
  surfaceTone = 'default',
  onOpen,
  onComplete,
  completionDisabled = false,
  isCompleting = false,
  referenceDate,
}: ScheduleCardProps) {
  const theme = useAppTheme();
  const [focusedControl, setFocusedControl] = useState<'checkbox' | 'content' | null>(null);
  const cardBackground =
    surfaceTone === 'tinted' ? theme.colors.scheduleSurface : theme.colors.surface;
  const presentation = getSchedulePresentation(task, referenceDate);
  const recurrenceLabel = getRecurrenceLabel(task);
  const occurrenceLabel = getOccurrenceLabel(task);
  const secondaryMetadata = [
    presentation.rangeLabel,
    recurrenceLabel,
    occurrenceLabel,
    task.category,
    task.ddayGoalTitle,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' · ');
  const scheduleAccessibilityLabel = `${task.title}, 일정, ${presentation.primaryLabel}${
    presentation.rangeLabel ? `, ${presentation.rangeLabel}` : ''
  }${recurrenceLabel ? `, ${recurrenceLabel}` : ''}${occurrenceLabel ? `, ${occurrenceLabel}` : ''}`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBackground,
          borderColor: focusedControl ? theme.colors.primary : theme.colors.border,
          borderRadius: radii.md,
          borderWidth: focusedControl ? 1 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {onComplete ? (
        <Pressable
          accessibilityHint="일정을 완료합니다."
          accessibilityLabel={`${scheduleAccessibilityLabel} 완료`}
          accessibilityRole="checkbox"
          accessibilityState={{ busy: isCompleting, checked: false, disabled: completionDisabled }}
          disabled={completionDisabled}
          hitSlop={2}
          onBlur={() => setFocusedControl(null)}
          onFocus={() => setFocusedControl('checkbox')}
          onPress={onComplete}
          style={({ pressed }) => [
            styles.completionHitArea,
            pressed && { backgroundColor: theme.colors.primarySoft },
          ]}
        >
          <View style={[styles.checkbox, { borderColor: theme.colors.borderStrong }]}>
            {isCompleting ? <ActivityIndicator color={theme.colors.primary} size="small" /> : null}
          </View>
        </Pressable>
      ) : null}
      <Pressable
        accessible={Boolean(onOpen)}
        accessibilityHint={onOpen ? '일정 상세 화면을 엽니다.' : undefined}
        accessibilityLabel={onOpen ? `${scheduleAccessibilityLabel}, 상세 보기` : undefined}
        accessibilityRole={onOpen ? 'button' : undefined}
        disabled={!onOpen}
        onBlur={() => setFocusedControl(null)}
        onFocus={() => setFocusedControl('content')}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.content,
          pressed && {
            backgroundColor:
              surfaceTone === 'tinted' ? theme.colors.warningSoft : theme.colors.surfaceMuted,
          },
        ]}
      >
        <View style={styles.copy}>
          <AppText numberOfLines={2} weight="medium">
            {task.title}
          </AppText>
          <View style={styles.metadata}>
            <AppText tone="primary" variant="caption" weight="bold">
              일정 · {presentation.primaryLabel}
            </AppText>
            {secondaryMetadata ? (
              <AppText
                numberOfLines={1}
                style={styles.secondaryMetadata}
                tone="secondary"
                variant="caption"
              >
                · {secondaryMetadata}
              </AppText>
            ) : null}
          </View>
        </View>
        {onOpen ? (
          <AppText tone="muted" variant="bodyLarge">
            ›
          </AppText>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 60,
    overflow: 'hidden',
  },
  completionHitArea: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  content: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
    flexDirection: 'row',
    gap: spacing[3],
    minWidth: 0,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  copy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
  metadata: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[1],
    minWidth: 0,
  },
  secondaryMetadata: {
    flex: 1,
  },
});
