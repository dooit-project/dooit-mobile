# 목표 여정 집계와 일회성 Task 연결 — F1c-2

2026-10-18 · `f268a95` 커밋, 미검증

후속 [F1c-3 AI 비활성·사용 제한 상태](./GOAL_AI_FALLBACK_2026-10-18.md)에서 선택적 AI DTO/API와 오류 모델을 추가했다. 아래 AI 미구현 설명은 F1c-2 당시 범위이며 AI 활성화·화면 연결은 여전히 후속이다.

[직접 기록·여정 조회 계약](./GOAL_DIRECT_LOG_FOUNDATION_2026-10-18.md)은 `8bf28c5`로 커밋했다. 이번에는 백엔드 GoalTaskLinkService·GoalJourneyService·TaskRepository 쿼리·controller/DTO를 대조해 일회성 Task 연결과 여정 mock을 추가했다. Android/iOS/Web 공통 통신 코드이며 새 의존성·화면 변경·실 API 호출은 없다.

## 코드 반영

- `goal-task-api.ts`와 요청 타입: 목표 아래 날짜 기반 TODO 생성, 개인 Task의 새 Goal 연결·해제. 응답의 linkedGoalId는 기존 D-Day ID와 독립이다. 기존 Task fixture/옛 응답 호환을 위해 응답 필드는 optional nullable로 받는다.
- Task 작성 DTO의 linkedGoalId: 일반 개인 Task 생성·수정에서도 사용 가능하다. 수정에서 null/생략은 연결 해제가 아니며, 해제는 전용 DELETE를 사용한다.
- mock 개인 Goal 연결: 본인 Goal/Task만 연결하고 완료 상태·D-Day 연결을 유지한다. 반복 series·계획 회차 Task는 409/70005이며 계획 API에서 바꿔야 한다. 반복 정의와 일회성 목표를 동시에 보내면 400이다. 새 Goal 연결 Task의 owner와 guest 병합도 추적한다.
- Goal/직접 기록/회차 저장소의 읽기 전용 snapshot 조회를 추가했다. 여정 조회가 기존 회차 GET을 재호출하거나 Task를 생성·갱신하지 않는다.
- `mock-goal-journey-store.ts`: 저장된 실천 결과·개인 일회성 완료·취소되지 않은 직접 기록을 통합하고, 날짜 내림차순 → sourceType → ID 내림차순으로 정렬한다. 식별은 sourceType+sourceId다. 반복 연결 Task는 일회성 완료에서 제외한다.

## 집계·날짜 규칙

summary는 전체 요청 기간을 기준으로 계산해 모든 페이지에 동일하게 제공한다. 실천 회차·일회성 완료·직접 기록·서로 다른 실천 날짜 수, STANDARD/MINIMUM/UNKNOWN과 휴식/미기록 회차 수를 분리한다. UNKNOWN에는 Task 완료와 직접 기록도 포함되므로 전체 unknownCount를 반복 실천만의 수치로 표현하지 않는다.

실천 결과와 Task 완료는 query timezone으로 실천 날짜를 계산한다. 직접 기록은 날짜 기반 입력이므로 원래 practicedDate를 유지한다. 휴식/미기록 회차는 serviceDate 범위로 집계한다. 미래 PENDING은 현재 활성 계획의 적용 version·요일·당시 Goal 연결이 유효할 때만 포함하고 과거 PENDING은 보존한다. 조회 자체로 빠진 회차를 만들어 채우지 않는다.

KEEP/CLEAR/REPLACE는 여정의 다음 행동 표시에도 반영한다. 직접 기록의 snapshotGoalTitle은 수정된 실천 날짜가 아니라 최초 Goal version으로 찾는다. Task 일회성 완료에는 과거 Goal snapshot을 추측해서 넣지 않는다.

## 페이지·충돌

1~100개씩 조회하며 31일 제한은 없다. cursor scope는 owner·goal·기간·timezone이고 limit은 페이지 크기다. 범위가 다르거나 잘못된 cursor는 400/10001이다. 원본·상태·version·집계가 달라진 cursor는 409/70008이며 기존 `isGoalJourneyConflict`로 구분한다. 새 첫 페이지는 바뀐 원본으로 정상 조회한다.

mock cursor는 프로세스 메모리의 opaque token이다. 서버 Base64/hash 형식을 복제하거나 서버 cursor와 호환하지 않는다. journeyVersion 역시 opaque mock 값이다. 화면 연결 시 문자열 구조를 해석하지 말고 충돌 시 기존 페이지/cursor를 버리고 처음부터 조회해야 한다.

## 잔여와 검증 상태

AI 비활성 503/사용 제한 상태는 다음 F1c-3다. 기존 화면은 D-Day/Task 기반이며 새 Goal 연결 UI·여정 infinite-query hook·cache 무효화·페이지 초기화 UI는 F2/F4에서 연결한다. Workspace와 옛 PersonalSystem 이관은 구현하지 않았다. mock은 DB snapshot isolation·다중 서버 동시성을 모사하지 않는다.

읽기 시 미구체화, 전체 집계/페이지·원본 중복 제거, cursor scope/version 충돌, 긴 기간·시간대·취소/재개, D-Day/완료 독립성·null 수정 의미·반복 연결 거절·실패 후 원본 보존, owner 격리/병합의 회귀 사례를 작성했다. 사용자 요청대로 테스트·`npm run validate`·실제 화면 감사·운영 호출은 실행하지 않았다. 포맷만 적용했으며 통과로 기록하지 않는다.
