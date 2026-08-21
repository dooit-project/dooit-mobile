import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { getWeekDates } from '@/features/calendar/calendar-date';
import { useCalendarRangeTasks } from '@/features/calendar/use-calendar-range-tasks';
import { radii, spacing, useAppTheme, useMobileLayout } from '@/theme';
import type { LocalDateString } from '@/types';
import { doesScheduleOverlapDate, formatDateLabel } from '@/utils';

const weekdayLabels = ['월', '화', '수', '목', '금', '토', '일'];

export function getTodayWeekDateLabel(date: LocalDateString) {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));

  return day === 1 ? `${month}/${day}` : String(day);
}

type TodayWeekStripProps = {
  today: LocalDateString;
};

export function TodayWeekStrip({ today }: TodayWeekStripProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const { isDenseCalendar } = useMobileLayout();
  const dates = getWeekDates(today);
  const query = useCalendarRangeTasks('WEEK', today);
  const schedules = query.data ?? [];
  const [focusedDate, setFocusedDate] = useState<LocalDateString | null>(null);
  const openCalendarDate = (date: LocalDateString) => {
    router.push({ pathname: '/calendar', params: { date } });
  };

  return (
    <View accessibilityLabel="이번 주 일정" style={styles.container}>
      <View style={[styles.calendarGrid, isDenseCalendar && styles.calendarGridDense]}>
        <View style={styles.days}>
          {dates.map((date, index) => {
            const isToday = date === today;
            const hasSchedule = schedules.some((task) => doesScheduleOverlapDate(task, date));

            return (
              <Pressable
                accessibilityLabel={`${formatDateLabel(date, {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}${isToday ? ', 오늘' : ''}${hasSchedule ? ', 일정 있음' : ''}, 달력에서 보기`}
                accessibilityRole="button"
                accessibilityState={{ selected: isToday }}
                key={date}
                onBlur={() => setFocusedDate(null)}
                onFocus={() => setFocusedDate(date)}
                onPress={() => openCalendarDate(date)}
                style={({ pressed }) => [
                  styles.day,
                  isDenseCalendar && styles.dayDense,
                  {
                    backgroundColor: pressed ? theme.colors.highlightBlue : 'transparent',
                    borderColor: focusedDate === date ? theme.colors.primary : 'transparent',
                  },
                ]}
              >
                <AppText
                  align="center"
                  tone={isToday ? 'default' : 'secondary'}
                  variant="caption"
                  weight="semibold"
                >
                  {weekdayLabels[index]}
                </AppText>
                <View style={[styles.date, isToday && { backgroundColor: theme.colors.text }]}>
                  <AppText
                    align="center"
                    variant="bodyLarge"
                    weight="bold"
                    style={isToday ? { color: theme.colors.surface } : undefined}
                  >
                    {getTodayWeekDateLabel(date)}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.scheduleDot,
                    { backgroundColor: hasSchedule ? theme.colors.primary : 'transparent' },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  calendarGrid: {
    minHeight: 64,
    position: 'relative',
  },
  calendarGridDense: {
    minHeight: 58,
  },
  days: {
    flexDirection: 'row',
  },
  day: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 2,
    flex: 1,
    gap: spacing[1],
    minHeight: 56,
    paddingBottom: spacing[1],
    paddingTop: spacing[1],
  },
  dayDense: {
    gap: 0,
    minHeight: 56,
  },
  date: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  scheduleDot: {
    borderRadius: radii.full,
    height: 4,
    width: 4,
  },
});
