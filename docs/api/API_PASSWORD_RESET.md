# Password Reset API 요구 계약

Last updated: 2026-08-27

ToDoLab Mobile의 이메일/비밀번호 기반 로그인에 채택된 비밀번호 재설정 API 계약이다. 백엔드 source 구현과 통합 테스트는 완료됐고 모바일 UI·deep link·production 메일 발송 검증이 남아 있다.

## 목표

- 사용자가 비밀번호를 잊어도 앱을 재설치하거나 운영자에게 직접 문의하지 않고 계정을 복구한다.
- access token이 없는 상태에서도 안전하게 시작할 수 있다.
- reset token은 짧은 수명, 1회성, 로그/응답 비노출을 기본으로 한다.

## 채택된 API

### 1. 재설정 메일 요청

`POST /api/v1/auth/password-reset/request`

요청:

```json
{
  "email": "user@example.com"
}
```

응답:

```json
{
  "status": "success",
  "data": {
    "accepted": true
  },
  "timestamp": "2026-08-06T00:00:00Z"
}
```

보안 기준:

- 존재하지 않는 이메일이어도 같은 성공 응답을 반환해 계정 존재 여부를 노출하지 않는다.
- rate limit을 적용한다.
- reset link는 앱 deep link 또는 Web fallback URL을 포함한다.

### 2. reset token 검증

`POST /api/v1/auth/password-reset/verify`

요청:

```json
{
  "token": "opaque-reset-token"
}
```

응답:

```json
{
  "status": "success",
  "data": {
    "valid": true,
    "emailHint": "u***@example.com"
  },
  "timestamp": "2026-08-06T00:00:00Z"
}
```

보안 기준:

- token은 opaque string으로 취급한다.
- 만료, 이미 사용됨, 변조 token은 같은 계열의 사용자 친화 오류로 응답한다.
- 전체 이메일은 노출하지 않고 필요 시 masking hint만 제공한다.

### 3. 새 비밀번호 저장

`POST /api/v1/auth/password-reset/confirm`

요청:

```json
{
  "token": "opaque-reset-token",
  "newPassword": "new-password"
}
```

응답:

```json
{
  "status": "success",
  "data": null,
  "timestamp": "2026-08-06T00:00:00Z"
}
```

보안 기준:

- 성공 시 reset token은 즉시 폐기한다.
- 기존 access token/session 정책은 백엔드 보안 기준에 맞춰 폐기 또는 유지 여부를 명시한다.
- 비밀번호 정책은 회원가입과 동일하게 최소 8자 이상을 기본으로 한다.

## 모바일 화면 연결 계획

1. 로그인 화면의 `비밀번호를 잊으셨나요?` 링크에서 `/password-reset`로 이동한다.
2. API 준비 전에는 안내 화면을 보여준다.
3. API 준비 후 `/password-reset`에 이메일 입력 form을 연결한다.
4. deep link로 reset token을 받으면 token 검증 화면으로 이동한다.
5. 새 비밀번호 저장 성공 후 `/login?reset=1`로 이동해 완료 안내를 보여준다.

## 확인된 백엔드 정책

- 기본 link: `todolab://password-reset?token={token}`. production template은 환경변수로 변경할 수 있다.
- token TTL: 30분, URL-safe opaque token, 원본 대신 SHA-256 hash 저장
- rate limit: normalized email 기준 기본 5건/1시간, 초과 시 429/`11006`
- 비밀번호 정책: 회원가입과 동일
- confirm 성공 시 token과 refresh session을 폐기한다. 이미 발급된 access token은 `exp`까지 유효할 수 있다.
- 없거나 만료·사용·변조된 token은 400/`11005`다.

## 모바일 남은 작업

- 이메일 요청, token 검증, 새 비밀번호 저장 상태를 `/password-reset`에 구현한다.
- deep link의 token을 안전하게 route state로 전달하고 로그·telemetry에 남기지 않는다.
- 성공 뒤 `/login?reset=1`로 이동해 완료 안내를 표시한다.
- production 메일 발송, 앱 link와 Web fallback을 실제 기기에서 검증한다.
