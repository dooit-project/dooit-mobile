import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  AppIcon,
  AppText,
  Button,
  EmptyState,
  IconButton,
  InlineNotice,
  ListSkeleton,
  Screen,
} from '@/components/ui';
import { uiAuditProps } from '@/components/ui/ui-audit-props';
import { getWeekDates } from '@/features/calendar/calendar-date';
import { getDdayGoalFallbackColor, useDdayGoalColors } from '@/features/dday';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { useAppToday } from '@/services/time/use-app-today';
import { radii, spacing, useAppTheme } from '@/theme';
import { formatDateLabel, shiftLocalDate } from '@/utils';

import { type CompletedEvidenceGroup, getCompletedEvidence } from './completed-evidence';
import { useCompletedWeek } from './use-completed-week';

const RECORD_BATCH_SIZE = 20;

export function WeeklyEvidenceOverview() {
  const router = useRouter();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const today = useAppToday();
  const [browsedDate, setBrowsedDate] = useState<string | null>(null);
  const [currentWeekFocused, setCurrentWeekFocused] = useState(false);
  const selectedDate = browsedDate ?? today;
  const week = useCompletedWeek(selectedDate);
  const start = week.days[0]?.date ?? selectedDate;
  const end = week.days.at(-1)?.date ?? selectedDate;
  const isCurrentWeek = start <= today && today <= end;
  const groups = getCompletedEvidence(week.days);
  const colors = useDdayGoalColors(
    groups.flatMap((group) => (group.goalId === null ? [] : [group.goalId])),
  );
  const moveWeek = (offset: number) => {
    const next = shiftLocalDate(selectedDate, offset);
    if (next) {
      const nextWeek = getWeekDates(next);
      setBrowsedDate(nextWeek.includes(today) ? null : next);
    }
  };
  const rangeOptions: Intl.DateTimeFormatOptions = {
    ...(start.slice(0, 4) !== today.slice(0, 4) || end.slice(0, 4) !== today.slice(0, 4)
      ? { year: 'numeric' }
      : {}),
    month: 'numeric',
    day: 'numeric',
  };
  const startLabel = formatDateLabel(start, rangeOptions);
  const endLabel = formatDateLabel(end, rangeOptions);
  const compactYearRange = width <= 360 && 'year' in rangeOptions;
  const compactDate = (date: string, withYear: boolean) =>
    `${withYear ? `${date.slice(2, 4)}.` : ''}${Number(date.slice(5, 7))}.${Number(date.slice(8, 10))}`;
  const isEmpty = !week.isPending && !week.error && groups.length === 0;

  return (
    <Screen
      scroll
      safeAreaEdges={['left', 'right']}
      contentContainerStyle={[styles.screen, isEmpty && styles.emptyScreen]}
    >
      <View style={styles.weekNavigation}>
        <View style={[styles.navigationSide, width <= 360 && styles.narrowNavigationSide]} />
        <View
          {...uiAuditProps({ uiRow: 'review-week-navigation', uiAlign: 'text-block' })}
          style={styles.rangeNavigation}
        >
          <IconButton
            accessibilityLabel="이전 주 기록 보기"
            onPress={() => moveWeek(-7)}
            style={styles.arrow}
          >
            <View {...uiAuditProps({ uiIcon: 'glyph' })}>
              <AppIcon name="chevron-left" color={theme.colors.textSecondary} />
            </View>
          </IconButton>
          <AppText
            {...uiAuditProps({ uiText: 'block' })}
            accessibilityLabel={`${formatDateLabel(start, { dateStyle: 'full' })}부터 ${formatDateLabel(end, { dateStyle: 'full' })}까지`}
            variant={compactYearRange ? 'caption' : width <= 360 ? 'label' : 'body'}
            weight="semibold"
            align="center"
            style={styles.rangeLabel}
          >
            {width <= 360
              ? `${compactDate(start, compactYearRange)}${compactYearRange ? '–' : ' – '}${compactDate(end, compactYearRange)}`
              : `${startLabel} – ${endLabel}`}
          </AppText>
          <IconButton
            accessibilityLabel="다음 주 기록 보기"
            disabled={isCurrentWeek}
            onPress={() => moveWeek(7)}
            style={styles.arrow}
          >
            <View {...uiAuditProps({ uiIcon: 'glyph' })}>
              <AppIcon name="chevron-right" color={theme.colors.textSecondary} />
            </View>
          </IconButton>
        </View>
        <Pressable
          {...uiAuditProps({ uiTouch: '44' })}
          accessibilityLabel="이번 주로 이동"
          accessibilityRole="button"
          accessibilityState={{ disabled: isCurrentWeek }}
          disabled={isCurrentWeek}
          onBlur={() => setCurrentWeekFocused(false)}
          onFocus={() => setCurrentWeekFocused(true)}
          onPress={() => setBrowsedDate(null)}
          style={[styles.currentWeek, width <= 360 && styles.narrowCurrentWeek]}
        >
          {({ pressed }) => (
            <View
              style={[
                styles.currentWeekOutline,
                width <= 360 && styles.narrowCurrentWeekOutline,
                {
                  backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
                  borderColor: currentWeekFocused ? theme.colors.text : theme.colors.borderStrong,
                  opacity: isCurrentWeek ? 0.5 : 1,
                },
              ]}
            >
              <AppText tone="secondary" variant="caption" weight="semibold">
                이번 주
              </AppText>
            </View>
          )}
        </Pressable>
      </View>

      {week.isPending ? (
        <ListSkeleton accessibilityLabel="주간 완료 기록을 불러오는 중" />
      ) : week.error ? (
        <InlineNotice
          title="완료 기록을 불러오지 못했어요"
          message={getUserFacingApiErrorMessage(week.error)}
          tone="danger"
          action={
            <Button variant="ghost" size="compact" onPress={() => void week.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : groups.length ? (
        <View style={styles.evidence}>
          <AppText accessibilityRole="header" variant="sectionTitle" weight="bold">
            {isCurrentWeek ? '이번 주' : '이 주'}에 남긴 기록
          </AppText>
          {groups.map((group) => (
            <EvidenceGroup
              key={`${start}:${group.goalId ?? 'unlinked'}`}
              group={group}
              color={
                group.goalId === null
                  ? theme.colors.textMuted
                  : (colors[String(group.goalId)] ?? getDdayGoalFallbackColor(group.goalId))
              }
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyArea}>
          <EmptyState
            title={`${isCurrentWeek ? '이번 주' : '이 주'}에 저장된 완료 기록이 없어요`}
            description="다른 주의 기록을 살펴보거나 오늘의 할 일로 돌아갈 수 있어요."
            primaryAction={
              <Button variant="outline" onPress={() => router.replace('/')}>
                오늘로 가기
              </Button>
            }
          />
        </View>
      )}
    </Screen>
  );
}

function EvidenceGroup({ group, color }: { group: CompletedEvidenceGroup; color: string }) {
  const router = useRouter();
  const theme = useAppTheme();
  const [visibleCount, setVisibleCount] = useState(RECORD_BATCH_SIZE);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const remaining = Math.max(0, group.records.length - visibleCount);

  return (
    <View style={styles.group}>
      <View style={styles.groupHeading}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={styles.groupTitle}>
          <AppText accessibilityRole="header" variant="sectionTitle" weight="bold">
            {group.title}
          </AppText>
          <AppText tone="secondary" variant="label">
            완료 기록 {group.records.length}개 · {group.activeDays}일
          </AppText>
        </View>
      </View>
      <View style={styles.records}>
        {group.records.slice(0, visibleCount).map(({ task, date }) => (
          <Pressable
            {...uiAuditProps({ uiRow: 'review-record', uiAlign: 'text-block', uiTouch: '44' })}
            key={task.id}
            accessibilityRole="button"
            accessibilityLabel={`${task.title}, ${formatDateLabel(date, { dateStyle: 'full' })} 완료 기록`}
            accessibilityHint="원본 할 일 상세를 엽니다"
            onFocus={() => setFocusedId(task.id)}
            onBlur={() => setFocusedId(null)}
            onPress={() =>
              router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(task.id) } })
            }
            style={({ pressed }) => [
              styles.record,
              {
                backgroundColor:
                  pressed || focusedId === task.id ? theme.colors.primarySoft : 'transparent',
                borderColor: focusedId === task.id ? theme.colors.primary : 'transparent',
              },
            ]}
          >
            <View {...uiAuditProps({ uiText: 'block' })} style={styles.recordCopy}>
              <AppText>{task.title}</AppText>
              <AppText variant="label" tone="secondary">
                {formatDateLabel(date, { month: 'numeric', day: 'numeric', weekday: 'short' })}
              </AppText>
            </View>
            <AppIcon name="chevron-right" size="meta" color={theme.colors.textMuted} />
          </Pressable>
        ))}
        {remaining > 0 ? (
          <Button
            variant="ghost"
            accessibilityLabel={`${group.title}의 남은 기록 ${remaining}개 중 더 보기`}
            onPress={() => setVisibleCount((count) => count + RECORD_BATCH_SIZE)}
          >
            더 보기 ({remaining}개)
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 0, gap: spacing[5] },
  emptyScreen: { flexGrow: 1 },
  emptyArea: { flexGrow: 1, justifyContent: 'center' },
  weekNavigation: { flexDirection: 'row', alignItems: 'center' },
  navigationSide: { width: 54 },
  narrowNavigationSide: { width: 36 },
  rangeNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    columnGap: 2,
  },
  rangeLabel: { flexShrink: 1 },
  arrow: { backgroundColor: 'transparent' },
  currentWeek: { width: 54, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  narrowCurrentWeek: { width: 56 },
  currentWeekOutline: {
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 32,
    paddingHorizontal: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  narrowCurrentWeekOutline: { paddingHorizontal: 6 },
  evidence: { gap: spacing[4] },
  group: { gap: spacing[2] },
  groupHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  dot: { height: 10, width: 10, borderRadius: 5, marginTop: 8 },
  groupTitle: { flex: 1, gap: spacing[1] },
  records: { paddingLeft: spacing[4] },
  record: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing[3],
    rowGap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderRadius: radii.sm,
  },
  recordCopy: { flex: 1, minWidth: 0, gap: spacing[1] },
});
