# 인증 세션과 게스트 보존 계약

Last updated: 2026-08-27

ToDoLab의 앱·Web 세션 수명, refresh credential과 게스트 데이터 보존 기준이다. 백엔드는 등록·게스트 refresh, logout, token rotation·reuse detection과 idle 30일·absolute 90일 계약을 제공한다. 현재 남은 일은 모바일 저장·갱신 흐름과 Web credential 방식을 연결하는 것이다.

## 제품 기준

| 대상                | 목표 기간                        | 만료 뒤 동작                                       |
| ------------------- | -------------------------------- | -------------------------------------------------- |
| access token        | 발급 후 15분                     | refresh가 가능하면 자동 갱신, 아니면 로그인 안내   |
| 등록 계정 refresh   | 미사용 30일, 최초 로그인 후 90일 | 다시 로그인                                        |
| 게스트 refresh 자격 | 미사용 30일                      | 기존 게스트 자동 복구 중단                         |
| 게스트 서버 데이터  | 마지막 인증 활동 후 최소 90일    | 삭제 전 계정 연결 필요, 만료된 token으로 복구 불가 |

기간 판정과 만료는 서버 시간을 기준으로 서버가 강제한다. 클라이언트의 `expiresAt`은 선제 갱신과 안내에만 사용하며 세션 수명을 연장하는 근거로 사용하지 않는다. 실제 개인정보 처리방침이나 운영 보존 정책이 더 짧은 기간을 요구하면 출시 전에 이 표와 사용자 안내를 함께 변경한다.

## 등록 계정 목표 구조

- access token은 짧게 유지하고 API `Authorization: Bearer`에만 사용한다.
- native refresh token은 `expo-secure-store`에 저장한다.
- Web refresh credential은 JavaScript가 읽을 수 없는 `Secure`, `HttpOnly`, `SameSite=Lax` cookie로 발급한다.
- Web과 API는 가능한 한 같은 site의 HTTPS 하위 domain으로 운영한다.
- refresh token은 매 사용 시 회전하고 이전 token 재사용이 감지되면 같은 token family를 폐기한다.
- 회전하더라도 최초 로그인 기준 90일 absolute lifetime을 늘리지 않는다.
- 로그아웃·비밀번호 변경·계정 보안 조치 시 서버 refresh session을 폐기한다.

Web cookie 사용 시 refresh·logout에는 exact allow origin, credentials 허용과 CSRF 방어가 필요하다. refresh token을 `localStorage`나 응답 body로 Web JavaScript에 전달하지 않는다.

## 게스트 목표 구조

게스트는 비밀번호가 없으므로 refresh credential이 유일한 복구 수단이다.

- guest 생성 응답에도 access 만료와 refresh 만료를 구분해 제공한다.
- native guest refresh credential은 SecureStore, Web은 HttpOnly cookie를 사용한다.
- refresh 성공 후 같은 guest user id와 기존 Task·D-Day·Workspace 접근 상태를 유지한다.
- 마지막 인증 활동부터 90일 동안 서버 데이터를 보존한다. 단순 앱 background나 Web tab 종료는 탈퇴로 처리하지 않는다.
- 보존 기간이 끝난 guest는 새 계정을 자동 생성하지 않고 로그인·새 게스트 시작을 명시적으로 선택하게 한다.
- 데이터 삭제 예정 안내가 가능해지면 만료 14일 전부터 계정 연결 행동과 함께 표시한다.

## API 계약

필요 endpoint:

```text
POST /api/v1/auth/refresh
POST /api/v1/auth/guest/refresh
POST /api/v1/auth/logout
```

token 응답에는 최소 다음 필드를 둔다.

```json
{
  "tokenType": "Bearer",
  "accessToken": "...",
  "expiresAt": "2026-08-23T12:15:00",
  "refreshExpiresAt": "2026-11-21T12:00:00",
  "user": {}
}
```

- native는 refresh token을 별도 response field로 받을 수 있지만 Web 응답에서는 제외하고 cookie로만 전달한다.
- refresh·logout 응답과 인증 관련 오류에는 `Cache-Control: no-store`를 적용한다.
- 만료된 access token, 만료된 refresh session, 재사용 감지는 구분 가능한 안정적 error code를 제공한다.
- refresh 요청이 동시에 발생하면 한 번만 실행하고 나머지 API 요청은 같은 결과를 기다리게 할 수 있어야 한다.

## 프론트 적용 규칙

- `expiresAt`을 token과 함께 저장하고 만료 2분 전부터 한 번만 선제 갱신한다.
- 앱 시작 시 등록 계정은 refresh 가능 여부를 확인한 뒤 `/auth/me`를 호출한다.
- 게스트도 `/auth/me`보다 먼저 만료 임박 여부를 판정해 refresh한다.
- foreground 복귀와 Web tab 활성화에서 만료 임박 시 갱신한다. 고정 24시간 간격만 사용하지 않는다.
- refresh 중 발생한 API 요청은 무한 재시도하지 않고 한 번의 refresh 결과를 공유한다.
- offline이면 기존 화면과 입력을 유지하고 연결 복구 뒤 갱신한다. refresh 만료가 확정됐을 때만 로그인 또는 새 게스트 선택으로 보낸다.
- 401에서 refresh가 가능한 계정은 한 번 갱신 후 원 요청을 한 번만 재시도한다.

## 현재 프론트 구현과 차이

- 프론트는 `expiresAt`을 응답으로 받지만 아직 저장·판정하지 않는다.
- 백엔드 응답의 `refreshToken`, `refreshExpiresAt`을 프론트 타입과 SecureStore에 반영하지 않았다.
- 게스트 refresh는 앱 시작의 `/auth/me` 성공 뒤와 foreground 24시간 간격으로만 시도한다.
- 등록 계정 refresh, 동시 요청 단일화, 401 뒤 1회 재시도와 서버 logout 호출은 아직 없다.
- Web은 access token을 `localStorage`에 저장하며 HttpOnly cookie 계약을 연결하지 않았다.

백엔드 source 계약은 준비됐지만 production 반영과 프론트 연결 전에는 access token 수명을 단독으로 줄이지 않는다.

## 프론트 연결과 완료 판단

- `TokenResponse`에 `refreshToken`, `refreshExpiresAt`을 반영한다.
- native는 refresh credential을 별도 SecureStore key에 저장하고 계정 전환·logout에서 정리한다.
- refresh 요청은 하나만 실행하고 대기 요청이 같은 결과를 공유한다.
- access 만료 전 선제 갱신과 401 뒤 원 요청 1회 재시도를 구현한다.
- logout은 서버 session 폐기를 호출한 뒤 로컬 credential을 안전하게 제거한다.
- Web cookie 계약을 채택하면 credentials·CSRF·CORS를 production origin에서 검증한다.
- 프론트 real smoke에서 만료 임박, offline 복귀, 동시 요청, token 재사용, guest 90일 경계를 검증한다.

보안 근거는 [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)와 [IETF OAuth 2.0 for Browser-Based Applications](https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/)의 서버 측 만료·refresh 회전 원칙을 따른다.
