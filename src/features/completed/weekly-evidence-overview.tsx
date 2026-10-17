import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  EmptyState,
  IconButton,
  InlineNotice,
  ListSkeleton,
  Screen,
} from '@/components/ui';
import { getDdayGoalFallbackColor, useDdayGoalColors } from '@/features/dday';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';
import { formatDateLabel, shiftLocalDate, toApiLocalDate } from '@/utils';

import { type CompletedEvidenceGroup, getCompletedEvidence } from './completed-evidence';
import { useCompletedWeek } from './use-completed-week';

const RECORD_BATCH_SIZE = 20;

export function WeeklyEvidenceOverview() {
  const router = useRouter();
  const theme = useAppTheme();
  const today = toApiLocalDate();
  const [selectedDate, setSelectedDate] = useState(today);
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
    if (next) setSelectedDate(next);
  };
  const rangeOptions: Intl.DateTimeFormatOptions = {
    ...(start.slice(0, 4) !== today.slice(0, 4) || end.slice(0, 4) !== today.slice(0, 4)
      ? { year: 'numeric' }
      : {}),
    month: 'numeric',
    day: 'numeric',
  };

  return (
    <Screen scroll safeAreaEdges={['left', 'right']} contentContainerStyle={styles.screen}>
      <View style={styles.weekNavigation}>
        <View style={styles.rangeNavigation}>
          <IconButton
            accessibilityLabel="이전 주 기록 보기"
            onPress={() => moveWeek(-7)}
            style={styles.arrow}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={18}
              tintColor={theme.colors.textSecondary}
            />
          </IconButton>
          <AppText
            accessibilityLabel={`${formatDateLabel(start, { dateStyle: 'full' })}부터 ${formatDateLabel(end, { dateStyle: 'full' })}까지`}
            variant="label"
            weight="semibold"
            align="center"
            style={styles.rangeLabel}
          >
            {formatDateLabel(start, rangeOptions)} – {formatDateLabel(end, rangeOptions)}
          </AppText>
          <IconButton
            accessibilityLabel="다음 주 기록 보기"
            disabled={isCurrentWeek}
            onPress={() => moveWeek(7)}
            style={styles.arrow}
          >
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={18}
              tintColor={theme.colors.textSecondary}
            />
          </IconButton>
        </View>
        <Button
          variant="ghost"
          size="compact"
          disabled={isCurrentWeek}
          onPress={() => setSelectedDate(today)}
          style={styles.currentWeek}
        >
          이번 주
        </Button>
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
          <AppText tone="secondary" variant="label">
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
        <EmptyState
          title={`${isCurrentWeek ? '이번 주' : '이 주'}에 저장된 완료 기록이 없어요`}
          description="다른 주의 기록을 살펴보거나 오늘의 할 일로 돌아갈 수 있어요."
          primaryAction={<Button onPress={() => router.replace('/')}>오늘로 가기</Button>}
        />
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
          <AppText accessibilityRole="header" variant="bodyLarge" weight="semibold">
            {group.title}
          </AppText>
          <AppText tone="secondary" variant="caption">
            완료 기록 {group.records.length}개 · {group.activeDays}일
          </AppText>
        </View>
      </View>
      <View style={styles.records}>
        {group.records.slice(0, visibleCount).map(({ task, date }) => (
          <Pressable
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
            <AppText style={styles.recordTitle}>{task.title}</AppText>
            <AppText variant="caption" tone="secondary" style={styles.recordDate}>
              {formatDateLabel(date, { month: 'numeric', day: 'numeric', weekday: 'short' })}
            </AppText>
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
  weekNavigation: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  rangeNavigation: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rangeLabel: { flex: 1, flexShrink: 1 },
  arrow: { backgroundColor: 'transparent' },
  currentWeek: { minHeight: 44 },
  evidence: { gap: spacing[6] },
  group: { gap: spacing[2] },
  groupHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  dot: { height: 10, width: 10, borderRadius: 5, marginTop: 8 },
  groupTitle: { flex: 1, gap: spacing[1] },
  records: { paddingLeft: spacing[4] },
  record: {
    minHeight: 48,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing[3],
    rowGap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderRadius: radii.sm,
  },
  recordTitle: { flexGrow: 1, flexShrink: 1, flexBasis: 140 },
  recordDate: { flexShrink: 0 },
});
