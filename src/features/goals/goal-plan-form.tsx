import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, InlineNotice } from '@/components/ui';
import { formatDdayTargetDateInput } from '@/features/dday/dday-validation';
import { getUserFacingApiErrorMessage } from '@/services/api';
import { useAppToday } from '@/services/time/use-app-today';
import { radii, spacing, useAppTheme } from '@/theme';
import type { GoalPlanResponse, GoalPlanStatus } from '@/types';

import {
  buildGoalPlanRequest,
  goalPlanDays,
  initialGoalPlanValues,
  type GoalPlanValues,
} from './goal-plan-form-values';
import { useChangeGoalPlan } from './use-goal-plans';

type Props = { goalId: number; plan?: GoalPlanResponse; onDone: () => void; blocked?: boolean };
export function GoalPlanForm({ goalId, plan, onDone, blocked = false }: Props) {
  const today = useAppToday();
  const mutation = useChangeGoalPlan(goalId);
  const [values, setValues] = useState(() => initialGoalPlanValues(today, plan));
  const [advanced, setAdvanced] = useState(
    Boolean(
      plan?.nextAction ||
      plan?.standardAction.targetAmount ||
      plan?.standardAction.estimatedMinutes ||
      plan?.minimumAction.targetAmount ||
      plan?.minimumAction.estimatedMinutes,
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<GoalPlanStatus | null>(null);
  const submitting = useRef(false);
  const busy = mutation.isPending;
  const locked = busy || confirmation !== null || blocked;
  const update = (field: keyof GoalPlanValues, value: string) => {
    setValues((old) => ({ ...old, [field]: value }));
    setError(null);
  };
  async function save() {
    if (submitting.current || blocked) return;
    let request: ReturnType<typeof buildGoalPlanRequest>;
    try {
      request = buildGoalPlanRequest(values, goalId, plan);
    } catch (failure) {
      setError(getUserFacingApiErrorMessage(failure));
      return;
    }
    submitting.current = true;
    setError(null);
    try {
      await mutation.mutateAsync(
        plan ? { type: 'update', planId: plan.id, request } : { type: 'create', request },
      );
      onDone();
    } catch (failure) {
      setError(getUserFacingApiErrorMessage(failure));
      submitting.current = false;
    }
  }
  async function changeStatus() {
    if (!plan || !confirmation || submitting.current || blocked) return;
    submitting.current = true;
    setError(null);
    try {
      await mutation.mutateAsync({ type: 'status', planId: plan.id, status: confirmation });
      onDone();
    } catch (failure) {
      setError(getUserFacingApiErrorMessage(failure));
      submitting.current = false;
    }
  }
  return (
    <Card style={styles.form}>
      <AppText variant="bodyLarge" weight="bold">
        {plan ? '반복 계획 수정' : '반복 계획 만들기'}
      </AppText>
      <AppText variant="caption" tone="secondary">
        평소에 할 일과 힘든 날의 작은 버전을 정해보세요.
      </AppText>
      {blocked ? (
        <InlineNotice
          tone="warning"
          message="목표나 계획이 변경되었어요. 입력한 내용은 남겨뒀어요. 취소 후 최신 목록에서 다시 열어 주세요."
        />
      ) : null}
      <PlanField
        fieldKey={'name'}
        label={'반복할 일'}
        limit={120}
        options={{ placeholder: '예: 영단어 복습' }}
        values={values}
        locked={locked}
        onChange={update}
      />
      <View style={styles.field}>
        <AppText variant="label" weight="semibold">
          반복할 요일
        </AppText>
        <View style={styles.row}>
          {goalPlanDays.map((day) => (
            <Button
              key={day.value}
              size="compact"
              disabled={locked}
              accessibilityLabel={`${day.label}요일`}
              accessibilityState={{ selected: values.days.includes(day.value) }}
              variant={values.days.includes(day.value) ? 'secondary' : 'ghost'}
              onPress={() =>
                setValues((old) => ({
                  ...old,
                  days: old.days.includes(day.value)
                    ? old.days.filter((value) => value !== day.value)
                    : [...old.days, day.value],
                }))
              }
            >
              {day.label}
            </Button>
          ))}
        </View>
      </View>
      <PlanField
        fieldKey={'startDate'}
        label={'시작일'}
        limit={10}
        options={{ date: true }}
        values={values}
        locked={locked}
        onChange={update}
      />
      <AppText variant="caption" tone="secondary">
        반복 날짜 기준: {plan?.schedule.timeZone ?? 'Asia/Seoul'}
      </AppText>
      <PlanField
        fieldKey={'trigger'}
        label={'시작할 상황 · 선택'}
        limit={200}
        options={{ placeholder: '예: 아침 식사를 마친 뒤' }}
        values={values}
        locked={locked}
        onChange={update}
      />
      <PlanField
        fieldKey={'standard'}
        label={'평소에는'}
        limit={500}
        options={{
          placeholder: '예: 영단어 30개 외우기',
          multiline: true,
        }}
        values={values}
        locked={locked}
        onChange={update}
      />
      <PlanField
        fieldKey={'minimum'}
        label={'힘든 날에는'}
        limit={500}
        options={{
          placeholder: '예: 영단어 3개만 읽기',
          multiline: true,
        }}
        values={values}
        locked={locked}
        onChange={update}
      />
      <Button
        size="compact"
        variant="ghost"
        disabled={locked}
        accessibilityState={{ expanded: advanced }}
        onPress={() => setAdvanced(!advanced)}
      >
        분량·예상 시간·다음 행동 {advanced ? '접기' : '추가하기'}
      </Button>
      {advanced ? (
        <>
          <PlanField
            fieldKey={'standardAmount'}
            label={'평소 분량 · 선택'}
            limit={100}
            options={{ placeholder: '예: 30개' }}
            values={values}
            locked={locked}
            onChange={update}
          />
          <PlanField
            fieldKey={'standardMinutes'}
            label={'평소 예상 시간(분) · 선택'}
            limit={4}
            options={{ numeric: true }}
            values={values}
            locked={locked}
            onChange={update}
          />
          <PlanField
            fieldKey={'minimumAmount'}
            label={'작은 버전의 분량 · 선택'}
            limit={100}
            options={{ placeholder: '예: 3개' }}
            values={values}
            locked={locked}
            onChange={update}
          />
          <PlanField
            fieldKey={'minimumMinutes'}
            label={'작은 버전의 예상 시간(분) · 선택'}
            limit={4}
            options={{ numeric: true }}
            values={values}
            locked={locked}
            onChange={update}
          />
          <PlanField
            fieldKey={'nextAction'}
            label={'다음에 시작할 행동 · 선택'}
            limit={300}
            options={{
              placeholder: '예: 어제 틀린 단어부터 펼치기',
            }}
            values={values}
            locked={locked}
            onChange={update}
          />
        </>
      ) : null}
      {plan ? (
        <>
          <PlanField
            fieldKey={'effectiveFromDate'}
            label={'수정 적용일'}
            limit={10}
            options={{ date: true }}
            values={values}
            locked={locked}
            onChange={update}
          />
          <AppText variant="caption" tone="secondary">
            적용일 이후의 계획을 바꿔요. 지난 실천 기록은 그대로 남아요.
          </AppText>
        </>
      ) : null}
      {error ? <InlineNotice tone="danger" message={error} /> : null}
      {confirmation ? (
        <View style={styles.field}>
          <AppText>
            {confirmation === 'ACTIVE'
              ? '이 반복 계획을 다시 시작할까요?'
              : confirmation === 'ARCHIVED'
                ? '이 계획을 보관할까요? 앞으로의 할 일은 멈추고 지나온 기록은 남아요. 보관 후에는 다시 수정하거나 활성화할 수 없어요.'
                : '이 계획을 잠시 멈출까요? 앞으로의 할 일은 기록함으로 옮기고 지나온 기록은 남아요.'}
          </AppText>
          <AppText variant="caption" tone="secondary">
            입력 중인 내용 수정은 저장하지 않고 상태만 바꿔요.
          </AppText>
          <View style={styles.row}>
            <Button
              variant="ghost"
              disabled={busy}
              onPress={() => {
                setConfirmation(null);
                setError(null);
              }}
            >
              취소
            </Button>
            <Button loading={busy} disabled={blocked} onPress={() => void changeStatus()}>
              확인
            </Button>
          </View>
        </View>
      ) : (
        <>
          <Button loading={busy} disabled={blocked} onPress={() => void save()}>
            계획 저장
          </Button>
          <Button variant="secondary" disabled={busy} onPress={onDone}>
            취소
          </Button>
          {plan ? (
            <View style={styles.row}>
              <Button
                variant="ghost"
                size="compact"
                disabled={busy || blocked}
                onPress={() => setConfirmation(plan.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
              >
                {plan.status === 'ACTIVE' ? '잠시 멈추기' : '다시 시작'}
              </Button>
              <Button
                variant="ghost"
                size="compact"
                disabled={busy || blocked}
                onPress={() => setConfirmation('ARCHIVED')}
              >
                계획 보관
              </Button>
            </View>
          ) : null}
        </>
      )}
      {plan?.schedule.notifyAtTime ? (
        <AppText variant="caption" tone="secondary">
          기존 알림 시각 {plan.schedule.notifyAtTime.slice(0, 5)}을 유지해요.
        </AppText>
      ) : null}
    </Card>
  );
}
const styles = StyleSheet.create({
  form: { gap: spacing[3] },
  field: { gap: spacing[2] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  input: {
    minHeight: 48,
    fontSize: 16,
    padding: spacing[3],
    borderWidth: 1,
    borderRadius: radii.md,
  },
});

function PlanField({
  fieldKey,
  label,
  limit,
  options,
  values,
  locked,
  onChange,
}: {
  fieldKey: Exclude<keyof GoalPlanValues, 'days'>;
  label: string;
  limit: number;
  options: { placeholder?: string; numeric?: boolean; date?: boolean; multiline?: boolean };
  values: GoalPlanValues;
  locked: boolean;
  onChange: (field: keyof GoalPlanValues, value: string) => void;
}) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <AppText variant="label" weight="semibold">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        editable={!locked}
        value={values[fieldKey]}
        maxLength={limit}
        placeholder={options.placeholder}
        placeholderTextColor={theme.colors.textMuted}
        multiline={options.multiline}
        keyboardType={options.numeric || options.date ? 'number-pad' : 'default'}
        inputMode={options.numeric || options.date ? 'numeric' : 'text'}
        onChangeText={(value) =>
          onChange(fieldKey, options.date ? formatDdayTargetDateInput(value) : value)
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: focused ? theme.colors.primary : theme.colors.border,
          },
        ]}
      />
    </View>
  );
}
