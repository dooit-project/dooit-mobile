# 달력 오늘 버튼 크기 보정

2026-10-31 · `84d76c1` 이후 미커밋 작업 트리 · Product Design audit

- 범위: 사용자가 선택한 [달력 보정 시안](../../design/calendar-navigation-2026-10-30/04-refined.png)과 [중앙 정렬 결정](../calendar-heading-2026-10-30/README.md)을 유지하고 오늘 버튼의 시각 크기만 줄인다. 달력 구조, 월 이동과 오늘 복귀 의미는 유지한다.
- [변경 전](./01-before.jpg)과 [변경 후](./02-after-390.jpg)는 같은 Chrome 반응형 Web 390×844·mock 빈 날짜 화면이다. 바깥 조작 영역은 48×48로 두고 안쪽 테두리는 최소 44×32로 줄였다. 공통 색상·타이포·radius를 사용하며 공통 Button 전체는 바꾸지 않았다. [표시용 화면](./05-display.jpg)은 브라우저 주변을 잘라낸 실제 캡처다.
- 단계별 확인: ① 초기 화면에서 제목 중앙과 오늘 버튼의 크기·정렬을 육안으로 확인했다. ② 다음 달로 이동해 11월 표시를 확인했다. ③ 오늘 버튼으로 10월 31일에 복귀했다. [320 화면](./03-after-320.jpg)도 육안으로 살펴봤다. 430 입력 과정이 실패해 해당 크기는 미확인이다.
- [Android 접근성 안내](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views)는 작은 시각 요소에도 큰 터치 영역을 둘 수 있다고 설명하며 48dp 조작 영역을 권장한다. [Google Calendar의 모바일 안내](https://support.google.com/calendar/answer/65923?hl=en-7)는 오늘 복귀를 제공하는 사례다. 공식 문서 참고이며 다른 앱 직접 조작은 아니다.
- 내장 브라우저와 Chrome 확장의 접근 호스트 장애로 Chrome 앱과 DevTools 반응형 모드를 사용했다. 새 DOM 좌표 보고서를 수집하지 못해 `check:ui-layout`은 미실행이다. 430·글자 확대·키보드 초점·스크린 리더 및 Android/iOS 실기기는 미확인이다. 화면의 터치 영역 수치는 코드 기준이며 실제 기기 측정이 아니다. 최종 시각 QA는 pending이다.

캡처 자료에서 개인 브라우저 탭 정보가 포함된 상단 영역은 제거했다. 문서의 원본 캡처 링크는 이 정보가 제거된 기록이며, 잘리지 않은 파일은 로컬 임시 보관소에 보존했다.
