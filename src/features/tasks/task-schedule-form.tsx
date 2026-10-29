import { useId, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AppText, Button, InlineNotice } from '@/components/ui';
import { spacing, useAppTheme } from '@/theme';
import type { RecurrenceEditScope, TaskResponse, TaskUpsertRequest } from '@/types';
import { shiftLocalDate } from '@/utils';

import {
  TaskScheduleFields,
  type TaskScheduleField,
  type TaskScheduleValues,
} from './task-schedule-fields';
import { buildTaskScheduleUpdate, getScheduleEndDayOffset } from './task-schedule-update';
import { useTaskDraftChange } from './use-task-draft-change';

export function TaskScheduleForm({
  task,
  scope = 'THIS',
  isSubmitting = false,
  errorMessage,
  onCancel,
  onSubmit,
  onDraftChange,
}: {
  task: TaskResponse;
  scope?: RecurrenceEditScope;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onSubmit: (request: TaskUpsertRequest) => void;
  onDraftChange: (dirty: boolean) => void;
}) {
  const theme = useAppTheme();
  const [baseline] = useState(() => ({
    task,
    values: {
      scheduleDate: task.startAt?.slice(0, 10) ?? task.plannedDate ?? '',
      allDay: task.allDay,
      startTime: task.startAt?.slice(11, 16) ?? '09:00',
      endTime: task.endAt?.slice(11, 16) ?? '',
    },
    endDayOffset: getScheduleEndDayOffset(task),
  }));
  const [values, setValues] = useState<TaskScheduleValues>(baseline.values);
  const [validationError, setError] = useState<{
    field: TaskScheduleField;
    message: string;
  } | null>(null);
  const dateRef = useRef<TextInput>(null);
  const startRef = useRef<TextInput>(null);
  const endRef = useRef<TextInput>(null);
  const errorId = useId();
  const dateReadOnly = scope !== 'THIS';
  const error = dateReadOnly && validationError?.field === 'scheduleDate' ? null : validationError;
  const effectiveValues = dateReadOnly
    ? { ...values, scheduleDate: baseline.values.scheduleDate }
    : values;
  const dirty =
    effectiveValues.scheduleDate !== baseline.values.scheduleDate ||
    values.allDay !== baseline.values.allDay ||
    (!values.allDay &&
      (values.startTime !== baseline.values.startTime ||
        values.endTime !== baseline.values.endTime));
  useTaskDraftChange(dirty, onDraftChange);
  useLayoutEffect(() => {
    if (!error) return;
    const frame = requestAnimationFrame(() => {
      ({ scheduleDate: dateRef, startTime: startRef, endTime: endRef })[
        error.field
      ].current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [error]);
  const updateField = (key: keyof TaskScheduleValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }));
    setError((current) =>
      current &&
      (current.field === key ||
        key === 'allDay' ||
        (key === 'startTime' && current.field === 'endTime'))
        ? null
        : current,
    );
  };
  const submit = () => {
    if (isSubmitting) return;
    if (!dirty) {
      onCancel();
      return;
    }
    const result = buildTaskScheduleUpdate(baseline.task, {
      date: effectiveValues.scheduleDate,
      startTime: values.startTime,
      endTime: values.endTime,
      allDay: values.allDay,
      endDayOffset: baseline.endDayOffset,
    });
    if (!result.ok) {
      setError({
        field: result.field === 'date' ? 'scheduleDate' : result.field,
        message: result.message,
      });
      return;
    }
    onSubmit(result.request);
  };
  const endDate =
    baseline.endDayOffset > 0
      ? shiftLocalDate(effectiveValues.scheduleDate, baseline.endDayOffset)
      : null;
  return (
    <View style={styles.form}>
      <TaskScheduleFields
        values={effectiveValues}
        updateField={updateField}
        isSubmitting={isSubmitting}
        dateRef={dateRef}
        startRef={startRef}
        endRef={endRef}
        dateReadOnly={dateReadOnly}
        dateNote={dateReadOnly ? '각 반복 날짜는 유지하고 시간을 변경해요.' : undefined}
        endDateNote={endDate && !values.allDay ? `종료 날짜 ${endDate}` : undefined}
        validationProps={(field) => ({
          invalid: error?.field === field,
          errorMessage: error?.field === field ? error.message : undefined,
          errorMessageId: error?.field === field ? `${errorId}-${field}` : undefined,
        })}
        fieldError={(field) =>
          error?.field === field ? (
            <AppText
              nativeID={`${errorId}-${field}`}
              variant="caption"
              style={{ color: theme.colors.danger }}
            >
              {error.message}
            </AppText>
          ) : null
        }
      />
      {values.allDay && baseline.endDayOffset > 1 && endDate ? (
        <AppText variant="caption" tone="secondary">
          종료 날짜 {endDate} · 이 날짜 전까지
        </AppText>
      ) : null}
      {errorMessage ? <InlineNotice tone="danger" message={errorMessage} /> : null}
      <View style={styles.actions}>
        <Button
          fullWidth
          size="large"
          variant="outline"
          focusAppearance="ring"
          disabled={isSubmitting}
          onPress={onCancel}
        >
          취소
        </Button>
        <Button
          fullWidth
          size="large"
          focusAppearance="ring"
          loading={isSubmitting}
          onPress={submit}
        >
          변경 완료
        </Button>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  form: { flexGrow: 1, gap: spacing[4] },
  actions: { marginTop: 'auto', paddingTop: spacing[6], gap: spacing[2] },
});
