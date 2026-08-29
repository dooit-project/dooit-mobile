# 오류 로깅과 개인정보 기준

> 최종 갱신: 2026-08-23

Dooit 모바일의 오류 로깅은 장애를 재현하고 앱 품질을 개선하기 위한 최소 정보만 수집한다. 사용자가 기록한 Task 제목, 설명, 카테고리, D-Day 목표명처럼 생활 패턴을 직접 드러내는 내용은 기본적으로 외부 로깅 대상이 아니다.

## 도구 결정과 현재 상태

- 오류 수집 도구는 Expo의 공식 연동 안내와 Android·iOS·Web 지원을 기준으로 **Sentry**를 사용한다.
- 현재는 도구만 선정했으며 SDK, project, DSN을 연결하지 않았으므로 외부로 수집되는 오류는 없다.
- Sentry project와 운영 책임자가 정해진 뒤 별도 변경으로 SDK를 설치하고 source map 업로드와 실제 수집을 검증한다.
- SDK를 켤 때도 session replay, tracing, profiling과 기본 개인정보 전송은 끈 상태에서 crash와 명시적으로 만든 오류 이벤트부터 시작한다.

## 수집 목적

- 앱 crash, API 실패, 화면 진입 실패, 데이터 동기화 실패를 재현한다.
- Android, iOS, Web별로 발생하는 플랫폼 차이를 파악한다.
- 느린 네트워크, timeout, 잘못된 서버 응답처럼 사용자 경험을 크게 해치는 문제의 빈도를 확인한다.

## 수집 가능 정보

| 범주        | 예시                                                            | 기준                |
| ----------- | --------------------------------------------------------------- | ------------------- |
| 앱 정보     | 앱 버전, build 번호, Expo SDK, 플랫폼, OS major version         | 허용                |
| 화면 정보   | route name, tab name, feature name                              | 허용                |
| 오류 정보   | 오류 kind, HTTP status, API error code                          | 허용                |
| crash 정보  | 처리되지 않은 오류의 stack trace                                | crash 조사에만 허용 |
| 성능 정보   | cold start 구간, API latency bucket, list item count bucket     | 허용                |
| 네트워크    | online/offline 추정, timeout 여부, retry count                  | 허용                |
| 사용자 식별 | 내부 user id hash 또는 anonymous id                             | MVP 이후 재검토     |
| 원문 데이터 | Task title, description, category, D-Day title, 검색어, memo 등 | 기본 수집하지 않음  |

## 수집하지 않는 정보

- Task 제목과 설명 원문
- D-Day 목표명과 목표 날짜의 조합
- 검색어 원문
- 사용자의 연락처, 위치, 파일, 사진
- 인증 토큰, refresh token, 쿠키, API key
- 로컬 `.env` 값과 실제 API URL의 민감한 query parameter

## 오류 이벤트 형태

구현 시 이벤트는 다음 형태를 넘지 않는다.

```ts
type ErrorLogEvent = {
  feature:
    | 'auth'
    | 'today'
    | 'calendar'
    | 'search'
    | 'completed'
    | 'dday'
    | 'task-detail'
    | 'profile'
    | 'workspace'
    | 'notifications'
    | 'settings';
  action: string;
  errorKind?: string;
  httpStatus?: number;
  apiCode?: number;
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
  retryCount?: number;
  itemCountBucket?: '0' | '1-10' | '11-50' | '51+';
};
```

- 실제 이벤트는 [`createErrorLogEvent`](../../src/services/telemetry/error-reporting-policy.ts)에서 허용 목록만 새 객체로 만든다.
- `action`은 코드에 고정된 영문 식별자만 허용한다. 제목이나 검색어가 섞인 동적 값은 `unknown`으로 바꾼다.
- `Error.message`, `cause`, request·response body, header, URL과 query string은 구조화 이벤트에 복사하지 않는다.
- 항목 수는 원값 대신 구간으로, 재시도 수는 `0~10` 범위로 제한한다.

## 사용자에게 보이는 오류와 로깅의 분리

- 화면에는 [`getUserFacingApiErrorMessage`](../../src/services/api/api-error.ts)를 통해 정규화된 문구를 표시한다.
- 로깅에는 사용자용 문구보다 `errorKind`, `httpStatus`, `apiCode`처럼 재현에 필요한 구조화 정보를 남긴다.
- 4xx/API 검증 오류는 사용자 입력 문제일 수 있으므로 빈도를 보되 원문 payload는 남기지 않는다.
- network, timeout, 5xx는 재시도 정책과 함께 묶어 빈도를 본다.

## Sentry 활성화 체크리스트

- Expo SDK 56, React Native 0.85에서 Android·iOS·Web build를 확인한다.
- `sendDefaultPii`는 `false`로 두고 session replay, tracing, profiling은 초기 범위에서 켜지 않는다.
- `beforeSend`에서 사용자, request, breadcrumb와 허용 목록 밖의 context를 제거한다.
- source map 업로드용 인증 값은 EAS secret으로만 관리하고 저장소와 public env에 넣지 않는다.
- 사용자가 개인정보 처리방침에서 수집 목적과 항목을 확인할 수 있어야 한다.
- 개발·mock 환경에서는 비활성화하고 preview·production도 DSN이 명시된 경우에만 활성화한다.
- 의도적으로 실패시킨 API와 crash가 원문 데이터 없이 수집되고 source map으로 복원되는지 플랫폼별로 확인한다.
