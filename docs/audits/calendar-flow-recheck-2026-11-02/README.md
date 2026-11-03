# 달력 전체 흐름 재검토

2026-11-02 · Product Design audit · Chrome 반응형 mock Web 430×844

1. [빈 날짜](./03-empty-display.jpg): 선택한 날짜 제목과 빈 상태, ‘이 날짜에 일정 추가’가 보인다. 등록 화면은 선택한 2026-11-02와 일정 유형을 미리 채웠다. 원본: [01](./01-empty.jpg).
2. [일정이 있는 날짜](./04-populated-display.jpg): 테스트 일정 ‘토익 시험 접수’를 저장하고 상세를 닫자 달력의 해당 날짜와 날짜별 목록에 보였다. 목록에서 제목·시작 시각을 읽을 수 있다. 원본: [02](./02-populated.jpg). **P2:** 이 상태에는 같은 날짜에 새 일정을 추가하는 진입점이 없다. 빈 상태에서만 제공하므로 날짜에 일정 하나를 만든 후 다시 추가하기가 어렵다. `CalendarDayTasks`의 분기에서도 확인했다. 날짜 제목 근처 또는 목록 끝에 작고 명확한 추가 동작을 두는 방안을 검토한다. 선택한 날짜가 입력 화면에 전달되는 현재 동작은 유지해야 한다.
3. 다른 날짜 선택: 11월 3일을 선택하면 해당 날짜 제목과 빈 상태가 갱신된다. 다시 추가 버튼이 나타난다. 달력 안의 기존 일정은 그대로 보인다.
4. **접근성 위험:** 빈 날짜의 추가 버튼에서 등록 화면으로 이동할 때 Chrome에서 포커스가 남은 요소의 상위 영역을 `aria-hidden` 처리하지 못했다는 경고가 나타났다. 화면 읽기 도구에서 실제 영향은 아직 확인하지 못했으며, 등록 화면 전환과 포커스 이동의 원인 확인이 필요하다.

## 외부 참고와 미확인 범위

- [Google Calendar의 날짜 선택과 오늘 복귀](https://support.google.com/calendar/answer/6110849?co=GENIE.Platform%3DAndroid&hl=en), [Fantastical의 날짜/일정 연결](https://flexibits.com/fantastical-ios/help/calendar-views), [Fantastical의 날짜에서 일정 추가](https://flexibits.com/fantastical-ios/help/adding-events-and-tasks), [Apple의 터치 및 배치 안내](https://developer.apple.com/design/tips/)를 공식 문서로 참고했다. 외부 앱을 직접 조작한 비교는 아니다.
- 내장 브라우저·Chrome 확장 접근 호스트 장애로 Chrome 앱과 DevTools 반응형 모드를 사용했다. mock 일정 1개와 빈 날짜만 실제 점검했다. 여러 일정·기간 일정·완료·오류·확대 글자·키보드·스크린 리더·Android/iOS 및 운영 데이터는 이번 검토에서 확인하지 않았다. 기존 미완료 DOM 좌표 보고서와 `check:ui-layout`도 남아 있다. 기록한 두 문제 때문에 달력 검토를 특이사항 없음으로 판정하지 않는다.

캡처 자료에서 개인 브라우저 탭 정보가 포함된 상단 영역은 제거했다. 문서의 원본 캡처 링크는 이 정보가 제거된 기록이며, 잘리지 않은 파일은 로컬 임시 보관소에 보존했다.
