# 상세 초점과 미저장 확인 재검토

2026-10-29 · Product Design audit · Chrome 확장, 로컬 mock Web, 390×844

1. [상세 진입](./01-detail.png): 패널에 초기 초점이 있고 닫기 버튼이 불필요하게 강조되지 않는다. Shift+Tab은 마지막 체크리스트 버튼으로, Tab은 첫 목표 경로로 순환했다.
2. [미저장 확인](./02-confirm.png): 제목을 변경하고 취소하면 저장하지 않는 결과와 두 선택이 명확하다. 초기 초점은 계속 작성이다. Escape 후 입력과 취소 버튼 초점이 복원됐다.
3. [WAI modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)의 초기 초점·내부 순환·복귀와 [GOV.UK 버튼 지침](https://design-system.service.gov.uk/components/button/)의 행동을 설명하는 문구·행동 위계를 참고했다. 앱별 공식 디자인 패턴을 이 재검토에서 직접 조작한 것은 아니다.

검토한 Web mock 범위에 막히는 문제는 발견하지 않았다. 실제 Android/iOS·스크린 리더·글자 확대·운영 데이터와 모든 진입 경로는 미확인이다. 기존 [초점 감사](../task-detail-focus-2026-10-29/README.md)와 [문구 감사](../confirm-copy-2026-10-29/README.md)의 범위도 유지한다.
