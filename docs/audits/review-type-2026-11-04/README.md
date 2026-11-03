# 돌아보기 글자 크기 비교와 보정

2026-11-04 · Product Design 감사 기준 · 로컬 Playwright / Chrome mock Web

## 기존 크기 비교

- 오늘의 목표 묶음 제목은 공통 `sectionTitle` 18/26, 항목 제목은 `bodyLarge` 16/24, 보조 정보는 `caption` 13/18이다. 달력 월 제목은 18/26이고 오늘 버튼은 13/18이다.
- 보정 전 돌아보기는 기록 구역 제목 18/26, 목표 묶음 제목 16/24, 항목 제목 16/24, 기록 개수·날짜 13/18이었다. 주간 범위는 일반 폭 16/24, 360 이하 13/18이어서 같은 역할이라도 모두 동일하지 않았다. 숫자는 React Native 디자인 토큰 값이며 플랫폼 표시 크기와 같다고 단정하지 않는다.

## 보정과 확인

1. [기록 있는 화면 이전](./before-populated-390.png) → [수정 후](./after-populated-390.png): 목표 묶음 제목을 오늘과 같은 18/26으로 바꾸고 기록 개수·완료 날짜는 14/20으로 키웠다. 항목 제목은 기존과 같은 16/24를 유지했다.
2. [이전 주 320](./after-previous-320.png): 주간 범위를 13에서 14로 키우고 좁은 폭에서는 날짜 사이 공백을 줄였다. 좌우 버튼과 겹치지 않지만 날짜 범위가 촘촘해 보이는 한계가 있다. 캡처에서 이전 버튼 테두리는 클릭 후 초점 표시다.
3. [이전 주 390](./after-previous-390.png), [430](./after-previous-430.png): 주간 이동과 이번 주 복귀, 빈 상태를 확인했다. 320/390/430의 새 DOM 검사에서 각각 1행·4조작 통과했다. 화면 표시가 동일한 실제 앱의 mock 테스트 기록이며 시안이 아니다.

[Apple의 접근성 안내](https://developer.apple.com/design/human-interface-guidelines/accessibility)와 [화면 크기·글자 확대 대응 안내](https://developer.apple.com/design/human-interface-guidelines/layout), [Google Calendar의 날짜 탐색 안내](https://support.google.com/calendar/answer/6110849?co=GENIE.Platform%3DAndroid&hl=en)를 참고했다. 외부 앱의 실제 폰트 크기를 측정하거나 앱을 직접 조작한 비교는 아니다.

내장 브라우저 접근 호스트 장애로 이전에 사용자가 승인한 로컬 Playwright를 사용했다. 확대 글자·연도 경계·다수 목표·native 실기기·스크린 리더 및 운영 API는 확인하지 않았다. 기록의 상세 내용은 테스트 데이터다.
