# Web Authentication and CSP Policy

ToDoLab Web의 인증 정보 저장과 Content Security Policy 적용 기준이다. Web 배포가 정해지기 전에도 구현과 운영 판단이 달라지지 않도록 현재 허용 범위와 교체 조건을 함께 관리한다.

## 현재 인증 저장 결정

- Android와 iOS access token은 `expo-secure-store`에 저장한다.
- Web access token은 현재 `localStorage`에 저장한다. 새로고침과 브라우저 재실행 뒤 게스트·로그인 세션을 복원하기 위한 임시 운영 결정이다.
- account type은 만료 안내와 게스트 복구 분기를 위해 token과 별도 key로 유지한다.
- 로그아웃·401 만료 처리·계정 전환에서는 access token을 즉시 제거한다.
- token 값은 화면 문구, URL, 로그, 오류 보고, analytics, smoke test 출력에 포함하지 않는다.

`localStorage`는 JavaScript에서 읽을 수 있으므로 XSS가 발생하면 token 탈취를 막을 수 없다. CSP는 위험을 줄이는 방어선이지 안전한 token 저장소를 만드는 수단은 아니다. 따라서 운영 Web에는 임의의 third-party script를 추가하지 않고 dependency와 배포 산출물을 함께 검토한다.

## 목표 인증 구조

백엔드가 Web 전용 세션 계약을 제공하면 다음 구조로 교체한다.

1. 짧은 수명의 access token은 메모리에만 둔다.
2. refresh credential은 `Secure`, `HttpOnly`, `SameSite` cookie로 백엔드가 발급한다.
3. refresh·logout 요청에는 허용 origin과 CSRF 방어 정책을 적용한다.
4. 게스트 refresh에서도 같은 guest user id와 기존 데이터를 유지한다.
5. cookie 적용 전후의 로그인, 게스트 복원, 계정 연결과 로그아웃을 별도 smoke test로 검증한다.

백엔드 계약이 준비되기 전에는 `sessionStorage`로 일방 변경하지 않는다. 브라우저 종료 때마다 게스트 접근을 잃어 현재 제품의 복원 기대와 충돌하기 때문이다.

## 운영 CSP 기준

운영 배포에서는 HTML 응답에 아래 정책을 HTTP header로 적용한다. `<API_ORIGIN>`은 실제 HTTPS API origin 하나로 치환하며 `https:` 같은 전체 scheme wildcard는 사용하지 않는다.

```text
Content-Security-Policy:
  default-src 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
  form-action 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' <API_ORIGIN> wss:;
  worker-src 'self' blob:;
  manifest-src 'self';
  upgrade-insecure-requests
```

- React Native Web의 runtime style을 위해 `style-src 'unsafe-inline'`은 현재 허용한다.
- `script-src`에는 `unsafe-inline`과 `unsafe-eval`을 추가하지 않는다.
- WebSocket을 사용하지 않는 운영 host라면 `wss:`도 제거한다.
- `frame-ancestors`는 meta CSP가 아니라 HTTP header에서 적용한다.
- 먼저 preview 환경에서 `Content-Security-Policy-Report-Only`로 위반을 확인한 뒤 enforce header로 전환한다.

Expo Router SDK 56은 `expo-router` plugin의 `headers` 설정을 제공하지만, 이 header는 `expo-server`로 제공하는 HTML·API 응답에만 적용되고 정적 asset에는 적용되지 않는다. 실제 정적 host나 CDN을 사용하면 동일 정책을 그 배포 설정에 명시해야 한다. 기준은 [Expo Router server headers](https://docs.expo.dev/router/web/server-headers/)를 따른다.

## 함께 적용할 보안 header

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

`Cache-Control`은 [`WEB_DEPLOYMENT_CACHE.md`](./WEB_DEPLOYMENT_CACHE.md)의 HTML·asset 분리 기준을 따른다. API의 인증·개인정보 응답은 백엔드에서 `no-store`를 적용한다.

## 배포 검증

1. `npm run web:export:production`이 실제 HTTPS API origin으로 통과한다.
2. export된 HTML의 script가 self-hosted이고 inline script나 `eval` 의존성이 없는지 확인한다.
3. preview에서 CSP를 report-only로 적용하고 로그인·게스트·Today·Calendar·Workspace 흐름을 실행한다.
4. 위반이 없으면 enforce header로 전환한다.
5. `curl -I` 또는 브라우저 Network에서 CSP와 보안 header를 확인한다.
6. 새로고침·브라우저 재실행·로그아웃·401 뒤 token 복원과 제거 결과를 확인한다.
7. 다른 origin이나 임의 inline script가 차단되는지 확인한다.

운영 host와 API origin이 정해지기 전에는 CSP가 적용 완료됐다고 판정하지 않는다. 이 문서는 적용할 정책을 확정하며, 실제 header 결과는 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록한다.
