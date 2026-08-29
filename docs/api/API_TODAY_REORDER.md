# Today Task 재정렬 API 후순위 개선안

이 문서는 Dooit 모바일의 drag and drop 재정렬 결과를 한 번의 요청으로 저장하기 위한 후순위 API 개선안을 정의한다.

현재 실사용 준비 단계에서는 필수 요구사항으로 보지 않는다. 모바일은 기존 `UP`/`DOWN` 순서 변경 API로 동작하며, drag and drop 고도화가 실제 우선순위에 올라올 때 이 계약을 다시 검토한다. 백엔드 구현과 데이터베이스 변경은 `dooit-backend` 저장소에서 별도로 진행한다.

## 1. 현재 계약과 문제

현재 모바일은 다음 API로 Task를 한 칸씩 이동한다.

```http
PATCH /api/v1/tasks/{taskId}/today-order?date=YYYY-MM-DD&direction=UP|DOWN
```

drag and drop으로 여러 칸 이동하면 이동 거리만큼 요청을 순차 호출해야 한다. 중간 요청이 실패하면 화면 순서와 서버 순서가 어긋날 수 있고 요청마다 조회 무효화가 발생한다.

다만 현재 UI/UX 방향에서는 카드에 위/아래 버튼을 노출하지 않고, drag and drop도 필수 조작으로 두지 않는다. 따라서 이 API는 “실사용을 막는 백엔드 요청”이 아니라 “정렬 경험을 더 자연스럽게 만들 때의 성능·일관성 개선안”으로 관리한다.

## 2. 제안 API

```http
PUT /api/v1/tasks/today-order
Content-Type: application/json
```

### Request

```ts
type TodayTaskOrderRequest = {
  date: LocalDateString;
  orderedTaskIds: number[];
};
```

예:

```json
{
  "date": "2026-06-30",
  "orderedTaskIds": [42, 18, 77]
}
```

`orderedTaskIds`는 해당 날짜의 `TODAY` 상태이면서 `SCHEDULE`이 아닌 실행 Task 전체를 사용자가 보는 순서대로 전달한다.

## 3. 처리 규칙

- `date`는 [`API_DATE_TIME.md`](./API_DATE_TIME.md)의 `YYYY-MM-DD` 서비스 날짜 규칙을 따른다.
- 배열은 비어 있을 수 있지만 중복 ID를 포함할 수 없다.
- 배열은 요청 시점의 해당 날짜 실행 Task ID 집합과 정확히 일치해야 한다.
- 다른 날짜, `INBOX`, `DONE`, `SCHEDULE` Task ID는 허용하지 않는다.
- 사용자 인증 도입 후에는 현재 사용자가 소유한 Task만 허용한다.
- 서버는 전체 순서를 하나의 transaction에서 원자적으로 저장한다.
- `todayOrder`는 배열 순서대로 충돌 없는 값으로 정규화한다.
- 같은 요청을 반복해도 결과가 달라지지 않는 idempotent 계약으로 제공한다.
- 일정 Task의 시간순 정렬에는 영향을 주지 않는다.

## 4. 응답

성공 시 HTTP 200과 공통 `ApiResponse<T>` envelope를 사용한다.

```ts
type TodayTaskOrderResponse = {
  date: LocalDateString;
  items: TaskResponse[];
};
```

- `items`는 저장된 순서의 실행 Task 전체다.
- 각 항목은 Today 조회와 동일한 완전한 `TaskResponse`다.
- 성공 응답 직후 `GET /api/v1/tasks/today?date=...`도 같은 실행 순서를 반환해야 한다.

## 5. 동시 변경과 오류

| HTTP | 상황                                                                  |
| ---: | --------------------------------------------------------------------- |
|  400 | 잘못된 날짜 형식, 중복 ID, 허용되지 않은 Task 상태·종류               |
|  401 | 인증 필요                                                             |
|  403 | 다른 사용자의 Task 포함                                               |
|  409 | 요청 배열과 현재 실행 Task 집합이 달라 순서를 안전하게 저장할 수 없음 |
|  500 | transaction 실패 등 서버 내부 오류                                    |

Task가 다른 기기에서 추가·완료·이동되어 ID 집합이 달라지면 일부만 저장하지 않고 HTTP 409를 반환한다. 모바일은 최신 Today 목록을 다시 조회하고 사용자가 재정렬하도록 안내한다.

공통 오류 envelope를 유지하며 `message`에는 모바일에 노출 가능한 문구만 포함한다.

## 6. 모바일 동작

1. drag 중에는 로컬 위치만 표시한다.
2. drop 즉시 query cache를 목표 순서로 낙관적 갱신한다.
3. `PUT /api/v1/tasks/today-order`를 한 번 호출한다.
4. 성공하면 응답 `items`로 cache를 확정한다.
5. 실패하면 이전 cache로 복구한다.
6. HTTP 409면 최신 Today 목록을 다시 조회하고 짧은 안내를 표시한다.

mutation 진행 중에는 추가 drop을 막되 Task 완료와 상세 보기는 가능한 범위에서 유지한다.

## 7. 호환성과 전환

- 새 API가 배포되기 전까지 모바일은 기존 `UP`/`DOWN` API를 순차 호출한다.
- 백엔드 배포 후 모바일 API client, mock client, optimistic update와 테스트를 새 계약으로 교체한다.
- 지원 모바일 버전의 전환이 끝날 때까지 기존 API를 유지한다.
- 기존 API 제거 시점은 백엔드 OpenAPI와 배포 기록에 명시한다.

## 8. 백엔드 구현 확인 항목

이 항목은 drag and drop 정렬을 실제 작업 범위로 올릴 때 확인한다.

- [ ] OpenAPI에 request, response, 오류 schema가 등록되어 있다.
- [ ] 전체 순서가 하나의 transaction에서 저장된다.
- [ ] 중복, 누락, 다른 날짜, 일정, 완료 Task ID가 거부된다.
- [ ] 동일 요청 재전송의 idempotency가 검증된다.
- [ ] 동시 추가·완료·재정렬에서 HTTP 409와 rollback이 검증된다.
- [ ] 저장 직후 Today 조회 순서가 응답 순서와 일치한다.
