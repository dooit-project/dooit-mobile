# 백엔드 연동 Runbook

이 문서는 Dooit Mobile을 실제 백엔드와 붙이기 전에 프론트엔드 기준으로 확인해야 할 환경, API 계약, smoke test 순서를 정리한다. 백엔드 구현 변경은 `dooit-backend` 저장소에서 진행하고, 이 저장소에서는 클라이언트 요구 사항과 검증 결과만 관리한다.

백엔드 원본 계약은 다음 문서를 기준으로 한다.

- [`API_V1_FRONTEND.md`](../../../backend/docs/api/API_V1_FRONTEND.md)
- [`ENVIRONMENT_INTEGRATION.md`](../../../backend/docs/ops/ENVIRONMENT_INTEGRATION.md)
- [`AUTH_CONTRACT.md`](../../../backend/docs/api/AUTH_CONTRACT.md)
- [`API_ERROR_CODES.md`](../../../backend/docs/api/API_ERROR_CODES.md)
- [`RECURRENCE_MODEL.md`](../../../backend/docs/api/RECURRENCE_MODEL.md)
- [`NOTIFICATION_CONTRACT.md`](../../../backend/docs/api/NOTIFICATION_CONTRACT.md)
- [`TIMEZONE_CONTRACT.md`](../../../backend/docs/api/TIMEZONE_CONTRACT.md)
- [`MOBILE_API_BACKEND_STATUS.md`](../../../backend/docs/mobile/MOBILE_API_BACKEND_STATUS.md)

## 1. 환경 모드

로컬 UI 개발과 실제 연동 테스트는 `EXPO_PUBLIC_API_MODE`로 분리한다. `.env.local`은 평소 mock 개발 기준으로 둘 수 있고, 실제 백엔드 연동 확인처럼 일시적으로 값을 바꿔야 할 때는 `EXPO_PUBLIC_API_MODE_OVERRIDE`, `EXPO_PUBLIC_API_URL_OVERRIDE`를 우선 사용한다.

| 모드   | 설정                                                                  | 목적                                             |
| ------ | --------------------------------------------------------------------- | ------------------------------------------------ |
| `mock` | `EXPO_PUBLIC_API_MODE=mock` 또는 `EXPO_PUBLIC_API_MODE_OVERRIDE=mock` | 백엔드 없이 in-memory dummy data로 화면 확인     |
| `real` | `EXPO_PUBLIC_API_MODE_OVERRIDE=real`                                  | `EXPO_PUBLIC_API_URL_OVERRIDE`의 실제 API와 연동 |

`EXPO_PUBLIC_API_MODE`를 생략하면 모바일은 `mock`으로 동작한다. `.env.local`에 mock 값이 남아 있을 수 있으므로 real API 화면 smoke test는 아래 npm script로 실행한다.

```bash
npm run web:real -- --port 8090 --clear
```

플랫폼별 로컬 API 주소는 다음 기준을 따른다.

| 실행 환경             | API URL 예시                     |
| --------------------- | -------------------------------- |
| Web, iOS Simulator    | `http://localhost:8080`          |
| Android Emulator      | `http://10.0.2.2:8080`           |
| 실제 Android/iOS 기기 | `http://<개발 PC의 LAN IP>:8080` |

`EXPO_PUBLIC_*` 값은 앱 번들에 포함되므로 토큰, 비밀번호, 서버 secret, API key를 넣지 않는다. `*_OVERRIDE` 값도 동일하게 public 값으로 취급한다.

## 2. 공통 API 응답 계약

real API 응답은 공통 envelope을 사용해야 한다.

```ts
type ApiEnvelope<T> = {
  status: 'success' | 'fail';
  data?: T;
  error?: {
    code: number;
    message: string;
  };
  timestamp: string;
};
```

- 성공 응답은 `status: "success"`와 `data`를 내려준다.
- 실패 응답은 HTTP status와 함께 `status: "fail"`, `error.code`, `error.message`를 내려준다.
- body가 없는 성공 응답은 `204 No Content`만 허용한다.
- envelope이 없거나 JSON parsing이 실패하면 모바일은 invalid response로 처리한다.
- 기본 timeout은 10초다.

## 3. 인증 계약

모바일은 로그인 성공 시 access token과 native refresh credential·각 만료 시각을 저장하고, 보호 요청에 access token을 자동 첨부한다. 만료 2분 전 선제 갱신, 동시 요청 단일화와 401 뒤 1회 재시도까지 연결되어 있다.

토큰 저장 보안 기준:

- iOS와 Android는 `expo-secure-store`를 사용해 OS 보안 저장소에 access token을 저장한다.
- Web은 브라우저 제약상 `localStorage` fallback을 사용한다. 현재 허용 범위, HttpOnly cookie 전환 조건과 운영 CSP는 [`WEB_SECURITY_POLICY.md`](./WEB_SECURITY_POLICY.md)를 따른다.
- 앱 시작 시 저장된 token을 먼저 메모리로 복원한 뒤 API 요청을 보낸다.
- token은 로그, 오류 메시지, smoke test 출력에 남기지 않는다.
- 백엔드는 등록·게스트 refresh token, rotation·reuse detection, logout과 idle 30일·absolute 90일 계약을 제공한다.
- native SecureStore 저장과 `expiresAt` 기반 선제 갱신을 연결했다. Web HttpOnly cookie 계약과 실서버 smoke test는 [`API_SESSION_LIFECYCLE.md`](../api/API_SESSION_LIFECYCLE.md)를 따른다.

| Method | Path                            | 용도                                  |
| ------ | ------------------------------- | ------------------------------------- |
| `POST` | `/api/v1/auth/guest`            | 게스트 계정과 token 발급              |
| `POST` | `/api/v1/auth/guest/refresh`    | 같은 게스트 ID의 token 갱신           |
| `POST` | `/api/v1/auth/register`         | 회원가입·게스트 승격                  |
| `POST` | `/api/v1/auth/login`            | 로그인·게스트 데이터 병합, token 저장 |
| `POST` | `/api/v1/auth/refresh`          | refresh token 회전과 access 갱신      |
| `POST` | `/api/v1/auth/logout`           | 서버 refresh session 폐기             |
| `GET`  | `/api/v1/auth/me`               | 현재 사용자와 계정 유형 확인          |
| `POST` | `/api/v1/auth/password-reset/*` | 비밀번호 재설정 계약, 배포 여부 확인  |

`POST /api/v1/auth/login` 응답은 다음 필드를 포함해야 한다.

- `tokenType: "Bearer"`
- `accessToken`
- `expiresAt`
- `user`
- 게스트 데이터 병합이 있으면 `mergeResult`, 일반 로그인은 `mergeResult: null`

게스트 발급과 `/auth/me` 기본 계약은 다음 명령으로 확인한다. token은 출력하지 않지만 실행할 때마다 만료 정리 대상 게스트 계정 하나가 생성된다.

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:guest:real
```

401 응답을 받으면 모바일은 access token을 삭제하고 캐시를 비운 뒤 로그인 화면으로 이동해 "세션이 만료됐어요. 다시 로그인해 주세요." 안내를 표시한다. 403 응답은 재로그인 반복 대신 권한 오류로 보여준다.

## 4. 현재 모바일이 호출하는 Task API

| Method   | Path                                    | Query / Body 핵심                   | 사용 화면                 |
| -------- | --------------------------------------- | ----------------------------------- | ------------------------- |
| `GET`    | `/api/v1/tasks`                         | `type`, `taskType?`, `date`         | Calendar 범위 조회        |
| `GET`    | `/api/v1/tasks/search`                  | 검색어, 상태, 유형, 기간, cursor 등 | Search                    |
| `GET`    | `/api/v1/tasks/{taskId}`                | -                                   | 상세                      |
| `POST`   | `/api/v1/tasks`                         | `TaskUpsertRequest`                 | Task 작성                 |
| `POST`   | `/api/v1/tasks/quick-capture`           | 원문 text                           | 빠른 기록                 |
| `PUT`    | `/api/v1/tasks/{taskId}`                | `TaskUpsertRequest`                 | Task 수정                 |
| `DELETE` | `/api/v1/tasks/{taskId}`                | -                                   | Task 삭제                 |
| `GET`    | `/api/v1/tasks/today`                   | `date=YYYY-MM-DD`                   | Today                     |
| `GET`    | `/api/v1/tasks/today/recommendations`   | `date=YYYY-MM-DD`                   | 정리할 항목 추천          |
| `GET`    | `/api/v1/tasks/notification-candidates` | `from`, `to`                        | 로컬 알림 후보            |
| `GET`    | `/api/v1/tasks/done`                    | `date=YYYY-MM-DD`                   | 오늘 완료한 일, Completed |
| `GET`    | `/api/v1/tasks/stale`                   | -                                   | 정리할 항목, 지난 미완료  |
| `GET`    | `/api/v1/tasks/inbox`                   | -                                   | 정리할 항목, 기록함       |
| `PATCH`  | `/api/v1/tasks/{taskId}/done`           | -                                   | 완료 처리                 |
| `PATCH`  | `/api/v1/tasks/{taskId}/today`          | `date=YYYY-MM-DD`                   | 오늘로 이동               |
| `PATCH`  | `/api/v1/tasks/{taskId}/inbox`          | -                                   | 기록함으로 이동           |
| `PATCH`  | `/api/v1/tasks/{taskId}/today-order`    | `date`, `direction=UP\|DOWN`        | Today 순서 변경           |
| `PATCH`  | `/api/v1/tasks/{taskId}/defer-reason`   | `reason`                            | 미루는 이유               |
| `DELETE` | `/api/v1/tasks/{taskId}/defer-reason`   | -                                   | 미루는 이유 해제          |
| `PATCH`  | `/api/v1/tasks/{taskId}/dday-goal`      | `ddayGoalId`                        | D-Day 연결                |
| `DELETE` | `/api/v1/tasks/{taskId}/dday-goal`      | -                                   | D-Day 연결 해제           |
| `PATCH`  | `/api/v1/tasks/{taskId}/done/cancel`    | `date=YYYY-MM-DD`                   | 완료 다시 열기            |

`TaskResponse`는 `src/types/task.ts`를 기준으로 맞춘다. 특히 다음 필드는 Today와 Calendar UI에서 중요하다.

- `type`: `SCHEDULE`, `TODO`, `IDEA`
- `status`: `INBOX`, `TODAY`, `DONE`
- `startAt`, `endAt`, `allDay`, `plannedDate`, `targetDate`, `completedAt`
- `todayOrder`
- `ddayGoalId`, `ddayGoalTitle`, `ddayGoalTargetDate`, `ddayDaysLeft`
- 반복 일정 필드: `recurrenceSeriesId`, nested `recurrence`, `occurrenceDate`, `recurrenceException`
- 알림 후보 응답 필드: `notificationKey`, `scheduledAt`, `recurrenceSeriesId`, `occurrenceDate`, `suppressLocalNotification`, `task`

2026-09-03 백엔드 source에는 다음 계약도 준비됐지만 모바일은 아직 호출하지 않는다.

| Method | Path                                        | 연결 예정 화면           |
| ------ | ------------------------------------------- | ------------------------ |
| `GET`  | `/api/v1/daily-plans/{date}`                | 오늘 계획                |
| `PUT`  | `/api/v1/daily-plans/{date}`                | 계획 확정·마감           |
| `GET`  | `/api/v1/daily-plans/{date}/summary`        | 하루 마감 결과           |
| `GET`  | `/api/v1/tasks/categories`                  | 좌측 메뉴 개인 카테고리  |
| 다수   | `/api/v1/tasks/{taskId}/checklist-items/**` | 개인·Workspace Task 상세 |

정확한 필드와 권한은 [`API_DAILY_EXECUTION.md`](../api/API_DAILY_EXECUTION.md)를 따른다.

## 5. 현재 모바일이 호출하는 D-Day API

| Method   | Path                                | 용도                   |
| -------- | ----------------------------------- | ---------------------- |
| `GET`    | `/api/v1/dday-goals`                | D-Day 목표 목록        |
| `POST`   | `/api/v1/dday-goals`                | D-Day 목표 생성        |
| `GET`    | `/api/v1/dday-goals/{goalId}`       | D-Day 목표 상세        |
| `DELETE` | `/api/v1/dday-goals/{goalId}`       | D-Day 목표 삭제        |
| `GET`    | `/api/v1/dday-goals/{goalId}/tasks` | 목표 연결 Task         |
| `POST`   | `/api/v1/dday-goals/{goalId}/tasks` | 목표용 Today Task 생성 |

삭제 성공 응답:

- 백엔드 v1 표준은 `data: null`이다.
- 모바일 타입과 테스트도 `null` 기준으로 맞춘다.
- 실패 시에는 공통 오류 envelope을 유지하고, 이미 삭제된 목표는 404 또는 멱등 200 중 하나로 정책을 정한다.

## 6. 백엔드에서 우선 확인해야 할 항목

1. 실사용 환경
   - staging, production API URL과 CORS origin이 확정되어 있는지
   - Android Emulator, iOS Simulator, 실제 기기에서 접근 가능한 local/staging 주소가 분리되어 있는지
2. 인증
   - 회원가입, 로그인, 내 정보 조회가 envelope으로 응답하는지
   - 로그인 token이 `Authorization: Bearer`로 정상 인증되는지
   - 401 응답에서 모바일이 세션 만료로 전환되는지
3. Today
   - `GET /api/v1/tasks/today?date=...`가 오늘의 `SCHEDULE`을 먼저, 이후 오늘 할 일을 안정적으로 내려주는지
   - 시간이 있는 당일 일정과 여러 날 일정이 모두 포함되는지
   - 완료, 다시 열기, 오늘로 이동 뒤 관련 목록이 일관되게 갱신되는지
4. Calendar
   - `GET /api/v1/tasks?type=MONTH&date=...`가 해당 월 grid에 필요한 일정 범위를 내려주는지
   - 당일 일정도 하루짜리 bar로 표현할 수 있게 `startAt`/`endAt`이 안정적인지
   - 여러 날 일정이 구간 내 날짜별로 중복·누락 없이 표현되는지
5. Search
   - `statuses`, `taskTypes`는 comma-separated query string으로 받는지
   - `cursor`, `limit`, `nextCursor` pagination이 동작하는지
   - 날짜 filter의 timezone 기준이 `Asia/Seoul`과 어긋나지 않는지
6. D-Day
   - 목표 상세 조회와 목표 Task 생성에서 500이 발생하지 않는지
   - Task와 D-Day 연결/해제가 양쪽 화면에 일관되게 반영되는지
7. 반복 일정
   - 반복 생성, Today·Calendar materialize, occurrence 완료·미룸·건너뛰기, scope 수정·삭제가 현재 계약과 일치하는지 확인한다.
8. 알림
   - `notification-candidates`가 완료·삭제·건너뜀을 제외하고 `notificationKey`, `scheduledAt`, `suppressLocalNotification`을 내려주는지 확인한다.
   - 모바일은 향후 30일 후보 중 가까운 50개를 로컬에 예약하며 실제 OS 동작은 native smoke에서 확인한다.
9. 중복 요청 방지
   - 빠른 기록, 일정 생성, 반복 occurrence 생성처럼 사용자가 여러 번 누를 수 있는 요청에 idempotency 또는 client request id 정책이 필요한지 결정한다.
10. 비밀번호 재설정
    - request, verify, confirm endpoint와 `dooit://password-reset` link의 source 구현은 완료됐다.
    - 대상 배포의 메일 설정과 앱 deep link를 확인하고 전체 복구가 성공해야 실제 사용 가능으로 판정한다.
11. 일일 실행 신규 계약
    - Daily Plan summary migration이 적용됐는지 확인한다.
    - 개인 category 요약에 Workspace Task가 포함되지 않는지 확인한다.
    - Workspace 체크리스트는 ACTIVE 멤버 조회, OWNER·EDITOR 변경, VIEWER 403이 일치하는지 확인한다.
    - quick capture의 `낼`, `낼모레`, 상대 주+요일, `N시 반`, `HH:mm` 결과를 mock과 대조한다.

## 7. real 모드 smoke test 순서

1. `npm run validate`
2. `.env.local` 설정
   - Web 또는 iOS Simulator: `EXPO_PUBLIC_API_URL=http://localhost:8080`
   - Android Emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080`
   - 실제 기기: `EXPO_PUBLIC_API_URL=http://<개발 PC LAN IP>:8080`
3. 앱 재기동
4. Auth
   - 회원가입 → 로그인 → 프로필 email 표시 → 로그아웃
   - 만료 token 또는 비로그인 상태에서 401 처리 확인
   - API 단독 smoke는 `EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:auth:real`로 실행한다.
   - smoke script는 임시 계정 email만 출력하고 token과 비밀번호는 출력하지 않는다.
5. Today
   - 오늘 일정, 오늘 할 일, 오늘 완료한 일 표시
   - 빠른 기록 추가, 완료, 다시 열기
   - 정리할 항목 이동
   - 오늘 계획 확정, 예상 시간과 하루 결과 summary
6. Calendar
   - 3주 grid, 당일 일정 bar, 여러 날 일정 bar
   - 선택 날짜 목록과 Today 목록의 날짜 기준 일치
7. Search
   - 검색어, filter, pagination, 빈 상태
   - 자동 재확인은 `npm run smoke:search:real`로 실행한다.
8. D-Day
   - 목표 생성, 목표 상세, 목표 Task 생성, Task 연결/해제
9. 오류 상태
   - network, timeout, 401, 5xx에서 공통 오류 문구와 retry 확인
10. 카테고리·체크리스트
    - 개인 카테고리의 전체·미분류·상태별 count
    - 개인 Task 체크리스트 CRUD·정렬
    - Workspace OWNER·EDITOR·VIEWER 권한 차이

자세한 화면별 확인 항목은 [`SMOKE_TEST_CHECKLIST.md`](../qa/SMOKE_TEST_CHECKLIST.md)를 따른다.

배포 전에는 다음 명령으로 공개 readiness와 실행 metadata를 함께 확인한다.

```bash
EXPO_PUBLIC_API_URL=<배포 URL> npm run check:backend-deployment
```

검사기는 `GET /actuator/health/readiness`의 `UP`과 `GET /api/v1/system/metadata`의 `commitSha`·`imageTag`·`version` 중 하나 이상을 요구하며, 제공된 값을 모두 출력해 smoke log에 기록할 수 있게 한다.

최신 백엔드 배포의 OpenAPI 계약도 함께 확인한다.

```bash
EXPO_PUBLIC_API_URL=<배포 URL> npm run check:latest-backend-openapi
```

이 검사는 refresh·logout·비밀번호 재설정·metadata endpoint, 11개 생성 POST의 `Idempotency-Key`와 409, token refresh 필드 및 Task 알림 필드를 확인한다.

배포 후보를 한 번에 점검할 때는 통합 명령을 사용한다.

```bash
EXPO_PUBLIC_API_URL=<배포 URL> npm run check:backend-ready
```

통합 검사는 다음 순서로 실행하며 앞 단계가 실패하면 즉시 중단한다.

1. readiness `UP`과 실행 metadata
2. 최신 인증·멱등성·Task 알림 OpenAPI 계약
3. Workspace 23개 operation 계약

신규 Daily Execution 계약을 실제 데이터로 확인할 때는 아래 스모크를 사용한다.

```bash
EXPO_PUBLIC_API_URL=<검증 URL> npm run smoke:daily-execution:real
```

이 스모크는 임시 guest 범위에서 quick-capture 파싱, 개인 category 요약, checklist CRUD, Daily Plan summary를 확인한다. 생성된 Task와 refresh session은 종료 단계에서 정리하며 production 실행 전에는 대상 URL과 guest 계정 생성 정책을 다시 확인한다.

## 8. 현재 남은 연동과 계약

프론트에서 바로 연결할 항목:

- Daily Plan·예상 소요 시간·summary
- 개인 Task category 요약
- 개인·Workspace 체크리스트와 역할별 UI

배포·real smoke로 확인할 항목:

- production image의 source commit, migration과 실행 OpenAPI 일치
- 비밀번호 재설정 메일, refresh rotation·logout과 생성 요청 replay
- 내용 있는 Workspace cascade 삭제와 초대 거절 404·409 복구
- Android 알림, 공유 메뉴와 iOS widget의 실제 기기 동작

추가 백엔드 개발은 카테고리 관리, 계획·마감 atomic batch, Web HttpOnly refresh cookie와 서버 push처럼 제품 결정 또는 실패 근거가 생긴 계약에 한정한다. 현재 상태와 요청 문구는 [`FRONTEND_BACKEND_STATUS.md`](./FRONTEND_BACKEND_STATUS.md)를 기준으로 한다.
