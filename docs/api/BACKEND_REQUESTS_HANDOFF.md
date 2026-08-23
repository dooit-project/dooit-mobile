# ToDoLab 백엔드 요청사항 전달본

Last updated: 2026-08-23

아래 내용은 프론트 출시 준비와 후속 기능 구현에 필요한 백엔드 요청사항 전체입니다. 이 문서 본문을 그대로 백엔드 팀에 전달하면 됩니다.

---

## 전달 메시지

안녕하세요. ToDoLab 프론트의 현재 구현을 기준으로 백엔드에서 확인·구현이 필요한 내용을 우선순위별로 정리했습니다.

프론트는 개인 Task·D-Day·반복·빠른 등록·템플릿과 Workspace 생성·초대 수락·멤버 권한·Task·D-Day·알림 후보까지 구현되어 있습니다. 아래 항목은 백엔드 구현과 배포가 확인되어야 프론트의 real API 연결 및 출시 검증을 완료할 수 있습니다.

API 계약 확인 순서는 다음을 기준으로 부탁드립니다.

1. 백엔드 `docs/api/API_V1_FRONTEND.md`
2. 백엔드 `docs/api/SHARING_CONTRACT.md`
3. 실행 서버 `/v3/api-docs`
4. 아래 요청사항과 프론트 세부 계약 문서

## P0. 출시 검증 전에 필요한 항목

### 1. 내용이 있는 Workspace 삭제 오류 수정

확인된 문제:

- OWNER가 Task가 들어 있는 Workspace에 `DELETE /api/v1/workspaces/{workspaceId}`를 호출하면 HTTP 500 `INTERNAL_SERVER_ERROR`가 발생했습니다.
- Task를 먼저 삭제한 뒤 Workspace를 삭제하면 정상 처리됩니다.

요청:

- Workspace 하위 Task, D-Day, recurrence series, membership의 cascade 또는 명시적 삭제 순서를 구현해 주세요.
- 삭제를 허용하지 않는 정책이라면 HTTP 409 등 안정적인 status와 error code, 사용자가 취할 수 있는 복구 방법을 계약에 명시해 주세요.
- Task와 D-Day가 함께 있는 Workspace 삭제 통합 테스트를 추가해 주세요.

완료 기준:

- 내용이 있는 Workspace 삭제가 HTTP 500을 반환하지 않습니다.
- 삭제 정책과 error code가 `SHARING_CONTRACT.md` 및 OpenAPI에 반영됩니다.
- 같은 배포 버전에서 프론트 real API smoke를 통과합니다.

### 2. 배포 API URL과 실행 버전 식별

요청:

- 프론트가 사용할 staging·production HTTPS API URL을 확정해 주세요.
- `/actuator/health/readiness`는 인증이나 로그인 redirect 없이 `UP`을 확인할 수 있게 유지해 주세요.
- `/actuator/info` 또는 별도 공개 metadata endpoint에서 비밀 값이 아닌 backend commit SHA 또는 image tag를 반환해 주세요.
- 실행 OpenAPI, DB migration과 commit/image가 같은 배포 단위를 가리키게 해 주세요.
- production Web origin도 함께 전달해 CORS allow origin을 확정할 수 있게 해 주세요.

완료 기준:

- 프론트에서 아래 명령이 통과합니다.

```bash
EXPO_PUBLIC_API_URL=<배포 URL> npm run check:backend-deployment
```

- API URL, backend commit/image와 migration이 프론트 smoke 기록에 함께 남습니다.

### 3. 비밀번호 재설정 API와 메일 deep link

필요 endpoint:

```text
POST /api/v1/auth/password-reset/request
POST /api/v1/auth/password-reset/verify
POST /api/v1/auth/password-reset/confirm
```

요청 예시:

```json
// request
{ "email": "user@example.com" }

// verify
{ "token": "opaque-reset-token" }

// confirm
{ "token": "opaque-reset-token", "newPassword": "new-password" }
```

보안·동작 기준:

- 존재하지 않는 이메일에도 같은 성공 응답을 반환해 계정 존재 여부를 노출하지 않습니다.
- request endpoint에 rate limit을 적용합니다.
- reset token은 짧은 수명의 1회용 opaque token이며 응답·일반 로그에 남기지 않습니다.
- 만료·사용됨·변조 token은 안정적인 error code를 반환합니다.
- 성공 시 token을 즉시 폐기하고 기존 session/access token 폐기 여부를 문서화합니다.
- 회원가입과 같은 비밀번호 정책을 사용합니다.
- 메일 link는 `todolab` 앱 deep link와 Web fallback을 지원합니다.

회신 필요:

- reset link 형식
- token TTL
- rate limit 기준
- 비밀번호 정책
- 성공 후 기존 session 처리
- status와 error code

### 4. 운영 Web CORS와 cache 정책

요청:

- 운영 Web origin만 CORS allow origin에 등록해 주세요.
- `Authorization`, `Content-Type`과 도입 후 `Idempotency-Key` request header의 preflight를 허용해 주세요.
- cookie 기반 refresh를 도입하면 exact origin과 credentials를 허용하고 CSRF 방어를 적용해 주세요.
- 인증, 사용자 데이터와 API 응답에 `Cache-Control: no-store`를 적용해 주세요.
- API 오류나 인증 실패를 HTML 로그인 redirect로 바꾸지 말고 JSON status와 error code로 반환해 주세요.

완료 기준:

- 운영 브라우저에서 로그인·게스트·Today·Calendar·D-Day·Search·Workspace 요청이 CORS 오류 없이 동작합니다.
- `Authorization` preflight와 401·403 응답을 프론트가 그대로 처리할 수 있습니다.

## P1. 계약 완료 후 프론트가 연결할 항목

### 5. 생성 API `Idempotency-Key`

목적은 network timeout이나 사용자 재시도로 같은 데이터가 중복 생성되는 것을 막는 것입니다.

우선 대상 endpoint:

```text
POST /api/v1/auth/guest
POST /api/v1/tasks
POST /api/v1/tasks/quick-capture
POST /api/v1/task-templates
POST /api/v1/task-templates/{templateId}/tasks
POST /api/v1/dday-goals
POST /api/v1/dday-goals/{goalId}/tasks
POST /api/v1/workspaces
POST /api/v1/workspaces/{workspaceId}/members
POST /api/v1/workspaces/{workspaceId}/tasks
POST /api/v1/workspaces/{workspaceId}/dday-goals
```

처리 기준:

```text
인증 주체 또는 guest 생성 scope
+ HTTP method
+ normalized path
+ Idempotency-Key
```

- 같은 key와 같은 payload는 resource를 다시 만들지 않고 최초 status와 body를 반환합니다.
- 같은 key와 다른 payload는 HTTP 409, `IDEMPOTENCY_KEY_REUSED`를 반환합니다.
- 동시 요청도 한 번만 생성합니다.
- 처리 결과는 최소 24시간 유지합니다.
- OpenAPI에 header와 409 응답을 추가합니다.
- Web CORS allow headers에 `Idempotency-Key`를 추가합니다.
- replay 여부를 제공한다면 `Idempotency-Replayed: true`를 사용하고 CORS expose headers에 추가합니다.

완료 기준:

- 같은 key·payload의 순차·병렬 요청 결과 resource가 하나입니다.
- 최초 응답을 잃은 뒤 재시도하면 같은 resource 응답을 받습니다.
- 같은 key·다른 payload는 409로 거절됩니다.

### 6. 등록 계정 refresh와 게스트 보존 정책

필요 endpoint:

```text
POST /api/v1/auth/refresh
POST /api/v1/auth/guest/refresh
POST /api/v1/auth/logout
```

목표 수명:

| 대상                | 목표 기간                        |
| ------------------- | -------------------------------- |
| access token        | 발급 후 15분                     |
| 등록 계정 refresh   | 미사용 30일, 최초 로그인 후 90일 |
| 게스트 refresh 자격 | 미사용 30일                      |
| 게스트 서버 데이터  | 마지막 인증 활동 후 최소 90일    |

응답 최소 필드:

```json
{
  "tokenType": "Bearer",
  "accessToken": "...",
  "expiresAt": "2026-08-23T12:15:00",
  "refreshExpiresAt": "2026-11-21T12:00:00",
  "user": {}
}
```

보안·동작 기준:

- native refresh token은 response로 전달할 수 있으며 기기 SecureStore에 저장합니다.
- Web refresh credential은 `Secure`, `HttpOnly`, `SameSite=Lax` cookie로만 전달하고 response body나 localStorage에 두지 않습니다.
- refresh token은 매 사용 시 회전하고 이전 token 재사용 감지 시 token family를 폐기합니다.
- idle 30일과 최초 로그인 기준 90일 absolute lifetime을 구분합니다.
- 로그아웃·비밀번호 변경·보안 조치 시 서버 refresh session을 폐기합니다.
- 만료된 access, 만료된 refresh, token 재사용을 구분하는 error code를 제공합니다.
- refresh·logout과 인증 응답에 `Cache-Control: no-store`를 적용합니다.
- 게스트 refresh 뒤 같은 guest user id와 기존 데이터를 유지합니다.
- 게스트 데이터 90일 보존·삭제 정책을 API 문서와 개인정보 안내에 반영합니다.

주의:

- 등록 계정 refresh 없이 access token부터 15분으로 줄이면 사용자가 반복 로그아웃됩니다. 백엔드 refresh와 프론트 선제 갱신을 같은 배포 단위로 준비한 뒤 적용해 주세요.

### 7. 일정별 알림 preference와 `notifyAt`

제안 타입:

```ts
type TaskNotificationMode = 'NONE' | 'AT_START' | 'MINUTES_BEFORE';

type TaskNotificationPreference = {
  mode: TaskNotificationMode;
  minutesBefore: 5 | 10 | 15 | 30 | 60 | null;
  allDayTime: string | null; // HH:mm:ss
};
```

요청:

- `TaskUpsertRequest`에 선택 필드 `notificationPreference`를 추가합니다.
- `TaskResponse`에 정규화된 preference를 반환합니다.
- notification candidate에 실제 알림 시각 `notifyAt`을 추가합니다.
- 기존 `scheduledAt`은 일정 시작 시각 의미를 유지합니다.
- `NONE`은 후보에서 제외합니다.
- 종일 일정 기본 알림 시각은 사용자 timezone의 `09:00:00`입니다.
- 과거 `notifyAt`은 후보에서 제외합니다.
- 잘못된 조합은 HTTP 400과 안정적인 error code를 반환합니다.
- 반복 일정은 `THIS`, `THIS_AND_FUTURE`, `ALL` 범위에 preference override를 적용합니다.
- guest 승격·계정 병합과 계정 전환에서 preference를 보존·격리합니다.

후보 예시:

```ts
type TaskNotificationCandidateResponse = {
  notificationKey: string;
  taskId: number;
  scheduledAt: string;
  notifyAt: string;
  recurrenceSeriesId: number | null;
  occurrenceDate: string | null;
  suppressLocalNotification: boolean;
  task: TaskResponse;
};
```

완료 기준:

- 단건·반복·종일 일정의 preference와 `notifyAt`이 OpenAPI 및 통합 테스트에 반영됩니다.
- 기존 클라이언트가 추가 필드를 무시해도 현재 시작 시각 알림이 유지됩니다.

### 8. Workspace PENDING 초대 거절

현재 사용자는 PENDING 초대를 수락할 수만 있고 원치 않는 초대를 목록에서 제거할 수 없습니다.

제안 계약:

```http
PATCH /api/v1/workspaces/{workspaceId}/members/{memberId}
Content-Type: application/json

{ "status": "REMOVED" }
```

기존 PATCH 구조와 충돌하면 `POST .../decline` 같은 명시적 action endpoint도 가능합니다.

권한·동작 기준:

- 해당 `memberId`의 PENDING 사용자가 자기 초대만 거절할 수 있습니다.
- OWNER의 role 변경·멤버 제거 권한과 자기 초대 거절을 구분합니다.
- 성공 응답을 최종 membership 또는 `204 No Content` 중 하나로 고정합니다.
- 이미 수락·취소·거절된 초대는 안정적인 HTTP 404 또는 409와 error code를 반환합니다.
- 성공 직후 PENDING 목록과 Workspace 접근 결과에서 제외합니다.
- 같은 사용자 재초대 허용 여부와 cooldown을 문서화합니다.

완료 기준:

- OpenAPI와 권한 통합 테스트에 자기 초대 거절이 반영됩니다.
- PENDING·ACTIVE·REMOVED 상태별 권한 결과가 명확합니다.

## P2. 실제 필요성 확인 후 도입할 조건부 항목

### 9. 서버 push 기기 등록과 발송 멱등성

현재 Android·iOS는 로컬 예약 알림을 사용합니다. 앱 미실행으로 로컬 30일 예약 범위가 갱신되지 않는 문제가 실제로 확인된 뒤 서버 push를 도입할 예정입니다.

초기 범위:

- 로그인한 Android·iOS 계정만 지원합니다.
- 게스트와 Web push는 제외합니다.

제안 endpoint:

```text
PUT /api/v1/notification-devices/{installationId}
DELETE /api/v1/notification-devices/{installationId}
```

등록 요청 예시:

```json
{
  "platform": "ANDROID",
  "provider": "EXPO",
  "pushToken": "ExponentPushToken[...]",
  "appVersion": "1.0.0",
  "timezone": "Asia/Seoul",
  "locale": "ko-KR"
}
```

기준:

- `installationId`는 하드웨어 id가 아닌 앱 설치 단위 임의 값입니다.
- token은 암호화 저장하고 응답·일반 로그·분석 이벤트에 남기지 않습니다.
- token rotation, 로그아웃·계정 전환과 provider invalid token 비활성화를 지원합니다.
- 한 installation은 마지막으로 등록한 계정만 소유합니다.
- 발송 유일성은 다음 조합으로 보장합니다.

```text
accountId + installationId + scope + notificationKey + notifyAt
```

- 최소 상태는 `PENDING`, `SENT`, `FAILED`, `CANCELLED`입니다.
- provider timeout 재시도에도 같은 delivery id를 사용합니다.
- 완료·삭제·건너뜀·Workspace 권한 제거 시 미발송 job을 취소합니다.
- 서버가 발송을 확실히 소유하는 후보에만 `suppressLocalNotification=true`를 반환합니다.
- token 만료·push 비활성화 시 suppression을 먼저 해제합니다.
- push payload에는 Task 설명·카테고리·D-Day 제목·멤버 이름·access token을 넣지 않습니다.

완료 기준:

- 같은 `notificationKey`가 로컬과 push로 중복 수신되지 않습니다.
- token 만료, 계정 전환, 일정 수정·삭제와 Workspace 권한 제거 통합 테스트가 있습니다.

### 10. Workspace 템플릿

현재 제품 우선순위에서 보류 중이며 지금 구현을 요청하는 항목은 아닙니다. 추후 필요성이 확인되면 개인 템플릿과 분리된 Workspace scope, OWNER·EDITOR·VIEWER 권한, 반복·D-Day 적용과 삭제 정책을 먼저 계약해야 합니다.

## 공통 완료·회신 요청

각 항목이 완료되면 아래 내용을 함께 전달해 주세요.

```text
- 완료 항목:
- backend commit SHA 또는 image tag:
- 배포 환경과 API URL:
- 적용 migration:
- 변경된 OpenAPI endpoint/schema/error code:
- 하위 호환 또는 breaking change:
- 실행한 통합 테스트:
- 프론트에서 추가로 확인할 사항:
```

우선 P0 1~4의 처리 여부와 예상 순서를 회신 부탁드립니다. P1은 백엔드 계약이 OpenAPI에 반영된 항목부터 프론트가 순서대로 연결하겠습니다. P2는 별도의 도입 결정 전까지 구현하지 않아도 됩니다.

---

## 프론트 저장소의 세부 참고 문서

- Workspace 오류·초대: [`SHARING_BACKEND_REQUESTS.md`](./SHARING_BACKEND_REQUESTS.md)
- 비밀번호 재설정: [`API_PASSWORD_RESET.md`](./API_PASSWORD_RESET.md)
- 생성 중복 방지: [`API_IDEMPOTENCY.md`](./API_IDEMPOTENCY.md)
- 세션·게스트 보존: [`API_SESSION_LIFECYCLE.md`](./API_SESSION_LIFECYCLE.md)
- 일정별 알림: [`TASK_NOTIFICATION_TIMING_CONTRACT.md`](./TASK_NOTIFICATION_TIMING_CONTRACT.md)
- 서버 push: [`API_PUSH_NOTIFICATIONS.md`](./API_PUSH_NOTIFICATIONS.md)
