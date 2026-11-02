import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { getOccurrenceLabel, getRecurrenceLabel } from '@/features/tasks';
import { radii, spacing, useAppTheme } from '@/theme';
import type { LocalDateString, TaskResponse } from '@/types';
import { doesScheduleOverlapDate, formatTimeLabel, shiftLocalDate } from '@/utils';

import {
  CALENDAR_DAY_WIDTH,
  getCalendarSegmentLeftPercent,
  getCalendarSegmentWidthPercent,
} from './calendar-layout';

type CalendarPeriodBarsProps = {
  compact?: boolean;
  dates: LocalDateString[];
  minimal?: boolean;
  tasks: TaskResponse[];
  onOpen: (taskId: number) => void;
  onSelectDate?: (date: LocalDateString) => void;
};

export function CalendarSingleDayLabels({
  compact = false,
  dates,
  minimal = false,
  tasks,
  onOpen,
  onSelectDate,
}: CalendarPeriodBarsProps) {
  const theme = useAppTheme();
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const labels = buildCalendarSingleDayLabels(tasks, dates);

  if (labels.every((items) => items.length === 0)) return null;

  return (
    <View style={styles.singleDayRow}>
      {labels.map((items, index) => {
        const task = items[0];
        const date = dates[index];

        return (
          <View key={date} style={styles.singleDayCell}>
            {task ? (
              <Pressable
                accessibilityHint="일정 상세 화면을 엽니다."
                accessibilityLabel={`${getCalendarScheduleAccessibilityLabel(task, '하루 일정')}, 상세 보기`}
                accessibilityRole="button"
                hitSlop={14}
                onBlur={() => setFocusedItem(null)}
                onFocus={() => setFocusedItem(`${date}-${task.id}`)}
                onPress={() => onOpen(task.id)}
                style={({ pressed }) => [
                  styles.singleDayLabel,
                  compact && styles.singleDayLabelCompact,
                  minimal && styles.singleDayLabelMinimal,
                  {
                    backgroundColor: theme.colors.highlightAmber,
                    borderColor:
                      focusedItem === `${date}-${task.id}` ? theme.colors.primary : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <AppText
                  align={compact ? 'center' : undefined}
                  numberOfLines={1}
                  tone="secondary"
                  variant="caption"
                  weight="medium"
                  style={
                    minimal
                      ? styles.minimalSingleDayLabelText
                      : compact
                        ? styles.compactSingleDayLabelText
                        : undefined
                  }
                >
                  {getCalendarSingleDayLabel(task, compact, minimal)}
                </AppText>
              </Pressable>
            ) : null}
            {items.length > 1 ? (
              <Pressable
                accessibilityLabel={`${formatOverflowDate(date)} 하루 일정 ${items.length - 1}개 더 있음`}
                accessibilityHint="이 날짜의 전체 일정 목록을 엽니다."
                accessibilityRole="button"
                hitSlop={14}
                onBlur={() => setFocusedItem(null)}
                onFocus={() => setFocusedItem(`${date}-overflow`)}
                onPress={() => onSelectDate?.(date)}
                style={[
                  styles.singleDayOverflow,
                  {
                    borderColor:
                      focusedItem === `${date}-overflow` ? theme.colors.primary : 'transparent',
                  },
                ]}
              >
                <AppText tone="muted" variant="caption" weight="semibold">
                  +{items.length - 1}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function CalendarPeriodBars({
  compact = false,
  dates,
  minimal = false,
  tasks,
  onOpen,
  onSelectDate,
}: CalendarPeriodBarsProps) {
  const theme = useAppTheme();
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const layout = layoutCalendarPeriodSegments(tasks, dates);
  const overflowDate = dates[layout.overflowSegments[0]?.startIndex ?? 0];

  if (layout.segments.length === 0) return null;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {layout.segments.map((segment) => {
        const segmentKey = `${segment.task.id}-${segment.lane}`;

        return (
          <View
            key={segmentKey}
            style={[
              styles.segmentSlot,
              compact && styles.segmentSlotCompact,
              {
                left: getCalendarSegmentLeftPercent(segment.startIndex, dates.length),
                top: segment.lane * (compact ? 20 : 24),
                width: getCalendarSegmentWidthPercent(
                  segment.startIndex,
                  segment.endIndex,
                  dates.length,
                ),
              },
            ]}
          >
            <Pressable
              accessibilityHint="일정 상세 화면을 엽니다."
              accessibilityLabel={`${getCalendarScheduleAccessibilityLabel(segment.task, '기간 일정')}, 상세 보기`}
              accessibilityRole="button"
              hitSlop={12}
              onBlur={() => setFocusedItem(null)}
              onFocus={() => setFocusedItem(segmentKey)}
              onPress={() => onOpen(segment.task.id)}
              style={({ pressed }) => [
                styles.bar,
                compact && styles.barCompact,
                minimal && styles.barMinimal,
                {
                  backgroundColor: theme.colors.highlightSage,
                  borderColor: focusedItem === segmentKey ? theme.colors.primary : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <AppText
                numberOfLines={1}
                tone="secondary"
                variant="caption"
                weight="medium"
                style={styles.periodBarText}
              >
                {segment.continuesBefore ? '‹ ' : ''}
                {segment.task.title}
                {segment.continuesAfter ? ' ›' : ''}
              </AppText>
            </Pressable>
          </View>
        );
      })}
      {layout.overflowCount > 0 ? (
        <Pressable
          accessibilityLabel={`기간 일정 ${layout.overflowCount}개 더 있음`}
          accessibilityHint="해당 날짜의 전체 일정 목록을 엽니다."
          accessibilityRole="button"
          hitSlop={14}
          onBlur={() => setFocusedItem(null)}
          onFocus={() => setFocusedItem('period-overflow')}
          onPress={() => {
            if (overflowDate) onSelectDate?.(overflowDate);
          }}
          style={[
            styles.overflow,
            {
              borderColor: focusedItem === 'period-overflow' ? theme.colors.primary : 'transparent',
            },
          ]}
        >
          <AppText align="right" tone="secondary" variant="caption" weight="semibold">
            +{layout.overflowCount}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function buildCalendarSingleDayLabels(
  tasks: TaskResponse[],
  dates: LocalDateString[],
): TaskResponse[][] {
  return dates.map((date) =>
    tasks.filter(
      (task) =>
        task.type === 'SCHEDULE' &&
        !isMultiDaySchedule(task) &&
        doesScheduleOverlapDate(task, date),
    ),
  );
}

export function getCalendarSingleDayLabel(task: TaskResponse, compact = false, minimal = false) {
  if (minimal) {
    return task.title;
  }

  if (task.allDay || !task.startAt) return task.title;
  if (compact) return task.title;

  return `${formatTimeLabel(task.startAt)} ${task.title}`;
}

export function getCalendarScheduleAccessibilityLabel(task: TaskResponse, kind: string) {
  const timeLabel = task.startAt && !task.allDay ? formatTimeLabel(task.startAt) : null;

  return [task.title, kind, timeLabel, getRecurrenceLabel(task), getOccurrenceLabel(task)]
    .filter(Boolean)
    .join(', ');
}

export function layoutCalendarPeriodSegments(
  tasks: TaskResponse[],
  dates: LocalDateString[],
  maxLanes = 2,
) {
  const laneEndIndexes = Array.from({ length: maxLanes }, () => -1);
  const segments = [];
  const overflowSegments = [];
  const periodSegments = buildCalendarPeriodSegments(tasks, dates).sort(
    (left, right) => left.startIndex - right.startIndex || right.endIndex - left.endIndex,
  );

  for (const segment of periodSegments) {
    const lane = laneEndIndexes.findIndex((endIndex) => endIndex < segment.startIndex);

    if (lane < 0) {
      overflowSegments.push(segment);
      continue;
    }

    laneEndIndexes[lane] = segment.endIndex;
    segments.push({ ...segment, lane });
  }

  return {
    segments,
    overflowCount: overflowSegments.length,
    overflowSegments,
  };
}

export function buildCalendarPeriodSegments(tasks: TaskResponse[], dates: LocalDateString[]) {
  if (dates.length === 0) return [];

  return tasks.flatMap((task) => {
    if (!isMultiDaySchedule(task)) return [];

    const occupiedIndexes = dates
      .map((date, index) => (doesScheduleOverlapDate(task, date) ? index : -1))
      .filter((index) => index >= 0);

    if (occupiedIndexes.length === 0) return [];

    const startIndex = occupiedIndexes[0];
    const endIndex = occupiedIndexes.at(-1) ?? startIndex;
    const startDate = task.startAt?.slice(0, 10);
    const endDate = getOccupiedEndDate(task);

    return [
      {
        task,
        startIndex,
        endIndex,
        continuesBefore: Boolean(startDate && startDate < dates[0]),
        continuesAfter: Boolean(endDate && endDate > dates.at(-1)!),
      },
    ];
  });
}

export function isMultiDaySchedule(task: TaskResponse) {
  if (!task.startAt || !task.endAt) return false;

  const startDate = task.startAt.slice(0, 10) as LocalDateString;
  const occupiedEndDate = getOccupiedEndDate(task);
  return occupiedEndDate !== null && occupiedEndDate > startDate;
}

function getOccupiedEndDate(task: TaskResponse): LocalDateString | null {
  if (!task.endAt) return null;
  const rawEndDate = task.endAt.slice(0, 10) as LocalDateString;
  const endsAtMidnight = /^T00:00(?::00(?:\.0+)?)?$/.test(task.endAt.slice(10));
  return endsAtMidnight ? (shiftLocalDate(rawEndDate, -1) ?? rawEndDate) : rawEndDate;
}

function formatOverflowDate(date: LocalDateString) {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
}

const styles = StyleSheet.create({
  singleDayRow: {
    flexDirection: 'row',
    minHeight: 26,
  },
  singleDayCell: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    minWidth: 0,
    overflow: 'hidden',
    paddingHorizontal: 3,
    width: CALENDAR_DAY_WIDTH,
  },
  singleDayLabel: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    flex: 1,
    height: 22,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
    paddingHorizontal: 3,
  },
  singleDayLabelCompact: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 3,
  },
  singleDayLabelMinimal: {
    alignItems: 'center',
    flex: 0,
    minWidth: 44,
    paddingHorizontal: spacing[1],
  },
  compactSingleDayLabelText: {
    fontSize: 10,
    lineHeight: 14,
  },
  minimalSingleDayLabelText: {
    fontSize: 11,
    lineHeight: 15,
  },
  singleDayOverflow: {
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  container: {
    height: 52,
    overflow: 'hidden',
    position: 'relative',
  },
  containerCompact: {
    height: 44,
  },
  segmentSlot: {
    height: 22,
    paddingHorizontal: 4,
    position: 'absolute',
  },
  segmentSlotCompact: {
    height: 20,
    paddingHorizontal: 3,
  },
  bar: {
    borderRadius: radii.full,
    borderWidth: 1,
    flex: 1,
    height: 22,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: spacing[2],
  },
  barCompact: {
    height: 20,
    paddingHorizontal: spacing[1],
  },
  barMinimal: {
    paddingHorizontal: spacing[1],
  },
  periodBarText: {
    fontSize: 11,
    lineHeight: 15,
  },
  overflow: {
    borderRadius: radii.sm,
    borderWidth: 1,
    bottom: 0,
    position: 'absolute',
    right: spacing[1],
  },
});
