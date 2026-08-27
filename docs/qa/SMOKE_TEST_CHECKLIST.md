# Android·iOS·Web Smoke Test 체크리스트

이 문서는 ToDoLab 모바일을 mock 모드와 real API 모드에서 빠르게 검증할 때 사용하는 시나리오다. 실제 기기 연결 또는 인앱 브라우저 연결이 가능할 때 이 순서대로 확인한다.

## 공통 준비

- mock 모드:
  - `EXPO_PUBLIC_API_MODE=mock` 또는 `npm run web:mock`
  - 백엔드 없이 UI, navigation, 상태 변화 확인
- real 모드:
  - `npm run web:real -- --port 8090 --clear`
  - `EXPO_PUBLIC_API_URL_OVERRIDE`가 로컬 또는 테스트 백엔드를 가리키는지 확인
- 테스트 전 확인:
  - `npm run validate`
  - 앱 재기동
  - 캐시가 의심되면 Expo reload

## 공통 핵심 시나리오

### Auth

1. 프로필에서 로그인 화면으로 이동할 수 있다.
2. mock 모드에서는 임의 이메일과 8자 이상 비밀번호로 로그인할 수 있다.
3. 회원가입 화면에서 이메일, 이름, 비밀번호를 입력해 계정을 만들 수 있다.
4. 회원가입 성공 후 로그인 화면으로 돌아온다.
5. 로그인 화면의 비밀번호 재설정 진입점이 열린다.
6. 비밀번호 재설정 이메일 요청, deep link token 검증과 새 비밀번호 저장 뒤 로그인 완료 안내가 표시된다.
7. 로그인 후 프로필에 사용자 이메일이 표시된다.
8. 로그아웃 후 프로필이 로그인 필요 상태로 돌아간다.
9. 401 응답을 받으면 access token이 삭제되고 로그인 화면에 세션 만료 안내가 표시된다.

### Today

1. 앱 첫 진입 시 Today가 열린다.
2. 중복된 화면명이나 월 제목 없이 주간 날짜 strip이 첫 콘텐츠로 보인다.
3. 주간 날짜 strip에는 외곽선과 세로 구분선이 없고 오늘 날짜가 선택 상태다.
4. 월이 바뀌는 날짜만 `9/1`처럼 월을 함께 표시하고 일정이 있는 날짜에는 표시점이 보인다.
5. 일정 section이 있으면 오늘 할 일보다 위에 표시된다.
6. 새 Task 작성 화면에서 일정 유형을 선택하고 날짜, 시작 시간, 종료 시간을 입력해 일정이 생성된다.
7. 생성한 일정이 Today 일정 section과 Calendar 3주 grid에 표시된다.
8. 오늘 할 일을 체크하면 완료 목록으로 이동하거나 완료 상태가 반영된다.
9. 오늘 완료한 일이 있으면 최근 3개가 기본으로 보이고 전체 보기와 접기가 동작한다.
10. 완료 항목을 다시 열 수 있다.
11. 빠른 기록 버튼 또는 composer로 기록을 추가할 수 있다.
12. 기록함으로 저장된 직후에도 제목과 저장 위치가 보이고 `오늘 할 일로 이동`, `내용 확인`이 동작한다.
13. 정리할 항목 진입점이 지난 미완료·추천·기록함 개수를 보여준다.

### Task 상세

1. 수정 action이 본문 metadata와 섞이지 않고 상단 PageHeader에서 보인다.
2. 수정 action은 icon과 label을 함께 사용하고 뒤로 가기, 삭제보다 목적을 먼저 알아볼 수 있다.
3. 생성·수정·완료 시각과 비어 있는 부가 정보가 주요 내용보다 강하게 보이지 않는다.

### 하단 탐색

1. 현재 탭은 icon뿐 아니라 label의 색과 굵기, indicator로 구분된다.
2. 선택 상태를 색상 하나에만 의존하지 않는다.
3. 긴 label과 큰 글꼴에서도 탭 이름이 잘리거나 겹치지 않는다.

### Calendar

1. 선택 날짜 기준 3주 grid가 깨지지 않고 7열을 유지한다.
2. 오늘 날짜와 선택 날짜가 구분된다.
3. 하루 일정 label이 cell 안에서 넘치지 않는다.
4. 여러 날 일정 bar가 날짜 구간을 벗어나지 않는다.
5. 새로 만든 시간이 있는 일정이 3주 grid에 하루짜리 label로 표시된다.
6. `+N` overflow를 눌러 해당 날짜 목록으로 이동할 수 있다.
7. 선택 날짜의 예정·완료 목록이 표시된다.

### Search

1. mock 모드에서 검색어 입력 후 결과가 표시된다.
2. 기간, 상태, D-Day, category, 정렬 filter가 선택 상태를 보여준다.
3. 검색어 지우기가 동작한다.
4. 결과 row를 누르면 Task 상세로 이동한다.
5. 결과가 없을 때 빈 상태가 표시된다.
6. real 모드에서는 `/api/v1/tasks/search` 실제 요청을 보내고 성공 결과 또는 공통 오류·재시도 안내가 표시된다.

### Completed

1. 주 이동 버튼이 동작한다.
2. 날짜별 완료 count가 표시된다.
3. 선택 날짜의 완료 목록이 compact하게 표시된다.
4. 완료 Task를 다시 열 수 있다.

### Profile

1. 프로필 목적지 row가 세로 목록으로 표시된다.
2. 검색, 완료 기록, D-Day, 설정 진입이 가능하다.
3. row 간격과 icon 배경이 Today/Calendar의 planner 문법과 어긋나지 않는다.

## 플랫폼별 점검

### Android

- system back 첫 동작이 키보드 닫기인지 확인한다.
- 하단 navigation bar와 빠른 기록 composer가 겹치지 않는다.
- TalkBack에서 날짜 cell과 Task checkbox 역할이 읽힌다.
- adaptive icon과 monochrome icon preview가 깨지지 않는다.

#### Preview APK 최초 사용

검증 전:

1. EAS build id, frontend commit, `preview` profile을 [`SMOKE_TEST_LOG.md`](./SMOKE_TEST_LOG.md)의 후보와 대조한다.
2. 휴대폰 Tailscale을 켜고 APK의 API URL과 같은 tailnet에 로그인한다.
3. 휴대폰 브라우저에서 `<API_URL>/actuator/health/readiness`를 열어 HTTP 200과 `UP`을 확인한다.
4. 기존 앱 데이터 영향을 피하려면 앱을 제거한 뒤 후보 APK를 새로 설치한다.

최초 사용:

1. Expo Go와 Metro 없이 cold start하고 최초 사용 화면이 열린다.
2. `로그인 없이 시작`을 한 번 누르면 진행 표시가 나타나고 Today로 이동한다.
3. Task를 하나 작성한 뒤 앱을 완전히 종료하고 다시 열어 같은 게스트 데이터가 유지되는지 확인한다.
4. 로그인 또는 회원가입으로 연결한 뒤 기존 게스트 Task가 유지되는지 확인한다.

연결 실패 복구:

1. 앱 데이터를 다시 초기화하고 Tailscale을 끈 상태에서 `로그인 없이 시작`을 누른다.
2. timeout 뒤 버튼이 다시 활성화되고 network 또는 timeout 안내가 표시되는지 확인한다.
3. Tailscale을 다시 연결하고 같은 버튼으로 재시도해 Today 진입이 성공하는지 확인한다.

readiness가 휴대폰 브라우저에서 열리지 않으면 앱 결함으로 판정하지 않고 VPN·tailnet·백엔드 실행 상태를 먼저 복구한다. Quick Tunnel의 `*.trycloudflare.com` 주소는 APK 후보에 사용하지 않는다.

### iOS

- safe area와 home indicator가 composer, tab, CTA를 가리지 않는다.
- VoiceOver에서 Today 읽기 순서가 [`ACCESSIBILITY_CHECKLIST.md`](./ACCESSIBILITY_CHECKLIST.md)와 맞다.
- Dynamic Type 큰 글꼴에서 Task 제목과 primary action이 유지된다.
- splash에서 첫 화면으로 넘어갈 때 배경색 전환이 튀지 않는다.

### Web

- 320px, 375px, 430px, 720px 폭에서 horizontal overflow가 없다.
- keyboard tab 순서가 시각 순서와 크게 어긋나지 않는다.
- browser zoom 150%에서 주요 버튼 label이 잘리지 않는다.
- favicon이 표시된다.

## 네트워크 상태

### Mock

- 백엔드 없이 로그인, 회원가입, 내 정보 표시가 동작한다.
- 백엔드 없이 Today, Calendar, Search, Completed 화면이 모두 열린다.
- 반복 일정 label과 접근성 label이 mock 데이터에서 깨지지 않는다.

### Real

- 로그인, 내 정보 조회, 401 세션 만료 흐름이 동작한다.
- 비밀번호 재설정은 [`API_PASSWORD_RESET.md`](../api/API_PASSWORD_RESET.md)의 request·verify·confirm, 메일 link와 token 폐기를 실제 배포에서 확인한다.
- Today와 Calendar가 같은 날짜 기준으로 같은 일정을 보여준다.
- Calendar 범위 조회가 3주 화면에 필요한 일정과 여러 날 일정 원본 ID를 중복 없이 내려준다.
- Search는 `/api/v1/tasks/search` real API로 검색어, 상태 filter, 상세 filter, 빈 상태, cursor pagination을 확인한다.
- network, timeout, 5xx 오류에서 공통 오류 문구와 retry 버튼이 표시된다.
- 반복 생성·수정은 실제 저장 기능으로 제공하고 로컬 알림은 백엔드 후보 계약을 따른다. 서버 push 발송은 별도 활성화 전까지 사용자 기능으로 안내하지 않는다.

## 완료 기록 방식

실제 smoke test를 수행한 뒤 다음을 기록한다.

```text
날짜:
커밋:
환경: Android / iOS / Web
API 모드: mock / real
기기 또는 브라우저:
통과:
이슈:
스크린샷 또는 메모:
```
