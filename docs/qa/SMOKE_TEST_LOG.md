# Smoke Test Log

Last updated: 2026-08-21

이 문서는 현재 유효한 검증 기준선과 미검증 범위만 기록한다. 개별 실행 명령과 판정 기준은 [`SMOKE_TEST_CHECKLIST.md`](./SMOKE_TEST_CHECKLIST.md), 배포 후보 확인은 [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md)를 따른다.

## 자동 검증 기준선

- 날짜: 2026-08-21
- frontend commit: `5120deb`
- 명령: `npm run validate`
- 결과: 통과
- 범위: TypeScript, ESLint, Prettier, 문서 링크, release asset·Android APK 정적 설정, Jest
- 테스트: 67 suites, 359 tests

자동 검증에 포함된 주요 회귀:

- 게스트 bootstrap·복원·갱신·세션 만료 분기
- 로그인·회원가입 반환 동선과 query cache 격리
- 일정 범위·Calendar bar·반복 recurrence·occurrence action
- 검색·D-Day·Today section·Task cache
- 앱 preference와 contextual tip
- 알림 권한 정책·전달 시각·후보 동기화·증분 예약·예약 상한·알림 선택
- Workspace API·mock·권한·반복·D-Day·알림 후보와 기능 노출 정책
- 운영 Web export의 real mode·HTTPS API URL 검사

자동 검증만으로 확정할 수 없는 항목:

- 실제 Android/iOS 렌더링과 OS 권한 창
- 알림의 실제 전달·소리·선택·cold start
- VoiceOver·TalkBack, font scale, safe area, 키보드
- production API 지연·네트워크 전환·기기 재부팅

## 최신 Web 최초 사용 smoke

- 날짜: 2026-08-11
- 환경: mock Web, 320×844·390×844·430×932
- 근거: [`first-use-2026-08-11`](../audits/first-use-2026-08-11/README.md)
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
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:search:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:workspace-roles:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:recurrence:real
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run smoke:recurrence-actions:real
```

`smoke:guest:real`은 실행마다 별도 계정과 데이터를 만들며 다음 최신 계약을 함께 확인한다.

- guest 응답의 access·refresh credential과 만료 시각
- refresh token body 전송, 같은 guest ID 유지와 token rotation
- 같은 `Idempotency-Key`·payload replay가 동일 Task를 반환하는지
- 일정의 `notificationEnabled`·`notifyAt` 저장과 후보 `scheduledAt` 일치

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

- OWNER는 Workspace·Task를 생성하고 Task 정리 후 Workspace를 삭제할 수 있다.
- EDITOR는 Task를 수정하지만 Workspace 설정은 변경할 수 없다.
- VIEWER는 Task를 조회하지만 생성할 수 없다.
- PENDING은 초대만 조회하고 Workspace에는 접근할 수 없다.
- REMOVED와 비멤버는 Workspace 존재 여부를 확인할 수 없다.
- 권한 부족은 HTTP 403 `FORBIDDEN`, 비활성·비멤버 접근은 HTTP 404 `WORKSPACE_NOT_FOUND`다.

발견한 백엔드 후속 작업:

- Task가 남아 있는 Workspace를 OWNER가 삭제하면 HTTP 500이 발생했다.
- 권한 행렬 smoke의 데이터 정리는 Task를 먼저 삭제해 수행하며, Workspace 삭제 정책 보완 후 별도 재검증한다.

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
- 상태: `IN_QUEUE`
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
