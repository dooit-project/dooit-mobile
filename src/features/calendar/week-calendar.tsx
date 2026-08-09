import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { ContextualFeatureTip } from '@/features/onboarding';
import { radii, spacing, useAppTheme, useMobileLayout } from '@/theme';
import type { LocalDateString, TaskResponse } from '@/types';
import { formatDateLabel, isLocalDateString, shiftLocalDate, toApiLocalDate } from '@/utils';

import { CalendarDayTasks } from './calendar-day-tasks';
import { getThreeWeekCalendarDates } from './calendar-date';
import { CALENDAR_DAY_WIDTH, getCalendarColumnBoundaryPercent } from './calendar-layout';
import { CalendarPeriodBars, CalendarSingleDayLabels } from './calendar-period-bars';
import { useCalendarRangeTasks } from './use-calendar-range-tasks';

const weekdayLabels = ['월', '화', '수', '목', '금', '토', '일'];

export function WeekCalendar() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const theme = useAppTheme();
  const today = toApiLocalDate();
  const [selectedDate, setSelectedDate] = useState<LocalDateString>(
    params.date && isLocalDateString(params.date) ? params.date : today,
  );
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => Number(selectedDate.slice(0, 4)));
  const calendarDates = useMemo(() => getThreeWeekCalendarDates(selectedDate), [selectedDate]);
  const rangeTasks = useCalendarRangeTasks('MONTH', selectedDate);
  const openTask = (taskId: number) => {
    router.push({ pathname: '/tasks/[taskId]', params: { taskId: String(taskId) } });
  };

  const moveWeek = (amount: number) => {
    const nextSelectedDate = shiftLocalDate(selectedDate, amount * 7);

    if (nextSelectedDate) {
      setSelectedDate(nextSelectedDate);
      setPickerYear(Number(nextSelectedDate.slice(0, 4)));
      setMonthPickerOpen(false);
    }
  };

  const movePickerYear = (amount: number) => {
    setPickerYear((current) => current + amount);
  };

  const selectMonth = (month: number) => {
    const selectedDay = Number(selectedDate.slice(8, 10));
    const lastDayOfTargetMonth = new Date(Date.UTC(pickerYear, month, 0, 12)).getUTCDate();
    const targetDate = `${pickerYear}-${String(month).padStart(2, '0')}-${String(
      Math.min(selectedDay, lastDayOfTargetMonth),
    ).padStart(2, '0')}` as LocalDateString;

    if (isLocalDateString(targetDate)) {
      setSelectedDate(targetDate);
      setMonthPickerOpen(false);
    }
  };

  return (
    <Screen scroll contentContainerStyle={styles.screen}>
      <ContextualFeatureTip
        message="날짜를 누르면 그날의 Task와 일정을 볼 수 있어요. 여러 날 일정은 달력 위의 이어진 막대로 표시됩니다."
        tipIds={['calendar.overview']}
        title="Calendar 보는 방법"
      />
      <View style={styles.calendarSurface}>
        <View style={styles.calendarHeading}>
          <Pressable
            accessibilityLabel="이전 주"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => moveWeek(-1)}
            style={({ pressed }) => [
              styles.calendarNavButton,
              { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
            ]}
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={18}
              tintColor={theme.colors.textSecondary}
            />
          </Pressable>
          <Pressable
            accessibilityLabel={`${formatDateLabel(selectedDate, {
              year: 'numeric',
              month: 'long',
            })} 월 선택 열기`}
            accessibilityRole="button"
            accessibilityState={{ expanded: monthPickerOpen }}
            hitSlop={8}
            onPress={() => {
              setPickerYear(Number(selectedDate.slice(0, 4)));
              setMonthPickerOpen((current) => !current);
            }}
            style={({ pressed }) => [
              styles.monthTitleButton,
              { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
            ]}
          >
            <AppText align="center" variant="title" weight="bold">
              {formatDateLabel(selectedDate, { year: 'numeric', month: 'long' })}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityLabel="다음 주"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => moveWeek(1)}
            style={({ pressed }) => [
              styles.calendarNavButton,
              { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
            ]}
          >
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={18}
              tintColor={theme.colors.textSecondary}
            />
          </Pressable>
        </View>

        {monthPickerOpen ? (
          <MonthPicker
            pickerYear={pickerYear}
            selectedDate={selectedDate}
            onMoveYear={movePickerYear}
            onSelectMonth={selectMonth}
          />
        ) : null}

        <MonthDateGrid
          dates={calendarDates}
          selectedDate={selectedDate}
          today={today}
          onSelect={setSelectedDate}
          tasks={rangeTasks.data ?? []}
          onOpenTask={openTask}
        />
      </View>

      <CalendarDayTasks date={selectedDate} />
    </Screen>
  );
}

type MonthPickerProps = {
  pickerYear: number;
  selectedDate: LocalDateString;
  onMoveYear: (amount: number) => void;
  onSelectMonth: (month: number) => void;
};

function MonthPicker({ pickerYear, selectedDate, onMoveYear, onSelectMonth }: MonthPickerProps) {
  const theme = useAppTheme();
  const selectedYear = Number(selectedDate.slice(0, 4));
  const selectedMonth = Number(selectedDate.slice(5, 7));

  return (
    <View
      style={[
        styles.monthPickerSurface,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.monthPickerHeader}>
        <Pressable
          accessibilityLabel="이전 연도"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onMoveYear(-1)}
          style={({ pressed }) => [
            styles.monthPickerNavButton,
            { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
          ]}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={14}
            tintColor={theme.colors.textSecondary}
          />
        </Pressable>
        <AppText align="center" tone="secondary" variant="label" weight="semibold">
          {pickerYear}년
        </AppText>
        <Pressable
          accessibilityLabel="다음 연도"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onMoveYear(1)}
          style={({ pressed }) => [
            styles.monthPickerNavButton,
            { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
          ]}
        >
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            tintColor={theme.colors.textSecondary}
          />
        </Pressable>
      </View>
      <View style={styles.monthPickerGrid}>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
          const selected = pickerYear === selectedYear && month === selectedMonth;

          return (
            <Pressable
              accessibilityLabel={`${pickerYear}년 ${month}월 선택`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={month}
              onPress={() => onSelectMonth(month)}
              style={({ pressed }) => [
                styles.monthOption,
                {
                  backgroundColor: selected
                    ? theme.colors.primarySoft
                    : pressed
                      ? theme.colors.surfaceMuted
                      : 'transparent',
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <AppText align="center" tone={selected ? 'primary' : 'default'} weight="semibold">
                {month}월
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type DatePickerProps = {
  dates: LocalDateString[];
  selectedDate: LocalDateString;
  today: LocalDateString;
  onSelect: (date: LocalDateString) => void;
  tasks?: TaskResponse[];
  onOpenTask?: (taskId: number) => void;
};

function MonthDateGrid({
  dates,
  selectedDate,
  today,
  onSelect,
  tasks = [],
  onOpenTask = () => undefined,
}: DatePickerProps) {
  const theme = useAppTheme();
  const { isDenseCalendar } = useMobileLayout();
  const selectedMonth = selectedDate.slice(0, 7);

  return (
    <View
      style={[
        styles.monthGridSurface,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.rule },
      ]}
    >
      <View style={styles.monthWeekdays}>
        {weekdayLabels.map((label, index) => (
          <AppText
            align="center"
            key={label}
            tone={index >= 5 ? 'muted' : 'secondary'}
            variant="caption"
            weight="semibold"
            style={styles.monthWeekday}
          >
            {label}
          </AppText>
        ))}
      </View>
      {Array.from({ length: Math.ceil(dates.length / 7) }, (_, weekIndex) =>
        dates.slice(weekIndex * 7, weekIndex * 7 + 7),
      ).map((weekDates, weekIndex, weeks) => (
        <View
          key={weekDates[0]}
          style={[
            styles.monthWeek,
            isDenseCalendar && styles.monthWeekDense,
            {
              borderBottomColor: theme.colors.rule,
              borderBottomWidth: weekIndex < weeks.length - 1 ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <View style={styles.dayColumnRules}>
            {Array.from({ length: 6 }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.dayColumnRule,
                  {
                    backgroundColor: theme.colors.rule,
                    left: getCalendarColumnBoundaryPercent(index),
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.monthGrid}>
            {weekDates.map((date) => (
              <CalendarDateButton
                date={date}
                isCurrentMonth={date.startsWith(selectedMonth)}
                isToday={date === today}
                key={date}
                selected={date === selectedDate}
                onPress={() => onSelect(date)}
                style={[styles.monthDayButton, isDenseCalendar && styles.monthDayButtonDense]}
                theme={theme}
              />
            ))}
          </View>
          <View style={[styles.singleDayLane, isDenseCalendar && styles.singleDayLaneDense]}>
            <CalendarSingleDayLabels
              compact
              dates={weekDates}
              tasks={tasks}
              onOpen={onOpenTask}
              onSelectDate={onSelect}
            />
          </View>
          <View style={[styles.periodLanes, isDenseCalendar && styles.periodLanesDense]}>
            <CalendarPeriodBars
              compact={isDenseCalendar}
              dates={weekDates}
              tasks={tasks}
              onOpen={onOpenTask}
              onSelectDate={onSelect}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

type CalendarDateButtonProps = {
  date: LocalDateString;
  selected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  weekdayLabel?: string;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  theme: ReturnType<typeof useAppTheme>;
};

function CalendarDateButton({
  date,
  selected,
  isToday,
  isCurrentMonth,
  weekdayLabel,
  onPress,
  style,
  theme,
}: CalendarDateButtonProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      accessibilityLabel={`${formatDateLabel(date, {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })}${isToday ? ', 오늘' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.dayButton,
        style,
        {
          backgroundColor: pressed || isFocused ? theme.colors.highlightBlue : 'transparent',
          borderColor: isFocused
            ? theme.colors.primary
            : selected
              ? theme.colors.text
              : 'transparent',
        },
      ]}
    >
      {weekdayLabel ? (
        <AppText
          align="center"
          tone={selected ? 'primary' : 'secondary'}
          variant="caption"
          weight="semibold"
        >
          {weekdayLabel}
        </AppText>
      ) : null}
      <AppText
        align="center"
        tone={selected ? 'primary' : isCurrentMonth ? 'default' : 'muted'}
        variant={weekdayLabel ? 'bodyLarge' : 'label'}
        weight={selected || isToday ? 'heavy' : 'semibold'}
      >
        {Number(date.slice(-2))}
      </AppText>
      <View
        style={[
          styles.todayDot,
          {
            backgroundColor: isToday ? theme.colors.highlightAmber : 'transparent',
            borderColor: isToday ? theme.colors.warning : 'transparent',
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing[4],
    paddingBottom: 104,
    paddingTop: spacing[4],
  },
  calendarSurface: {
    gap: spacing[1],
  },
  calendarHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 44,
    justifyContent: 'center',
    paddingBottom: spacing[1],
  },
  monthGridSurface: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  calendarNavButton: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  monthTitleButton: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  monthPickerSurface: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
    padding: spacing[2],
  },
  monthPickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[1],
    justifyContent: 'center',
  },
  monthPickerNavButton: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  monthPickerGrid: {
    columnGap: spacing[1],
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing[1],
  },
  monthOption: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: '23%',
    flexGrow: 1,
    justifyContent: 'center',
    maxWidth: '24%',
    minHeight: 34,
  },
  dayButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing[1],
    justifyContent: 'center',
    minWidth: 0,
  },
  monthWeekdays: {
    flexDirection: 'row',
    paddingHorizontal: spacing[2],
    paddingTop: spacing[2],
  },
  monthWeekday: {
    width: CALENDAR_DAY_WIDTH,
  },
  monthGrid: {
    flexDirection: 'row',
    paddingTop: spacing[1],
  },
  monthWeek: {
    marginHorizontal: spacing[2],
    minHeight: 128,
    position: 'relative',
  },
  monthWeekDense: {
    minHeight: 112,
  },
  dayColumnRules: {
    bottom: 0,
    left: 0,
    opacity: 0.24,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  dayColumnRule: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  monthDayButton: {
    minHeight: 48,
    paddingVertical: spacing[1],
    width: CALENDAR_DAY_WIDTH,
  },
  monthDayButtonDense: {
    minHeight: 42,
  },
  singleDayLane: {
    minHeight: 28,
  },
  singleDayLaneDense: {
    minHeight: 24,
  },
  periodLanes: {
    minHeight: 48,
  },
  periodLanesDense: {
    minHeight: 40,
  },
  todayDot: {
    borderRadius: radii.full,
    borderWidth: 1,
    height: 6,
    width: 6,
  },
});
