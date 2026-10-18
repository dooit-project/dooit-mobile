# 날짜별 회차와 Task 동기화 — F1b-2

2026-10-18 · `39bc77e` 커밋, 미검증

후속 [F1c-1 직접 기록·여정 조회 계약](./GOAL_DIRECT_LOG_FOUNDATION_2026-10-18.md)에서 직접 기록 API/mock과 여정 조회 타입·API를 추가했다. 통합 여정 mock과 일회성 Task Goal 연결은 다음 단위다.

[반복 계획·회차 API 기반](./GOAL_PLAN_CLIENT_FOUNDATION_2026-10-18.md)은 `c3d17cc`로 커밋했다. 이번에는 백엔드 GoalPlanOccurrenceService·GoalPracticeResultService·GoalOccurrenceTaskLinkService·TaskTxService/domain을 대조해 mock의 회차 및 연결 Task를 구현했다. Android/iOS/Web 공통 코드이며 화면/정보 구조 변경·새 의존성·실제 API 호출은 없다.

## 구현 범위

- Goal/Plan 수정 이력을 적용일·version별로 저장한다. 회차 날짜에 유효한 가장 높은 version을 선택하고, 목표 생성 전 시작한 계획에는 최초 Goal snapshot을 사용한다.
- 시작/종료 포함 1~31일 조회에서 선택 요일을 구체화한다. planId+serviceDate로 중복을 막고 날짜/회차 ID 순서로 반환한다. goalId 필터는 현재 계획 연결이 아닌 회차 snapshot 기준이다. 필터 없는 독립 계획도 지원한다.
- 과거·PRACTICED·RESTED snapshot은 보존한다. 미래 PENDING만 재계산하고, 휴지/보관·요일 제외로 사라지는 미래 PENDING은 반환에서 제외하되 원본과 연결 Task ID는 남긴다.
- 미래 PENDING에는 날짜만 있는 TODO를 생성/갱신한다. 제목은 snapshotNextAction 또는 최소 행동이며, Task 알림은 비활성이다. 과거 회차는 linkedTaskId가 null일 수 있다.
- 실천 결과 STANDARD/MINIMUM/UNKNOWN·실제 한 일·어려움·KEEP/CLEAR/REPLACE 기록을 저장한다. 실천은 연결 Task와 미완료 체크리스트를 완료하고 집중 목록에서 제거한다. 실천 취소 시 회차와 Task를 재개한다. 체크리스트 완료는 자동으로 되돌리지 않는다.
- 휴식은 RESTED 기록과 Task의 기록함 이동이다. 실천/휴식 전환은 먼저 이전 선택을 취소해야 한다. 전달한 occurrenceVersion이 오래됐으면 409/70004, 다른 owner 회차는 404/70003이다. 실패 전 원본을 수정하지 않는다.
- Task 직접 체크는 UNKNOWN 실천을 만든다. 이미 명시적으로 남긴 기본/최소 기록은 완료 시각까지 보존한다. Task 재개는 결과를 취소하며, RESTED Task의 완료/재개와 회차 연결 Task 삭제는 409다.
- 목표 PAUSE_FUTURE와 계획 정지/보관 시 미래 PENDING Task를 즉시 기록함으로 옮기고 focus에서 제거한다. 목표 달성 취소만으로 계획/Task를 재개하지 않는다. 계획 활성화 후 회차 조회가 같은 Task를 다시 사용한다.
- guest 병합 시 회차 소유권도 함께 이전하며 Goal/Plan/Task의 기존 소유권 이전과 연결한다.

## 알림과 시간대 경계

회차 응답의 notificationKey는 `goal-plan:{planId}:{serviceDate}`이며 scheduledNotificationAt은 활성 계획의 PENDING에만 제공한다. Task 후보와 중복 알림을 만들지 않는다. **실제 native 알림 예약·재조정은 아직 연결하지 않았다.** 회차의 timeZone wall-clock과 일반 API의 서울 완료 시각을 구분한다. 다른 시간대 날짜 경계도 mock에서 사용한다.

mock 전용 변환은 Intl 시간대 데이터를 사용하며 DST 겹침은 이른 instant, 빈 시각은 앞으로 이동하는 방식이다. 저장된 practicedAt 원문은 유지하고 Task 완료 시각은 기존 클라이언트 utility와 같은 초 단위다. 운영 시간대·DST·알림 실기기 검증을 대체하지 않는다.

## 남은 범위

현재 화면은 계속 기존 Task/D-Day 기반이다. 조회 hook·mutation cache 갱신·회차 UI·native 알림은 F2/F3에서 연결한다. 자동으로 새 Goal 데이터를 만들거나 이전 데이터를 이관하지 않았다. NextActionPatch는 결과의 변경 의도를 기록하며 계획 정의를 임의로 덮어쓰지 않는다.

mock은 프로세스 메모리와 순차 요청 모델이다. 실제 DB transaction/lock·다중 프로세스 동시성을 모사하지 않는다. occurrenceVersion은 변경 시 증가하는 불투명한 값으로 다루며 서버의 정확한 증가 횟수와 일치한다고 가정하지 않는다. 직접 기록·여정과 일회성 Task의 새 Goal 연결은 다음 F1c다. 기존 D-Day ID와 새 Goal ID는 계속 별개다.

## 검증 상태

기간 경계·반복 조회 중복 방지, 과거 Task 생략, 결과/Task/체크리스트/focus, 휴식 충돌·버전 충돌·삭제 방지, UNKNOWN/기존 결과 보존, 적용일·과거 snapshot·연결 해제, 정지/재개, 다른 시간대·DST, owner 격리/병합의 회귀 사례를 작성했다. 사용자 요청대로 테스트·`npm run validate`·실제 화면 감사·운영 호출은 실행하지 않았다. 포맷만 적용했으며 통과 기록은 아니다.

작업 중 빠른 기록 requestedType·로컬 실행 명령의 별도 변경이 동시에 들어왔다. 이번 회차 구현 범위와 구분해 보존했고, 그 기능의 배포/완료 상태를 이 문서에서 갱신하지 않았다.
