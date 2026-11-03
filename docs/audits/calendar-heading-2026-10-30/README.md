# 달력 상단 정렬과 오늘 버튼

2026-10-30 · `84d76c1` 이후 작업 트리 · Product Design audit

- 대상: 월 제목·이전/다음 달·오늘 복귀. 선택된 [월간 달력 보정 원본](../../design/calendar-navigation-2026-10-30/04-refined.png)의 월간 그리드, 선택일 목록과 하단 탭을 유지한다. 공통 `Button` outline을 사용하고 나머지 달력 UI나 기능은 변경하지 않는다.
- [변경 전 실제 화면](./01-before.jpg): 네 조작을 한 덩어리로 중앙 정렬해 제목은 달력의 중심보다 왼쪽에 있으며 오늘은 테두리 없는 텍스트로 보인다. 이는 기존 구현의 스타일이며 버튼 역할이 눈에 충분히 드러나지 않는 문제다.
- [변경 후 실제 화면](./02-after.jpg): 양쪽에 같은 폭을 확보해 월 제목과 양방향 화살표를 달력 중심에 놓고, 오른쪽에는 공통 outline의 오늘 버튼을 배치했다. 좁은 폭에서도 들어가도록 제목은 공통 sectionTitle 크기를 사용한다. 버튼과 화살표 조작을 유지한다.
- [320](./03-mobile-320.jpg), [390](./04-mobile-390.jpg), [430](./05-mobile-430.jpg)은 Chrome DevTools 반응형 Web의 실제 화면이고, [390 표시용](./08-mobile-390-display.jpg)은 안내 닫기 후 캡처에서 주변 브라우저를 잘라낸 이미지다. 일반 글자 크기에서 제목과 조작이 육안으로 겹치지 않는다. 390에서 월 선택기 열기·11월 선택·이전 달 이동, 430에서 다음 달 이동과 오늘 복귀를 실제 조작했다.
- [Google Calendar 모바일 안내](https://support.google.com/calendar/answer/65923?hl=en-7)와 [Android 안내](https://support.google.com/calendar/answer/6110849?co=GENIE.Platform%3DAndroid&hl=en)를 참고했다. 오늘 복귀를 직접 제공하는 패턴을 확인한 것이며 다른 앱을 직접 조작하거나 Dooit 배치를 검증한 것은 아니다. 위치와 테두리는 시안 및 사용자 피드백에 따른 판단이다.
- 내장 브라우저/Chrome 확장의 접근 호스트 장애로 Chrome 앱 및 DevTools 반응형 모드를 사용했다. `collect-ui-layout.js`의 새 DOM 보고서 수집이 실패해 `check:ui-layout`은 미실행이며 정량적인 44px·중앙 정렬 통과를 주장하지 않는다. 확대 글자, 키보드 초점, VoiceOver/TalkBack, Android/iOS 실기기와 운영 API도 미확인이다. 변경 후 필수 검사를 마치기 전까지 시각 QA는 pending이다.

캡처 자료에서 개인 브라우저 탭 정보가 포함된 상단 영역은 제거했다. 문서의 원본 캡처 링크는 이 정보가 제거된 기록이며, 잘리지 않은 파일은 로컬 임시 보관소에 보존했다.
