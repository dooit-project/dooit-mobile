# Workspace 후속 기능 우선순위

Last updated: 2026-09-11

Workspace 일정 공유 이후의 초대 거절, 체크리스트와 주간 리포트 범위를 관리한다. 현재 계약과 연결 상태는 [`FRONTEND_BACKEND_STATUS.md`](../integration/FRONTEND_BACKEND_STATUS.md)를 따른다.

## 결정

| 후보             | 우선순위           | 현재 결정                                                             |
| ---------------- | ------------------ | --------------------------------------------------------------------- |
| 초대 거절        | P1, QA 남음        | API·mock·cache·확인 UI 완료. 반응형·접근성·real smoke 진행            |
| 체크리스트       | 구현 완료, QA 남음 | 상세 CRUD·정렬·VIEWER 제한과 local 역할 검증 완료. production QA 남음 |
| 계층형 하위 Task | 보류               | 체크리스트로 해결되지 않는 반복 요구가 확인될 때 재검토               |
| 주간 리포트      | 탐색               | 출시 범위에서 제외하고 실제 회고 행동과 필요한 지표를 먼저 확인       |

## 초대 거절

- 받은 초대의 `수락`은 주요 행동, `거절`은 Workspace 이름을 다시 보여 주는 보조 확인 행동이다.
- 성공하면 받은 초대 cache에서 제거하고, 404·409면 목록을 새로고침해 현재 상태를 설명한다.
- 320px·글자 확대·Web keyboard·스크린리더와 real API 검증이 남았다.

## 체크리스트

백엔드는 `/api/v1/tasks/{taskId}/checklist-items/**`에서 개인·Workspace Task의 한 단계 item 조회·생성·수정·완료·재개·삭제·정렬을 제공한다.

- Workspace ACTIVE 멤버는 조회할 수 있다.
- OWNER·EDITOR만 변경할 수 있고 VIEWER 변경은 HTTP 403이다.
- 프론트는 VIEWER에게 변경 action을 숨기거나 비활성화하고, 역할 변경 뒤의 403은 재로그인이 아닌 권한 안내로 처리한다.
- 반복 occurrence, 부모 완료 시 미완료 item 처리와 정렬 응답은 실행 OpenAPI·real API로 확인한다.
- item에 담당자·날짜·알림·재귀 checklist를 추가하지 않는다.

## 계층형 하위 Task

체크리스트와 별개로 부모 완료, 반복 occurrence, D-Day, 개인/Workspace 이동, 검색·알림을 상속하는 하위 Task 모델은 만들지 않는다. 다음 요구가 반복될 때만 문제를 다시 정의한다.

- 하나의 목표를 여러 Task로 만들고 제목 접두어로 묶는 패턴
- 체크리스트 item 자체에 담당자·날짜·알림이 필요한 협업
- Workspace 일정의 책임 분담을 독립 Task 관계로 관리해야 하는 요구

## 주간 리포트

완료 수치만 강조하거나 홈 정보 밀도를 높이지 않는다. 사용자가 지난주 결과를 실제로 되돌아보는지, 개인과 Workspace를 분리할지, 완료·이월·D-Day 중 무엇이 다음 행동으로 이어지는지 확인한 뒤 결정한다.

## 남은 검증

초대 거절의 반응형·접근성과 production 역할별 검증은 [로드맵](./ROADMAP.md)에서 추적한다. 개인·Workspace 체크리스트 UI와 local OWNER·EDITOR·VIEWER 권한 검증은 완료됐으며 다시 신규 구현 작업으로 잡지 않는다.

공유 UI가 바뀌면 [Workspace 흐름](./WORKSPACE_UI_FLOW.md)에 따라 실제 화면을 점검한다.
