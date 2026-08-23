# UF-02 Today 실행·빠른 기록 캡처

- 캡처일: 2026-08-23
- 환경: Web mock, Chrome, 390×844, demo 계정
- FigJam: [UF-01·UF-02 사용자 흐름 보드](https://www.figma.com/board/xf7ISp8sW7yyQEndMUjJNl)

## 캡처 순서

| 번호 | 화면                                               | 상태                     | 판정      |
| ---- | -------------------------------------------------- | ------------------------ | --------- |
| 01   | [Today 최초 안내](./01-today-populated.png)        | populated + feature tip  | 주의      |
| 02   | [Today 기본](./02-today-default.png)               | 일정·할 일·정리·완료     | 정상      |
| 03   | [빠른 기록 열기](./03-quick-capture-open.png)      | 빈 composer              | 정상      |
| 04   | [빠른 기록 입력](./04-quick-capture-filled.png)    | 입력·추가 활성           | 정상      |
| 05   | [빠른 기록 성공](./05-quick-capture-success.png)   | 기록함 저장·후속 행동    | 정상      |
| 06   | [composer 닫기](./06-after-composer-close.png)     | 저장 결과가 사라진 Today | 개선 필요 |
| 07   | [정리할 항목](./07-review-multiple.png)            | 지난 미완료·추천·기록함  | 오류      |
| 08   | [완료 4개 기본](./08-completed-four-collapsed.png) | 최근 3개·전체 보기       | 정상      |
| 09   | [완료 4개 펼침](./09-completed-four-expanded.png)  | 전체 4개·접기            | 정상      |

## 판정

Today의 실행 목록과 완료 피드백, 빠른 기록 입력·성공, 완료 목록의 최근 3개·전체 보기 흐름은 연결된다. 다만 빠른 기록의 저장 이후 맥락과 하루 정리의 집계는 수정이 필요하다.

1. 날짜 없는 빠른 기록 한 건이 `추천`과 `기록함`에 동시에 표시된다. 이번 캡처에서 정리 개수가 3개에서 5개로 증가했고 같은 항목이 두 구역에 반복됐다.
2. 성공 결과는 composer 안에만 있어 닫는 즉시 제목·저장 위치·후속 행동이 사라진다. Today 본문에 최신 기록 한 건을 유지하는 안이 필요하다.
3. 빠른 기록 input에서 `Escape`를 눌러도 composer가 닫히지 않았다. Web keyboard 동작을 추가해야 한다.
4. feature tip이 일정과 실행 목록을 아래로 밀어 첫 viewport의 실제 할 일을 줄인다. 재노출 조건과 밀도를 별도로 점검해야 한다.

## 아직 확인하지 못한 상태

- mock mutation이 즉시 끝나 저장 중 화면을 안정적으로 캡처하지 못했다.
- 빠른 기록 network·timeout 실패와 재시도
- 기록함 0개·1개, 하루 정리 0개
- 완료 mutation 실패와 다시 열기 실패
- keyboard, zoom 150%, font scale, VoiceOver·TalkBack

구현 기준은 [`USER_FLOW_CATALOG.md`](../../product/USER_FLOW_CATALOG.md)와 [`QUICK_CAPTURE_INBOX_UX_PROPOSAL.md`](../../product/QUICK_CAPTURE_INBOX_UX_PROPOSAL.md)를 따른다.
