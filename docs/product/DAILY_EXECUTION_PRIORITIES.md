# 오늘 실행 루프 구현 결정

Last updated: 2026-09-11

이 문서는 구현된 실행 루프의 세부 결정과 제한을 보존한다. 현재 범위는 [PRD](./PRD.md), 남은 작업 순서는 [로드맵](./ROADMAP.md), 배포 확인은 [연동 현황](../integration/FRONTEND_BACKEND_STATUS.md)를 따른다.

## 목표

```text
빠른 기록 → 오늘 계획 → 한 가지 실행 → 하루 마감 → 다음 날 복구
```

기존 기록함·Today·완료·추천·오래 미룬 일의 연결을 먼저 개선한다. 습관, Pomodoro, matrix와 자동 일정 배치는 오늘 실행 루프가 실제 사용에서 검증된 뒤 판단한다.

## 현재 완료된 프론트 기반

- 기존 Task API 기반 오늘 계획과 항목별 부분 실패 재시도
- 하루 마감과 날짜·기록함 이동
- session-only `한 가지 실행하기`
- 오늘·달력·기록함·오래 미룬 일·완료 기록·목표·공유 공간의 탐색 메뉴
- 공유 메뉴 text·URL 확인 화면과 iOS widget 빠른 기록 deep link prototype
- real quick-capture API와 멱등성 처리
- backend 규칙과 같은 quick-capture mock parser와 회귀 테스트
- Daily Plan·summary·category summary·checklist 타입, API client, mock과 query hook
- 계획 확정 시점 focus snapshot 기반 하루 마감 결과와 항목별 즉시 이동 반영
- 개인·Workspace Task 체크리스트 CRUD·정렬과 VIEWER 읽기 전용 UI

## 구현 상태와 제한

### 서버 계약 연결

타입, API client, mock fixture, query key와 기본 cache 무효화를 완료했다. local real API와 production에서는 403·404·migration 미적용 응답을 추가 검증한다.

### 카테고리 탐색

`GET /api/v1/tasks/categories`의 개인 Task 요약을 달력 아래 접이식 메뉴에 연결했다.

- `전체`, `미분류`, 개인 카테고리를 구분한다.
- `taskCount`, `inboxCount`, `todayCount`, `doneCount` 중 현재 진입에 필요한 값만 노출한다.
- Workspace Task는 섞지 않는다.
- 생성·이름 변경·삭제·사용자 지정 정렬 UI는 별도 API가 생기기 전 제공하지 않는다.
- `전체`와 이름 있는 카테고리는 기존 검색 화면으로 이동한다. `미분류`는 검색 API에 null-category 필터가 추가되기 전 count만 표시한다.

### 체크리스트

개인·Workspace Task 상세에 한 단계 체크리스트를 연결했다.

- ACTIVE 멤버는 조회한다.
- OWNER·EDITOR는 생성·수정·완료·재개·삭제·정렬할 수 있다.
- VIEWER에게 변경 행동을 노출하지 않고 서버 403도 권한 안내로 처리한다.
- 계층형 subtask, 담당자, 날짜, 알림은 범위에서 제외한다.

### 서버 Daily Plan과 하루 결과

- 계획 화면의 focus 순서와 확정 상태는 서버 Daily Plan에 연결했다.
- `estimatedDurationMinutes` 입력·상세 표시와 오늘 총 예상 시간을 연결했다.
- 계획 확정 시점 snapshot 기반 summary를 하루 마감 결과에 연결했다.
- summary의 완료·다른 날짜 이동·기록함 이동·미결정을 생산성 점수로 바꾸지 않는다.

## 의도적으로 보류

- 습관 tracker
- Eisenhower Matrix
- Kanban·Gantt·Timeline
- AI 자동 일정 재배치
- 생산성 점수와 연속 달성
- 댓글·파일·복잡한 Workspace activity feed
