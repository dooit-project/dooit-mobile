# API 생성 요청 Idempotency 계약

네트워크 timeout이나 사용자의 재시도로 같은 Task·일정·Workspace가 중복 생성되지 않게 하는 프론트·백엔드 계약이다. 현재 백엔드 계약에는 아직 포함되지 않았으므로, OpenAPI와 CORS 반영 전까지 프론트가 임의 header를 보내지 않는다.

## 전송 계약

- 생성 요청은 `Idempotency-Key` HTTP header를 사용한다.
- 값은 프론트가 생성한 UUID v4 문자열이며 사용자 ID, 이메일, 기기 ID 같은 식별 정보를 넣지 않는다.
- 하나의 사용자 제출 시도에서 만든 key는 network·timeout·5xx 뒤 같은 payload를 재시도할 때 그대로 사용한다.
- 사용자가 입력을 수정하거나 이전 요청이 성공·확정적 4xx로 끝나면 다음 제출에는 새 key를 만든다.
- 프론트는 key를 analytics나 영구 저장소에 남기지 않는다. 진행 중인 mutation과 수동 재시도에 필요한 동안만 보관한다.

예시:

```http
POST /api/v1/tasks
Idempotency-Key: 9d01851c-3a42-44d5-bf10-461481d86543
Content-Type: application/json
```

## 우선 적용 endpoint

중복될 때 사용자 데이터가 달라지는 생성 endpoint에 우선 적용한다.

- `POST /api/v1/auth/guest`
- `POST /api/v1/tasks`
- `POST /api/v1/tasks/quick-capture`
- `POST /api/v1/task-templates`
- `POST /api/v1/task-templates/{templateId}/tasks`
- `POST /api/v1/dday-goals`
- `POST /api/v1/dday-goals/{goalId}/tasks`
- `POST /api/v1/workspaces`
- `POST /api/v1/workspaces/{workspaceId}/members`
- `POST /api/v1/workspaces/{workspaceId}/tasks`
- `POST /api/v1/workspaces/{workspaceId}/dday-goals`

로그인·token refresh·조회 요청은 이 계약의 우선 범위가 아니다. PUT·DELETE처럼 같은 resource에 동일 요청을 반복해도 결과가 같아야 하는 endpoint는 서버 자체의 멱등성을 유지한다.

## 백엔드 처리 기준

백엔드는 다음 조합으로 요청을 식별한다.

```text
인증 주체 또는 guest 생성 scope + HTTP method + normalized path + Idempotency-Key
```

- 최초 요청의 payload fingerprint, 처리 상태, HTTP status와 응답 body를 원자적으로 저장한다.
- 같은 key와 같은 payload가 다시 오면 resource를 다시 만들지 않고 최초 status와 body를 재생한다.
- 같은 key에 다른 payload가 오면 HTTP 409와 안정적인 error code `IDEMPOTENCY_KEY_REUSED`를 반환한다.
- 동시에 같은 key가 들어와도 하나의 생성만 실행한다.
- 완료 기록은 최소 24시간 유지한 뒤 만료할 수 있다.
- 인증 전 guest 생성은 IP나 광고 ID로 묶지 않고 endpoint와 충분히 무작위인 key로 충돌을 방지한다.
- `Idempotency-Key` 자체는 인증 수단이 아니며 응답이나 사용자 화면에 노출하지 않는다.

선택 응답 header:

```http
Idempotency-Replayed: true
```

## Web·CORS

Web 배포를 위해 API CORS에 다음을 반영한다.

- request allow headers: `Idempotency-Key`
- response expose headers: `Idempotency-Replayed`를 프론트에서 사용할 경우에만 추가
- production allow origin은 실제 Web origin으로 제한

새 header가 preflight를 실패시키면 생성 자체가 막히므로 CORS 배포가 확인되기 전에는 프론트 전송을 활성화하지 않는다.

## 프론트 적용 순서

1. 백엔드 OpenAPI와 CORS에 계약을 반영한다.
2. API client의 POST option에 `idempotencyKey`를 추가한다.
3. 각 생성 mutation이 최초 submit에서 key를 만들고 불확실한 실패 재시도에 재사용한다.
4. 성공 또는 확정적 client error 뒤 key를 폐기한다.
5. mock API에서 같은 key·payload의 응답 재생과 다른 payload의 409를 구현한다.
6. timeout 직후 재시도해 Task·D-Day·Workspace가 한 개만 생성되는 real API smoke를 추가한다.

## 완료 판단

- OpenAPI에 대상 endpoint header와 409 응답이 보인다.
- Web preflight가 `Idempotency-Key`를 허용한다.
- 동일 key·payload를 병렬 또는 순차 전송해도 resource가 한 개만 생성된다.
- 최초 응답을 잃은 상황에서 같은 key로 재시도하면 동일 resource 응답을 받는다.
- 같은 key·다른 payload는 409로 거부된다.
