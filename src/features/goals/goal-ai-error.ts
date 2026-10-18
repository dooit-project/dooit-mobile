import { ApiClientError, getUserFacingApiErrorMessage } from '@/services/api/api-error';

export type GoalAiFailure =
  | { kind: 'unavailable'; message: string }
  | { kind: 'rate-limited'; message: string; retryAt: number | null }
  | { kind: 'journey-changed'; message: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

/** Context-specific fallback; never reinterpret every 503/429 as a Goal AI response. */
export function getGoalAiFailure(
  error: unknown,
  context: 'draft' | 'journey-summary' = 'draft',
): GoalAiFailure {
  const fallback = context === 'draft' ? '직접 작성할 수 있어요.' : '기록은 그대로 볼 수 있어요.';
  if (error instanceof ApiClientError) {
    if (error.kind === 'cancelled') return { kind: 'cancelled' };
    if (error.status === 503 && error.code === 70009) {
      return { kind: 'unavailable', message: `지금은 AI 제안을 사용할 수 없어요. ${fallback}` };
    }
    if (error.status === 429 && error.code === 70010) {
      return {
        kind: 'rate-limited',
        message: `AI 요청 한도에 도달했어요. ${fallback}`,
        retryAt: error.retryAt ?? null,
      };
    }
    if (error.status === 409 && error.code === 70008) {
      return {
        kind: 'journey-changed',
        message: '기록이 변경되었어요. 최신 기록을 확인한 뒤 다시 요약해 주세요.',
      };
    }
  }
  return { kind: 'error', message: getUserFacingApiErrorMessage(error) };
}
