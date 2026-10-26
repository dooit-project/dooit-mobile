import { useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, AppText, Button, TextField, focusControl, uiAuditProps } from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';

import {
  isValidRecurrenceInterval,
  recurrenceFrequencyOptions,
  recurrenceModeOptions,
  type RecurrenceFormValues,
} from './task-form-recurrence';
import {
  taskNotificationTimingOptions,
  type TaskNotificationTiming,
} from './task-notification-timing';
import { TaskFormPropertyRow } from './task-form-property-row';
import { useTaskDraftChange } from './use-task-draft-change';

export type TaskFormSetting = 'notification' | 'recurrence';

export function getRecurrenceFormLabel(values: RecurrenceFormValues) {
  if (values.mode !== 'CUSTOM')
    return recurrenceModeOptions.find((option) => option.value === values.mode)!.label;
  const unit = recurrenceFrequencyOptions.find(
    (option) => option.value === values.customFrequency,
  )!.label;
  return `${values.customInterval}${unit}마다`;
}

export function TaskFormSettings({
  setting,
  allDay,
  notificationTiming,
  recurrence,
  onBack,
  onNotificationChange,
  onRecurrenceChange,
  onDraftChange,
  closeRef,
}: {
  setting: TaskFormSetting;
  allDay: boolean;
  notificationTiming: TaskNotificationTiming;
  recurrence: RecurrenceFormValues;
  onBack: () => void;
  onNotificationChange: (value: TaskNotificationTiming) => void;
  onRecurrenceChange: (value: RecurrenceFormValues) => void;
  onDraftChange: (dirty: boolean) => void;
  closeRef: { current: (() => void) | null };
}) {
  const theme = useAppTheme();
  const [page, setPage] = useState<TaskFormSetting | 'custom' | 'frequency'>(setting);
  const [frequency, setFrequency] = useState(recurrence.customFrequency);
  const [interval, setInterval] = useState(recurrence.customInterval);
  const [error, setError] = useState(false);
  const backRef = useRef<ComponentRef<typeof Pressable>>(null);
  const intervalRef = useRef<ComponentRef<typeof TextField>>(null);
  const unitRef = useRef<ComponentRef<typeof Pressable>>(null);
  const returningToCustom = useRef(false);
  const customDirty =
    (page === 'custom' || page === 'frequency') &&
    (recurrence.mode !== 'CUSTOM' ||
      frequency !== recurrence.customFrequency ||
      interval !== recurrence.customInterval);
  useTaskDraftChange(customDirty, onDraftChange);

  const back = () => {
    if (page === 'frequency') {
      returningToCustom.current = true;
      setPage('custom');
    } else if (page === 'custom') {
      setFrequency(recurrence.customFrequency);
      setInterval(recurrence.customInterval);
      setError(false);
      setPage('recurrence');
    } else onBack();
  };
  useLayoutEffect(() => {
    closeRef.current = back;
    return () => {
      closeRef.current = null;
    };
  });
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      focusControl(returningToCustom.current ? unitRef.current : backRef.current);
      returningToCustom.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [page]);
  const title =
    page === 'notification'
      ? '알림'
      : page === 'custom'
        ? '직접 반복 설정'
        : page === 'frequency'
          ? '반복 단위'
          : '반복';
  const frequencyLabel = recurrenceFrequencyOptions.find(
    (option) => option.value === frequency,
  )!.label;

  return (
    <View style={styles.container}>
      <Button
        ref={backRef}
        variant="ghost"
        focusAppearance="ring"
        contentAlignment="start"
        leading={<AppIcon name="arrow-left" size="menu" color={theme.colors.textSecondary} />}
        onPress={back}
      >
        {page === 'custom'
          ? '반복으로 돌아가기'
          : page === 'frequency'
            ? '직접 설정으로 돌아가기'
            : '작성 화면으로 돌아가기'}
      </Button>
      <AppText accessibilityRole="header" variant="title" weight="semibold">
        {title}
      </AppText>
      {page === 'notification' ? (
        <>
          <AppText tone="secondary" variant="label">
            {allDay
              ? '종일 일정은 당일 오전 9시에 알려드려요.'
              : '이 일정의 시작 시각을 기준으로 알려드려요.'}
          </AppText>
          <SettingChoices
            label="알림 선택"
            options={taskNotificationTimingOptions
              .filter((option) => !allDay || ['OFF', 'AT_START'].includes(option.value))
              .map((option) => ({
                ...option,
                label: allDay && option.value === 'AT_START' ? '당일 오전 9시' : option.label,
              }))}
            value={notificationTiming}
            onChange={onNotificationChange}
            optionLabel={(label) => `${label} 알림 선택`}
          />
        </>
      ) : page === 'recurrence' ? (
        <SettingChoices
          label="반복 선택"
          options={recurrenceModeOptions}
          value={recurrence.mode}
          onChange={(mode) => {
            if (mode === 'CUSTOM') setPage('custom');
            else onRecurrenceChange({ ...recurrence, mode });
          }}
          optionLabel={(label) => `${label} 선택`}
        />
      ) : page === 'frequency' ? (
        <SettingChoices
          label="반복 단위 선택"
          options={recurrenceFrequencyOptions}
          value={frequency}
          onChange={(value) => {
            setFrequency(value);
            returningToCustom.current = true;
            setPage('custom');
          }}
          optionLabel={(label) => `${label} 단위 반복 선택`}
        />
      ) : (
        <>
          <View style={styles.field}>
            <AppText variant="label" weight="semibold">
              반복 간격
            </AppText>
            <View style={styles.interval}>
              <TextField
                ref={intervalRef}
                accessibilityLabel="반복 간격"
                accessibilityHint="1부터 99 사이의 숫자로 입력해 주세요."
                keyboardType="number-pad"
                maxLength={2}
                value={interval}
                invalid={error}
                style={styles.input}
                onChangeText={(value) => {
                  setInterval(value);
                  setError(false);
                }}
              />
              <AppText tone="secondary">{frequencyLabel}마다</AppText>
            </View>
            {error ? (
              <AppText accessibilityLiveRegion="polite" tone="danger" variant="caption">
                반복 간격은 1부터 99 사이의 숫자로 입력해 주세요.
              </AppText>
            ) : null}
          </View>
          <TaskFormPropertyRow
            ref={unitRef}
            icon="repeat"
            label="단위"
            value={frequencyLabel}
            onPress={() => setPage('frequency')}
          />
          {isValidRecurrenceInterval(interval) ? (
            <AppText tone="secondary" variant="label">
              {Number(interval)}
              {frequencyLabel}마다 반복해요.
            </AppText>
          ) : null}
          <Button
            fullWidth
            focusAppearance="ring"
            onPress={() => {
              if (!isValidRecurrenceInterval(interval)) {
                setError(true);
                intervalRef.current?.focus();
                return;
              }
              onRecurrenceChange({
                mode: 'CUSTOM',
                customFrequency: frequency,
                customInterval: String(Number(interval)),
              });
            }}
          >
            적용
          </Button>
        </>
      )}
    </View>
  );
}

function SettingChoices<Value extends string>({
  label,
  options,
  value,
  onChange,
  optionLabel,
}: {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  optionLabel: (label: string) => string;
}) {
  return (
    <View accessibilityLabel={label} style={styles.choices}>
      {options.map((option) => (
        <SettingChoice
          key={option.value}
          label={option.label}
          accessibilityLabel={optionLabel(option.label)}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

function SettingChoice({
  label,
  accessibilityLabel,
  selected,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...uiAuditProps({
        ...(selected ? { uiRow: 'task-setting-choice', uiAlign: 'text-block' } : {}),
        uiTouch: '44',
      })}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={selected ? '현재 선택된 값이에요.' : undefined}
      onPress={onPress}
      onFocus={(event) => {
        const target = event.currentTarget as unknown as { matches?: (value: string) => boolean };
        setFocused(Platform.OS !== 'web' || Boolean(target.matches?.(':focus-visible')));
      }}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
        focused && { outlineStyle: 'solid', outlineWidth: 2, outlineColor: theme.colors.primary },
      ]}
    >
      <AppText
        {...uiAuditProps({ uiText: 'block' })}
        tone={selected ? 'primary' : 'default'}
        weight={selected ? 'semibold' : 'regular'}
        style={styles.choiceText}
      >
        {label}
      </AppText>
      {selected ? <AppIcon name="check" size="menu" color={theme.colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[4], paddingHorizontal: spacing[1], paddingBottom: spacing[4] },
  choices: { gap: spacing[1] },
  choice: {
    minHeight: 48,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  choiceText: { flexShrink: 1 },
  field: { gap: spacing[2] },
  interval: { flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
  input: { width: 88, textAlign: 'center' },
});
