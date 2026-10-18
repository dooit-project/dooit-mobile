# Goal 클라이언트 기반 — F1a

2026-10-18 · `0359caf` 커밋, 미검증

후속 [F1b-1 반복 계획·회차 기반](./GOAL_PLAN_CLIENT_FOUNDATION_2026-10-18.md)에서 Plan CRUD mock과 미래 계획 정지 정책을 추가했다. 아래 미구현 설명은 F1a 당시 범위이며 회차·Task 동기화는 여전히 후속이다.

[백엔드 회신](./BACKEND_HANDOFF_2026-10-18.md) 이후 첫 구현 단위다. 로컬 백엔드 GoalV1Controller·DTO·GoalService·Goal domain을 대조했다. API 호출·데이터 이관·화면 변경은 하지 않았다. Android/iOS/Web 공통 통신 코드에 해당하며 새 의존성은 없다.

## 추가한 범위

- `src/types/goal.ts`: 선택 목표일, 원하는 결과·이유, D-Day 명시 연결, 상태·현재 version·nullable 시각과 요청 제한.
- `src/features/goals/goal-api.ts`: 생성, 목록/상세, 내용 수정, 상태 변경, 달성/취소. 기존 공통 API client의 인증·취소·오류 처리를 사용한다. 계약에 없는 목표 삭제·색상·순서 저장은 추가하지 않았다.
- `goal-query-keys.ts`: 기존 `ddays`와 독립적인 `goals` namespace. 계정 전환 시 기존 전체 캐시 정리 정책을 사용한다. 실제 조회 hook/화면은 후속이다.
- `mock-goal-store.ts`: 기존 D-Day 데이터와 독립 저장·ID, owner별 목록/상세·다른 owner 404/70001, guest 로그인 병합 시 소유권 이전. 기존 mock의 기본 사용자/인증 흐름을 그대로 사용하며 인증 서버를 모사하지는 않는다.

## 지켜야 할 계약

- 날짜는 생략/null 가능하다. 새 Goal ID와 기존 D-Day ID를 동일시하지 않는다. 연결은 `linkedDdayGoalId`로 명시한다.
- PATCH도 제목이 필수다. optional 내용 생략은 기존 값 유지가 아니라 null 초기화다. 부분 필드만 보내는 수정 UI를 만들지 않는다.
- 내용 수정은 `currentVersion`을 증가시킨다. 상태 변경은 version을 증가시키지 않는다. 보관 후 내용 수정은 400이며 보관 상태는 되돌리지 않는다.
- 달성은 사용자가 확인한다. 달성 취소는 ACHIEVED만 ACTIVE로 돌린다. 달성률 계산은 없다.
- 미래 계획 정책 생략은 PAUSE_FUTURE다. ACTIVE/달성 취소가 계획을 자동 재개하지 않는다. 현재 mock에는 Plan이 없으므로 계획 정지·미래 Task 중단은 F1b에서 구현한다.
- 생성의 서버 멱등성이 확인되지 않아 일반 Goal POST를 자동 재시도 허용 목록에 넣지 않았다. 직접 기록의 필수 Idempotency-Key는 F1c에서 별도 구현한다.

## 남은 범위와 검증 상태

Plan/회차·Task 연결·충돌, 직접 기록·여정·AI 비활성 처리는 아직 미구현이다. mock의 `effectiveFromDate`는 날짜 형식만 확인하며 과거 GoalVersion 스냅샷은 저장하지 않는다. 여정 구현 전에 version 이력과 적용일을 추가해야 한다. 색상/G-06은 서버 회신 대기이며 기존 로컬 저장을 유지한다. requestedType은 운영 배포 확인 전 전송하지 않는다.

기존 화면은 D-Day 기반 그대로다. 목표 선택 UI를 새 API에 연결하는 F2 이전까지 자동 전환·운영 데이터 생성은 없다. 화면/정보 구조를 수정하지 않아 이번 단계에 신규 시각안은 만들지 않았다.

목표일 없는 생성·내용 초기화, 다른 owner 접근·소유권 이전, 잘못된 날짜/연결·빈 제목, 달성 취소·보관 경계의 회귀 사례를 작성했다. 사용자 검증 보류 요청에 따라 테스트·`npm run validate`·실제 화면 감사·운영 API 호출은 실행하지 않았다. 정렬 포맷만 적용했으며 통과로 기록하지 않는다.
