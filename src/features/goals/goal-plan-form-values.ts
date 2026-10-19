import type {
  GoalPlanCreateRequest,
  GoalPlanResponse,
  GoalPlanUpdateRequest,
  GoalScheduleDay,
} from '@/types';
import { goalPlanLimits } from '@/types';
import { isLocalDateString } from '@/utils';

export const goalPlanDays: { value: GoalScheduleDay; label: string }[] = [
  { value: 'MO', label: '월' },
  { value: 'TU', label: '화' },
  { value: 'WE', label: '수' },
  { value: 'TH', label: '목' },
  { value: 'FR', label: '금' },
  { value: 'SA', label: '토' },
  { value: 'SU', label: '일' },
];
export type GoalPlanValues = {
  name: string;
  trigger: string;
  startDate: string;
  days: GoalScheduleDay[];
  standard: string;
  minimum: string;
  standardAmount: string;
  minimumAmount: string;
  standardMinutes: string;
  minimumMinutes: string;
  nextAction: string;
  effectiveFromDate: string;
};
export function initialGoalPlanValues(today: string, plan?: GoalPlanResponse): GoalPlanValues {
  return {
    name: plan?.name ?? '',
    trigger: plan?.triggerText ?? '',
    startDate: plan?.schedule.startDate ?? today,
    days: plan ? [...plan.schedule.days] : goalPlanDays.map((day) => day.value),
    standard: plan?.standardAction.text ?? '',
    minimum: plan?.minimumAction.text ?? '',
    standardAmount: plan?.standardAction.targetAmount ?? '',
    minimumAmount: plan?.minimumAction.targetAmount ?? '',
    standardMinutes: plan?.standardAction.estimatedMinutes?.toString() ?? '',
    minimumMinutes: plan?.minimumAction.estimatedMinutes?.toString() ?? '',
    nextAction: plan?.nextAction ?? '',
    effectiveFromDate: today,
  };
}
export function buildGoalPlanRequest(
  values: GoalPlanValues,
  goalId: number,
  plan?: GoalPlanResponse,
): GoalPlanCreateRequest & GoalPlanUpdateRequest {
  const name = values.name.trim(),
    standard = values.standard.trim(),
    minimum = values.minimum.trim();
  if (!name || name.length > goalPlanLimits.name)
    throw new Error('계획 이름을 120자 이내로 입력해 주세요.');
  if (
    !isLocalDateString(values.startDate) ||
    (plan && !isLocalDateString(values.effectiveFromDate))
  )
    throw new Error('시작일과 수정 적용일을 올바른 연도·월·일로 입력해 주세요.');
  if (
    !values.days.length ||
    values.days.some((value) => !goalPlanDays.some((day) => day.value === value))
  )
    throw new Error('반복할 요일을 하나 이상 선택해 주세요.');
  if (!standard || !minimum || standard.length > 500 || minimum.length > 500)
    throw new Error('기본 행동과 최소 행동을 각각 500자 이내로 입력해 주세요.');
  if (
    values.trigger.length > 200 ||
    values.nextAction.length > 300 ||
    values.standardAmount.length > 100 ||
    values.minimumAmount.length > 100
  )
    throw new Error('입력한 문장의 길이를 확인해 주세요.');
  function minutes(raw: string) {
    if (!raw.trim()) return null;
    if (!/^\d+$/.test(raw.trim()) || Number(raw) < 1 || Number(raw) > 1440)
      throw new Error('예상 시간은 1~1440분의 정수로 입력해 주세요.');
    return Number(raw);
  }
  return {
    goalId,
    name,
    triggerText: values.trigger.trim() || null,
    schedule: {
      startDate: values.startDate,
      days: goalPlanDays.filter((day) => values.days.includes(day.value)).map((day) => day.value),
      timeZone: plan?.schedule.timeZone ?? 'Asia/Seoul',
      notifyAtTime: plan?.schedule.notifyAtTime ?? null,
    },
    standardAction: {
      text: standard,
      targetAmount: values.standardAmount.trim() || null,
      estimatedMinutes: minutes(values.standardMinutes),
    },
    minimumAction: {
      text: minimum,
      targetAmount: values.minimumAmount.trim() || null,
      estimatedMinutes: minutes(values.minimumMinutes),
    },
    nextAction: values.nextAction.trim() || null,
    ...(plan ? { effectiveFromDate: values.effectiveFromDate } : {}),
  };
}
