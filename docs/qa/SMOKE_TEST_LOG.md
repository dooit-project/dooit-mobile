# Smoke Test Log

이 문서는 모바일 앱이 실제 사용 가능한 상태인지 확인한 최신 smoke test 기준선만 남긴다. 오래된 조사 과정과 해결된 원인 분석은 git history와 각 커밋에 맡기고, 재실행에 필요한 사실과 남은 확인 항목만 관리한다.

## 2026-08-11 local real API guest refresh and merge smoke

환경:

- API URL: `http://127.0.0.1:8080`
- 실행 명령: `EXPO_PUBLIC_API_URL=http://127.0.0.1:8080 npm run smoke:guest:real`
- 보안: access token과 비밀번호는 출력하지 않음

통과:

- 게스트 계정과 token 발급 후 `/auth/me`가 같은 user id를 반환한다.
- `POST /api/v1/auth/guest/refresh`가 같은 guest user id의 새 token을 반환한다.
- 게스트가 만든 일반 Task 1건, D-Day 연결 Task 1건, 반복 일정 1건, D-Day 목표 1건을 기존 정식 계정 로그인으로 병합한다.
- 병합 응답이 `tasks=2`, `schedules=1`, `ddayGoals=1`, `recurrenceSeries=1`을 반환한다.
- 병합된 Task와 일정의 원본 ID, 반복 series ID, D-Day 목표와 연결 Task 관계가 유지된다.
- 잘못된 비밀번호 로그인은 HTTP 401을 반환하고 기존 guest user id, token과 Task 접근을 유지한다.
- 병합에 사용한 동일 guest token으로 로그인을 재시도하면 모든 병합 건수가 0이며 데이터가 중복되지 않는다.
- 같은 정식 계정으로 다시 로그인해도 병합된 Task가 중복되지 않고 `mergeResult`가 `null`이다.
- 검증에 사용한 Task, 반복 일정, D-Day 연결 Task와 목표는 정식 계정 token으로 삭제했다.
- 게스트 회원가입에서 기존 이메일을 사용하면 HTTP 409가 반환되고 기존 guest user id, account type, token과 Task 접근이 유지된다.
- 새 이메일로 다시 회원가입하면 추가 로그인 없이 같은 user id가 `REGISTERED`로 승격되고 기존 Task를 계속 조회할 수 있다.

메모:

- 환경 변수 없이 기본값 `http://localhost:8080`으로 실행하면 회원가입 후 게스트 생성이 HTTP 500으로 실패했다. 최신 Docker API 검증에는 `127.0.0.1`을 명시한다.
- smoke 실행 과정에서 테스트용 정식 계정과 게스트 계정이 생성된다. 병합된 게스트와 테스트 정식 계정의 정리는 백엔드 보존 정책을 따른다.
- 동시 병합 요청 잠금은 백엔드 통합 테스트에서 별도로 확인한다.

## 2026-08-10 local backend guest deployment preflight

환경:

- 모바일 `main`: 온보딩·게스트 시작 흐름이 반영된 최신 commit
- 백엔드 `main`: 게스트 발급, 회원가입 승격, 로그인 병합, 멱등 재시도 구현 commit 확인
- Docker production API: `http://127.0.0.1:8080`
- 별도 local Java API: `http://localhost:8080`

확인 결과:

- 모바일의 온보딩 관련 미푸시 commit을 `origin/main`에 반영했다.
- 백엔드 게스트 관련 선별 테스트는 통과했다. 전체 390개 테스트 중 게스트와 무관한 `DocumentationSecurityIntegrationTest` 1개는 실패했다.
- Docker API의 `POST /api/v1/auth/guest`는 401 `인증이 필요합니다.`를 반환해 아직 구버전 app이 실행 중인 것으로 확인했다.
- local Java API의 같은 endpoint는 500 `서버 오류가 발생했습니다.`를 반환했다.
- 두 API의 readiness는 DB와 schema를 포함해 `UP`이지만, Docker MySQL의 `APP_USER`를 읽기 전용으로 확인한 결과 `ACCOUNT_TYPE`, `MERGED_INTO_USER_ID`, `GUEST_EXPIRES_AT` 등 게스트 column이 없었다.
- 기존 DB의 `EMAIL`, `PASSWORD_HASH`, `DISPLAY_NAME`도 여전히 `NOT NULL`이어서 게스트 생성에 필요한 `20260809_add_guest_account_columns.sql`이 적용되지 않은 상태다.

다음 순서:

1. production DB backup을 생성하고 복구 가능 여부를 확인한다.
2. app container를 중지한 뒤 `docs/db/migrations/20260809_add_guest_account_columns.sql`을 production DB에 적용한다.
3. 최신 backend `main` image로 app container를 재배포한다.
4. readiness 확인 후 `EXPO_PUBLIC_API_URL=http://127.0.0.1:8080 npm run smoke:guest:real`을 재실행한다.
5. 게스트 발급과 `/auth/me`가 통과하면 승격·병합·멱등 재시도 smoke를 모바일 script에 확장한다.

주의:

- migration과 production container 재배포는 실제 DB를 변경하므로 별도 사용자 승인 후 진행한다.
- 게스트 token 갱신 API와 병합 결과 count 응답은 백엔드에 아직 없다.

## 2026-08-09 mock Web guest session smoke

환경:

- API 모드: `mock`
- URL: `http://localhost:8092/profile`
- 실행 명령: `npm run web:mock -- --localhost --port 8092 --clear`
- 검증 화면: Profile

발견 및 조치:

- 첫 게스트 발급 직후에는 `게스트로 사용 중`이 표시됐지만 Web 새로고침 후 mock 메모리가 초기화되면서 저장 token을 demo 회원으로 잘못 복원했다.
- mock access token에 `accountType`과 user id를 구분해 기록하고, `/auth/me`가 저장된 guest token에서 같은 게스트 사용자를 복원하도록 수정했다.

통과:

- 첫 게스트 세션에서 Profile의 `게스트로 사용 중`, 로그인 버튼, 앱 데이터 삭제 시 복구 불가 안내가 표시된다.
- 새로고침 후에도 같은 게스트 상태 표현과 로그인 동선이 유지된다.
- 새로고침 후 `demo@todolab.app` 정식 회원으로 바뀌지 않는다.
- 단위 테스트에서 저장 guest token의 account type과 user id 복원을 확인한다.

## 2026-08-09 local real API guest auth smoke

환경:

- API URL: `http://127.0.0.1:8080`
- 백엔드: Docker port `127.0.0.1:8080` listen 확인
- 실행 명령: `EXPO_PUBLIC_API_URL=http://127.0.0.1:8080 npm run smoke:guest:real`
- 보안: access token은 출력하지 않음

결과:

- 샌드박스 기본 권한의 로컬 포트 연결 실패 후 승인된 네트워크 권한으로 재실행했다.
- `POST /api/v1/auth/guest`가 HTTP 401과 `인증이 필요합니다.`를 반환해 실패했다.
- 게스트 token이 발급되지 않았으므로 `/api/v1/auth/me` 동일 user id 검증은 실행되지 않았다.
- 실패 응답 기준으로 smoke 실행에서 생성된 게스트 계정은 없다.

다음 확인:

- 현재 실행 중인 백엔드를 게스트 endpoint와 security permit 설정이 포함된 최신 backend commit/image로 재배포한다.
- 재배포 후 같은 명령을 실행해 `GUEST` token 응답과 `/auth/me`의 동일 user id를 확인한다.
- 실제 승격·병합 API가 준비되면 게스트 데이터 소유권 이전과 중복 미발생 검증을 이 smoke에 추가한다.

## 2026-08-03 EAS Android preview APK build 요청

환경:

- EAS owner/project: `hyunseung2/todolab-mobile`
- EAS project id: `f49103dc-1d93-47a9-8972-4b5a4cc9e395`
- Build profile: `preview`
- Platform: Android
- Distribution: internal
- API mode: `real`
- API URL: `https://macmini.tail68d2d1.ts.net`
- Build id: `684720b7-aa78-4a55-920d-d34995dd7a86`
- Build URL: `https://expo.dev/accounts/hyunseung2/projects/todolab-mobile/builds/684720b7-aa78-4a55-920d-d34995dd7a86`
- APK artifact URL: `https://expo.dev/artifacts/eas/g6wzSfaqBYf2a56vseLGY9qsoO0zxBfHx-78ExMhWt8.apk`
- Build 대상 frontend commit: `987c90d13216efddab3c70127f5d543704437bd8`
- App version/build: `1.0.0` / `1`
- Artifact expiration: `2026-08-17T14:13:56.913Z`

상태:

- project upload, fingerprint 계산, remote Android credential 적용까지 통과했다.
- 2026-08-08 재확인 기준 EAS 상태는 `FINISHED`다.
- APK artifact가 생성되었으므로 Android 기기에 설치한 뒤 Expo Go와 Metro 없이 cold start, 로그인, Today, Calendar, Search, D-Day 흐름을 확인한다.
- 이 build는 2026-08-03 기준 frontend commit이므로, 이후 로그인/계정 만들기/비밀번호 재설정 UI 커밋은 포함하지 않는다. 최신 UI가 필요하면 현재 `main` 기준으로 preview APK를 다시 생성한다.

## 현재 기준선: 2026-07-28 local real API full smoke

환경:

- API 모드: `real`
- API URL: `http://localhost:8080`
- 백엔드: local server `8080` listen 확인
- 실행 방식: Node `fetch` 기반 API smoke
- 보안: access token, 비밀번호, 실제 secret은 출력하지 않음
- 테스트 데이터: `mobile-smoke-{runId}@example.com`, `M{runId}` prefix로 생성 후 cleanup

통과:

- Auth: 회원가입, 로그인, 내 정보 조회
- Task: 기록함 TODO 생성, 단건 조회, 수정, 기록함 조회
- Today: 오늘로 이동, 순서 변경, Today 조회, 추천 조회
- 미룬 이유: `WAITING_OTHER` 저장과 해제
- Done: 완료, 완료 목록 조회, 다시 열기
- Schedule: 당일 일정 생성, Today 조회, Calendar 월간 조회, Search 조회
- 여러 날 일정: 2026-07-28–2026-07-30 Today 포함, 2026-07-27·2026-07-31 Today 미포함, Calendar 월간 조회에서 원본 ID 1회 반환
- Search: 검색어, 상태 filter, 종류 filter, cursor pagination, 빈 결과
- D-Day: 목표 생성, 상세 조회, 목록 조회, 목표 Task 생성, 연결 Task 조회, Task와 목표 연결·해제, 목표 삭제
- Stale: 지난 미완료 조회 응답 배열 계약

발견 및 조치:

- 모바일 `DeferReason` enum이 백엔드 v1 계약과 달라 `NO_TIME` 요청이 HTTP 400을 반환했다.
- 모바일 enum과 label을 백엔드 `TOO_BIG | NOT_NEEDED_NOW | AVOIDING | NO_DEADLINE | WAITING_OTHER | ETC` 기준으로 수정했다.
- 재실행 결과 전체 smoke 묶음이 통과했다.

## 2026-07-28 local real API auth smoke

환경:

- API URL: `http://127.0.0.1:8080`
- 백엔드: local server `8080` listen 확인
- 실행 명령: `EXPO_PUBLIC_API_URL=http://127.0.0.1:8080 npm run smoke:auth:real`
- 보안: access token과 비밀번호는 출력하지 않음

통과:

- 회원가입
- 로그인과 `Bearer` access token 응답 계약
- `Authorization: Bearer <token>` 기반 내 정보 조회
- 비인증 `/api/v1/auth/me` 401 거부
- 잘못된 token 401 거부

메모:

- 샌드박스 내부 기본 권한에서는 로컬 포트 연결이 `EPERM`으로 차단되어 권한 승인 후 실행했다.
- `localhost`보다 `127.0.0.1`을 명시하는 편이 smoke 실행 결과를 재현하기 쉽다.

## 2026-07-28 local real Web UI auth smoke

환경:

- API 모드: `real`
- API URL: `http://127.0.0.1:8080`
- 백엔드: local server `8080` listen 확인
- 실행 명령: `npm run web:real -- --port 8090 --clear`
- 보안: access token과 비밀번호는 출력하지 않음

통과:

- 기존 mock token이 real `/api/v1/auth/me`에서 401 처리되고 로그인 화면으로 이동
- 세션 만료 안내 문구 노출
- 회원가입 화면 진입
- 임시 계정 회원가입 후 로그인 화면 복귀
- 로그인 후 Today로 복귀
- Profile 탭에 실제 가입 이메일 표시
- 브라우저 reload 후 저장된 access token으로 세션 복원
- 로그아웃 후 로그인 필요 상태로 복귀

발견 및 조치:

- `.env.local`의 mock 값이 real 화면 smoke와 섞여 실제 모드 확인이 헷갈릴 수 있었다.
- `EXPO_PUBLIC_API_MODE_OVERRIDE`, `EXPO_PUBLIC_API_URL_OVERRIDE`를 일반 환경 값보다 우선 적용하고 `npm run web:real`을 추가했다.
- Expo Web 실행 중 `src/features/tasks/index.ts`와 D-Day feature 사이 require cycle warning이 반복된다. 기능 실패는 아니지만 다음 refactor 후보로 남긴다.

## 최근 화면 QA 기준선

Mock Web 화면에서 확인한 항목:

- Today: 320px, 375px, 430px, 720px에서 horizontal overflow 없음
- Calendar: 320px, 375px, 430px, 720px에서 horizontal overflow 없음
- Today 첫 viewport에서 주간 일정, 일정 목록, 오늘 할 일이 노출됨
- Calendar 320px에서 3주 grid와 선택 날짜 목록이 같은 화면 흐름 안에 표시됨
- 213px stress viewport에서 Today와 Calendar의 개별 element overflow 없음

아직 실제 기기로 다시 볼 항목:

- 실제 iOS 375pt, Android 430dp 기기 또는 simulator에서 safe area와 하단 tab 겹침 여부
- OS font scale 1.5 또는 browser zoom 150%에서 section 제목, row action, 빠른 입력 composer 유지 여부
- light/dark에서 section 색상, calendar rule, hairline 대비
- 일정 label과 여러 날 일정 bar가 날짜 cell 밖으로 튀지 않는지

2026-08-02 재확인:

- `xcrun simctl list devices available`은 `unable to find utility "simctl"`로 실패한다.
- `adb devices`는 `command not found: adb`로 실패한다.
- native smoke는 Xcode simulator runtime, Android Platform Tools, 또는 실제 기기 연결 후 진행한다.

## 2026-07-30 mock Web responsive smoke

환경:

- API 모드: `mock`
- 실행 명령: `npm run web:mock -- --localhost --port 8091 --clear`
- 확인 방식: Browser viewport override + DOM overflow check
- Viewport: 320×760, 375×760, 430×760, 720×760

통과:

- Today와 Calendar 모두 `documentElement.scrollWidth === clientWidth`로 페이지 단위 horizontal overflow 없음
- Today 첫 viewport에서 주간 strip, 일정, 오늘 할 일 section 노출
- Calendar 3주 grid가 320px, 375px, 430px, 720px에서 화면 폭을 밀지 않음
- 하단 탭이 viewport 폭 밖으로 밀리지 않음

메모:

- 긴 일정 label, 긴 Task 설명, tab icon glyph 일부는 element 내부 `scrollWidth > clientWidth`로 감지되지만 페이지 전체 overflow는 만들지 않는다. 현재 UI 의도상 말줄임/clip 대상이다.
- OS font scale 1.5, iOS/Android safe area, light/dark 대비는 실제 기기 또는 simulator에서 별도 확인해야 한다.

## 다음 smoke test 순서

백엔드가 켜져 있을 때:

1. `npm run validate`
2. `npm run web:real -- --port 8090 --clear`로 real 모드 화면 실행
3. Auth, Today, Calendar, Search, D-Day, 정리할 항목, 완료 목록을 실제 화면에서 순서대로 확인
4. 실패 시 사용자에게 보이는 문구, 기존 데이터 유지 여부, retry 가능 여부 기록
5. 새로 발견한 API 계약 차이는 모바일 문서에 먼저 적고 백엔드 저장소에서 별도 처리

반복 Task·일정은 생성, Today/Calendar 조회, 수정·삭제 범위 선택까지 모바일에서 열어둔다. occurrence별 완료·미룸·건너뛰기는 백엔드 상태 변경 API가 통과한 뒤 실제 사용 flow에 포함한다.

## 2026-08-01 local real API search smoke

환경:

- API URL: `http://localhost:8080`
- 백엔드: local server `8080` 접근 가능
- 실행 명령: `npm run smoke:search:real`
- 보안: access token과 비밀번호는 출력하지 않음
- 테스트 데이터: `mobile-search-smoke-{runId}@example.com` 계정에 짧은 smoke title로 생성 후 cleanup

통과:

- 회원가입
- 로그인
- 검색용 TODO, SCHEDULE, DONE Task 생성
- `GET /api/v1/tasks/search?q=...&limit=2` 첫 페이지와 `nextCursor`
- cursor 기반 다음 페이지 조회
- `taskTypes=SCHEDULE`, `dateField=START`, `dateFrom`, `dateTo` filter
- `statuses=DONE` filter
- 빈 검색 결과와 `nextCursor: null`
- 생성 Task cleanup

판정:

- Search real API의 keyword, type filter, status filter, date range, cursor pagination, empty state 계약은 모바일 smoke 기준으로 통과한다.
- 앞으로 Search 화면 regression은 `npm run smoke:search:real`과 Web real 화면 확인을 함께 사용한다.

## 2026-07-29 local real API recurrence smoke

환경:

- API URL: `http://127.0.0.1:8080`
- 백엔드: local server `8080` listen 확인
- 실행 명령: `EXPO_PUBLIC_API_URL=http://127.0.0.1:8080 npm run smoke:recurrence:real`
- 보안: access token과 비밀번호는 출력하지 않음

통과:

- 회원가입
- 로그인
- `POST /api/v1/tasks` 반복 일정 생성
- 생성 응답의 `recurrenceSeriesId`, `occurrenceDate`, nested `recurrence.frequency`, `recurrence.recurrenceRule`
- 실패 후 `DELETE /api/v1/tasks/{id}?recurrenceScope=ALL` cleanup

실패:

- `GET /api/v1/tasks/today?date=2026-08-04`
- 결과: HTTP 500, error code `99999`
- 의미: 반복 생성 계약은 동작하지만 Today 조회에서 첫 occurrence materialize 또는 반복 포함 조회 path 확인이 필요하다.

모바일 조치:

- nested `recurrence` 응답 타입과 `TaskUpsertRequest.recurrence` 타입을 추가한다.
- `PUT/DELETE /api/v1/tasks/{id}?recurrenceScope=...` 호출 기반을 추가한다.
- 반복 생성 UI는 Today/Calendar occurrence 조회 smoke가 통과할 때까지 열지 않는다.

## 2026-07-30 local real API recurrence smoke 재확인

환경:

- API URL: `http://127.0.0.1:8080`
- 백엔드: local server `8080` listen 확인
- 실행 명령: `EXPO_PUBLIC_API_URL=http://127.0.0.1:8080 npm run smoke:recurrence:real`

결과:

- 회원가입, 로그인, `POST /api/v1/tasks` 반복 일정 생성 통과
- `GET /api/v1/tasks/today?date=2026-08-04` 실패
- HTTP status: `500`
- error code: `99999`
- 실패 후 `DELETE /api/v1/tasks/{id}?recurrenceScope=ALL` cleanup 통과

판정:

- 2026-07-29와 같은 실패가 재현된다.
- 모바일 반복 생성 UI는 백엔드 Today/Calendar occurrence materialize path가 수정될 때까지 열지 않는다.

추가 재확인:

- 2026-07-30 후속 실행에서도 회원가입, 로그인, 반복 생성, `recurrenceScope=ALL` cleanup은 통과했다.
- `GET /api/v1/tasks/today?date=2026-08-04`는 동일하게 HTTP 500, error code `99999`로 실패했다.

## 2026-08-01 local real API recurrence smoke 통과

환경:

- API URL: `http://localhost:8080`
- 백엔드: local server `8080` 접근 가능
- 실행 명령: `npm run smoke:recurrence:real`
- 보안: access token과 비밀번호는 출력하지 않음

통과:

- 회원가입
- 로그인
- `POST /api/v1/tasks` 주간 반복 일정 생성
- 생성 응답의 `recurrenceSeriesId`, `occurrenceDate`, `originalOccurrenceDate`, nested `recurrence`
- `GET /api/v1/tasks/today?date=2026-08-04` 첫 occurrence 조회
- `GET /api/v1/tasks/today?date=2026-08-11` 다음 occurrence materialize 조회
- `GET /api/v1/tasks?type=MONTH&taskType=SCHEDULE&date=2026-08` 월간 범위 occurrence 포함
- `DELETE /api/v1/tasks/{id}?recurrenceScope=ALL` cleanup

판정:

- 반복 occurrence Today/Calendar materialize 500은 백엔드 수정 후 모바일 smoke 기준으로 해소됐다.
- 모바일은 반복 작성 UI를 다시 열 수 있다.
- 다음 확인은 occurrence별 완료, 미룸, 건너뛰기, 로컬 알림 후보 예약·취소 흐름이다.

## 2026-08-01 local real API recurrence occurrence action smoke

환경:

- API URL: `http://localhost:8080`
- 백엔드: local server `8080` 접근 가능
- 실행 명령: `npm run smoke:recurrence-actions:real`
- 보안: access token과 비밀번호는 출력하지 않음

통과:

- 회원가입
- 로그인
- `POST /api/v1/tasks` 주간 반복 일정 생성
- `GET /api/v1/tasks/today?date=2026-08-04` 첫 occurrence 조회
- `GET /api/v1/tasks/today?date=2026-08-11` 다음 occurrence materialize 조회
- 실패 후 `DELETE /api/v1/tasks/{id}?recurrenceScope=ALL` cleanup

실패:

- `PATCH /api/v1/tasks/{firstOccurrenceId}/done`
- `PATCH /api/v1/tasks/{secondOccurrenceId}/defer-reason?reason=WAITING_OTHER`
- 결과: HTTP 500, error code `99999`

판정:

- 백엔드 반복 조회와 Calendar/Today materialize는 해소됐지만, materialize된 occurrence row의 상태 변경 path는 아직 확인이 필요하다.
- 모바일은 발생분을 개별 Task처럼 호출하고 있으므로, 백엔드에서 occurrence row의 완료·미룸 처리와 완료 목록(`GET /api/v1/tasks/done?date=...`) 반영을 보강해야 한다.
- `SKIPPED` 타입은 응답 모델에 있으나 모바일 문서와 API client에는 건너뛰기 전용 endpoint가 아직 없다. 백엔드에서 건너뛰기를 `DELETE recurrenceScope=THIS`로 처리하는지, 별도 `skip` endpoint로 처리하는지 확정이 필요하다.

## 2026-08-02 local real API recurrence occurrence action 통과

환경:

- API URL: `http://localhost:8080`
- 백엔드: local server `8080` 접근 가능
- 실행 명령: `npm run smoke:recurrence-actions:real`
- 추가 확인: 완료 목록 조회 기준일 probe
- 보안: access token과 비밀번호는 출력하지 않음

통과:

- 회원가입
- 로그인
- `POST /api/v1/tasks` 주간 반복 일정 생성
- 첫 occurrence Today 조회
- 다음 occurrence Today materialize 조회
- `PATCH /api/v1/tasks/{secondOccurrenceId}/defer-reason?reason=WAITING_OTHER`
- `PATCH /api/v1/tasks/{firstOccurrenceId}/done`
- 미룸 처리한 occurrence가 Today 재조회에서 `deferReason`을 유지
- 완료 처리한 occurrence가 완료 처리일 기준 `GET /api/v1/tasks/done?date=YYYY-MM-DD`에 포함
- 첫 occurrence 완료 후 다음 occurrence는 `DONE`으로 함께 바뀌지 않음
- `DELETE /api/v1/tasks/{thirdOccurrenceId}?recurrenceScope=THIS`
- 건너뛴 occurrence가 Today 재조회와 Calendar 월간 조회에서 제외
- 건너뛴 occurrence 이후의 다음 occurrence는 계속 표시
- `GET /api/v1/tasks/notification-candidates?from=2026-08-01&to=2026-08-31`
- 완료한 occurrence와 건너뛴 occurrence는 알림 후보에서 제외
- 이후 살아있는 occurrence는 알림 후보에 유지
- `DELETE /api/v1/tasks/{id}?recurrenceScope=ALL` cleanup

판정:

- 백엔드 수정 후 materialize된 반복 occurrence의 완료·미룸·건너뛰기 상태 변경은 모바일 smoke 기준으로 통과한다.
- 완료 목록은 occurrence 예정일이 아니라 실제 완료 처리일 기준 `date`로 조회된다. Today/Completed 화면의 “완료한 일” 의미와 일치하므로 모바일 smoke도 완료 처리일 기준으로 맞춘다.
- occurrence 건너뛰기는 `DELETE recurrenceScope=THIS` 계약으로 확인했다.
- 반복 occurrence 로컬 알림 후보는 완료·건너뛰기 상태 변경 후 재조회했을 때 예약 대상에서 제외된다. 실제 기기 알림 예약·취소는 native 권한과 OS scheduler가 필요하므로 실기기 QA에서 별도 확인한다.

## 2026-07-30 local real API auth smoke 재확인

환경:

- API URL: `http://localhost:8080`
- 백엔드: local server `8080` listen 확인
- 실행 명령: `npm run smoke:auth:real`
- 보안: access token과 비밀번호는 출력하지 않음

통과:

- 회원가입
- 로그인과 `Bearer` access token 응답 계약
- `Authorization: Bearer <token>` 기반 내 정보 조회
- 비인증 `/api/v1/auth/me` 401 거부
- 잘못된 token 401 거부

추가 검증:

- 같은 작업 단위에서 `npm run validate` 통과

## 2026-07-30 mock Web accessibility focus smoke

환경:

- API 모드: mock
- 실행 명령: `npm run web:mock -- --localhost --port 8091 --clear`
- 화면: Today `/`, Calendar `/calendar`
- viewport: 375×760

통과:

- Today와 Calendar의 focusable control에 접근성 label 누락 없음
- Today 주간 날짜, 일정 checkbox, Task 상세, 정리할 항목, 하단 tab 순서가 시각 흐름과 크게 어긋나지 않음
- Calendar 이전/다음 주 이동 button은 44×44 target으로 보정
- Calendar 날짜 cell은 선택 상태와 오늘 정보를 label/state로 전달

수정/확인 필요:

- Calendar와 Today의 일정 bar는 시각적으로 얇은 label로 유지하고 `hitSlop`으로 터치 영역을 보강한다. iOS/Android 실기기에서 실제 터치 영역과 VoiceOver/TalkBack 탐색성을 최종 확인한다.

## 2026-07-30 mock Web render performance smoke

환경:

- API 모드: mock
- 실행 명령: `npm run web:mock -- --localhost --port 8091 --clear`
- 화면: Today `/`, Calendar `/calendar`
- viewport: 375×760, 720×760

결과:

| 화면     | viewport | network idle | DOM node | horizontal overflow |
| -------- | -------- | -----------: | -------: | ------------------- |
| Today    | 375×760  |        323ms |      218 | 없음                |
| Calendar | 375×760  |        379ms |      286 | 없음                |
| Today    | 720×760  |        314ms |      218 | 없음                |
| Calendar | 720×760  |        336ms |      286 | 없음                |

판정:

- mock Web 기준 초기 진입과 Calendar 렌더링은 현재 UI 밀도에서 큰 병목이 보이지 않는다.
- Android/iOS 실기기에서는 네이티브 렌더링, 저사양 기기, 큰 글꼴, 실제 API 지연을 별도로 확인한다.
