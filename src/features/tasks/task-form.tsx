import { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AppText, Button, Card, InlineNotice } from '@/components/ui';
import { radii, spacing, useAppTheme } from '@/theme';
import type {
  LocalDateString,
  RecurrenceFrequency,
  TaskResponse,
  TaskType,
  TaskUpsertRequest,
} from '@/types';
import { taskLimits } from '@/types';
import { isLocalDateString, toApiLocalDate } from '@/utils';

import {
  buildTaskRecurrenceRequest,
  getInitialRecurrenceValues,
  isValidRecurrenceInterval,
  recurrenceFrequencyOptions,
  recurrenceModeOptions,
  type RecurrenceMode,
} from './task-form-recurrence';
import { normalizeScheduleFormInput } from './task-form-schedule';
import {
  buildTaskNotificationFields,
  getInitialTaskNotificationTiming,
  taskNotificationTimingOptions,
  type TaskNotificationTiming,
} from './task-notification-timing';
import { parseEstimatedDurationMinutes } from './task-duration';

type TaskFormValues = {
  title: string;
  description: string;
  category: string;
  estimatedDurationMinutes: string;
  type: TaskType;
  allDay: boolean;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  recurrenceMode: RecurrenceMode;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceInterval: string;
  notificationTiming: TaskNotificationTiming;
};

type TaskFormField =
  | 'title'
  | 'description'
  | 'category'
  | 'estimatedDurationMinutes'
  | 'scheduleDate'
  | 'startTime'
  | 'endTime'
  | 'recurrenceInterval';

type TaskFormProps = {
  autoFocusTitle?: boolean;
  initialTask?: TaskResponse;
  initialDate?: LocalDateString;
  initialType?: TaskType;
  submitLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onCancel?: () => void;
  onSubmit: (request: TaskUpsertRequest) => void;
};

const taskTypes: { value: TaskType; label: string }[] = [
  { value: 'TODO', label: '할 일' },
  { value: 'SCHEDULE', label: '일정' },
  { value: 'IDEA', label: '아이디어' },
];

export function TaskForm({
  autoFocusTitle = false,
  initialTask,
  initialDate,
  initialType,
  submitLabel,
  isSubmitting = false,
  errorMessage,
  onCancel,
  onSubmit,
}: TaskFormProps) {
  const theme = useAppTheme();
  const [values, setValues] = useState<TaskFormValues>(() => {
    const recurrence = getInitialRecurrenceValues(initialTask);

    return {
      title: initialTask?.title ?? '',
      description: initialTask?.description ?? '',
      category: initialTask?.category ?? '',
      estimatedDurationMinutes: initialTask?.estimatedDurationMinutes
        ? String(initialTask.estimatedDurationMinutes)
        : '',
      type: initialTask?.type ?? initialType ?? 'TODO',
      allDay: initialTask?.allDay ?? false,
      scheduleDate:
        initialTask?.startAt?.slice(0, 10) ??
        initialTask?.targetDate ??
        initialTask?.plannedDate ??
        initialDate ??
        toApiLocalDate(),
      startTime: initialTask?.startAt?.slice(11, 16) ?? '09:00',
      endTime: initialTask?.endAt?.slice(11, 16) ?? '',
      recurrenceMode: recurrence.mode,
      recurrenceFrequency: recurrence.customFrequency,
      recurrenceInterval: recurrence.customInterval,
      notificationTiming: getInitialTaskNotificationTiming(initialTask),
    };
  });
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<TaskFormField | null>(null);
  const [focusedType, setFocusedType] = useState<TaskType | null>(null);
  const [focusedRecurrenceMode, setFocusedRecurrenceMode] = useState<string | null>(null);
  const [focusedRecurrenceFrequency, setFocusedRecurrenceFrequency] = useState<string | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(
    initialTask
      ? Boolean(
          initialTask.description ||
          initialTask.category ||
          initialTask.estimatedDurationMinutes ||
          initialTask.type !== 'TODO' ||
          initialTask.allDay,
        )
      : initialType !== undefined && initialType !== 'TODO',
  );
  const titleLength = values.title.trim().length;
  const hasTitleValidationError = validationMessage === '제목을 입력해 주세요.';
  const hasEstimatedDurationValidationError = validationMessage?.startsWith('예상 시간은');
  const canSubmit = titleLength > 0 && !isSubmitting;
  const isSchedule = values.type === 'SCHEDULE';

  const updateField = <Key extends keyof TaskFormValues>(key: Key, value: TaskFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setValidationMessage(null);
  };

  const handleSubmit = () => {
    const title = values.title.trim();
    const description = values.description.trim();
    const category = values.category.trim();

    if (!title) {
      setValidationMessage('제목을 입력해 주세요.');
      return;
    }

    const estimatedDuration = parseEstimatedDurationMinutes(values.estimatedDurationMinutes);
    if (!estimatedDuration.ok) {
      setValidationMessage('예상 시간은 5분 이상 1440분 이하로 입력해 주세요.');
      return;
    }

    const schedule = isSchedule
      ? normalizeScheduleFormInput({
          allDay: values.allDay,
          date: values.scheduleDate,
          startTime: values.startTime,
          endTime: values.endTime,
        })
      : null;

    if (schedule && !schedule.ok) {
      setValidationMessage(schedule.message);
      return;
    }

    if (isSchedule && values.recurrenceMode !== 'NONE') {
      if (!isLocalDateString(values.scheduleDate)) {
        setValidationMessage('반복 기준 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.');
        return;
      }

      if (
        values.recurrenceMode === 'CUSTOM' &&
        !isValidRecurrenceInterval(values.recurrenceInterval)
      ) {
        setValidationMessage('반복 간격은 1부터 99 사이의 숫자로 입력해 주세요.');
        return;
      }
    }

    const recurrence =
      isSchedule && isLocalDateString(values.scheduleDate)
        ? buildTaskRecurrenceRequest(
            {
              mode: values.recurrenceMode,
              customFrequency: values.recurrenceFrequency,
              customInterval: values.recurrenceInterval,
            },
            values.scheduleDate,
          )
        : null;
    const notification = schedule
      ? buildTaskNotificationFields(values.notificationTiming, schedule.startAt, schedule.allDay)
      : { notificationEnabled: false, notifyAt: null };

    onSubmit({
      title,
      description: description || null,
      category: category || null,
      estimatedDurationMinutes: estimatedDuration.value,
      type: values.type,
      allDay: schedule?.allDay ?? false,
      startAt: schedule?.startAt ?? null,
      endAt: schedule?.endAt ?? null,
      recurrence,
      ...notification,
    });
  };

  return (
    <View style={styles.container}>
      <Card variant="sheet" style={styles.formCard}>
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <AppText variant="label" weight="bold">
              제목
            </AppText>
            <AppText
              tone={titleLength > taskLimits.title - 5 ? 'danger' : 'muted'}
              variant="caption"
            >
              {values.title.length}/{taskLimits.title}
            </AppText>
          </View>
          <TextInput
            accessibilityLabel="Task 제목"
            autoFocus={autoFocusTitle}
            editable={!isSubmitting}
            maxLength={taskLimits.title}
            onBlur={() => setFocusedField(null)}
            onChangeText={(value) => updateField('title', value)}
            onFocus={() => setFocusedField('title')}
            placeholder="예: 은행 앱 이체 확인"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="next"
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: hasTitleValidationError
                  ? theme.colors.danger
                  : focusedField === 'title'
                    ? theme.colors.primary
                    : theme.colors.border,
                borderWidth: focusedField === 'title' ? 2 : 1,
                color: theme.colors.text,
              },
            ]}
            value={values.title}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label" weight="bold">
            유형
          </AppText>
          <View style={styles.typeGrid}>
            {taskTypes.map((type) => {
              const selected = type.value === values.type;

              return (
                <Pressable
                  accessibilityLabel={`${type.label} 유형 선택`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: isSubmitting }}
                  disabled={isSubmitting}
                  key={type.value}
                  onBlur={() => setFocusedType(null)}
                  onFocus={() => setFocusedType(type.value)}
                  onPress={() => updateField('type', type.value)}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: selected ? theme.colors.highlightBlue : 'transparent',
                      borderColor:
                        focusedType === type.value || selected
                          ? theme.colors.primary
                          : theme.colors.border,
                      borderWidth: focusedType === type.value ? 2 : 1,
                    },
                  ]}
                >
                  <AppText tone={selected ? 'primary' : 'default'} variant="label" weight="bold">
                    {type.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isSchedule ? (
          <View style={styles.scheduleFields}>
            <View style={styles.field}>
              <AppText variant="label" weight="bold">
                일정 날짜
              </AppText>
              <TextInput
                accessibilityHint="YYYY-MM-DD 형식으로 입력해 주세요."
                accessibilityLabel="일정 날짜"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => updateField('scheduleDate', value)}
                onFocus={() => setFocusedField('scheduleDate')}
                placeholder="2026-07-27"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="next"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor:
                      focusedField === 'scheduleDate' ? theme.colors.primary : theme.colors.border,
                    borderWidth: focusedField === 'scheduleDate' ? 2 : 1,
                    color: theme.colors.text,
                  },
                ]}
                value={values.scheduleDate}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <AppText variant="label" weight="bold">
                  종일 일정
                </AppText>
                <AppText tone="secondary" variant="caption">
                  하루 전체를 차지하는 일정으로 저장해요.
                </AppText>
              </View>
              <Switch
                accessibilityLabel="종일 일정 여부"
                disabled={isSubmitting}
                onValueChange={(value) => {
                  updateField('allDay', value);
                  if (value && !['OFF', 'AT_START'].includes(values.notificationTiming)) {
                    updateField('notificationTiming', 'AT_START');
                  }
                }}
                thumbColor={values.allDay ? theme.colors.primary : theme.colors.surface}
                trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primarySoft }}
                value={values.allDay}
              />
            </View>

            {!values.allDay ? (
              <View style={styles.timeRow}>
                <View style={[styles.field, styles.timeField]}>
                  <AppText variant="label" weight="bold">
                    시작
                  </AppText>
                  <TextInput
                    accessibilityHint="HH:mm 형식으로 입력해 주세요."
                    accessibilityLabel="일정 시작 시간"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('startTime', value)}
                    onFocus={() => setFocusedField('startTime')}
                    placeholder="09:00"
                    placeholderTextColor={theme.colors.textMuted}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor:
                          focusedField === 'startTime' ? theme.colors.primary : theme.colors.border,
                        borderWidth: focusedField === 'startTime' ? 2 : 1,
                        color: theme.colors.text,
                      },
                    ]}
                    value={values.startTime}
                  />
                </View>

                <View style={[styles.field, styles.timeField]}>
                  <View style={styles.labelRow}>
                    <AppText variant="label" weight="bold">
                      종료
                    </AppText>
                    <AppText tone="muted" variant="caption">
                      선택
                    </AppText>
                  </View>
                  <TextInput
                    accessibilityHint="비워두면 시작 시간만 있는 일정으로 저장됩니다."
                    accessibilityLabel="일정 종료 시간"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(value) => updateField('endTime', value)}
                    onFocus={() => setFocusedField('endTime')}
                    placeholder="10:00"
                    placeholderTextColor={theme.colors.textMuted}
                    returnKeyType="done"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor:
                          focusedField === 'endTime' ? theme.colors.primary : theme.colors.border,
                        borderWidth: focusedField === 'endTime' ? 2 : 1,
                        color: theme.colors.text,
                      },
                    ]}
                    value={values.endTime}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.field}>
              <AppText variant="label" weight="bold">
                알림
              </AppText>
              <AppText tone="secondary" variant="caption">
                {values.allDay
                  ? '종일 일정은 당일 오전 9시에 알려드려요.'
                  : '이 일정의 시작 시각을 기준으로 알려드려요.'}
              </AppText>
              <View style={styles.notificationGrid}>
                {taskNotificationTimingOptions
                  .filter(
                    (option) =>
                      !values.allDay || option.value === 'OFF' || option.value === 'AT_START',
                  )
                  .map((option) => {
                    const selected = values.notificationTiming === option.value;
                    const label =
                      values.allDay && option.value === 'AT_START' ? '당일 오전 9시' : option.label;

                    return (
                      <Pressable
                        accessibilityLabel={`${label} 알림 선택`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected, disabled: isSubmitting }}
                        disabled={isSubmitting}
                        key={option.value}
                        onPress={() => updateField('notificationTiming', option.value)}
                        style={[
                          styles.notificationOption,
                          {
                            backgroundColor: selected ? theme.colors.highlightBlue : 'transparent',
                            borderColor: selected ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                      >
                        <AppText
                          align="center"
                          tone={selected ? 'primary' : 'default'}
                          variant="caption"
                          weight="bold"
                        >
                          {label}
                        </AppText>
                      </Pressable>
                    );
                  })}
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <AppText variant="label" weight="bold">
                  반복
                </AppText>
                <AppText tone="muted" variant="caption">
                  선택
                </AppText>
              </View>
              <View style={styles.recurrenceGrid}>
                {recurrenceModeOptions.map((option) => {
                  const selected = values.recurrenceMode === option.value;

                  return (
                    <Pressable
                      accessibilityLabel={`${option.label} 선택`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected, disabled: isSubmitting }}
                      disabled={isSubmitting}
                      key={option.value}
                      onBlur={() => setFocusedRecurrenceMode(null)}
                      onFocus={() => setFocusedRecurrenceMode(option.value)}
                      onPress={() => updateField('recurrenceMode', option.value)}
                      style={[
                        styles.recurrenceOption,
                        {
                          backgroundColor: selected ? theme.colors.highlightSage : 'transparent',
                          borderColor:
                            focusedRecurrenceMode === option.value || selected
                              ? theme.colors.primary
                              : theme.colors.border,
                          borderWidth: focusedRecurrenceMode === option.value ? 2 : 1,
                        },
                      ]}
                    >
                      <AppText
                        align="center"
                        tone={selected ? 'primary' : 'default'}
                        variant="caption"
                        weight="bold"
                      >
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {values.recurrenceMode === 'CUSTOM' ? (
                <View style={styles.customRecurrence}>
                  <View style={styles.recurrenceFrequencyGrid}>
                    {recurrenceFrequencyOptions.map((option) => {
                      const selected = values.recurrenceFrequency === option.value;

                      return (
                        <Pressable
                          accessibilityLabel={`${option.label} 단위 반복 선택`}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected, disabled: isSubmitting }}
                          disabled={isSubmitting}
                          key={option.value}
                          onBlur={() => setFocusedRecurrenceFrequency(null)}
                          onFocus={() => setFocusedRecurrenceFrequency(option.value)}
                          onPress={() => updateField('recurrenceFrequency', option.value)}
                          style={[
                            styles.frequencyOption,
                            {
                              backgroundColor: selected
                                ? theme.colors.highlightBlue
                                : 'transparent',
                              borderColor:
                                focusedRecurrenceFrequency === option.value || selected
                                  ? theme.colors.primary
                                  : theme.colors.border,
                              borderWidth: focusedRecurrenceFrequency === option.value ? 2 : 1,
                            },
                          ]}
                        >
                          <AppText
                            align="center"
                            tone={selected ? 'primary' : 'default'}
                            variant="caption"
                            weight="bold"
                          >
                            {option.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.intervalRow}>
                    <TextInput
                      accessibilityHint="1부터 99 사이의 숫자로 입력해 주세요."
                      accessibilityLabel="반복 간격"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                      keyboardType="number-pad"
                      maxLength={2}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(value) => updateField('recurrenceInterval', value)}
                      onFocus={() => setFocusedField('recurrenceInterval')}
                      placeholder="2"
                      placeholderTextColor={theme.colors.textMuted}
                      returnKeyType="done"
                      style={[
                        styles.input,
                        styles.intervalInput,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor:
                            focusedField === 'recurrenceInterval'
                              ? theme.colors.primary
                              : theme.colors.border,
                          borderWidth: focusedField === 'recurrenceInterval' ? 2 : 1,
                          color: theme.colors.text,
                        },
                      ]}
                      value={values.recurrenceInterval}
                    />
                    <AppText tone="secondary" variant="label">
                      {getCustomRecurrenceUnitLabel(values.recurrenceFrequency)}마다 반복
                    </AppText>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: isDetailsExpanded }}
          onPress={() => setIsDetailsExpanded((current) => !current)}
          style={({ pressed }) => [
            styles.detailsToggle,
            { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
          ]}
        >
          <AppText tone="secondary" variant="label" weight="semibold">
            {isDetailsExpanded ? '추가 정보 접기' : '설명·카테고리·예상 시간 추가'} ›
          </AppText>
        </Pressable>

        {isDetailsExpanded ? (
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label" weight="bold">
                설명
              </AppText>
              <AppText tone="muted" variant="caption">
                선택
              </AppText>
            </View>
            <TextInput
              accessibilityLabel="Task 설명"
              editable={!isSubmitting}
              maxLength={taskLimits.description}
              multiline
              onBlur={() => setFocusedField(null)}
              onChangeText={(value) => updateField('description', value)}
              onFocus={() => setFocusedField('description')}
              placeholder="필요한 맥락이나 다음 행동"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor:
                    focusedField === 'description' ? theme.colors.primary : theme.colors.border,
                  borderWidth: focusedField === 'description' ? 2 : 1,
                  color: theme.colors.text,
                },
              ]}
              textAlignVertical="top"
              value={values.description}
            />
          </View>
        ) : null}

        {isDetailsExpanded ? (
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label" weight="bold">
                예상 시간
              </AppText>
              <AppText tone="muted" variant="caption">
                선택
              </AppText>
            </View>
            <View style={styles.durationRow}>
              <TextInput
                accessibilityHint="5분부터 1440분 사이로 입력해 주세요."
                accessibilityLabel="예상 소요 시간(분)"
                editable={!isSubmitting}
                keyboardType="number-pad"
                maxLength={4}
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => updateField('estimatedDurationMinutes', value)}
                onFocus={() => setFocusedField('estimatedDurationMinutes')}
                placeholder="30"
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="done"
                style={[
                  styles.input,
                  styles.durationInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: hasEstimatedDurationValidationError
                      ? theme.colors.danger
                      : focusedField === 'estimatedDurationMinutes'
                        ? theme.colors.primary
                        : theme.colors.border,
                    borderWidth: focusedField === 'estimatedDurationMinutes' ? 2 : 1,
                    color: theme.colors.text,
                  },
                ]}
                value={values.estimatedDurationMinutes}
              />
              <AppText tone="secondary" variant="label">
                분
              </AppText>
            </View>
          </View>
        ) : null}

        {isDetailsExpanded ? (
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label" weight="bold">
                카테고리
              </AppText>
              <AppText tone="muted" variant="caption">
                선택
              </AppText>
            </View>
            <TextInput
              accessibilityLabel="Task 카테고리"
              editable={!isSubmitting}
              maxLength={taskLimits.category}
              onBlur={() => setFocusedField(null)}
              onChangeText={(value) => updateField('category', value)}
              onFocus={() => setFocusedField('category')}
              placeholder="예: 업무, 집, 건강"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor:
                    focusedField === 'category' ? theme.colors.primary : theme.colors.border,
                  borderWidth: focusedField === 'category' ? 2 : 1,
                  color: theme.colors.text,
                },
              ]}
              value={values.category}
            />
          </View>
        ) : null}

        {validationMessage ? (
          <AppText accessibilityLiveRegion="polite" tone="danger" variant="caption">
            {validationMessage}
          </AppText>
        ) : null}

        {errorMessage ? <InlineNotice message={errorMessage} tone="danger" /> : null}
      </Card>

      <View style={styles.actions}>
        {onCancel ? (
          <Button disabled={isSubmitting} fullWidth variant="ghost" onPress={onCancel}>
            취소
          </Button>
        ) : null}
        <Button
          disabled={!canSubmit}
          fullWidth
          loading={isSubmitting}
          size="large"
          onPress={handleSubmit}
        >
          {submitLabel}
        </Button>
      </View>
    </View>
  );
}

function getCustomRecurrenceUnitLabel(frequency: RecurrenceFrequency) {
  if (frequency === 'DAILY') return '일';
  if (frequency === 'MONTHLY') return '개월';

  return '주';
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  formCard: {
    gap: spacing[4],
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[2],
  },
  field: {
    gap: spacing[2],
  },
  scheduleFields: {
    gap: spacing[3],
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  timeField: {
    flex: 1,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'space-between',
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  textArea: {
    minHeight: 88,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  typeOption: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing[2],
  },
  recurrenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  recurrenceOption: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing[3],
  },
  notificationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  notificationOption: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing[3],
  },
  customRecurrence: {
    gap: spacing[2],
  },
  recurrenceFrequencyGrid: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  frequencyOption: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  intervalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  intervalInput: {
    minWidth: 72,
    textAlign: 'center',
  },
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  durationInput: {
    maxWidth: 120,
    minWidth: 88,
    textAlign: 'right',
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
  detailsToggle: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    minHeight: 32,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  actions: {
    gap: spacing[2],
  },
});
