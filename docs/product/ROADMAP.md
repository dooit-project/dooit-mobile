# Dooit Mobile Roadmap

Last updated: 2026-09-03

이 문서는 현재 제품 범위와 아직 끝나지 않은 일만 관리한다. 백엔드 계약 상태는 [`FRONTEND_BACKEND_STATUS.md`](../integration/FRONTEND_BACKEND_STATUS.md), 출시 판정은 [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md), 과거 결과는 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)와 Git 이력에서 확인한다.

## 현재 상태

- 핵심 개인·Workspace 흐름, 오늘 계획·하루 마감·한 가지 실행과 앱 밖 빠른 기록 prototype이 구현됐다.
- 최신 검증 기준선은 85 suites, 434 tests 통과다. 문서 변경 후 `npm run validate`로 다시 확정한다.
- 백엔드 source `6a78afe`에 일일 결과 summary, 개인 카테고리 요약, Workspace 체크리스트와 빠른 등록 파싱 확장이 반영됐다.
- production은 readiness `UP`이지만 metadata가 `commitSha=local`, `imageTag=docker-20260829`를 반환하므로 최신 source 배포와 migration 적용은 아직 증명되지 않았다.
- EAS project id는 기존 `@hyunseung2/todolab-mobile`을 가리키지만 앱 slug는 `dooit-mobile`이다. 새 `@hyunseung2/dooit-mobile` project 연결 전에는 release 후보를 만들지 않는다.

## P0. 출시 기반 복구

- [ ] `@hyunseung2/dooit-mobile` EAS project를 만들고 `app.json`의 project id를 새 값으로 교체한다.
- [ ] `npm run check:eas-setup`과 Android managed signing credential 접근을 다시 확인한다.
- [ ] 백엔드 `6a78afe` 포함 image와 필수 migration을 production에 반영한다.
- [ ] metadata가 실제 commit/image를 식별하도록 고치고 readiness·metadata·OpenAPI·migration을 한 배포 단위로 확인한다.
- [ ] 현재 `main` 기준 Android preview APK를 만들고 build id, frontend/backend commit, API URL을 smoke log에 남긴다.
- [ ] Expo Go·Metro 없이 Android 실기기 cold start, 최소 하루 사용, 알림·복구·production 핵심 흐름을 확인한다.

## P1. 신규 백엔드 계약 연결

세부 순서는 [`DAILY_EXECUTION_PRIORITIES.md`](./DAILY_EXECUTION_PRIORITIES.md)와 [`API_DAILY_EXECUTION.md`](../api/API_DAILY_EXECUTION.md)를 따른다.

- [ ] quick-capture mock parser와 테스트를 `낼`, `낼모레`, 상대 주+요일, `N시 반`, `HH:mm` 규칙에 맞춘다.
- [ ] Daily Plan·summary·category summary·checklist 타입, API client, mock fixture와 query cache를 추가한다.
- [ ] local preference 기반 오늘 계획을 서버 Daily Plan과 `estimatedDurationMinutes`에 연결한다.
- [ ] 하루 마감 결과를 계획 확정 시점 focus snapshot 기반 summary에 연결한다.
- [ ] 카테고리 요약을 좌측 메뉴에 개인 범위로 연결한다.
- [ ] 개인·Workspace Task 상세에 체크리스트를 추가하고 VIEWER 변경 행동을 제한한다.
- [ ] 신규 API를 local real backend와 production Android에서 검증한다.

## P1. UI·제품 검증

- [ ] 카테고리 메뉴, 체크리스트와 summary 화면은 각각 Product Design 3안을 비교한 뒤 구현한다.
- [ ] 320dp·390dp·430dp, font scale 1.0·1.5, light·dark에서 핵심 행동과 줄바꿈을 확인한다.
- [ ] VoiceOver·TalkBack, Android back, iOS gesture, safe area와 키보드를 실제 기기에서 확인한다.
- [ ] Workspace 초대·체크리스트를 OWNER·EDITOR·VIEWER별로 real smoke한다.
- [ ] 실제 API 지연과 대량 데이터에서 Today·Completed·Calendar 렌더링 시간을 측정한다.
- [ ] 오류·복구, Workspace 역할별 흐름과 native 전용 상태의 캡처 근거를 보강한다.

로컬 Web 화면 검증은 ChatGPT 앱의 내장 브라우저를 기본으로 한다. 내장 연결을 만들 수 없거나 Chrome 고유 동작이 필요한 경우 로컬 Chrome/Playwright로 같은 390×844 조건을 검증하고 환경과 결과를 audit에 기록한다.

## P1. 네이티브 빠른 기록

- [x] 공유 메뉴 text·URL 수신 확인 화면과 quick-capture 전달을 구현했다.
- [x] iOS widget의 빠른 기록 deep link prototype과 native build 격리 검사를 구현했다.
- [ ] iOS development build에서 widget deep link, 인증 bootstrap과 cold start를 확인한다.
- [ ] Android 공유 메뉴에서 text·URL, 취소·재시도와 앱 종료 상태를 확인한다.
- [ ] prototype을 release 범위에 포함할지 실기기 결과 뒤 승인한다.

## P1. 운영·복구·보안

- [ ] 비밀번호 재설정 메일·deep link, guest 병합, refresh rotation·reuse, logout을 production에서 확인한다.
- [ ] 생성 mutation timeout·동일 key replay와 payload 충돌 409를 real smoke한다.
- [ ] 운영 Web의 CORS, CSP, `no-store`, 직접 경로 새로고침과 세션 만료를 확인한다.
- [ ] Web refresh credential의 HttpOnly cookie 운영 여부를 확정한다.
- [ ] Sentry project·DSN·운영 책임자를 정한 뒤 privacy 기준에 맞춰 연결한다.
- [ ] 서버 push 자동 발송과 local suppression 계약은 production 검증과 별도 승인 전 활성화하지 않는다.

## 백엔드에 남은 요청

- 최신 image 배포, migration 적용과 실제 commit SHA가 담긴 metadata
- 실행 OpenAPI를 확인할 수 있는 인증 또는 검사 경로
- 카테고리 관리 승인 시 CRUD·사용자 지정 순서·삭제 정책
- 단건 계획·마감의 부분 실패가 반복될 때 atomic batch mutation
- Web 운영 형태 확정 시 HttpOnly refresh cookie
- 서버 push 승인 시 token lifecycle·발송 멱등성·local/push 소유권

일일 계획, 예상 소요 시간, summary, 개인 카테고리 요약, 개인·Workspace 체크리스트와 빠른 등록 파싱은 이미 source에 있으므로 다시 개발 요청하지 않는다.

## 출시 완료 기준

- 신규 사용자가 게스트 또는 계정으로 시작하고 데이터 연결·복구에서 유실이나 중복이 없다.
- 개인·Workspace 핵심 흐름과 신규 일일 실행 API가 production에서 일관된다.
- Android/iOS 알림과 앱 밖 빠른 기록이 승인된 플랫폼의 실제 기기에서 검증된다.
- Web 인증·데이터 동기화·직접 경로 접근이 운영 도메인에서 동작한다.
- 최신 APK가 Expo Go·Metro 없이 시작되고 치명적 오류 없이 사용된다.
- `npm run validate`와 [`RELEASE_CHECKLIST.md`](../qa/RELEASE_CHECKLIST.md)가 통과한다.

## 범위 밖

- 모바일에서 데이터베이스 직접 조회·수정
- IP 주소·광고 ID·하드웨어 식별자를 인증 수단으로 사용
- 비밀 값과 로컬 환경 파일 저장
- 승인 전 Store 제출, OTA 배포와 서버 push 활성화
