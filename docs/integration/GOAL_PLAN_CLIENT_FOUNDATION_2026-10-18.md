# 반복 계획·회차 클라이언트 기반 — F1b-1

2026-10-18 · 코드 반영, 미커밋·미검증

[F1a 목표 기반](./GOAL_CLIENT_FOUNDATION_2026-10-18.md)은 `0359caf`로 커밋했다. 이번에는 백엔드 GoalPlan/Occurrence controller·요청/응답 DTO·Plan/Occurrence/PracticeResult/TaskLink service와 domain을 읽고 통신 계약 및 계획 관리 mock을 추가했다. 새 화면이나 정보 구조는 변경하지 않았으며 Android/iOS/Web 공통 코드다. 새 의존성은 없다.

## 추가한 범위

- `src/types/goal-plan.ts`: 목표 연결/독립 계획, 반복 요일·시작일·시간대·선택 알림, 기본/최소 행동·다음 행동, 회차 snapshot·실천/휴식·버전 응답.
- `goal-plan-api.ts`: 전체/목표별/독립 목록, 생성·상세·전체 내용 수정·상태 변경. 목표 하위 경로의 ID는 body보다 우선한다.
- `goal-occurrence-api.ts`: 기간 조회, 실천 결과 저장/취소, 휴식/휴식 취소. 결과 저장의 `occurrenceVersion`은 body, 나머지 회차 변경의 version은 query로 보낸다. 휴식 PUT에 가짜 body를 넣지 않으며 취소 응답은 null이다.
- `goal-plan-query-keys.ts`: 계획 목록 필터와 회차 기간/목표가 포함된 독립 cache namespace. 아직 조회 hook·mutation cache 갱신·화면은 연결하지 않았다.
- `mock-goal-plan-store.ts`: owner별 복수/독립 계획, 기본 서울 시간대, 선택 요일 중복 제거·시간/행동 제한, 전체 내용 교체·보관 상태, 계정 병합 이전. 중첩 응답도 복사해 호출자가 내부 데이터를 바꾸지 않게 했다.
- Goal mock 상태 정책 연결: 생략/PAUSE_FUTURE는 해당 목표 계획을 멈추고 KEEP_FUTURE는 유지한다. 목표 재활성/달성 취소가 계획을 자동 재개하지 않는다. 이 단계는 계획 상태만 처리한다.

## 다음 연결에서 지킬 계약

1. 계획 PATCH는 전체 내용이다. `goalId` 생략/null은 목표 연결 해제이며 이름·schedule·기본/최소 행동은 필수다. 내용 수정만 version을 증가시키고 보관 후 내용 수정/활성화는 허용하지 않는다.
2. 회차 GET은 단순 조회가 아니다. 시작/종료 포함 1~31일을 구체화하고 연결 Task를 만들거나 갱신할 수 있다. 화면에서 임의로 오늘 회차를 합성하지 않는다.
3. goalId 필터는 회차 당시 snapshot 연결을 따른다. 수정의 effectiveFromDate, 과거/실천 완료 snapshot 보존, 미래 PENDING 재계산은 회차 mock 구현 시 함께 필요하다.
4. 휴식↔실천은 기존 선택을 취소한 뒤 전환한다. 오래된 occurrenceVersion 또는 충돌 상태의 409/70004를 그대로 전달하고 자동 덮어쓰기/재시도하지 않는다. 화면 연결 시 재조회와 사용자 재선택을 처리한다.
5. 다음 행동은 KEEP/CLEAR/REPLACE다. 요청 타입에서 REPLACE만 값을 받도록 구분했다. 공백 값 등 실제 검증은 서버 계약을 따르며 저장 시 임의로 다음 계획 내용을 바꿔 추측하지 않는다.
6. 회차의 scheduledNotificationAt은 회차 timeZone의 wall-clock이다. 일반 서울 시각 parser로 무조건 해석하지 않는다. notificationKey로 동일 알림을 식별하고 연결 Task의 별도 알림과 중복되지 않게 해야 한다.
7. 회차 결과와 Task 완료/재개는 양방향 동기화된다. 동일 행동을 Task와 실천 기록에서 두 번 집계하지 않는다. linkedTaskId가 null인 과거 회차도 허용한다.

## 명시적인 미구현 범위

**회차 mock 구체화·실천/휴식·버전 충돌·연결 Task/체크리스트·focus·알림 동기화는 다음 F1b-2다.** 현재 회차 wrapper는 실제 API 계약만 준비한 상태이며 mock client는 이 경로를 지원하지 않는다. 빈 배열이나 가짜 성공으로 대체하지 않았다. 실제 API도 이번 작업에서 호출하지 않았다.

계획 mock은 현재 version만 저장하며 effectiveFromDate는 형식만 확인한다. 과거 version 이력과 목표 version 선택은 회차 구현 전에 확장해야 한다. 일반 Goal/Plan 생성의 멱등성은 확인되지 않아 자동 timeout 재시도를 켜지 않았다. 직접 기록·여정·AI 오류 처리는 F1c다. 기존 화면은 계속 D-Day/Task API를 사용한다.

## 검증 상태

계정 격리/guest 병합, 목표 경로 우선, 독립 필터 우선, 내용 교체/연결 해제, 실패 후 데이터 보존, 목표 달성의 미래 정책·취소 후 미재개, 보관 경계·시간/행동 제약의 회귀 사례를 작성했다. 사용자 요청에 따라 테스트·`npm run validate`·실제 화면 감사·운영 API 호출은 실행하지 않았다. 포맷만 적용했으며 Android/iOS/Web 동작 통과를 주장하지 않는다.
