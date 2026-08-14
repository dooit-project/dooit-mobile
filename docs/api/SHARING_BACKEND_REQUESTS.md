# 일정 공유 백엔드 요청사항

Last updated: 2026-08-15

프론트 구현 기준은 백엔드의 `API_V1_FRONTEND.md`, `SHARING_CONTRACT.md`, 실행 중인 OpenAPI 순서로 대조한다. 아래 항목은 공유 화면을 완성하기 전에 백엔드에서 확인하거나 보완해야 한다.

## P0. 초대받은 사용자 조회

현재 초대 수락은 `workspaceId`와 `memberId`가 필요하지만 Workspace 목록은 ACTIVE membership만, 멤버 목록도 ACTIVE 멤버만 반환한다. PENDING 사용자는 두 ID를 발견할 수 없다.

다음과 같은 현재 사용자 전용 endpoint가 필요하다.

```http
GET /api/v1/workspace-invitations
```

```ts
type WorkspaceInvitationResponse = {
  workspace: WorkspaceResponse;
  membership: WorkspaceMemberResponse; // status=PENDING
  invitedAt: string;
};
```

요구사항:

- 현재 로그인 사용자의 PENDING membership만 반환한다.
- guest는 빈 목록 또는 명시적인 403 정책 중 하나를 문서화한다.
- 수락 후 목록에서 제거되고 Workspace 목록에 나타난다.
- REMOVED membership은 반환하지 않는다.

## P0. 실행 OpenAPI 최신화

2026-08-15 현재 로컬 `http://localhost:8080/v3/api-docs`에는 전체 59개 path가 있으나 `/api/v1/workspaces/**`가 하나도 없다. 최신 Workspace 커밋이 포함된 서버를 재빌드·재시작한 뒤 아래를 확인해야 한다.

- 문서에 적힌 Workspace Task/D-Day/멤버 endpoint가 OpenAPI에 모두 노출된다.
- request·response schema가 `API_V1_FRONTEND.md`와 일치한다.
- 프론트 real API smoke용 백엔드 commit SHA를 제공한다.

## P1. 반복 Task 수정·삭제 범위

문서상 Workspace 반복 Task 생성과 materialize는 가능하지만 반복 Task 수정·삭제는 아직 HTTP 400이다.

- `recurrenceScope=THIS|THIS_AND_FUTURE|ALL` 지원 범위를 개인 Task API와 맞춘다.
- 지원 전에는 안정적인 error code를 반환한다.
- 프론트는 지원 확인 전 반복 Workspace Task의 편집·삭제 행동을 숨긴다.

## P1. 권한·오류 계약

- OWNER, EDITOR, VIEWER별 endpoint 허용 행렬을 OpenAPI 설명과 통합 테스트에 고정한다.
- 다른 workspace의 Task/D-Day ID는 404 계열로 숨긴다.
- 권한 부족은 403, 잘못된 scope 연결은 안정적인 400/404 error code로 구분한다.
- 마지막 ACTIVE OWNER 제거·탈퇴 실패 error code를 문서화한다.

## P1. Workspace 알림 후보

- 최신 OpenAPI에 `/tasks/notification-candidates`를 노출한다.
- 개인 후보와 Workspace 후보가 서로 섞이지 않는 invariant를 유지한다.
- 서버 push가 도입되면 동일 `notificationKey`에 `suppressLocalNotification=true`를 반환한다.
- Workspace별 세부 알림 설정은 별도 계약 전까지 프론트에 노출하지 않는다.

## 전달 요청 문구

백엔드에는 다음처럼 전달하면 된다.

> 공유 화면에서 초대받은 사용자가 수락에 필요한 workspaceId/memberId를 찾을 방법이 없습니다. 현재 사용자 PENDING 초대 목록 API를 우선 추가해 주세요. 최신 Workspace endpoint가 실행 OpenAPI에 노출되도록 서버도 재빌드·재시작하고, 사용된 backend commit SHA를 알려 주세요. 반복 Workspace Task 수정·삭제는 지원 범위와 error code를 문서화해 주세요.
