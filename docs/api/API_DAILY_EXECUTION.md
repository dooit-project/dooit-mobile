# 일일 계획·실행 API 계약

Last verified: 2026-09-03

이 문서는 `오늘 계획 → 실행 → 하루 마감`에 사용하는 현재 백엔드 계약과 아직 남은 요청만 기록한다. 배포 여부와 모바일 연결 상태는 [`FRONTEND_BACKEND_STATUS.md`](../integration/FRONTEND_BACKEND_STATUS.md)를 따른다.

## 현재 사용할 수 있는 계약

### 일일 계획

```http
GET /api/v1/daily-plans/{date}
PUT /api/v1/daily-plans/{date}
```

- 사용자·서비스 날짜별로 하나의 계획을 사용한다.
- `focusTaskIds`는 최대 3개이며 배열 순서가 집중 순서다.
- `status`, `confirmedAt`, `closedAt`, `updatedAt`으로 계획 상태를 구분한다.
- 날짜와 시간대는 [`API_DATE_TIME.md`](./API_DATE_TIME.md)를 따른다.

### 예상 소요 시간

Task 생성·수정·응답의 `estimatedDurationMinutes`를 사용한다.

- `null`은 미설정이다.
- 일정의 `startAt`·`endAt`과 별개이며 Task 예상 시간 합계는 클라이언트에서 계산할 수 있다.
- 반복 occurrence와 template 적용은 실행 OpenAPI와 백엔드 테스트를 기준으로 확인한다.

### 일일 결과 요약

```http
GET /api/v1/daily-plans/{date}/summary
```

응답 핵심 필드:

```ts
type DailyPlanSummaryResponse = {
  date: string;
  status: string;
  plannedFocusCount: number;
  completedCount: number;
  movedToOtherDateCount: number;
  movedToInboxCount: number;
  undecidedCount: number;
};
```

집계 기준은 현재 focus 목록이 아니라 계획을 확정한 시점의 focus snapshot이다. production 적용 전 다음 migration이 필요하다.

```text
docs/db/migrations/20260903_add_daily_plan_initial_focus_task.sql
```

### 체크리스트

```http
/api/v1/tasks/{taskId}/checklist-items/**
```

- Task 아래 한 단계 item의 조회·생성·제목 수정·완료·재개·삭제·정렬을 지원한다.
- 개인 Task와 Workspace Task에 같은 URL을 사용한다.
- Workspace ACTIVE 멤버는 조회할 수 있다.
- OWNER·EDITOR만 변경할 수 있고 VIEWER 변경은 HTTP 403이다.
- 비활성 멤버와 비멤버의 리소스 노출 여부는 HTTP 404 계약을 따른다.
- item에는 별도 날짜·알림·담당자·재귀 checklist를 추가하지 않는다.

### 개인 카테고리 요약

```http
GET /api/v1/tasks/categories
```

```ts
type TaskCategorySummary = {
  category: string | null;
  displayName: string;
  taskCount: number;
  inboxCount: number;
  todayCount: number;
  doneCount: number;
};
```

- 개인 Task만 집계하고 Workspace Task는 제외한다.
- `category=null`은 미분류이며 `displayName`은 `미분류`다.
- 이 API는 기존 자유 입력 category의 조회 요약이다. 카테고리 entity CRUD나 사용자 지정 순서를 제공하지 않는다.

### 빠른 등록 파싱

```http
POST /api/v1/tasks/quick-capture
```

기존 표현 외에 `낼`, `내일모레`·`낼모레`, 상대 주와 요일 조합, `N시 반`, `HH:mm`을 지원한다. `담주`·`다다음주`·`다담주` 같은 상대 주 표현은 요일과 함께 입력하는 규칙을 mock parser에도 동일하게 적용한다.

## 프론트 연결 순서

빠른 등록 parser와 신규 계약의 타입·API client·mock·query hook을 연결했다. 다음 순서로 화면과 실제 환경을 연결한다.

1. 일일 계획 focus 복원과 확정 mutation은 서버 resource에 연결했다. 예상 시간 입력과 합계는 다음 작업이다.
2. summary를 하루 마감 결과에 연결한다.
3. 개인·Workspace Task 상세에 체크리스트를 연결하고 역할별 행동을 제한한다.
4. 카테고리 요약을 탐색 메뉴에 연결한다.
5. local real API, production Android 순서로 검증한다.

## 아직 백엔드에 요청할 수 있는 계약

### 조건부: 계획·마감 batch mutation

현재 단건 mutation과 부분 실패 재시도 UX를 먼저 사용한다. 실제 사용에서 일부만 저장되는 문제가 반복 확인될 때 모든 operation을 하나의 transaction으로 처리하는 atomic endpoint와 `Idempotency-Key`를 요청한다.

### 조건부: 카테고리 관리

사용자가 메뉴에서 카테고리를 직접 관리해야 할 때 생성·이름 변경·삭제·사용자 지정 정렬과 삭제 시 기존 Task 처리 정책을 요청한다. Workspace category는 개인 범위와 자동으로 섞지 않는다.

이미 구현된 계약을 다시 요청 목록으로 관리하지 않는다. production 요청은 신규 개발이 아니라 최신 image, migration, 식별 가능한 metadata와 smoke 환경 제공에 한정한다.
