import { ddayGoalLimits } from '@/types';
import { isLocalDateString } from '@/utils';

export type DdayGoalFormValues = {
  title: string;
  targetDate: string;
};

export type DdayGoalFormErrors = Partial<Record<keyof DdayGoalFormValues, string>>;

export function formatDdayTargetDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('-');
}

export function validateDdayGoal(values: DdayGoalFormValues): DdayGoalFormErrors {
  const title = values.title.trim();
  const targetDate = values.targetDate.trim();
  const errors: DdayGoalFormErrors = {};

  if (!title) {
    errors.title = '목표 이름을 입력해 주세요.';
  } else if (title.length > ddayGoalLimits.title) {
    errors.title = `목표 이름은 ${ddayGoalLimits.title}자까지 입력할 수 있어요.`;
  }

  if (!targetDate) {
    errors.targetDate = '목표 날짜를 입력해 주세요.';
  } else if (!isLocalDateString(targetDate)) {
    errors.targetDate = 'YYYY-MM-DD 형식의 올바른 날짜를 입력해 주세요.';
  }

  return errors;
}
