import { useState, type ReactNode, type Ref } from 'react';
import { Pressable, StyleSheet, Switch, View, type TextInput } from 'react-native';
import { AppText, TextField, uiAuditProps } from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';

export type TaskScheduleValues = {
  allDay: boolean;
  scheduleDate: string;
  startTime: string;
  endTime: string;
};
export type TaskScheduleField = 'scheduleDate' | 'startTime' | 'endTime';

/** Shared fields keep full TaskForm and focused schedule editing visually identical. */
export function TaskScheduleFields({
  values,
  updateField,
  isSubmitting = false,
  dateRef,
  startRef,
  endRef,
  validationProps,
  fieldError,
  dateReadOnly = false,
  dateNote,
  endDateNote,
}: {
  values: TaskScheduleValues;
  updateField: (key: keyof TaskScheduleValues, value: string | boolean) => void;
  isSubmitting?: boolean;
  dateRef?: Ref<TextInput>;
  startRef?: Ref<TextInput>;
  endRef?: Ref<TextInput>;
  validationProps: (field: TaskScheduleField) => {
    invalid: boolean;
    errorMessage?: string;
    errorMessageId?: string;
  };
  fieldError: (field: TaskScheduleField) => ReactNode;
  dateReadOnly?: boolean;
  dateNote?: string;
  endDateNote?: string;
}) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.scheduleFields}>
      <View style={styles.field}>
        <AppText variant="label" weight="semibold">
          일정 날짜
        </AppText>
        <TextField
          accessibilityHint="YYYY-MM-DD 형식으로 입력해 주세요."
          ref={dateRef}
          {...validationProps('scheduleDate')}
          accessibilityLabel="일정 날짜"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting && !dateReadOnly}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          onChangeText={(value) => updateField('scheduleDate', value)}
          placeholder="2026-07-27"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="next"
          value={values.scheduleDate}
        />
        {fieldError('scheduleDate')}
        {dateNote ? (
          <AppText variant="caption" tone="secondary">
            {dateNote}
          </AppText>
        ) : null}
      </View>

      <Pressable
        {...uiAuditProps({ uiRow: 'schedule-all-day', uiAlign: 'text-block', uiTouch: '44' })}
        accessibilityRole="switch"
        accessibilityLabel="종일 일정 여부"
        accessibilityHint="하루 전체를 차지하는 일정으로 저장해요."
        accessibilityState={{ checked: values.allDay, disabled: isSubmitting }}
        aria-checked={values.allDay}
        disabled={isSubmitting}
        onPress={() => updateField('allDay', !values.allDay)}
        onFocus={(event) => {
          const target = event.target as unknown as { matches?: (selector: string) => boolean };
          setFocused(target.matches?.(':focus-visible') ?? true);
        }}
        onBlur={() => setFocused(false)}
        style={[
          styles.switchRow,
          focused && {
            outlineColor: theme.colors.primary,
            outlineWidth: 2,
            outlineStyle: 'solid',
            outlineOffset: 2,
          },
        ]}
      >
        <View {...uiAuditProps({ uiText: 'block' })} style={styles.switchCopy}>
          <AppText variant="label" weight="semibold">
            종일 일정
          </AppText>
          <AppText tone="secondary" variant="caption">
            하루 전체를 차지하는 일정으로 저장해요.
          </AppText>
        </View>
        <View
          {...uiAuditProps({ uiIcon: 'control' })}
          style={styles.switchTarget}
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Switch
            accessible={false}
            aria-hidden
            disabled={isSubmitting}
            onValueChange={(value) => updateField('allDay', value)}
            thumbColor={values.allDay ? theme.colors.primary : theme.colors.surface}
            trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primarySoft }}
            value={values.allDay}
          />
        </View>
      </Pressable>

      {!values.allDay ? (
        <View style={styles.field}>
          <View style={styles.timeRow}>
            <View style={[styles.field, styles.timeField]}>
              <AppText variant="label" weight="semibold">
                시작
              </AppText>
              <TextField
                accessibilityHint="HH:mm 형식으로 입력해 주세요."
                ref={startRef}
                {...validationProps('startTime')}
                accessibilityLabel="일정 시작 시간"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                onChangeText={(value) => updateField('startTime', value)}
                placeholder="09:00"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="next"
                value={values.startTime}
              />
            </View>

            <View style={[styles.field, styles.timeField]}>
              <View style={styles.labelRow}>
                <AppText variant="label" weight="semibold">
                  종료
                </AppText>
                <AppText tone="muted" variant="caption">
                  선택
                </AppText>
              </View>
              <TextField
                accessibilityHint="비워두면 시작 시간만 있는 일정으로 저장됩니다."
                ref={endRef}
                {...validationProps('endTime')}
                accessibilityLabel="일정 종료 시간"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                onChangeText={(value) => updateField('endTime', value)}
                placeholder="10:00"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="done"
                value={values.endTime}
              />
            </View>
          </View>
          {fieldError('startTime')}
          {fieldError('endTime')}
          {endDateNote ? (
            <AppText variant="caption" tone="secondary">
              {endDateNote}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  scheduleFields: { gap: spacing[3] },
  field: { gap: spacing[2] },
  timeRow: { flexDirection: 'row', gap: spacing[2] },
  timeField: { flex: 1 },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'space-between',
  },
  switchTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  switchRow: {
    minHeight: 44,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  switchCopy: { flex: 1, gap: spacing[1] },
});
