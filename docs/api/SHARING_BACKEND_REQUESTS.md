# 일정 공유 백엔드 요청사항

Last updated: 2026-08-27

프론트 구현 기준은 백엔드의 `API_V1_FRONTEND.md`, `SHARING_CONTRACT.md`, 실행 `/v3/api-docs` 순서로 대조한다. 백엔드 source 구현은 완료됐으며 이 문서에는 채택된 계약과 프론트 재검증 조건만 둔다.

배포 상태와 모바일 후속은 [`BACKEND_STATUS_2026-08-27.md`](../integration/BACKEND_STATUS_2026-08-27.md)와 [`ROADMAP.md`](../product/ROADMAP.md)를 기준으로 한다.

## 현재 확인된 계약

local backend source `fd2a7e3`에서 다음 항목을 확인했고 `./gradlew test --rerun-tasks`가 통과했다.

- PENDING 초대 목록과 자기 membership 수락
- Workspace Task·D-Day·멤버·알림 후보 OpenAPI 23개 operation
- 반복 Task `recurrenceScope=THIS|THIS_AND_FUTURE|ALL`
- OWNER·EDITOR·VIEWER와 PENDING·REMOVED·비멤버 권한 행렬
- 개인/Workspace scope 분리와 Workspace 알림 억제 정책
- 내용 있는 Workspace의 하위 Task·D-Day·반복 series·membership cascade 삭제
- PENDING 사용자의 자기 초대 `REMOVED` 전환
- `GET /api/v1/system/metadata` 배포 식별 계약

프론트 검증 명령:

```bash
npm run check:workspace-openapi
npm run smoke:workspace-roles:real
```

## 완료. 내용이 있는 Workspace 삭제

2026-08-19 local real API에서 OWNER가 Task가 들어 있는 Workspace에 `DELETE /api/v1/workspaces/{workspaceId}`를 호출하면 HTTP 500 `INTERNAL_SERVER_ERROR`가 발생했다. Task를 먼저 삭제한 뒤 Workspace를 삭제하면 정상 처리된다.

채택된 정책은 같은 transaction에서 Task → D-Day → recurrence series → membership → Workspace 순서로 삭제하는 cascade다. 개인 scope 리소스는 삭제하지 않는다.

완료 판단:

- 내용이 있는 Workspace 삭제가 HTTP 500을 반환하지 않는다.
- 선택한 삭제 정책과 error code가 `SHARING_CONTRACT.md`와 OpenAPI에 반영된다.
- 프론트 real API smoke에서 같은 결과를 확인한다.

## 완료. 배포 버전 식별

`GET /api/v1/system/metadata`가 `commitSha`, `imageTag`, `version`을 제공한다. production에서는 readiness와 metadata를 함께 확인한다.

백엔드·배포 요청:

- health/info 또는 배포 metadata에서 commit SHA나 image tag를 제공한다.
- `/actuator/health/readiness`는 인증 없이 `UP`을 확인할 수 있게 유지하고, `/actuator/info` 또는 별도 metadata endpoint는 로그인 redirect 없이 비밀 값이 아닌 commit SHA나 image tag를 반환한다.
- Workspace migration 적용 상태를 배포 기록에 남긴다.
- staging은 사용하지 않는 정책을 유지하고 production API URL과 해당 버전을 프론트 smoke 기록에 연결한다.

완료 판단:

- 실행 서버 version metadata, OpenAPI와 DB migration이 같은 배포 단위를 가리킨다.
- 프론트에서 `EXPO_PUBLIC_API_URL=<배포 URL> npm run check:backend-deployment`가 통과한다.
- [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 API URL과 backend version을 기록한다.

## 프론트 후속

현재 프론트 화면에는 노출하지 않는다.

- Workspace 템플릿: 개인 템플릿과 분리된 scope·권한·적용 계약이 필요하다.
- 서버 push 설정: 실제 발송을 도입할 때 [`API_PUSH_NOTIFICATIONS.md`](./API_PUSH_NOTIFICATIONS.md)의 기기 등록, local/push 소유권 전환과 발송 멱등성 계약이 필요하다.
- Workspace·Task·D-Day·초대 생성은 백엔드 OpenAPI·CORS의 `Idempotency-Key` 계약에 맞춰 timeout 재시도를 활성화한다.

## 완료. Workspace 초대 거절 계약

백엔드는 자기 PENDING membership을 `status=REMOVED`로 바꾸는 계약과 권한 통합 테스트를 제공한다. 모바일도 거절 확인, mutation, cache 제거와 404/409 목록 복구를 연결했다.

제안 계약:

```http
PATCH /api/v1/workspaces/{workspaceId}/members/{memberId}
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "status": "REMOVED"
}
```

- 해당 `memberId`의 PENDING 사용자가 자기 초대만 거절할 수 있다.
- OWNER·EDITOR·VIEWER role 변경과 초대 거절 권한을 혼동하지 않는다.
- 성공 응답은 최종 membership 또는 `204 No Content` 중 하나로 OpenAPI에 고정한다.
- 이미 수락·취소·거절된 초대는 안정적인 `404` 또는 `409`와 error code를 반환한다.
- 거절한 초대는 PENDING 목록과 Workspace 접근 결과에서 즉시 제외한다.
- 같은 사용자를 다시 초대할 수 있는지와 재초대 cooldown이 있다면 계약에 명시한다.

모바일 남은 일은 real API에서 거절 성공·40폐·재초대와 404/409 복구를 검증하는 것이다.

## 남은 배포·프론트 확인

- 최신 source와 Workspace migration을 production에 반영한다.
- metadata가 가리키는 같은 배포에서 내용 있는 Workspace 삭제를 real smoke한다.
- OWNER·초대 사용자 역할로 초대 거절과 cache 복구를 real smoke한다.

서버 push를 시작할 때 추가 전달:

> 로그인 계정의 설치 단위 token 등록·해제 API와 발송 멱등성을 구현해 주세요. 서버가 발송을 확실히 소유하는 후보만 `suppressLocalNotification=true`로 반환하고, token 만료 시 suppression을 먼저 해제해야 합니다. 상세 계약은 `API_PUSH_NOTIFICATIONS.md`를 기준으로 합니다.
