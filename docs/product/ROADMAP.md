# ToDoLab Mobile Roadmap

Last updated: 2026-08-27

이 문서는 현재 제품 범위와 아직 끝나지 않은 일만 관리한다. 완료 과정은 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)와 Git 이력, 출시 판정은 [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md)에서 확인한다.

## 현재 상태

- 핵심 사용자 기능과 Workspace 일정 공유의 프론트 구현은 대부분 완료됐다.
- `npm run validate`의 최신 기준선은 73 suites, 377 tests 통과다.
- mock Web과 local real API smoke는 통과했지만 최신 APK·실기기·운영 도메인 검증은 남아 있다.
- 백엔드 요청 8개는 source `fd2a7e3` 기준 구현됐고 `./gradlew test --rerun-tasks`가 통과했다. 다만 production 배포 버전과 DB migration 적용은 아직 별도 확인이 필요하다.
- 따라서 현재 단계는 **백엔드 계약을 프론트에 연결하고 production 출시를 검증하는 단계**다.

## 현재 구현 범위

### 인증과 최초 사용

- 게스트 발급·복원·갱신, 회원가입 승격, 기존 계정 로그인, 로그아웃, 세션 만료 복구
- 최초 실행 선택, 기능 둘러보기, network·timeout·설정·서버 오류별 실패 안내와 로그인 우회
- 계정 연결 뒤 Task·일정·D-Day·반복 series 병합 결과 안내
- API mode·URL·token 진단 정보는 development build에서만 노출

### Task와 일정

- Inbox·Today·Done 조회와 빠른 등록, 생성·수정·삭제·완료·재개·날짜 이동·재정렬
- Calendar 하루·여러 날·종일 일정, D-Day, 검색과 cursor pagination
- 반복 일정 생성, occurrence 수정·삭제·건너뛰기와 범위 선택
- 개인 Task 템플릿 CRUD와 Today 적용

### Workspace 공유

- Workspace 생성·목록, PENDING 초대 조회·수락·거절, OWNER 멤버·권한 관리
- OWNER·EDITOR·VIEWER별 일정·D-Day·멤버 UI와 권한 제한
- Workspace Task CRUD, 반복 범위, D-Day 연결, 알림 후보와 로컬 예약
- 개인/Workspace scope, 계정·Workspace query cache와 알림 식별자 격리
- 공유 템플릿과 서버 push 설정은 계약 전까지 숨김
- 화면은 일정·D-Day·멤버 탭으로 나누고 320px·390px·430px와 Web 키보드 점검 완료

### 품질과 배포 기반

- 공통 design token, light·dark theme, responsive·접근성 role/state/focus 기준
- 로컬 알림 증분 동기화, 계정 전환 정리, 알림 선택 Task 이동
- mock/real API 분리, real API smoke와 Workspace OpenAPI·권한 검사
- 운영 Web export의 real mode·HTTPS API URL 강제
- Expo/EAS 프로젝트, Android package, iOS bundle identifier와 APK 저장·검증 도구
- 최신 UI P1 재점검과 Task 상세 정보 그룹 개선은 [`current-p1-2026-08-20`](../audits/current-p1-2026-08-20/README.md)에 기록

## 다음 우선순위

### P0. 출시 후보 만들기

- [ ] staging은 사용하지 않는 정책을 유지하고 production HTTPS API URL을 확정한 뒤 `npm run check:backend-deployment`로 readiness와 실행 backend metadata를 확인한다.
- [ ] `npm run check:android-apk` 통과 후 현재 `main`과 `expo-notifications`가 포함된 Android preview APK를 빌드한다.
  - 2026-08-21 `2898493` 기준 EAS build `38acdebc-b5ba-4027-9a43-aacc368bf33f` 제출, 현재 `IN_QUEUE`
- [ ] `npm run apk:release-note`로 APK 파일명, frontend commit, EAS build id, API URL을 생성해 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록한다.
- [ ] [`SMOKE_TEST_CHECKLIST.md`](../qa/SMOKE_TEST_CHECKLIST.md)의 preview APK 순서로 실제 Android 기기에서 Expo Go·Metro 없이 cold start와 최소 하루 사용을 확인한다.
- [ ] production DB에서 인증·게스트·Today·Calendar·D-Day·Search·Workspace 핵심 흐름을 확인한다.

### P0. 백엔드 완료 항목 연결

- [x] Task·D-Day·반복 series·membership이 있는 Workspace cascade 삭제와 통합 테스트가 백엔드에 구현됐다.
- [x] `GET /api/v1/system/metadata`에서 backend commit/image/version을 식별하는 계약이 구현됐다.
- [x] 비밀번호 재설정 request·verify·confirm, 30분 token, rate limit과 `todolab://password-reset` link 계약이 구현됐다.
- [x] 비밀번호 재설정 이메일 입력·token 검증·새 비밀번호 저장 UI와 `todolab://password-reset` route를 연결한다.
- [ ] 최신 백엔드 배포에서 내용 있는 Workspace 삭제와 metadata endpoint를 real smoke로 재검증한다.
- [ ] 메일 발송 환경을 포함한 최신 백엔드 배포에서 비밀번호 재설정 전체 흐름을 확인한다.

백엔드 source 완료 근거와 프론트 후속은 [`BACKEND_STATUS_2026-08-27.md`](../integration/BACKEND_STATUS_2026-08-27.md)를 기준으로 한다. 과거 전달 내용은 [`BACKEND_REQUESTS_HANDOFF.md`](../api/BACKEND_REQUESTS_HANDOFF.md), Workspace 세부 내용은 [`SHARING_BACKEND_REQUESTS.md`](../api/SHARING_BACKEND_REQUESTS.md), 인증 계약은 [`API_PASSWORD_RESET.md`](../api/API_PASSWORD_RESET.md)를 참고한다.

### P1. 네이티브·복구 QA

- [ ] Android/iOS에서 최초 설치, 재실행, offline, API 4xx·5xx, 저장 token 확인 실패와 게스트 만료를 확인한다.
- [ ] 게스트 병합 실패·네트워크 중단·재시도에서 데이터 유실과 중복이 없는지 확인한다.
- [ ] 앱 강제 종료, 기기 재부팅, 네트워크 전환과 API timeout 뒤 상태 복구를 확인한다.
- [ ] 알림 권한 미결정·허용·거부·설정 복귀와 시간·종일 일정 실제 수신을 확인한다.
- [ ] foreground·background·cold start 알림 선택과 일정 변경 뒤 예약 제거를 확인한다.
- [ ] 로그아웃·계정 전환·시간대 변경 뒤 알림 격리와 재동기화를 확인한다.

### P1. 접근성·레이아웃·성능

- [ ] Android/iOS 320dp·390dp·430dp와 font scale 1.0·1.5에서 줄바꿈과 핵심 행동을 확인한다.
- [ ] VoiceOver·TalkBack에서 Today → Calendar → 더보기와 Workspace 탭 흐름을 확인한다.
- [ ] iPhone home indicator, Android navigation bar, 키보드와 safe area 겹침을 확인한다.
- [ ] Workspace 흐름을 browser zoom 150%에서 확인한다.
- [ ] 실제 API 지연과 대량 데이터에서 Today·Completed·Calendar 렌더링 시간을 측정한다.
- [x] 흰색 splash mark가 보이도록 primary 배경과 정적 회귀 검사를 적용한다.
- [ ] [`BRAND_ASSET_REVIEW.md`](../design/BRAND_ASSET_REVIEW.md)를 기준으로 임시 `A` 심볼을 ToDoLab 고유 icon·favicon·adaptive 자산으로 교체한다.

### P1. Today·Navigation 행동 위계

- [x] Today 상단의 독립 월 제목과 미사용 `TodayHeader`, 외곽선과 날짜 열 구분선을 제거하고 월 경계 날짜와 일정 유무 표시를 보완한다.
- [x] 빠른 기록 성공 영역에 방금 만든 제목, 저장 위치, `오늘 할 일로 이동`, `내용 확인`을 제공하고 cache 갱신을 검증한다.
- [x] 오늘 완료한 일이 있으면 최근 3개를 기본으로 펼치고 `전체 N개 보기`와 `접기` 동작을 제공한다.
- [x] Task 상세의 `수정`을 종류 metadata에서 분리해 PageHeader icon+label action으로 이동한다.
- [x] 하단 tab의 활성 label 색·굵기와 선택 indicator를 강화하고 icon만으로 현재 위치를 전달하지 않는지 확인한다.
- [x] [`QUICK_CAPTURE_INBOX_UX_PROPOSAL.md`](./QUICK_CAPTURE_INBOX_UX_PROPOSAL.md)의 최신 기록 1개 preview와 `하루 정리` 분리를 캡처 비교한 뒤 구현한다.
- [x] Workspace Task의 D-Day 연결·제목 수정·삭제 action을 주요 행동과 overflow menu로 정리하고 [`workspace-task-actions-2026-08-26`](../audits/workspace-task-actions-2026-08-26/README.md)에서 전후 캡처를 점검한다.
- [x] Workspace Task 행동 위계를 Web 320px·390px·430px에서 [`workspace-task-responsive-2026-08-26`](../audits/workspace-task-responsive-2026-08-26/README.md)으로 검증한다.
- [x] Workspace Task 행동 위계를 Web 390px light와 접근성 트리에서 [`workspace-task-theme-accessibility-2026-08-27`](../audits/workspace-task-theme-accessibility-2026-08-27/README.md)로 검증한다.
- [ ] 위 변경을 font scale 1.5, dark와 VoiceOver·TalkBack에서 검증한다.

### P1. 사용자 흐름 시각 문서화

- [x] 프론트엔드 핵심 시나리오와 상태별 캡처 커버리지를 [`USER_FLOW_CATALOG.md`](./USER_FLOW_CATALOG.md)에 통합한다.
- [x] UF-01 최초 시작·계정 연결의 최신 mock 캡처를 만들고 FigJam 보드에 흐름도·화면·검토 이슈를 구성한다.
- [ ] mock Web의 최신 기본·완료·빈 상태 캡처를 flow ID별로 갱신한다.
- [ ] 오류·복구와 Workspace 역할별 흐름을 보강한 뒤 승인된 캡처를 FigJam 공유 보드에 배치한다.

### P1. Web 운영 검증

- [x] mock Web static export, 22개 route 산출물, 200 fallback과 service worker 비포함을 [`WEB_MOCK_VALIDATION_2026-08-23.md`](../qa/WEB_MOCK_VALIDATION_2026-08-23.md)에 기록한다.
- [ ] 연결된 브라우저에서 mock 로그인·게스트·Today·Calendar·Workspace, 직접 경로·새로고침·zoom 150%·keyboard를 캡처 검증한다.
  - 로그인·게스트 전환·Today·Calendar·Workspace 빈 목록·직접 경로 새로고침·320/390/430px·기본 focus와 빠른 기록 Escape 닫기는 통과했다. Workspace 생성·상세와 zoom 150%는 남아 있다.
- [ ] 운영 배포 환경에 확정된 HTTPS API URL을 주입하고 `npm run web:export:production` 결과를 확인한다.
- [ ] 운영 origin의 CORS, `Authorization` header, preflight와 API `no-store` 정책을 확인한다.
- [ ] 게스트 생성·새로고침·복원·계정 연결과 로그인 세션 만료·계정 전환을 실제 브라우저에서 확인한다.
- [x] Web token 저장 보완 정책과 CSP를 확정한다. 실제 운영 header 적용은 배포 검증에서 확인한다.
- [x] 정적 host용 200 route fallback과 회귀 검사를 추가한다.
- [ ] 운영 host에서 `/login`, `/calendar`, `/tasks/{id}`, `/workspaces/{id}` 직접 접근과 새로고침을 확인한다.
- [x] 브라우저·도메인 변경과 storage 삭제 시 게스트 복구 한계를 안내와 맞춘다.
- [ ] 320px부터 desktop, keyboard, zoom 150%, cache 갱신 결과를 smoke log에 기록한다.

### P1. 준비된 백엔드 계약 연결

- [x] Task의 `notificationEnabled`·`notifyAt`을 생성·편집 UI와 로컬 예약에 연결한다.
- [x] API 생성 요청은 [`API_IDEMPOTENCY.md`](../api/API_IDEMPOTENCY.md)의 `Idempotency-Key` 정책을 사용한다.
- [x] 백엔드 OpenAPI·CORS와 24시간 replay 저장이 `Idempotency-Key`를 지원한다.
- [x] 우선 대상 생성 mutation에 key를 적용하고 timeout 뒤 동일 key 1회 재시도를 구현한다.
- [x] refresh token·장기 세션과 게스트 90일 보존 목표는 [`API_SESSION_LIFECYCLE.md`](../api/API_SESSION_LIFECYCLE.md)를 따른다.
- [x] 백엔드가 등록·게스트 refresh, logout, rotation·reuse detection과 idle 30일·absolute 90일 계약을 제공한다.
- [x] native SecureStore에 refresh credential과 만료 시각을 저장하고 선제 갱신·동시 요청 단일화·401 1회 재시도를 구현한다.
- [ ] Web refresh credential을 HttpOnly cookie로 운영할지 백엔드와 배포 형태를 확정한다.
- [x] 오류 로깅 도구로 Sentry를 선정하고 [`ERROR_LOGGING_PRIVACY.md`](../qa/ERROR_LOGGING_PRIVACY.md)의 비수집 이벤트 경계를 적용한다.
- [ ] Sentry project·DSN과 운영 책임자가 정해지면 SDK, route ErrorBoundary, source map 업로드를 연결하고 Android·iOS·Web에서 검증한다.
- [x] Workspace 초대 거절, 하위 작업, 주간 리포트의 1차 우선순위는 [`WORKSPACE_FOLLOWUP_PRIORITIES.md`](./WORKSPACE_FOLLOWUP_PRIORITIES.md)를 따른다.
- [x] 백엔드가 자기 PENDING membership을 `REMOVED`로 전환하는 초대 거절 계약과 권한 테스트를 제공한다.
- [x] 받은 초대에 거절 확인·mutation·cache 제거와 404/409 목록 복구를 구현한다.
- [ ] 초대 수락·거절 위계를 320px·글자 확대·keyboard·스크린리더에서 캡처 점검하고 real smoke한다.
- [ ] 하위 작업과 주간 리포트는 반복적인 사용자 요구나 사용 지표가 확인될 때 재검토한다.
- [x] 서버 push의 token 등록, local/push 중복 방지와 발송 이력 UX는 [`API_PUSH_NOTIFICATIONS.md`](../api/API_PUSH_NOTIFICATIONS.md)를 따른다.
- [ ] 백엔드 source의 push 자동 발송과 suppression 계약을 production에서 검증한 뒤 local/push 소유권 전환을 별도 승인한다.
- [x] Store, iOS, Web 공개 범위와 version·runtimeVersion·OTA 기준은 [`RELEASE_SCOPE_POLICY.md`](./RELEASE_SCOPE_POLICY.md)를 따른다.
- [ ] Android Store·iOS·Web은 각 승격 조건을 통과한 플랫폼부터 별도로 공개 승인한다.

## 외부 의존성

| 의존성                | 필요한 결과                                           | 완료 판단                              |
| --------------------- | ----------------------------------------------------- | -------------------------------------- |
| 최신 백엔드 배포      | source 완료 8개 계약, migration, metadata와 메일 설정 | 같은 배포 버전으로 real smoke 통과     |
| Android 기기·emulator | APK, 알림, 네트워크, TalkBack, 성능 검증              | 기기·OS·결과가 smoke log에 기록됨      |
| iOS simulator·실기기  | safe area, VoiceOver, 알림, cold start 검증           | 기기·OS·결과가 smoke log에 기록됨      |
| 운영 도메인·정책      | API URL, CORS, CSP, token, logging 정책               | release checklist에 값과 담당이 기록됨 |

## 출시 완료 기준

- 신규 사용자가 인증 오류 없이 게스트 또는 계정 시작 방식을 선택한다.
- 게스트 데이터가 계정 연결·실패·재시도 과정에서 유실되거나 중복되지 않는다.
- 개인과 Workspace의 핵심 흐름이 production API에서 일관된다.
- Android/iOS 알림 예약·취소·선택·계정 격리가 실제 기기에서 검증된다.
- Web은 알림 없이 인증·게스트 복원·데이터 동기화·직접 경로 접근이 운영 도메인에서 동작한다.
- 최신 APK가 Expo Go·Metro 없이 시작되고 치명적 오류 없이 사용된다.
- `npm run validate`와 [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md)가 통과한다.

## 범위 밖

- 모바일에서 데이터베이스를 직접 조회하거나 수정하지 않는다.
- IP 주소, 광고 ID, 하드웨어 식별자를 인증 수단으로 사용하지 않는다.
- 실제 비밀 값과 로컬 환경 파일을 저장소에 기록하지 않는다.
- 서버 push 발송, Store 제출, OTA 배포는 범위를 명시적으로 결정하기 전 자동으로 확대하지 않는다.
