import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
  type Ref,
} from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';

import {
  AppText,
  Button,
  Card,
  InlineNotice,
  SegmentedControl,
  TextField,
  focusControl,
} from '@/components/ui';
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
  type RecurrenceMode,
} from './task-form-recurrence';
import { TaskScheduleFields } from './task-schedule-fields';
import { normalizeScheduleFormInput } from './task-form-schedule';
import {
  buildTaskNotificationFields,
  getInitialTaskNotificationTiming,
  taskNotificationTimingOptions,
  type TaskNotificationTiming,
} from './task-notification-timing';
import { parseEstimatedDurationMinutes } from './task-duration';
import { useTaskDraftChange } from './use-task-draft-change';
import { TaskFormPropertyRow } from './task-form-property-row';
import {
  TaskFormSettings,
  getRecurrenceFormLabel,
  type TaskFormSetting,
} from './task-form-settings';

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

type ValidationField =
  | 'title'
  | 'scheduleDate'
  | 'startTime'
  | 'endTime'
  | 'estimatedDurationMinutes'
  | 'recurrenceMode';
type ValidationError = { field: ValidationField; message: string };

export type TaskFormHandle = { closeSettings: () => boolean };

type TaskFormProps = {
  ref?: Ref<TaskFormHandle>;
  onSettingsChange?: (open: boolean) => void;
  autoFocusTitle?: boolean;
  initialTask?: TaskResponse;
  initialDate?: LocalDateString;
  initialType?: TaskType;
  submitLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onDraftChange?: (dirty: boolean) => void;
  onCancel?: () => void;
  onSubmit: (request: TaskUpsertRequest) => void;
};

const taskTypes: { value: TaskType; label: string }[] = [
  { value: 'TODO', label: '할 일' },
  { value: 'SCHEDULE', label: '일정' },
  { value: 'IDEA', label: '아이디어' },
];

const titlePlaceholders: Record<TaskType, string> = {
  TODO: '예: 은행 앱 이체 확인',
  SCHEDULE: '예: 팀 주간 회의',
  IDEA: '예: 주말에 만들고 싶은 것',
};

export function TaskForm({
  ref,
  onSettingsChange,
  autoFocusTitle = false,
  initialTask,
  initialDate,
  initialType,
  submitLabel,
  isSubmitting = false,
  errorMessage,
  onDraftChange,
  onCancel,
  onSubmit,
}: TaskFormProps) {
  const theme = useAppTheme();
  // Freeze the baseline for this editing session, including across query refreshes.
  const [initialValues] = useState<TaskFormValues>(() => {
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
  const [values, setValues] = useState(initialValues);
  const dirty = (Object.keys(initialValues) as (keyof TaskFormValues)[]).some(
    (key) => values[key] !== initialValues[key],
  );
  const [setting, setSetting] = useState<TaskFormSetting | null>(null);
  const [hasSettingsDraft, setHasSettingsDraft] = useState(false);
  const settingsCloseRef = useRef<(() => void) | null>(null);
  const notificationRef = useRef<ComponentRef<typeof Pressable>>(null);
  const recurrenceRef = useRef<ComponentRef<typeof Pressable>>(null);
  const returnFocusRef = useRef<ComponentRef<typeof Pressable> | null>(null);
  useLayoutEffect(() => {
    if (setting || !returnFocusRef.current) return;
    const frame = requestAnimationFrame(() => {
      focusControl(returnFocusRef.current, { preventScroll: true });
      returnFocusRef.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [setting]);
  useTaskDraftChange(dirty || hasSettingsDraft, onDraftChange);
  useImperativeHandle(ref, () => ({
    closeSettings: () => {
      if (!setting) return false;
      settingsCloseRef.current?.();
      return true;
    },
  }));
  const openSetting = (value: TaskFormSetting) => {
    setSetting(value);
    onSettingsChange?.(true);
  };
  const closeSetting = () => {
    const control = setting === 'notification' ? notificationRef : recurrenceRef;
    returnFocusRef.current = control.current;
    setSetting(null);
    setHasSettingsDraft(false);
    onSettingsChange?.(false);
  };
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const validationId = useId();
  const titleRef = useRef<TextInput>(null);
  const dateRef = useRef<TextInput>(null);
  const startRef = useRef<TextInput>(null);
  const endRef = useRef<TextInput>(null);
  const durationRef = useRef<TextInput>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(
    initialTask
      ? Boolean(
          initialTask.description || initialTask.category || initialTask.estimatedDurationMinutes,
        )
      : false,
  );
  const titleLength = values.title.trim().length;
  const canSubmit = titleLength > 0 && !isSubmitting;
  const isSchedule = values.type === 'SCHEDULE';
  const detailsToggleLabel = isDetailsExpanded ? '추가 정보 접기' : '설명·추가 정보 보기';
  const notificationLabel =
    values.allDay && values.notificationTiming === 'AT_START'
      ? '당일 오전 9시'
      : taskNotificationTimingOptions.find((option) => option.value === values.notificationTiming)!
          .label;
  const recurrenceValues = {
    mode: values.recurrenceMode,
    customFrequency: values.recurrenceFrequency,
    customInterval: values.recurrenceInterval,
  };

  useLayoutEffect(() => {
    if (!validationError) return;
    const frame = requestAnimationFrame(() => {
      if (validationError.field === 'recurrenceMode') focusControl(recurrenceRef.current);
      else {
        const controls = {
          title: titleRef,
          scheduleDate: dateRef,
          startTime: startRef,
          endTime: endRef,
          estimatedDurationMinutes: durationRef,
        };
        controls[validationError.field].current?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [validationError]);
  const reportValidationError = (field: ValidationField, message: string) => {
    if (field === 'estimatedDurationMinutes') setIsDetailsExpanded(true);
    setValidationError({ field, message });
  };
  const validationProps = (field: ValidationField) => ({
    invalid: validationError?.field === field,
    errorMessage: validationError?.field === field ? validationError.message : undefined,
    errorMessageId: `${validationId}-${field}`,
  });
  const fieldError = (field: ValidationField) =>
    validationError?.field === field ? (
      <AppText
        nativeID={`${validationId}-${field}`}
        accessibilityLiveRegion="polite"
        tone="danger"
        variant="caption"
      >
        {validationError.message}
      </AppText>
    ) : null;

  const updateField = <Key extends keyof TaskFormValues>(key: Key, value: TaskFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setValidationError((current) =>
      current &&
      (current.field === key ||
        key === 'type' ||
        key === 'allDay' ||
        (current.field === 'endTime' && key === 'startTime'))
        ? null
        : current,
    );
  };

  const handleSubmit = () => {
    const title = values.title.trim();
    const description = values.description.trim();
    const category = values.category.trim();

    if (!title) {
      reportValidationError('title', '제목을 입력해 주세요.');
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
      reportValidationError(
        schedule.field === 'date' ? 'scheduleDate' : schedule.field,
        schedule.message,
      );
      return;
    }

    if (isSchedule && values.recurrenceMode !== 'NONE') {
      if (!isLocalDateString(values.scheduleDate)) {
        reportValidationError(
          'scheduleDate',
          '반복 기준 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.',
        );
        return;
      }

      if (
        values.recurrenceMode === 'CUSTOM' &&
        !isValidRecurrenceInterval(values.recurrenceInterval)
      ) {
        reportValidationError(
          'recurrenceMode',
          '반복 간격은 1부터 99 사이의 숫자로 입력해 주세요.',
        );
        return;
      }
    }

    const estimatedDuration = parseEstimatedDurationMinutes(values.estimatedDurationMinutes);
    if (!estimatedDuration.ok) {
      reportValidationError(
        'estimatedDurationMinutes',
        '예상 시간은 5분 이상 1440분 이하로 입력해 주세요.',
      );
      return;
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
      recurrence:
        initialTask &&
        values.recurrenceMode === initialValues.recurrenceMode &&
        values.recurrenceFrequency === initialValues.recurrenceFrequency &&
        values.recurrenceInterval === initialValues.recurrenceInterval
          ? undefined
          : recurrence,
      ...notification,
    });
  };

  return (
    <>
      {setting ? (
        <TaskFormSettings
          setting={setting}
          allDay={values.allDay}
          notificationTiming={values.notificationTiming}
          recurrence={recurrenceValues}
          closeRef={settingsCloseRef}
          onDraftChange={setHasSettingsDraft}
          onBack={closeSetting}
          onNotificationChange={(timing) => {
            updateField('notificationTiming', timing);
            closeSetting();
          }}
          onRecurrenceChange={(recurrence) => {
            setValues((current) => ({
              ...current,
              recurrenceMode: recurrence.mode,
              recurrenceFrequency: recurrence.customFrequency,
              recurrenceInterval: recurrence.customInterval,
            }));
            setValidationError((current) => (current?.field === 'recurrenceMode' ? null : current));
            closeSetting();
          }}
        />
      ) : null}
      <View
        style={[styles.container, setting ? styles.hidden : null]}
        aria-hidden={setting ? true : undefined}
        accessibilityElementsHidden={Boolean(setting)}
        importantForAccessibility={setting ? 'no-hide-descendants' : 'auto'}
      >
        <Card variant="sheet" style={styles.formCard}>
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AppText variant="label" weight="semibold">
                제목
              </AppText>
              <AppText
                tone={titleLength > taskLimits.title - 5 ? 'danger' : 'muted'}
                variant="caption"
              >
                {values.title.length}/{taskLimits.title}
              </AppText>
            </View>
            <TextField
              ref={titleRef}
              {...validationProps('title')}
              accessibilityLabel="Task 제목"
              autoFocus={autoFocusTitle}
              editable={!isSubmitting}
              maxLength={taskLimits.title}
              onChangeText={(value) => updateField('title', value)}
              placeholder={titlePlaceholders[values.type]}
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="next"
              value={values.title}
            />
            {fieldError('title')}
          </View>

          <View style={styles.field}>
            <AppText variant="label" weight="semibold">
              유형
            </AppText>
            <SegmentedControl
              accessibilityLabel="유형"
              options={taskTypes.map((type) => ({
                ...type,
                accessibilityLabel: `${type.label} 유형 선택`,
              }))}
              value={values.type}
              disabled={isSubmitting}
              onValueChange={(type) => updateField('type', type)}
            />
          </View>

          {isSchedule ? (
            <TaskScheduleFields
              values={values}
              updateField={(key, value) => {
                if (key === 'allDay') updateField('allDay', Boolean(value));
                else updateField(key, String(value));
                if (
                  key === 'allDay' &&
                  value &&
                  !['OFF', 'AT_START'].includes(values.notificationTiming)
                ) {
                  updateField('notificationTiming', 'AT_START');
                }
              }}
              isSubmitting={isSubmitting}
              dateRef={dateRef}
              startRef={startRef}
              endRef={endRef}
              validationProps={validationProps}
              fieldError={fieldError}
            />
          ) : null}

          {isSchedule ? (
            <View style={[styles.properties, { borderColor: theme.colors.border }]}>
              <TaskFormPropertyRow
                ref={notificationRef}
                icon="bell"
                label="알림"
                value={notificationLabel}
                disabled={isSubmitting}
                onPress={() => openSetting('notification')}
              />
              <View
                style={{
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border,
                }}
              />
              <TaskFormPropertyRow
                ref={recurrenceRef}
                icon="repeat"
                label="반복"
                value={getRecurrenceFormLabel(recurrenceValues)}
                disabled={isSubmitting}
                onPress={() => openSetting('recurrence')}
              />
              {fieldError('recurrenceMode')}
            </View>
          ) : null}

          <Pressable
            accessibilityLabel={detailsToggleLabel}
            accessibilityRole="button"
            accessibilityState={{ expanded: isDetailsExpanded }}
            onPress={() => setIsDetailsExpanded((current) => !current)}
            style={({ pressed }) => [
              styles.detailsToggle,
              { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
            ]}
          >
            <AppText tone="secondary" variant="label" weight="semibold">
              {detailsToggleLabel} ›
            </AppText>
          </Pressable>

          {isDetailsExpanded ? (
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <AppText variant="label" weight="semibold">
                  설명
                </AppText>
                <AppText tone="muted" variant="caption">
                  선택
                </AppText>
              </View>
              <TextField
                accessibilityLabel="Task 설명"
                editable={!isSubmitting}
                maxLength={taskLimits.description}
                multiline
                onChangeText={(value) => updateField('description', value)}
                placeholder="필요한 맥락이나 다음 행동"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.textArea}
                textAlignVertical="top"
                value={values.description}
              />
            </View>
          ) : null}

          {isDetailsExpanded ? (
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <AppText variant="label" weight="semibold">
                  예상 시간
                </AppText>
                <AppText tone="muted" variant="caption">
                  선택
                </AppText>
              </View>
              <View style={styles.durationRow}>
                <TextField
                  accessibilityHint="5분부터 1440분 사이로 입력해 주세요."
                  ref={durationRef}
                  {...validationProps('estimatedDurationMinutes')}
                  accessibilityLabel="예상 소요 시간(분)"
                  editable={!isSubmitting}
                  keyboardType="number-pad"
                  maxLength={4}
                  onChangeText={(value) => updateField('estimatedDurationMinutes', value)}
                  placeholder="30"
                  placeholderTextColor={theme.colors.textMuted}
                  returnKeyType="done"
                  style={styles.durationInput}
                  value={values.estimatedDurationMinutes}
                />
                <AppText tone="secondary" variant="label">
                  분
                </AppText>
              </View>
              {fieldError('estimatedDurationMinutes')}
            </View>
          ) : null}

          {isDetailsExpanded ? (
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <AppText variant="label" weight="semibold">
                  카테고리
                </AppText>
                <AppText tone="muted" variant="caption">
                  선택
                </AppText>
              </View>
              <TextField
                accessibilityLabel="Task 카테고리"
                editable={!isSubmitting}
                maxLength={taskLimits.category}
                onChangeText={(value) => updateField('category', value)}
                placeholder="예: 업무, 집, 건강"
                placeholderTextColor={theme.colors.textMuted}
                value={values.category}
              />
            </View>
          ) : null}

          {errorMessage ? <InlineNotice message={errorMessage} tone="danger" /> : null}
        </Card>

        <View style={styles.actions}>
          {onCancel ? (
            <Button
              disabled={isSubmitting}
              fullWidth
              variant="ghost"
              focusAppearance="ring"
              onPress={onCancel}
            >
              취소
            </Button>
          ) : null}
          <Button
            disabled={!canSubmit}
            focusAppearance="ring"
            fullWidth
            loading={isSubmitting}
            size="large"
            onPress={handleSubmit}
          >
            {submitLabel}
          </Button>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  formCard: {
    gap: spacing[3],
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[2],
  },
  field: {
    gap: spacing[2],
  },
  hidden: { display: 'none' },
  properties: { borderTopWidth: StyleSheet.hairlineWidth },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'space-between',
  },
  textArea: {
    minHeight: 88,
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
  detailsToggle: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  actions: {
    gap: spacing[1],
  },
});
