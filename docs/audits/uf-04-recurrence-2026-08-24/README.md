# UF-04 반복 Task occurrence 캡처

- 캡처일: 2026-08-24
- 환경: Web mock, Chrome, 390×844, demo 계정

## 캡처 순서

| 번호 | 화면                                                          | 상태                               | 판정 |
| ---- | ------------------------------------------------------------- | ---------------------------------- | ---- |
| 01   | [새 일정 반복 기본](./01-new-schedule-recurrence-default.jpg) | 일정 날짜·시간·반복 없음           | 정상 |
| 02   | [매일 반복 입력](./02-daily-recurrence-filled.jpg)            | 제목·매일 반복·저장 가능           | 정상 |
| 03   | [반복 Task 상세](./03-recurring-task-detail.jpg)              | 일정 정보에 `반복 매일` 표시       | 정상 |
| 04   | [수정 범위 이번만](./04-edit-scope-this.jpg)                  | 기본 범위와 설명                   | 정상 |
| 05   | [수정 범위 이후 모두](./05-edit-scope-future.jpg)             | 이후 occurrence 범위 선택          | 정상 |
| 06   | [삭제 범위 이번만](./06-delete-scope-this.jpg)                | 위험 안내·기본 범위·취소·영구 삭제 | 정상 |
| 07   | [삭제 범위 전체](./07-delete-scope-all.jpg)                   | 반복 묶음 전체 선택                | 정상 |

## 판정

반복 일정 생성, 상세 표시, 수정과 삭제의 `이번만·이후 모두·전체` 범위 선택 UI는 연결된다.

1. Web mock 생성기가 폼에서 전달한 `recurrence`를 저장하지 않아 상세에서 `반복 없음`으로 표시되던 문제를 수정했다. 생성·수정 응답이 nested recurrence와 호환 필드를 함께 유지하는 테스트를 추가했다.
2. 수정·삭제 범위는 행동 전에 먼저 노출되고, 기본값 `이번만`의 영향 범위를 설명한다. `이후 모두`와 `전체` 선택도 화면에서 구분된다.
3. 개인 반복 Task에는 별도의 `건너뛰기` 행동이 현재 없다. API 계약은 `DELETE recurrenceScope=THIS`를 건너뛰기로 정의하지만 UI에서는 삭제 확인의 `이번만`으로만 표현되어 사용자가 이후 occurrence 유지 의미를 직접 알기 어렵다.

## 아직 확인하지 못한 상태

- 수정 완료와 삭제 완료 뒤 Today·Calendar occurrence 갱신
- 건너뛰기 명칭 또는 별도 행동과 `SKIPPED` 상태 표시
- 매주·매월·직접 설정 생성과 종료일·횟수 조건
- mutation 저장 중, network·timeout 실패와 rollback·재시도
- 완료·미룸·이동 뒤 이후 occurrence 유지
- 실제 API materialize와 notification candidate 제외
- keyboard 전체 순서, zoom 150%, font scale, VoiceOver·TalkBack

구현 기준은 [`USER_FLOW_CATALOG.md`](../../product/USER_FLOW_CATALOG.md)와 [`API_RECURRENCE.md`](../../api/API_RECURRENCE.md)를 따른다.
