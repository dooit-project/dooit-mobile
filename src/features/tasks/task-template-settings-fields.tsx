import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radii, spacing, useAppTheme } from '@/theme';

import type {
  TaskTemplateRecurrenceMode,
  TaskTemplateSettingsValues,
} from './task-template-settings';
import { templateWeekdays } from './task-template-settings';

type Props = {
  disabled: boolean;
  onChange: (values: TaskTemplateSettingsValues) => void;
  values: TaskTemplateSettingsValues;
};

const recurrenceOptions: { label: string; value: TaskTemplateRecurrenceMode }[] = [
  { label: '반복 없음', value: 'NONE' },
  { label: '매일', value: 'DAILY' },
  { label: '매주', value: 'WEEKLY' },
  { label: '매월', value: 'MONTHLY' },
  { label: '매년', value: 'YEARLY' },
];

export function TaskTemplateSettingsFields({ disabled, onChange, values }: Props) {
  const theme = useAppTheme();
  const update = <Key extends keyof TaskTemplateSettingsValues>(
    key: Key,
    value: TaskTemplateSettingsValues[Key],
  ) => onChange({ ...values, [key]: value });

  return (
    <View style={[styles.section, { borderColor: theme.colors.border }]}>
      <View style={styles.heading}>
        <AppText weight="bold">일정과 반복</AppText>
        <AppText tone="secondary" variant="caption">
          템플릿을 적용할 날짜와 결합할 기본 설정이에요.
        </AppText>
      </View>

      <View accessibilityRole="radiogroup" style={styles.optionRow}>
        {(
          [
            { label: '할 일', value: 'TODO' },
            { label: '일정', value: 'SCHEDULE' },
          ] as const
        ).map((option) => (
          <Option
            disabled={disabled}
            key={option.value}
            label={option.label}
            onPress={() => update('type', option.value)}
            selected={values.type === option.value}
          />
        ))}
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <AppText variant="label" weight="bold">
            종일
          </AppText>
          <AppText tone="secondary" variant="caption">
            선택한 날짜 전체를 사용하는 일정으로 만들어요.
          </AppText>
        </View>
        <Switch
          accessibilityLabel="템플릿 종일 설정"
          disabled={disabled}
          onValueChange={(value) =>
            onChange({
              ...values,
              allDay: value,
              defaultStartTime: value ? '' : values.defaultStartTime,
            })
          }
          thumbColor={values.allDay ? theme.colors.primary : theme.colors.surface}
          trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primarySoft }}
          value={values.allDay}
        />
      </View>

      {!values.allDay ? (
        <View style={styles.timeRow}>
          <InputField
            accessibilityLabel="템플릿 기본 시작 시간"
            disabled={disabled}
            label="시작 시간"
            maxLength={5}
            onChange={(value) => update('defaultStartTime', value)}
            placeholder="09:00"
            value={values.defaultStartTime}
          />
          <InputField
            accessibilityLabel="템플릿 기본 소요 시간"
            disabled={disabled}
            keyboardType="number-pad"
            label="소요 시간(분)"
            maxLength={4}
            onChange={(value) => update('defaultDurationMinutes', value)}
            placeholder="60"
            value={values.defaultDurationMinutes}
          />
        </View>
      ) : null}

      <View style={styles.field}>
        <AppText variant="label" weight="bold">
          반복
        </AppText>
        <View accessibilityRole="radiogroup" style={styles.optionRow}>
          {recurrenceOptions.map((option) => (
            <Option
              disabled={disabled}
              key={option.value}
              label={option.label}
              onPress={() => update('recurrenceFrequency', option.value)}
              selected={values.recurrenceFrequency === option.value}
            />
          ))}
        </View>
      </View>

      {values.recurrenceFrequency !== 'NONE' ? (
        <InputField
          accessibilityLabel="템플릿 반복 간격"
          disabled={disabled}
          keyboardType="number-pad"
          label="반복 간격"
          maxLength={2}
          onChange={(value) => update('recurrenceInterval', value)}
          placeholder="1"
          value={values.recurrenceInterval}
        />
      ) : null}

      {values.recurrenceFrequency === 'WEEKLY' ? (
        <View style={styles.field}>
          <AppText variant="label" weight="bold">
            반복 요일
          </AppText>
          <View style={styles.weekdayRow}>
            {templateWeekdays.map((weekday) => {
              const selected = values.recurrenceByDays.includes(weekday.code);
              return (
                <Option
                  disabled={disabled}
                  key={weekday.code}
                  label={weekday.label}
                  onPress={() =>
                    update(
                      'recurrenceByDays',
                      selected
                        ? values.recurrenceByDays.filter((code) => code !== weekday.code)
                        : [...values.recurrenceByDays, weekday.code],
                    )
                  }
                  role="checkbox"
                  selected={selected}
                />
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Option({
  disabled,
  label,
  onPress,
  role = 'radio',
  selected,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  role?: 'checkbox' | 'radio';
  selected: boolean;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={`${label} 선택`}
      accessibilityRole={role}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected
            ? theme.colors.highlightBlue
            : pressed
              ? theme.colors.surfaceMuted
              : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <AppText tone={selected ? 'primary' : 'secondary'} variant="caption" weight="bold">
        {label}
      </AppText>
    </Pressable>
  );
}

function InputField({
  accessibilityLabel,
  disabled,
  keyboardType = 'numbers-and-punctuation',
  label,
  maxLength,
  onChange,
  placeholder,
  value,
}: {
  accessibilityLabel: string;
  disabled: boolean;
  keyboardType?: 'number-pad' | 'numbers-and-punctuation';
  label: string;
  maxLength: number;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.field, styles.inputField]}>
      <AppText variant="label" weight="bold">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
    paddingTop: spacing[4],
  },
  heading: {
    gap: spacing[1],
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  option: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    minHeight: 40,
    minWidth: 52,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  switchCopy: {
    flex: 1,
    gap: spacing[1],
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  field: {
    gap: spacing[2],
  },
  inputField: {
    flexGrow: 1,
    minWidth: 136,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
});
