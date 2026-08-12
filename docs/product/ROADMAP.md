# ToDoLab Mobile Roadmap

Last updated: 2026-08-13

이 문서는 완료 이력이 아니라 현재 제품 기준과 앞으로 할 일을 관리한다. 과거 검증 결과는 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md), 실제 배포 전 확인은 [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md)에서 관리한다.

## 현재 기준선

- Expo SDK 56, React Native 0.85, React 19, TypeScript 6 기반 Android·iOS·Web 클라이언트다.
- 하단 탭은 `오늘`, `달력`, `더보기`이며 기록함은 Today의 `정리할 항목`에서 다룬다.
- 인증이 없는 신규 사용자는 데이터 화면보다 먼저 `/start`에서 `로그인 없이 시작`, `로그인 또는 계정 만들기`, `기능 둘러보기`를 선택한다.
- 로그인 없이 시작은 순수 로컬 모드가 아니라 서버 게스트 계정이다. 이후 로그인·회원가입 시 게스트 데이터를 계정에 연결한다.
- mock과 real API 모드를 분리하며 실제 비밀 값과 로컬 환경 파일은 커밋하지 않는다.
- 날짜·시간 기준은 백엔드 계약과 동일한 `LocalDate`, `LocalDateTime`, `Asia/Seoul`이다.
- 로컬 알림은 백엔드 후보를 원본으로 삼는 best-effort 기능이며 서버 push와 중복되지 않아야 한다.

## 구현된 핵심 기능

### 인증과 최초 사용

- 게스트 발급·복원·갱신, 회원가입 승격, 기존 계정 로그인, 로그아웃, 세션 만료 복구
- 저장 token 확인 실패와 게스트 token 만료를 구분하고 새 guest id 자동 발급 방지
- 최초 실행 선택 화면, 선택형 기능 둘러보기, 게스트 생성 실패 재시도·로그인 우회
- Today·Calendar·D-Day 맥락형 도움말과 Settings의 가이드 다시 보기
- 계정 연결 결과의 Task·일정·D-Day·반복 series 병합 요약

### Task와 일정

- Inbox·Today·Done 조회, 빠른 기록, 생성·수정·삭제·완료·재개·날짜 이동
- Today 순서 변경, 미룸 사유, 오래된 기록 정리, D-Day 목표 연결
- Calendar 3주 흐름, 하루·여러 날·종일 일정 표시
- 반복 없음·매일·매주·매월·사용자 지정과 occurrence 범위 수정·삭제·건너뛰기
- 통합 검색, 상태·종류·날짜·D-Day filter, cursor pagination

### 로컬 알림

- 최초 실행이 아닌 첫 미래 일정 저장 또는 Settings의 사용자 행동 뒤 권한 요청
- 향후 30일 후보 중 실제 전달 시각이 가까운 50개 예약
- 시간 일정은 시작 시각, 종일 일정은 해당 날짜 오전 9시에 전달
- fingerprint 기반 증분 동기화와 Task 변경·앱 활성화 시 갱신
- 완료·삭제·건너뜀·Inbox 이동·로그아웃·계정 전환 시 예약 정리
- foreground 표시와 알림 선택 시 Task 상세 이동
- `suppressLocalNotification=true` 후보 제외

### 품질과 배포 기반

- 공통 design token과 responsive 기준, light·dark theme, 접근성 label·state·focus
- mock Web 주요 화면과 최초 사용 흐름 캡처
- `npm run validate`에 typecheck, lint, format, 문서 링크, release static check, test 통합
- Expo project, Android package, iOS bundle identifier, EAS profile, Android signing credential 구성
- Android preview APK 저장·검증 script와 real API smoke script

## 앞으로 할 일

### P0. 사용자 화면의 개발 정보 제거

- [x] 비밀번호 재설정 API가 준비되기 전에는 로그인 화면의 진입점을 숨기거나 실제 지원 행동만 제공하고, `백엔드 계약`과 API 목록을 사용자 화면에서 제거한다.
- [x] Settings의 API mode, API URL, Access Token 상태는 development build에서만 보이는 진단 영역으로 분리한다.
- [ ] 전체 UI/UX 감사와 [`shadcn-ui-2026-08-13`](../audits/shadcn-ui-2026-08-13/README.md)의 P1 개선 항목을 순서대로 반영한다.

### P0. 최신 Android APK와 실제 사용 검증

- [ ] 현재 `main`과 `expo-notifications` 네이티브 모듈이 포함된 preview APK를 새로 빌드한다.
- [ ] APK 파일명, frontend commit, EAS build id, API URL을 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록한다.
- [ ] 실제 Android 기기에 설치해 Expo Go와 Metro 없이 cold start 되는지 확인한다.
- [ ] 회원가입·로그인·게스트 시작·재실행·로그아웃·계정 전환을 production DB 범위로 확인한다.
- [ ] Today 조회·추가·수정·완료·재개·재정렬과 Calendar·D-Day·Search를 실제 API로 확인한다.
- [ ] 앱 강제 종료, 기기 재부팅, Wi-Fi·모바일 데이터 전환, API timeout 뒤 상태 복구를 확인한다.

### P0. 네이티브 알림 QA

- [ ] Android에서 권한 미결정·허용·거부·기기 설정 복귀 상태를 확인한다.
- [ ] 시간 일정은 시작 시각, 종일 일정은 오전 9시에 한 번만 수신되는지 확인한다.
- [ ] foreground, background, cold start에서 알림 선택 시 해당 Task 상세로 이동하는지 확인한다.
- [ ] 일정 수정·완료·삭제·Inbox 이동·반복 occurrence 건너뛰기 후 기존 예약이 제거되는지 확인한다.
- [ ] 로그아웃·다른 계정 로그인 후 이전 계정 제목이 알림에 남지 않는지 확인한다.
- [ ] 시간대·기기 날짜 변경 후 앱 활성화 동기화가 예약 시각을 다시 맞추는지 확인한다.
- [ ] 같은 시나리오를 iOS simulator 또는 실기기에서 확인한다.

### P1. 최초 사용과 오류 복구 회귀

- [ ] Android/iOS에서 최초 설치, 앱 재실행, offline, API 4xx·5xx, 저장 token 확인 실패, 게스트 만료를 확인한다.
- [ ] 게스트 생성·로그인·회원가입·병합 실패 시 기존 게스트 token과 데이터가 유지되는지 확인한다.
- [ ] 강제 병합 실패와 네트워크 중단 뒤 재시도가 데이터를 중복 생성하지 않는지 real API로 확인한다.
- [ ] 앱 삭제 후 재설치 시 서버 게스트 데이터의 복구 한계가 안내 문구와 일치하는지 확인한다.
- [ ] 320px·390px·430dp, font scale 1.5, 키보드에서 시작 선택과 오류 복구 행동이 가려지지 않는지 확인한다.

### P1. 접근성·레이아웃·성능

- [x] 공통 빈 상태를 icon·title·description·primary action·secondary action 구조로 정리하고 Today·Calendar부터 적용한다.
- [x] Calendar 빈 날짜에 해당 날짜의 일정 또는 Task를 추가하는 행동을 제공한다.
- [x] Completed와 하루 정리 빈 상태에 Today로 돌아가는 행동을 제공하고, 검색 전 상태와 검색 결과 없음을 구분한다.
- [x] 더보기 메뉴를 계정·작업 도구·앱 설정 그룹으로 나누고 기능 허브 역할에 맞게 탭 이름을 `더보기`로 확정한다.
- [x] 시작·로그인·회원가입·도움말·설정의 긴 문장을 줄이고, 제목의 강제 개행과 본문의 자동 개행 기준을 [`UX_REVIEW_LOG.md`](../design/UX_REVIEW_LOG.md)에 맞춘다.
- [x] Web 320px·390px·430px와 browser zoom 100%·150%에서 고립된 마지막 줄, 조사·서술어 분리, 중요 문구 말줄임을 점검한다.
- [ ] Android·iOS 320dp·390dp·430dp와 font scale 1.0·1.5에서 같은 문장·말줄임 기준을 실기기로 확인한다.
- [ ] iOS VoiceOver와 Android TalkBack에서 Today → Calendar → 더보기 핵심 흐름을 점검한다.
- [ ] checkbox, 일정 bar, tab, 빠른 기록, 알림 설정의 역할·상태·읽기 순서를 확인한다.
- [ ] 375pt iPhone과 430dp Android의 safe area, home indicator, navigation bar, 키보드 겹침을 확인한다.
- [ ] light·dark와 font scale 1.5에서 제목·주요 CTA·오류 문구가 잘리지 않는지 확인한다.
- [ ] 실제 API 지연과 긴 Today·Completed 목록, Calendar 일정 밀집 상태의 렌더링 성능을 확인한다.

### P1. 배포 준비

- [ ] staging·production API URL과 백엔드 배포 버전을 확정한다.
- [ ] 비밀번호 재설정 request·verify·confirm과 메일 deep link를 백엔드에 구현·배포하고 real 복구를 확인한다.
- [ ] API 생성 요청의 idempotency 또는 client request id 정책을 백엔드와 확정한다.
- [ ] refresh token 또는 장기 세션 정책과 게스트 보존 기간을 최종 확정한다.
- [ ] 오류 로깅 도구를 선정하고 [`ERROR_LOGGING_PRIVACY.md`](../qa/ERROR_LOGGING_PRIVACY.md)의 비수집 기준을 적용한다.
- [ ] Android 개인 배포가 안정되면 Play Store, iOS, Web 배포 범위와 버전 정책을 결정한다.
- [ ] runtimeVersion과 OTA updates 사용 여부를 결정한다.

### P2. 후속 제품 기능

- [ ] 사용자가 일정별 알림 시각 또는 미리 알림 간격을 선택할 수 있게 한다.
- [ ] 서버 push가 필요해지면 push token 등록, source 중복 방지, 발송 이력 UX를 별도 설계한다.
- [ ] 자연어 빠른 입력, 하위 작업, 주간 리포트의 필요성과 우선순위를 검증한다.

### P2. Web 운영 검증

모바일 로드맵의 기능·회귀·배포 검증을 마친 뒤 진행한다. Web에서는 로컬 알림을 제공하지 않는다.

- [ ] 운영 Web 빌드에 `EXPO_PUBLIC_API_MODE=real`과 HTTPS API URL을 주입하고 mock 모드 혼입을 막는다.
- [ ] 운영 Web origin의 CORS, `Authorization` header, preflight와 API의 `no-store` 정책을 확인한다.
- [ ] 신규 게스트 → Task 작성 → 새로고침 → 게스트 복원 → 로그인·회원가입 연결을 실제 브라우저에서 확인한다.
- [ ] 로그인 → 새로고침 → 세션 만료 → 재로그인 → 계정 전환에서 token과 React Query cache가 격리되는지 확인한다.
- [ ] Web token 저장 방식을 HttpOnly cookie 또는 localStorage 보완 정책 중 하나로 확정하고 CSP를 적용한다.
- [ ] `/login`, `/calendar`, `/tasks/{id}` 직접 접근과 새로고침이 정적 host의 route fallback에서 동작하는지 확인한다.
- [ ] 브라우저·기기·도메인 변경과 storage 삭제 시 게스트 데이터 복구 한계를 사용자 안내와 일치시킨다.
- [ ] 320px부터 desktop 폭까지 keyboard navigation, zoom 150%, 캐시 갱신과 real API 전체 흐름을 smoke log에 기록한다.

## 외부 의존성

| 의존성                       | 필요한 작업                                                                 | 완료 판단                                 |
| ---------------------------- | --------------------------------------------------------------------------- | ----------------------------------------- |
| 최신 백엔드 배포             | guest refresh, mergeResult, notification candidates가 포함된 동일 버전 배포 | real smoke와 앱 화면이 같은 계약으로 통과 |
| Android 실기기 또는 emulator | APK 설치, 알림, 네트워크, TalkBack, 성능 검증                               | 기기·OS·결과가 smoke log에 기록됨         |
| iOS simulator 또는 실기기    | safe area, VoiceOver, 알림, cold start 검증                                 | 기기·OS·결과가 smoke log에 기록됨         |
| 배포 URL·운영 정책           | staging·production URL, 세션, logging, store 범위 확정                      | release checklist에 값과 담당이 기록됨    |

## 완료 기준

- 신규 사용자가 인증 오류 화면을 보지 않고 게스트 또는 정식 계정 시작 방식을 선택한다.
- 게스트 데이터는 로그인·회원가입·실패·재시도 과정에서 유실되거나 중복되지 않는다.
- Today, Calendar, Search, D-Day, Completed의 핵심 흐름이 mock과 real API에서 일관된다.
- 알림 권한을 강요하지 않으며 예약·취소·계정 격리가 실제 기기에서 검증된다.
- Web은 알림 없이 real API 인증·게스트 복원·데이터 동기화·직접 경로 접근이 운영 도메인에서 검증된다.
- Android APK가 Expo Go·Metro 없이 시작되고 최소 하루 실제 사용에서 치명적 오류가 없다.
- `npm run validate`와 [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md)가 통과한다.

## 범위 밖

- 모바일에서 데이터베이스를 직접 조회하거나 수정하지 않는다.
- IP 주소, 광고 ID, 하드웨어 식별자를 사용자 인증 수단으로 사용하지 않는다.
- 실제 비밀 값과 로컬 환경 파일을 저장소에 기록하지 않는다.
- 서버 push 발송, Store 제출, OTA 배포는 해당 범위를 명시적으로 결정하기 전 자동으로 확대하지 않는다.
