import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  IconButton,
  InlineNotice,
  ListSkeleton,
  PageHeader,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { TaskCard, useReopenTask } from '@/features/tasks';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { radii, spacing, useAppTheme } from '@/theme';
import type { LocalDateString } from '@/types';
import { formatDateLabel, shiftLocalDate, toApiLocalDate } from '@/utils';

import { getCompletedSummary } from './completed-summary';
import { useCompletedWeek } from './use-completed-week';

export function CompletedOverview() {
  const router = useRouter();
  const theme = useAppTheme();
  const today = toApiLocalDate();
  const [selectedDate, setSelectedDate] = useState<LocalDateString>(today);
  const [focusedDate, setFocusedDate] = useState<LocalDateString | null>(null);
  const week = useCompletedWeek(selectedDate);
  const reopenTask = useReopenTask(selectedDate);
  const selectedDay = week.days.find((day) => day.date === selectedDate) ?? week.days[0];
  const summary = getCompletedSummary(week.days);
  const moveWeek = (days: number) => {
    const nextDate = shiftLocalDate(selectedDate, days);
    if (nextDate) setSelectedDate(nextDate);
  };

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        title="완료 기록"
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
      />

      <Card padded={false} style={styles.weekCard}>
        <View style={styles.weekHeading}>
          <IconButton accessibilityLabel="이전 주" onPress={() => moveWeek(-7)}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={20}
              tintColor={theme.colors.textSecondary}
            />
          </IconButton>
          <AppText align="center" style={styles.weekLabel} variant="label" weight="bold">
            {week.days[0] ? formatWeekRange(week.days[0].date, week.days.at(-1)?.date) : '이번 주'}
          </AppText>
          <IconButton accessibilityLabel="다음 주" onPress={() => moveWeek(7)}>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={20}
              tintColor={theme.colors.textSecondary}
            />
          </IconButton>
        </View>

        <View style={[styles.dayList, { borderTopColor: theme.colors.border }]}>
          {week.days.map((day) => {
            const selected = day.date === selectedDate;

            return (
              <Pressable
                key={day.date}
                accessibilityLabel={`${formatDateLabel(day.date)}, 완료 ${day.tasks.length}개`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onBlur={() => setFocusedDate(null)}
                onFocus={() => setFocusedDate(day.date)}
                onPress={() => setSelectedDate(day.date)}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor:
                      selected || focusedDate === day.date
                        ? theme.colors.primarySoft
                        : theme.colors.surface,
                    borderColor: focusedDate === day.date ? theme.colors.primary : 'transparent',
                  },
                ]}
              >
                <AppText
                  align="center"
                  tone={selected ? 'primary' : 'secondary'}
                  variant="caption"
                  weight="semibold"
                >
                  {formatDateLabel(day.date, { weekday: 'short' })}
                </AppText>
                <AppText
                  align="center"
                  tone={selected ? 'primary' : 'default'}
                  variant="label"
                  weight="bold"
                >
                  {day.tasks.length}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {week.isPending ? (
        <ListSkeleton accessibilityLabel="완료 기록을 불러오는 중" />
      ) : week.error ? (
        <InlineNotice
          message={getUserFacingApiErrorMessage(week.error)}
          title="완료 기록을 불러오지 못했어요"
          tone="danger"
          action={
            <Button size="compact" variant="ghost" onPress={() => void week.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <>
          {selectedDay?.tasks.length ? (
            <View style={styles.log}>
              <SectionHeader
                title={formatDateLabel(selectedDay.date)}
                action={
                  <AppText tone="success" variant="label" weight="semibold">
                    {selectedDay.tasks.length}개 완료
                  </AppText>
                }
              />
              <View style={styles.tasks}>
                {selectedDay.tasks.map((task) => (
                  <TaskCard
                    compact
                    key={task.id}
                    task={task}
                    isCompleting={reopenTask.isPending && reopenTask.variables === task.id}
                    completionDisabled={reopenTask.isPending}
                    onReopen={() => reopenTask.mutate(task.id)}
                    onOpen={() =>
                      router.push({
                        pathname: '/tasks/[taskId]',
                        params: { taskId: String(task.id) },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          ) : (
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
              title="이날 완료한 일이 없어요"
              description="다른 날짜를 선택해 완료 기록을 확인해 보세요."
              primaryAction={<Button onPress={() => router.replace('/')}>Today로 돌아가기</Button>}
            />
          )}

          {reopenTask.error ? (
            <InlineNotice message={reopenTask.error.message} tone="danger" />
          ) : null}

          <View
            style={[
              styles.summaryRow,
              {
                backgroundColor: theme.colors.highlightSage,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText variant="label" weight="semibold">
              이번 주 {summary.total}개 완료 · {summary.activeDays}일 기록
            </AppText>
            <AppText numberOfLines={1} tone="secondary" variant="caption">
              {summary.message}
            </AppText>
          </View>
        </>
      )}
    </Screen>
  );
}

function formatWeekRange(start: LocalDateString, end?: LocalDateString) {
  if (!end) return formatDateLabel(start);

  return `${formatDateLabel(start, { month: 'short', day: 'numeric' })} – ${formatDateLabel(end, {
    month: 'short',
    day: 'numeric',
  })}`;
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing[4],
    paddingTop: spacing[4],
  },
  headerButton: {
    backgroundColor: 'transparent',
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  weekCard: {
    overflow: 'hidden',
  },
  weekHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[1],
    padding: spacing[2],
  },
  weekLabel: {
    flex: 1,
  },
  dayList: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dayButton: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    gap: spacing[1],
    justifyContent: 'center',
    minHeight: 52,
  },
  summaryRow: {
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  log: {
    gap: spacing[3],
  },
  tasks: {
    gap: spacing[1],
  },
});
