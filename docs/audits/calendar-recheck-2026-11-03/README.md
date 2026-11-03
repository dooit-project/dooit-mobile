# 달력 흐름 재검토

2026-11-03 · Product Design 감사 기준 · 로컬 Playwright / Chrome mock Web 390×844

1. [빈 날짜](./01-empty.png): 선택 날짜와 일정 추가가 분명하다. 날짜 제목과 버튼이 같은 맥락에 있다.
2. [일정이 있는 날짜](./02-populated.png): 날짜별 목록과 추가 행이 보이고 글자·아이콘이 한 줄에서 정렬된다. 달력 셀의 좁은 제목은 생략되지만 아래 목록에서 전체 제목을 확인할 수 있다.
3. [추가 화면](./03-form.png): 선택한 날짜와 일정 유형을 유지하고 제목 입력에 초점이 온다. 이 흐름에서 이전 `aria-hidden` 경고는 재현되지 않았다.

Google Calendar는 [날짜 선택으로 해당 날짜 일정 확인](https://support.google.com/calendar/answer/6110849?co=GENIE.Platform%3DAndroid&hl=en)과 [별도 만들기 버튼](https://support.google.com/calendar/answer/72143?co=GENIE.Platform%3DAndroid&hl=en)을 제공한다. Apple Calendar는 [월간 표시에서 날짜별 목록과 표시 밀도 선택](https://support.apple.com/en-lamr/guide/iphone/iphfd1054569/ios)을 지원한다. 공식 안내 비교이며 두 앱을 직접 조작한 검증은 아니다.

현재 구조에서는 날짜 맥락에 붙은 추가 행을 유지한다. 목록이 길면 추가 행까지 스크롤이 필요하므로 다수 일정에서의 발견 가능성은 후속 검토 대상이다. 새 고정 버튼이나 표시 방식 선택을 바로 추가할 근거는 아직 부족하다. 이번에 확인한 단일 일정 흐름에서는 우선 수정할 문제를 발견하지 못했다.

이전 승인에 따라 내장 브라우저 접근 호스트 장애의 대안으로 별도 로컬 Playwright를 사용했다. 다수 일정, 긴 제목, 320/430, 실제 키보드·스크린 리더, Android/iOS와 운영 API는 이번에 확인하지 않았다. 실제 사용성 조사나 접근성 인증은 아니다.
