# 돌아보기 날짜와 현재 주 상태

2026-11-04 · Product Design 감사 기준 · 로컬 Playwright / Chrome mock Web

- 이번 단위: 좁은 화면의 주간 날짜 가독성과 현재 주/복귀 조작 구분. 기준은 [기존 320 화면](./before-previous-320.png)과 [돌아보기의 기존 선택 구조](../../design/review-evidence-2026-10-16/README.md)다. 기록 그룹·네 탭·주 이동 동작은 유지한다.
- [지난주 320](./after-previous-320.png): 시작일과 종료일을 두 줄로 표시해 날짜 사이의 붙은 문자열을 없앴다. 이전 화살표의 테두리는 테스트 클릭 후 키보드 초점 표시다.
- [현재 주 390](./after-populated-390.png): ‘이번 주’는 버튼이 아닌 파란 점과 텍스트 상태다. [지난주 390](./after-previous-390.png)에서는 ‘이번 주’가 테두리 있는 복귀 버튼이고 클릭하면 현재 주와 테스트 완료 기록이 나타난다. 화면 읽기 이름도 상태와 조작을 구분한다. 실제 스크린 리더 음성 검증은 아니다.
- [연도 경계 320](./after-year-320.png): 2025년 12월 29일부터 2026년 1월 4일까지 두 줄로 표시한다. 이 경우 날짜 내부 공백은 줄여서 전체 연도를 유지한다. 320/390/430과 연도 경계의 새 DOM 좌표 검사 모두 각 1행 / 4조작 통과다.
- [Apple 레이아웃 가이드](https://developer.apple.com/design/human-interface-guidelines/layout)는 화면 크기·글자 길이 변화와 조작 간 충분한 공간을 강조하며, [Google Calendar 공식 안내](https://support.google.com/calendar/answer/6110849?co=GENIE.Platform%3DAndroid&hl=en)는 현재 날짜 복귀 동작을 제공한다. 공식 자료 비교이며 외부 앱 직접 조작은 아니다.
- 내장 브라우저 접근 호스트 장애로 사용자가 이전에 승인한 로컬 Playwright를 사용했다. 테스트 완료 기록 1개로 확인했으며 다수 목표·확대 글자·스크린 리더·Android/iOS 실기기 및 운영 API는 미확인이다. 320 캡처에 보일 수 있는 하단 검은 번개는 Expo 개발 오버레이이며 앱 UI가 아니다.
