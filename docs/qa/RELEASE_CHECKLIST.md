# Release Checklist

ToDoLab Mobile을 실제 사용 또는 배포 후보로 올리기 전에 확인하는 최종 체크리스트다. 상세 기준은 각 전문 문서에 두고, 이 문서는 배포 직전 빠뜨리기 쉬운 결정과 검증 상태를 한곳에서 확인한다.

## 1. 릴리즈 범위

릴리즈 후보마다 아래 정보를 먼저 채운다.

```text
날짜:
커밋:
배포 대상: Android / iOS / Web
API 모드: mock / real
API URL:
백엔드 커밋 또는 배포 버전:
검증 기기:
담당자:
```

## 2. 코드와 검증

- [ ] 작업 트리에 의도하지 않은 변경이 없다.
- [ ] 실제 비밀 값, `.env.local`, 로컬 인증 정보가 포함되지 않았다.
- [ ] `npm run validate`가 통과했다.
- [ ] Android APK 후보라면 `npm run check:release-static`이 통과했다.
- [ ] EAS 빌드 후보라면 `npm run check:eas-setup`으로 계정 로그인, project 연결, 로컬 상태 Git 제외를 확인했다.
- [ ] 새 의존성을 추가했다면 Expo SDK 56, React Native 0.85 호환성을 확인했다.
- [ ] 플랫폼별 코드 변경이 있으면 Android, iOS, Web 영향 범위를 기록했다.
- [ ] 이번 릴리즈에 포함된 주요 변경을 `README.md`, `ROADMAP.md`, 관련 문서에 반영했다.

## 3. 환경과 API

- [ ] `EXPO_PUBLIC_API_MODE`가 목적에 맞다.
  - 로컬 UI 확인: `mock`
  - 실제 연동 확인: `real`
- [ ] `EXPO_PUBLIC_API_URL`이 대상 환경을 가리킨다.
- [ ] `EXPO_PUBLIC_*`에 secret, token, password, API key가 없다.
- [ ] real 모드에서는 [`BACKEND_INTEGRATION_RUNBOOK.md`](../integration/BACKEND_INTEGRATION_RUNBOOK.md)에 따라 Auth, Today, Calendar, D-Day, Search 흐름을 확인했다.
- [ ] 비밀번호 재설정은 [`API_PASSWORD_RESET.md`](../api/API_PASSWORD_RESET.md) 기준 request·verify·confirm과 메일 deep link가 대상 백엔드에 실제 배포됐는지 확인했다. 미구현 환경은 release 제한으로 기록했다.
- [ ] 401 세션 만료 시 access token 삭제와 로그인 동선이 자연스럽다.
- [ ] network, timeout, 5xx 오류에서 기존 데이터 유지, 오류 문구, retry가 동작한다.
- [ ] 백엔드 변경이 필요하면 모바일 요구 계약만 문서화하고 백엔드 저장소에서 별도로 추적한다.

## 4. 핵심 사용자 흐름

[`SMOKE_TEST_CHECKLIST.md`](./SMOKE_TEST_CHECKLIST.md)를 기준으로 확인한다.

- [ ] 회원가입, 로그인, 비밀번호 재설정 진입, 내 정보 조회, 로그아웃
- [ ] 빠른 기록 추가
- [ ] 기록함/정리할 항목에서 오늘 할 일로 이동 또는 추가
- [ ] Today 일정 표시, 오늘 할 일 완료, 완료 다시 열기
- [ ] Calendar 3주 grid, 하루 일정 label, 여러 날 일정 bar
- [ ] Search mock 결과와 real `/api/v1/tasks/search` 검색, filter, pagination
- [ ] D-Day 목표 생성, 목표 상세, 목표 연결 Task 생성
- [ ] Completed 주 이동, 완료 목록, 다시 열기
- [ ] Profile 목적지 이동

검증 결과는 [`SMOKE_TEST_LOG.md`](./SMOKE_TEST_LOG.md)에 남긴다.

## 5. UI/UX 품질

[`UX_REVIEW_LOG.md`](../design/UX_REVIEW_LOG.md)와 [`DESIGN.md`](../design/DESIGN.md)를 기준으로 확인한다.

- [ ] 첫 viewport에서 오늘의 일정 또는 오늘 할 일을 바로 볼 수 있다.
- [ ] Today는 중복된 화면명·월 제목 없이 주간 strip부터 시작한다.
- [ ] Today 주간 strip은 외곽선과 내부 세로선 없이도 날짜 cell과 오늘 선택 상태를 구분할 수 있다.
- [ ] 월 경계 날짜와 일정 유무가 각각 월 표기와 표시점으로 구분된다.
- [ ] Calendar column rule, 하루 일정 label, 기간 bar가 cell 밖으로 튀지 않는다.
- [ ] 일정, 오늘 할 일, 완료 section 색이 배경과 충분히 구분된다.
- [ ] 빠른 입력 결과에 생성된 제목, 저장 위치, 오늘로 이동·내용 확인 action이 즉시 보인다.
- [ ] 오늘 완료한 일은 최근 3개가 기본으로 보이고 전체 보기·접기가 동작한다.
- [ ] Task 상세의 수정 action이 PageHeader에서 icon과 label로 명확히 보인다.
- [ ] 현재 하단 탭이 icon, label, indicator로 함께 구분된다.
- [ ] 정리할 항목 action copy가 실제 동작과 맞다.
- [ ] Profile shortcut row가 다른 row와 같은 밀도와 radius를 가진다.
- [ ] 320px, 375pt, 430dp, 720px에서 horizontal overflow가 없다.
- [ ] font scale 1.5에서 핵심 제목과 action이 유지된다.
- [ ] light/dark에서 hairline, marker, text 대비가 충분하다.

## 6. 접근성

[`ACCESSIBILITY_CHECKLIST.md`](./ACCESSIBILITY_CHECKLIST.md)를 기준으로 확인한다.

- [ ] 터치 영역은 최소 44pt다.
- [ ] checkbox, 날짜 cell, 일정 bar, quick action의 역할과 상태가 screen reader에 읽힌다.
- [ ] 색상만으로 완료, 위험, 선택 상태를 전달하지 않는다.
- [ ] keyboard focus outline이 시각적으로 구분된다.
- [ ] Web Tab 순서가 시각 순서와 크게 어긋나지 않는다.
- [ ] VoiceOver/TalkBack에서 Today → Calendar → Profile 주요 흐름을 이해할 수 있다.

## 7. 플랫폼 품질

[`PLATFORM_QUALITY_CHECKLIST.md`](./PLATFORM_QUALITY_CHECKLIST.md)를 기준으로 확인한다.

- [ ] Android adaptive icon, monochrome icon preview가 깨지지 않는다.
- [ ] iOS icon이 라운드 마스크 안에서 자연스럽다.
- [ ] Splash에서 첫 화면으로 넘어갈 때 배경 전환이 튀지 않는다.
- [x] 흰색 splash mark와 설정 배경의 정적 대비가 확보됐다.
- [ ] Status bar와 safe area가 light/dark에서 자연스럽다.
- [ ] iOS home indicator, Android navigation bar, 하단 tab이 composer나 CTA를 가리지 않는다.
- [ ] Android back 버튼 첫 동작이 키보드 닫기인지 확인했다.
- [ ] Web favicon이 표시된다.
- [ ] 최초 실행에서는 알림 권한을 요청하지 않고 미래 일정 저장 또는 설정 행동 뒤에만 요청한다.
- [ ] Android/iOS에서 시간 일정과 종일 일정 알림을 각각 지정 시각과 오전 9시에 수신한다.
- [ ] foreground, background, cold start에서 알림 선택 시 해당 Task 상세로 이동한다.
- [ ] 완료·삭제·건너뜀·로그아웃 뒤 이전 로컬 알림 예약이 제거된다.

## 8. 성능과 안정성

[`PERFORMANCE_CHECKLIST.md`](./PERFORMANCE_CHECKLIST.md)를 기준으로 확인한다.

- [ ] 초기 진입에서 skeleton 또는 기존 데이터 유지가 자연스럽다.
- [ ] 긴 Today/Completed 목록에서 스크롤이 끊기지 않는다.
- [ ] Calendar 3주 grid와 일정 bar 렌더링이 과하게 느리지 않다.
- [ ] query retry가 무한 반복처럼 보이지 않는다.
- [ ] pull-to-refresh 후 데이터가 중복 표시되지 않는다.

## 9. Web 배포 캐시

Web 배포 후보라면 [`WEB_DEPLOYMENT_CACHE.md`](../integration/WEB_DEPLOYMENT_CACHE.md)를 기준으로 확인한다.

- [ ] `index.html`이 `no-cache, must-revalidate` 또는 동등한 재검증 정책을 가진다.
- [ ] hashed JS/CSS/image/font asset이 `public, max-age=31536000, immutable` 또는 동등한 장기 캐시 정책을 가진다.
- [ ] API 응답, 인증, 개인정보 관련 endpoint가 정적 asset 장기 캐시 정책과 섞이지 않는다.
- [ ] service worker/PWA cache를 쓰지 않는다면 배포 산출물에 의도치 않은 service worker가 없다.
- [ ] 새 Web 배포 후 사용자가 브라우저 캐시를 수동 초기화하지 않아도 최신 화면으로 진입한다.
- [ ] 정적 host가 `public/_redirects` 또는 동등한 200 rewrite를 적용한다.
- [ ] `/login`, `/calendar`, `/tasks/{id}`, `/workspaces/{id}` 직접 접근과 새로고침이 404 없이 같은 route를 유지한다.

## 9-1. Web 인증과 CSP

Web 배포 후보라면 [`WEB_SECURITY_POLICY.md`](../integration/WEB_SECURITY_POLICY.md)를 기준으로 확인한다.

- [ ] CSP의 `connect-src`가 실제 HTTPS API origin만 허용한다.
- [ ] `script-src`에 `unsafe-inline`과 `unsafe-eval`이 없다.
- [ ] CSP, `nosniff`, frame 차단, referrer와 permissions header가 HTML 응답에 적용된다.
- [ ] preview report-only 점검 뒤 로그인·게스트·Today·Calendar·Workspace에 필요한 요청만 허용된다.
- [ ] 로그아웃·401·계정 전환 뒤 access token이 제거되고 token 값이 URL·로그·오류 보고에 남지 않는다.
- [ ] `localStorage` token은 임시 정책임을 확인하고 HttpOnly refresh cookie 계약 여부를 release 제한에 기록한다.

## 10. 배포 식별자와 빌드

출시 빌드 전 확정해야 한다.

- [x] 앱 표시 이름: `ToDoLab`
- [x] Android package: `com.todolab.mobile`
- [x] iOS bundle identifier: `com.todolab.mobile`
- [x] EAS profile 뼈대: `development`, `preview`, `production`
- [x] scheme 유지 여부: `todolab`
- [x] API mode별 빌드 설정: mock development, real preview/production
- [x] Android signing credential 운영 기준과 비밀 값 제외 원칙
- [x] EAS project 연결 후 Android signing credential 생성과 접근 권한 확인
- [x] EAS preview/production `EXPO_PUBLIC_API_URL` 등록: `https://macmini.tail68d2d1.ts.net`
- [x] 현재 공개 범위와 version·runtimeVersion·OTA 기준 문서화
- [ ] 공개 대상 플랫폼이 [`RELEASE_SCOPE_POLICY.md`](../product/RELEASE_SCOPE_POLICY.md)의 승격 조건을 통과했다.
- [ ] 앱 아이콘, splash, favicon 최종 asset

`npm run check:release-static`으로 앱 이름, slug, scheme, icon/splash/favicon 파일 존재, PNG 크기, Android APK profile과 public 환경값을 함께 확인한다. `npm run check:eas-setup`은 Expo 로그인과 EAS project 연결 후 별도로 실행한다.

Expo project owner, project id, signing credential이 연결되기 전에는 실제 배포용 build를 만들지 않는다.

## 11. 릴리즈 판정

```text
결과: 통과 / 보류
보류 사유:
필수 수정:
후속 수정:
관련 커밋:
관련 이슈 또는 문서:
```

## 12. 개인 APK release note

Android 개인 APK 후보를 만들 때 [`ANDROID_APK_RUNBOOK.md`](../integration/ANDROID_APK_RUNBOOK.md)의 release note 형식을 사용한다.

- [ ] version, versionCode, frontend commit을 기록했다.
- [ ] backend commit 또는 image tag와 API URL을 기록했다.
- [ ] 필수 migration과 breaking API 의존성을 기록했다.
- [ ] rollback target과 데이터 호환성을 확인했다.
- [ ] APK link 또는 파일 위치를 저장소가 아닌 개인 보관 위치에 남겼다.

릴리즈 보류 기준:

- 로그인 또는 Today 핵심 흐름이 real 모드에서 실패한다.
- Calendar 날짜가 Today와 다르게 해석된다.
- 비밀 값 또는 로컬 환경 파일이 포함되어 있다.
- 작은 화면에서 핵심 action이 가려진다.
- 접근성상 완료, 삭제, 로그인 같은 주요 action 목적을 알 수 없다.
