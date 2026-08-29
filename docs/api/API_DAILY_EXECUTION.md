# 일일 계획·실행 백엔드 요청

Last updated: 2026-08-30

이 문서는 Dooit 모바일의 `오늘 계획 → 실행 → 하루 마감` 흐름에 필요한 신규 백엔드 계약의 우선순위를 정의한다. 백엔드 구현과 DB migration은 `dooit-backend` 저장소에서 별도로 진행한다.

## B0. 일일 계획 영속화

현재 `status=TODAY`, `plannedDate`, `todayOrder`는 오늘 목록과 순서를 표현하지만 사용자가 오늘의 핵심으로 확정한 1~3개와 계획 완료 상태는 표현하지 못한다.

권장 resource:

```http
GET /api/v1/daily-plans/{date}
PUT /api/v1/daily-plans/{date}
```

예시 요청:

```json
{
  "focusTaskIds": [41, 17, 93],
  "status": "CONFIRMED"
}
```

예시 응답:

```json
{
  "date": "2026-08-30",
  "status": "CONFIRMED",
  "focusTaskIds": [41, 17, 93],
  "confirmedAt": "2026-08-30T08:10:00+09:00",
  "closedAt": null,
  "updatedAt": "2026-08-30T08:10:00+09:00"
}
```

계약 조건:

- `focusTaskIds`는 해당 사용자 소유이며 같은 날짜의 미완료 Today Task만 허용한다.
- 최대 3개이며 배열 순서가 집중 순서다.
- Task 완료·삭제·다른 날짜 이동 시 focus 목록에서 자동 제거한다.
- 같은 사용자·날짜에 하나의 plan만 존재한다.
- PUT은 `Idempotency-Key` replay 또는 명시적인 version 기반 충돌 처리를 지원한다.
- user local date와 time zone 기준은 [`API_DATE_TIME.md`](./API_DATE_TIME.md)를 따른다.

## B0. 예상 소요 시간

Task 생성·수정·응답에 다음 nullable 필드를 추가한다.

```json
{
  "estimatedDurationMinutes": 30
}
```

계약 조건:

- `null`은 사용자가 시간을 정하지 않은 상태다.
- 허용 범위는 5~1440분이며 5분 단위를 권장하되 백엔드가 표시 preset을 강제하지 않는다.
- `SCHEDULE`의 `startAt`·`endAt`과 별개다. 일정 길이를 Task 예상 시간에 중복 저장하지 않는다.
- 반복 series 수정 범위와 template의 `defaultDurationMinutes` 적용 규칙을 명시한다.
- Today 응답에는 합계를 별도 필드로 중복 저장하지 않고 Task 값을 기준으로 계산할 수 있어야 한다.

## B1. 계획·마감 batch mutation

프론트 MVP는 기존 단건 mutation으로 먼저 검증한다. 부분 성공 문제가 실제 흐름에서 확인되면 다음 atomic endpoint를 추가한다.

```http
POST /api/v1/daily-plans/{date}/apply
```

```json
{
  "operations": [
    { "taskId": 41, "action": "MOVE_TO_DATE", "date": "2026-08-31" },
    { "taskId": 17, "action": "MOVE_TO_INBOX" },
    { "taskId": 93, "action": "SET_DEFER_REASON", "reason": "TOO_BIG" }
  ],
  "planStatus": "CLOSED"
}
```

계약 조건:

- 모든 operation이 성공하거나 전체가 rollback되는 atomic 처리를 우선한다.
- 중복 Task ID, 권한 없음, 이미 완료·삭제된 Task는 명확한 400·403·404·409로 구분한다.
- `Idempotency-Key`를 지원한다.
- 응답에는 갱신된 Task와 plan을 포함해 추가 refetch 없이 cache를 맞출 수 있게 한다.

## B1. 체크리스트

깊은 계층형 subtask 대신 Task 아래 한 단계 checklist를 우선한다.

필요 계약:

- item 목록 조회 또는 Task 상세 response 포함
- 생성·제목 수정·완료·재개·삭제
- 한 Task 안의 정렬
- 부모 Task 완료 시 미완료 item 처리 규칙
- 반복 Task occurrence에서 checklist 복제·수정 범위

권장 제한:

- 제목 최대 길이와 item 최대 개수 명시
- checklist item에는 별도 날짜·알림·담당자·재귀 checklist를 두지 않는다.
- Workspace Task에 적용할 경우 OWNER·EDITOR·VIEWER 권한을 기존 Task 계약과 일치시킨다.

## B2. 일일 결과 summary

당일 조회를 여러 번 조합하는 비용이나 기기 간 결과 불일치가 실제로 확인될 때만 추가한다.

```http
GET /api/v1/daily-plans/{date}/summary
```

최소 후보:

- 계획 시점의 focus 수
- 완료 수
- 다른 날짜로 이동한 수
- 기록함으로 이동한 수
- 아직 결정하지 않은 수

생산성 점수, 연속 달성과 비교 ranking은 범위에 포함하지 않는다.

## B2. 카테고리

카테고리 entity·정렬·변경·삭제·Task 수 집계는 [`NAVIGATION_INFORMATION_ARCHITECTURE.md`](../product/NAVIGATION_INFORMATION_ARCHITECTURE.md)의 계약을 따른다. 오늘 계획과 예상 시간보다 후순위다.

## 구현 요청 순서

1. 일일 계획 resource와 예상 소요 시간 OpenAPI 초안 합의
2. integration test와 migration을 포함한 backend source 구현
3. mock·real 응답 fixture와 frontend type 연결
4. production 배포 metadata 확인
5. Android·iOS·Web의 같은 계정에서 계획·예상 시간 동기화 smoke
6. 부분 실패 근거가 확인되면 batch mutation 추가
7. 체크리스트, summary, 카테고리 순으로 확장
