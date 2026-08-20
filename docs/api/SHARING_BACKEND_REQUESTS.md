# 일정 공유 백엔드 요청사항

Last updated: 2026-08-20

프론트 구현 기준은 백엔드의 `API_V1_FRONTEND.md`, `SHARING_CONTRACT.md`, 실행 `/v3/api-docs` 순서로 대조한다. 이 문서에는 현재 남은 요청과 재검증 조건만 둔다.

## 현재 확인된 계약

local backend source `5eb6050` 옆에서 다음 항목을 확인했다.

- PENDING 초대 목록과 자기 membership 수락
- Workspace Task·D-Day·멤버·알림 후보 OpenAPI 23개 operation
- 반복 Task `recurrenceScope=THIS|THIS_AND_FUTURE|ALL`
- OWNER·EDITOR·VIEWER와 PENDING·REMOVED·비멤버 권한 행렬
- 개인/Workspace scope 분리와 Workspace 알림 억제 정책

프론트 검증 명령:

```bash
npm run check:workspace-openapi
npm run smoke:workspace-roles:real
```

## P0. 내용이 있는 Workspace 삭제

2026-08-19 local real API에서 OWNER가 Task가 들어 있는 Workspace에 `DELETE /api/v1/workspaces/{workspaceId}`를 호출하면 HTTP 500 `INTERNAL_SERVER_ERROR`가 발생했다. Task를 먼저 삭제한 뒤 Workspace를 삭제하면 정상 처리된다.

백엔드 요청:

- 하위 Task·D-Day·반복 series·membership의 cascade 또는 명시적 삭제 순서를 구현한다.
- 삭제를 허용하지 않는 정책이면 HTTP 409 등 안정적인 오류 코드와 사용자 복구 방법을 계약에 명시한다.
- Task와 D-Day가 함께 있는 Workspace 삭제 통합 테스트를 추가한다.

완료 판단:

- 내용이 있는 Workspace 삭제가 HTTP 500을 반환하지 않는다.
- 선택한 삭제 정책과 error code가 `SHARING_CONTRACT.md`와 OpenAPI에 반영된다.
- 프론트 real API smoke에서 같은 결과를 확인한다.

## P0. 배포 버전 식별

현재 실행 OpenAPI와 인접 backend source HEAD는 확인할 수 있지만, 서버 응답만으로 실행 binary가 어느 commit 또는 image인지 확정할 수 없다.

백엔드·배포 요청:

- health/info 또는 배포 metadata에서 commit SHA나 image tag를 제공한다.
- `/actuator/health/readiness`는 인증 없이 `UP`을 확인할 수 있게 유지하고, `/actuator/info` 또는 별도 metadata endpoint는 로그인 redirect 없이 비밀 값이 아닌 commit SHA나 image tag를 반환한다.
- Workspace migration 적용 상태를 배포 기록에 남긴다.
- staging·production API URL과 해당 버전을 프론트 smoke 기록에 연결한다.

완료 판단:

- 실행 서버 version metadata, OpenAPI와 DB migration이 같은 배포 단위를 가리킨다.
- 프론트에서 `EXPO_PUBLIC_API_URL=<배포 URL> npm run check:backend-deployment`가 통과한다.
- [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 API URL과 backend version을 기록한다.

## 조건부 후속 계약

현재 프론트 화면에는 노출하지 않는다.

- 초대 거절: 제품 필요성이 확인되면 status 전이와 endpoint를 추가한다.
- Workspace 템플릿: 개인 템플릿과 분리된 scope·권한·적용 계약이 필요하다.
- 서버 push 설정: 실제 발송을 도입할 때 local/push 중복 방지와 이력 정책이 필요하다.

## 백엔드 전달 문구

> OWNER가 Task가 들어 있는 Workspace를 삭제하면 HTTP 500이 발생합니다. 하위 리소스 cascade 삭제 또는 명시적인 삭제 거부 정책을 정하고 안정적인 응답 코드와 통합 테스트를 추가해 주세요. 또한 실행 서버가 어느 commit 또는 image인지 health/info 응답에서 확인할 수 있게 해 주세요.
