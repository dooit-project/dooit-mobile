import { getUserFacingApiErrorMessage } from '@/services/api';

const GUEST_DATA_PRESERVED_MESSAGE =
  '게스트로 작성한 내용은 그대로 유지돼요. 입력이나 연결 상태를 확인한 뒤 다시 시도해 주세요.';

export function getAuthSubmissionErrorMessage(error: unknown, preserveGuestData: boolean) {
  const message = getUserFacingApiErrorMessage(error);

  return preserveGuestData ? `${message} ${GUEST_DATA_PRESERVED_MESSAGE}` : message;
}
