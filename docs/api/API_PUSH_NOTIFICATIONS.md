# 서버 push 알림 요구 계약

Last updated: 2026-08-23

## 범위와 도입 조건

현재 Dooit은 Android·iOS의 로컬 예약 알림만 사용한다. 서버 push는 앱이 오래 열리지 않아 로컬 30일 예약 범위가 갱신되지 않는 문제가 실제 사용에서 확인될 때 도입한다.

- 1차 대상은 로그인한 Android·iOS 계정이다.
- 게스트는 계정 전환·만료 시 token 소유권이 불명확하므로 로컬 알림만 사용한다.
- Web push는 현재 제품 범위에서 제외한다.
- push가 활성화되기 전에는 설정 화면에 push 상태나 발송 이력을 노출하지 않는다.

## 기기 token 계약

하드웨어 식별자를 만들지 않고 앱 설치 단위의 임의 `installationId`를 SecureStore에 저장한다. push token은 인증 token과 같은 수준의 민감 정보로 취급해 응답·일반 로그·분석 이벤트에 남기지 않는다.

```http
PUT /api/v1/notification-devices/{installationId}
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "platform": "ANDROID",
  "provider": "EXPO",
  "pushToken": "ExponentPushToken[...]",
  "appVersion": "1.0.0",
  "timezone": "Asia/Seoul",
  "locale": "ko-KR"
}
```

```http
DELETE /api/v1/notification-devices/{installationId}
Authorization: Bearer <access-token>
```

- `PUT`은 같은 계정·`installationId`에서 멱등이어야 하며 token rotation을 덮어쓴다.
- token은 서버에서 암호화 저장하고 request body와 token 원문을 로그에서 제거한다.
- 로그아웃·계정 전환 전에 현재 계정의 설치 등록을 삭제한다. 실패하면 다음 로그인과 서버의 만료 정리로 보완한다.
- 앱 재설치, provider token 변경, 알림 권한 복귀와 앱 버전 변경 때 다시 등록한다.
- 서버는 provider의 invalid/unregistered 응답을 받은 token을 즉시 비활성화한다.
- 한 `installationId`를 마지막으로 등록한 계정만 해당 설치의 push를 받는다.

## 로컬 알림과 소유권 전환

중복 방지의 기준은 기존 `notificationKey`다.

```text
push 미등록·비활성
  → notification candidate의 suppressLocalNotification=false
  → 모바일이 로컬 예약 소유

push 등록·발송 준비 완료
  → notification candidate의 suppressLocalNotification=true
  → 백엔드가 push 발송 소유
```

- token 등록 요청이 성공했다는 이유만으로 즉시 로컬 예약을 억제하지 않는다.
- 서버가 해당 계정·설치의 발송 준비를 완료한 뒤 후보 응답에서 `suppressLocalNotification=true`를 반환한다.
- 모바일은 true로 바뀐 후보의 기존 로컬 예약을 다음 동기화에서 취소한다.
- push 비활성화·token 만료 시 서버는 먼저 suppression을 해제하고 모바일이 후보를 다시 동기화할 수 있게 한다.
- 개인 일정과 Workspace 일정 모두 같은 규칙을 사용하되 Workspace identifier는 기존 `workspace:{accountId}:{workspaceId}:{notificationKey}` 격리를 유지한다.

## 발송 멱등성과 상태

서버 발송의 유일성 기준은 다음 조합이다.

```text
accountId + installationId + scope + notificationKey + notifyAt
```

- 같은 조합은 provider 재시도와 worker 재실행에서도 한 번만 발송한다.
- `notifyAt`이 바뀌면 미발송 job을 교체하고, 이미 발송된 알림을 다시 보내지 않는다.
- 완료·삭제·건너뛴 occurrence와 권한을 잃은 Workspace 일정은 미발송 job을 취소한다.
- provider timeout은 같은 delivery id로 재시도하고 새 발송 레코드를 만들지 않는다.
- 최소 상태는 `PENDING`, `SENT`, `FAILED`, `CANCELLED`이며 token 원문과 Task 원문은 이력에 저장하지 않는다.
- 발송 이력 보존 기간과 운영자 접근 권한은 개인정보 처리방침과 함께 확정한다.

## payload와 개인정보

초기 push의 잠금 화면 문구는 Task 제목을 포함하지 않는 일반 문구를 사용한다.

```json
{
  "title": "Dooit",
  "body": "일정 시간이 되었어요.",
  "data": {
    "source": "dooit-push",
    "scope": "PERSONAL",
    "taskId": 123,
    "notificationKey": "task:123"
  }
}
```

- 설명, 카테고리, D-Day 제목, 멤버 이름, access token은 payload에 넣지 않는다.
- Workspace payload에는 이동에 필요한 `workspaceId`만 추가한다.
- 알림 선택 시 앱은 현재 인증·Workspace 접근 권한을 다시 확인하고 상세를 조회한다.
- 제목 미리보기는 개인정보 노출 위험과 OS별 숨김 동작을 실기기에서 검증한 뒤 별도 opt-in으로만 추가한다.

## 설정과 이력 UX

MVP 설정 화면은 다음 정보만 제공한다.

- OS 알림 권한 상태
- 이 기기의 알림 사용 여부
- 마지막 동기화 성공 시각 또는 재시도 가능한 오류
- `알림 다시 맞추기`, `기기 설정 열기`

개별 일정마다 `발송됨` 이력을 나열하거나 별도의 알림함을 만들지 않는다. 전달 보장은 provider·OS 상태에 따라 달라질 수 있고, 많은 이력은 일정 화면의 정보 밀도를 높이기 때문이다. 고객 지원이 필요하면 사용자가 직접 복사할 수 있는 익명 진단 id와 상태 구간만 제공한다.

## 배포 순서와 완료 판단

1. 백엔드가 기기 등록·해제, token rotation, 발송 멱등성과 suppression 전환을 통합 테스트한다.
2. OpenAPI에 endpoint와 오류 코드를 반영한다.
3. 모바일이 SecureStore installation id, token 등록·해제와 계정 전환 정리를 구현한다.
4. preview 환경에서 로컬만, push만, token 만료, offline, 일정 수정·삭제와 Workspace 권한 제거를 검증한다.
5. 같은 `notificationKey`가 로컬과 push로 중복 수신되지 않는 것을 Android·iOS 실기기에서 확인한다.
6. 개인정보 처리방침과 운영 이력 보존 기준을 반영한 뒤 production을 활성화한다.

백엔드 계약과 실제 push 발송이 준비되기 전까지 현재 로컬 알림 구현을 변경하지 않는다.
