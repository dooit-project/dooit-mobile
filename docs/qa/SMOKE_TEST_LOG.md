# Smoke Test Log

Last updated: 2026-09-06

이 문서는 현재 유효한 검증 기준선과 미검증 범위만 기록한다. 개별 실행 명령과 판정 기준은 [`SMOKE_TEST_CHECKLIST.md`](./SMOKE_TEST_CHECKLIST.md), 배포 후보 확인은 [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md)를 따른다.

## 자동 검증 기준선

- 날짜: 2026-09-06
- frontend 기준: 현재 작업 트리, base `3721265`
- 명령: `npm run validate`
- 결과: 통과
- 테스트: 95 suites, 476 tests
- 대표 화면: Expo Web mock · Chrome · 390×844, 카테고리 drawer 접힘·펼침·검색 이동 4개 PNG를 2026-09-06에 추가
- 브라우저: ChatGPT 앱 내장 브라우저가 `Invalid browser service environment`로 연결되지 않아 Chrome 자동화로 대체했으며 console error는 없었음

## 백엔드 source 확인

- 날짜: 2026-09-03
- backend source: `6a78afe03fa5c805b6defe3b7de5793ca9a4e4e5` (`origin/main`과 일치)
- 관련 테스트: Daily Plan 6, Task API 37, Checklist 5, OpenAPI 7 통과
- 확인 계약: 일일 결과 summary, 개인 category 요약, 개인·Workspace checklist, 빠른 등록 구어 표현
- production: readiness `UP`, metadata `commitSha=local`, `imageTag=docker-20260829`
- 판정: source 계약은 준비됐으나 최신 production 배포와 Daily Plan summary migration 적용은 미확인

세부 상태와 요청은 [`FRONTEND_BACKEND_STATUS.md`](../integration/FRONTEND_BACKEND_STATUS.md)를 따른다.

자동 검증에 포함된 주요 회귀:

- 게스트 bootstrap·복원·갱신·세션 만료 분기
- 로그인·회원가입 반환 동선과 query cache 격리
- 일정 범위·Calendar bar·반복 recurrence·occurrence action
- 검색·D-Day·Today section·Task cache
- 앱 preference와 contextual tip
- 알림 권한 정책·전달 시각·후보 동기화·증분 예약·예약 상한·알림 선택
- Workspace API·mock·권한·반복·D-Day·알림 후보와 기능 노출 정책
- 공유 메뉴 빠른 기록과 iOS widget deep-link·build 격리
- quick-capture의 상대일·상대 주·한국어 날짜·요일·시간 parser 정합성
- Daily Plan·summary·category summary·checklist client, mock, query cache와 Workspace VIEWER 403
- Task 예상 시간 5~1440분 검증·mock 저장·합계·표시 형식
- Daily Plan 확정 snapshot summary의 표시·접근성 label과 하루 마감 이동 즉시 반영
- 개인·Workspace Task 체크리스트 CRUD·정렬, 원형 진행률과 VIEWER 403 계약
- 개인 카테고리 drawer 집계·접힘 상태와 이름 있는 category exact-match 검색 이동
- 운영 Web export의 real mode·HTTPS API URL 검사

자동 검증만으로 확정할 수 없는 항목:

- 실제 Android/iOS 렌더링과 OS 권한 창
- 알림의 실제 전달·소리·선택·cold start
- VoiceOver·TalkBack, font scale, safe area, 키보드
- production API 지연·네트워크 전환·기기 재부팅

## Web 최초 사용 smoke

- 날짜: 2026-08-11
- 환경: mock Web, 320×844·390×844·430×932
- 최신 근거: [`uf-01-first-use-2026-08-23`](../audits/uf-01-first-use-2026-08-23/README.md)
- 결과: 통과

확인 내용:

- 신규 사용자는 데이터 query 전에 시작 방식을 선택한다.
- 기능 둘러보기는 compact 화면에서 세로 스크롤로 모두 접근한다.
- 로그인 선택 후 시작 화면으로 돌아갈 수 있다.
- 게스트 생성 후 빈 Today로 이동하고 인증 오류를 노출하지 않는다.
- 320px 로그인 화면에 입력, 비밀번호 찾기, 계정 만들기, 게스트 복귀 행동이 존재한다.

제한:

- Web mock 결과이며 OS 키보드, 화면 읽기, 네이티브 권한과 알림은 포함하지 않는다.

## 최신 real API 기준선

- 날짜: 2026-08-02
- 환경: local backend `http://localhost:8080`
- 결과: Auth·Task·Today·Done·Schedule·Search·D-Day·Stale·반복 occurrence action 통과

확인 내용:

- 회원가입·로그인·내 정보·로그아웃
- Task 생성·조회·수정·완료·재개·이동·삭제
- 여러 날 일정의 Today 포함 범위와 Calendar 원본 ID 1회 반환
- 검색어·상태·종류·날짜·D-Day filter와 cursor pagination
- 반복 생성과 Today·Calendar occurrence materialize
- occurrence 완료·미룸·건너뛰기와 이후 occurrence 유지
- 완료·건너뛴 occurrence의 notification candidates 제외

재실행 필요:

- 최신 백엔드 배포에서 갱신된 `smoke:guest:real`의 refresh rotation·동일-key replay·`notifyAt` 후보
- `expo-notifications`가 포함된 최신 APK의 실제 후보 예약
- production DB와 staging·production URL

실행 명령:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:auth:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:guest:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:daily-execution:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:search:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:workspace-roles:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:recurrence:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:recurrence-actions:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run check:latest-backend-openapi
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run check:backend-ready
```

`smoke:guest:real`은 실행마다 별도 계정과 데이터를 만들며 다음 최신 계약을 함께 확인한다.

- guest 응답의 access·refresh credential과 만료 시각
- refresh token body 전송, 같은 guest ID 유지와 token rotation
- 같은 `Idempotency-Key`·payload의 순차·동시 replay가 동일 Task를 반환하는지
- 같은 key에 다른 payload를 보내면 HTTP 409로 거절되는지
- 일정의 `notificationEnabled`·`notifyAt` 저장과 후보 `scheduledAt` 일치

`smoke:auth:real`은 등록 계정 로그인 응답의 access·refresh credential, refresh token rotation, 회전된 access로 `/me` 조회, logout 뒤 refresh session 폐기를 확인한다.

`smoke:daily-execution:real`은 실행마다 임시 guest와 Task를 만들고 quick-capture의 `낼모레`·`N시 반`·`HH:mm`, 개인 category 집계, checklist CRUD·완료·재개·정렬, Daily Plan 확정 snapshot summary를 확인한 뒤 생성 Task와 refresh session을 정리한다.

## Workspace 실행 OpenAPI 기준선

- 날짜: 2026-08-19
- 환경: local backend `http://localhost:8080`
- 인접 backend source commit: `5eb6050`
- 명령: `npm run check:workspace-openapi`
- 결과: Workspace 23개 operation 통과

확인 내용:

- Workspace 목록·상세·생성·수정·삭제
- PENDING 초대 조회와 멤버 초대·상태 변경·제거
- Workspace Task CRUD·D-Day 연결·알림 후보
- Workspace D-Day CRUD와 연결 Task 조회

제한:

- 실행 서버 응답에 commit 또는 image tag가 없어 현재 source HEAD와 같은 binary인지는 확정하지 않았다.
- 권한 조합과 실제 데이터 변경 결과는 아래 Workspace 권한 real API 기준선에 기록한다.

## Workspace 권한 real API 기준선

- 날짜: 2026-08-19
- 환경: local backend `http://localhost:8080`
- 인접 backend source commit: `5eb6050`
- 명령: `npm run smoke:workspace-roles:real`
- 계정: 실행마다 분리된 OWNER·EDITOR·VIEWER·PENDING·REMOVED·비멤버 6개

판정 기준:

- OWNER는 Workspace·Task·D-Day를 생성하고 내용이 남은 Workspace를 직접 삭제할 수 있어야 한다.
- EDITOR는 Task를 수정하지만 Workspace 설정은 변경할 수 없다.
- VIEWER는 Task를 조회하지만 생성할 수 없다.
- PENDING은 초대만 조회하고 Workspace에는 접근할 수 없다.
- 최신 스크립트는 PENDING 사용자의 초대 거절 뒤 status가 `REMOVED`이고 초대 목록에서 사라지는지 확인한다.
- REMOVED와 비멤버는 Workspace 존재 여부를 확인할 수 없다.
- 권한 부족은 HTTP 403 `FORBIDDEN`, 비활성·비멤버 접근은 HTTP 404 `WORKSPACE_NOT_FOUND`다.

이전 실행에서 발견한 백엔드 후속 작업:

- Task가 남아 있는 Workspace를 OWNER가 삭제하면 HTTP 500이 발생했다.
- 최신 `smoke:workspace-roles:real`은 Task·반복 series·D-Day·membership을 남긴 상태로 Workspace를 삭제하고 OWNER·EDITOR·VIEWER의 후속 조회가 404인지 확인한다. 완료된 cascade 수정이 배포된 환경에서 재실행해 위 기준선을 갱신해야 한다.

## Android APK 기준선

- 기존 build 날짜: 2026-08-03
- EAS build id: `684720b7-aa78-4a55-920d-d34995dd7a86`
- 상태: `FINISHED`
- frontend commit: `987c90d13216efddab3c70127f5d543704437bd8`

판정:

- 이 APK는 이후 최초 사용·게스트 복구·알림 기능을 포함하지 않아 현재 release 후보가 아니다.
- 현재 `main` 기준 preview APK를 새로 빌드해야 한다.

### 최신 preview APK 빌드

- 제출 날짜: 2026-08-21
- EAS build id: `38acdebc-b5ba-4027-9a43-aacc368bf33f`
- 상태: `FINISHED` (2026-08-21 01:23 KST, 2026-08-29 EAS 재조회)
- profile: `preview`
- frontend commit: `2898493a203965fb651be066a30c01806f4c5e9c`
- API mode / URL: `real` / `https://macmini.tail68d2d1.ts.net`
- app version / versionCode: `1.0.0` / `1`
- 포함 기준: `expo-notifications` production dependency와 native config plugin 정적 검사 통과
- 후속: build 완료 뒤 artifact를 저장하고 실제 Android 기기에서 Tailscale 연결 상태로 cold start·게스트 시작·알림 smoke를 수행한다.

## 다음 기록 양식

```text
날짜:
frontend commit:
backend commit 또는 배포 버전:
빌드 id / APK 파일:
플랫폼·OS·기기:
API mode / URL:
시나리오:
결과: PASS / FAIL / BLOCKED
관찰 내용:
후속 작업:
```

## 다음 필수 smoke

1. 최신 Android preview APK cold start
2. 신규 설치 → 게스트 시작 → Task 작성 → 재실행 → 로그인 연결
3. 알림 권한 허용·거부·설정 복귀
4. 시간 일정·종일 일정 수신과 알림 선택 Task 이동
5. 완료·삭제·건너뜀·로그아웃 뒤 예약 제거
6. production API에서 Today·Calendar·D-Day·Search 전체 흐름
7. 네트워크 전환·offline·기기 재부팅·날짜 경계

## Production 배포 식별 확인

- 날짜: 2026-08-21
- 환경: `https://macmini.tail68d2d1.ts.net`
- readiness: `GET /actuator/health/readiness` HTTP 200, `UP`
- 전체 health: mail `DOWN`으로 HTTP 503이지만 DB·readiness·schema는 `UP`
- 배포 metadata: `GET /actuator/info`가 로그인으로 HTTP 302 redirect되어 commit/image tag 확인 불가
- 판정: `BLOCKED` — readiness와 별개로 배포 식별 metadata 공개 계약 보완 필요

위 기록은 당시 배포 기준이다. 현재 `check:backend-deployment`는 완료된 공개 계약인 `GET /api/v1/system/metadata`에서 `commitSha`·`imageTag`·`version`을 확인하므로 최신 production 배포 후 다시 실행해 이 판정을 갱신한다.

### 2026-08-28 통합 backend readiness 재검사

- readiness: 통과 (`UP`)
- metadata: 통과 (`commitSha`, `imageTag`, `version` 응답 확인)
- 최신 OpenAPI: 실패
- 확인된 누락: auth guest·login·refresh·guest refresh·logout과 비밀번호 재설정 request·verify·confirm의 성공(2xx) response, token response schema
- 참고: task-template·D-Day task endpoint의 path parameter가 `{id}`인 것은 정상이며 checker가 변수명을 무시하도록 보완했다.
- 판정: `BLOCKED` — 백엔드 OpenAPI 성공 응답 문서 보완 후 `npm run check:backend-ready` 재실행
- 독립 Workspace OpenAPI: 강화된 checker로 23개 operation·각 2xx 응답·path parameter 이름 정규화까지 통과했다.

### 2026-08-29 production backend readiness 재검사

- frontend commit: `f8231f3`
- readiness: `UP` 응답 후 metadata 단계까지 진행했지만 `GET /api/v1/system/metadata`가 HTTP 401을 반환해 통합 검사가 중단됐다.
- 최신 OpenAPI: 8개 auth·password reset operation의 2xx response와 token response schema가 여전히 누락됐다.
- 판정: `BLOCKED` — metadata endpoint의 익명 접근을 복구하고 OpenAPI 성공 응답·token schema를 보완한 백엔드 배포 후 `npm run check:backend-ready` 재실행

### 2026-09-06 신규 Daily Execution local real 재검사

- frontend 기준: `2b0f2d5` 이후 작업 트리
- backend source: `d4c4243`; 관련 통합 테스트 3종 `BUILD SUCCESSFUL`
- 실행 인스턴스: Docker image `dooit-backend:63a54d5`와 IntelliJ Java process가 모두 8080에 리슨
- 명령: `npm run smoke:daily-execution:real`
- 결과: IPv4 Docker와 IPv6 Java 모두 첫 `POST /api/v1/auth/guest`가 HTTP 500으로 중단
- 데이터 정리: Task 생성 전 실패하여 잔여 테스트 Task 없음
- 모바일 전체 검증: 96 suites, 479 tests 통과
- 판정: `BLOCKED` — 실행 인스턴스 하나로 정리하고 guest 생성 500을 복구한 뒤 재실행

### 2026-09-07 Workspace checklist 역할별 local real 검사

- 명령: `npm run smoke:workspace-roles:real`
- 체크리스트 결과: OWNER·EDITOR 생성·수정·완료·재개·삭제·정렬 통과
- 권한 결과: VIEWER 조회 통과, 생성·수정·완료·재개·삭제·정렬 HTTP 403, 비멤버 조회 HTTP 404 통과
- 전체 스모크 결과: 기존 반복 Workspace Task의 D-Day 연결에서 HTTP 500
- 데이터 정리: 실패 후 `finally`에서 생성 Workspace 삭제 성공
- 모바일 전체 검증: 96 suites, 480 tests 통과
- 판정: 체크리스트 역할 계약 `PASS`, Workspace 전체 스모크는 D-Day 연결 500으로 `BLOCKED`

### 2026-09-07 EAS Android 준비 재검사

- Expo 계정: `hyunseung2` 로그인 확인
- 현재 project ID: `f49103dc-1d93-47a9-8972-4b5a4cc9e395`
- project 판정: 연결 project `todolab-mobile`과 앱 slug `dooit-mobile` 불일치
- 빌드 API URL: preview·production 모두 `https://dooitapi.hsng.pe.kr`로 최신화
- 자동 검사: `check:eas-setup`이 project ID 존재와 실제 slug 일치를 별도로 확인하도록 보강
- 모바일 전체 검증: 97 suites, 483 tests 통과
- 판정: `BLOCKED` — `@hyunseung2/dooit-mobile` 생성·연결과 signing credential 확인 전 build 금지

### 2026-09-08 EAS project 생성·연결

- Expo project: `@hyunseung2/dooit-mobile`
- project ID: `e67d09ae-0fd9-4305-af7a-af395c8f21be`
- `npm run check:eas-setup`: 계정·project ID·slug 포함 전체 통과
- Android application identifier: `pj.dooit`
- Android credential: 메뉴 접근 성공, 새 project라 keystore 없음
- 설정 정적 검사: 통과
- 판정: project 연결 `PASS`; managed keystore 생성과 preview build는 최신 backend 배포 확인 뒤 진행
