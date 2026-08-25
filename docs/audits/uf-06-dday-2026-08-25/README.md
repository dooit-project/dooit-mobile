# UF-06 D-Day 목표 캡처

- 캡처일: 2026-08-25
- 환경: Web mock, Chrome, 390×844, demo 계정

## 캡처 순서

| 번호 | 화면                                                     | 상태                       | 판정 |
| ---- | -------------------------------------------------------- | -------------------------- | ---- |
| 01   | [D-Day 안내](./01-dday-guide.jpg)                        | 최초 사용 안내             | 정상 |
| 02   | [D-Day 목록](./02-dday-list.jpg)                         | 지난 목표 2개              | 정상 |
| 03   | [새 목표 기본](./03-dday-create-default.jpg)             | 빈 생성 form               | 정상 |
| 04   | [생성 validation](./04-dday-create-validation.jpg)       | 이름·날짜 오류             | 정상 |
| 05   | [새 목표 입력](./05-dday-create-filled.jpg)              | 미래 목표·생성 가능        | 정상 |
| 06   | [목표 생성 완료](./06-dday-created.jpg)                  | 목록 2→3개·D-128           | 정상 |
| 07   | [연결 Task 없음](./07-dday-linked-tasks-empty.jpg)       | 빈 상태와 연결 안내        | 정상 |
| 08   | [Today Task 생성](./08-dday-today-task-form.jpg)         | 목표 기반 Task form        | 정상 |
| 09   | [연결 Task 생성 완료](./09-dday-linked-task-created.jpg) | 연결 목록 1개              | 정상 |
| 10   | [연결 Task 상세](./10-dday-task-detail.jpg)              | D-Day 목표·남은 날짜 표시  | 정상 |
| 11   | [목표 삭제 확인](./11-dday-delete-confirm.jpg)           | 연결 Task가 있는 목표 삭제 | 주의 |
| 12   | [목표 삭제 완료](./12-dday-deleted.jpg)                  | 목록 3→2개                 | 정상 |
| 13   | [D-Day 완전 빈 상태](./13-dday-empty.jpg)                | 설명과 새 목표 CTA         | 정상 |

## 판정

D-Day 목록·빈 상태, 목표 생성과 validation, 목표 기반 Today Task 생성, Task 상세 연결, 목표 삭제의 정상 경로는 연결된다.

1. 미래 목표와 지난 목표를 `D-128`, `D+41`로 구분하며 목표 생성 직후 정렬된 목록과 개수가 갱신된다.
2. 연결된 할 일이 없을 때 상세 연결 위치를 안내한다. 목표 메뉴에서 Today Task를 만들면 목록이 자동으로 펼쳐지고, Task 상세에도 목표명과 남은 날짜가 표시된다.
3. 연결 Task가 있는 목표의 삭제 확인은 목표가 사라진다는 점만 안내한다. 연결된 Task가 유지되고 연결만 해제되는지, 함께 삭제되는지 사용자가 판단할 수 없으므로 백엔드 삭제 계약과 문구를 맞춰야 한다.
4. 모든 목표를 삭제하면 별도 카드 없이 간결한 빈 상태와 상단 `새 목표` 행동만 남는다.

## 아직 확인하지 못한 상태

- 기존 Task 상세에서 목표 연결·변경·해제
- 목표 생성·삭제와 Today Task 생성의 저장 중, network·timeout 실패와 재시도
- 연결 Task가 있는 목표 삭제 뒤 Task 유지·연결 해제 계약
- 목표별 연결 Task 여러 개와 완료 상태
- 실제 API와 Today·Calendar·검색의 D-Day 필터 반영
- keyboard 전체 순서, zoom 150%, font scale, VoiceOver·TalkBack

구현 기준은 [`USER_FLOW_CATALOG.md`](../../product/USER_FLOW_CATALOG.md)를 따른다.
