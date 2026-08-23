export function getGuestRecoveryMessage(isWeb: boolean) {
  return isWeb
    ? '이 브라우저와 웹 주소에 임시 저장돼요. 브라우저 저장소를 지우거나 다른 주소·브라우저에서 열면 복구할 수 없어요.'
    : '이 기기에 임시 저장돼요. 앱을 삭제하거나 앱 데이터를 지우면 복구할 수 없어요.';
}

export function getGuestContinueMessage(isWeb: boolean) {
  return isWeb
    ? '이 브라우저와 같은 웹 주소에서는 작성한 내용이 유지돼요.'
    : '이 기기에서는 작성한 내용이 유지돼요.';
}
