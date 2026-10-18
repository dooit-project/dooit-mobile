# 직접 기록·여정 조회 계약 — F1c-1

2026-10-18 · `8bf28c5` 커밋, 미검증

후속 [F1c-2 목표 여정 집계·일회성 Task 연결](./GOAL_JOURNEY_MOCK_2026-10-18.md)에서 통합 mock과 Goal 연결을 추가했다. 아래 미구현 설명은 F1c-1 당시 범위이며 hook·화면 연결은 여전히 후속이다.

[회차·Task 동기화](./GOAL_OCCURRENCE_MOCK_2026-10-18.md)는 `39bc77e`로 커밋했다. 이번 단계는 GoalDirectLog/Journey controller·DTO·service·domain을 읽고 직접 기록의 저장 기반과 여정 조회 계약을 추가했다. Android/iOS/Web 공통 코드이며 화면·새 의존성·운영 데이터 변경은 없다.

## 코드 반영

- `src/types/goal-journey.ts`: 직접 기록의 전체 내용 요청·취소 상태·원래 Goal version, 여정 원본 유형·실천 날짜/시각·snapshot·전체 기간 집계·페이지/cursor 응답.
- `goal-journey-api.ts`: 직접 기록 생성·수정·취소와 여정 GET. 직접 기록 생성의 요청 키를 호출자 필수 인자로 받는다. 빈 키/160자 초과를 차단하며 요청마다 새 키를 만드는 경로를 추가하지 않았다. 공통 client는 전달한 키로 timeout 재시도를 수행한다.
- `goal-journey-query-keys.ts`: 목표·기간·timezone·limit을 포함하는 조회 키. cursor는 infinite-query의 page parameter이므로 범위 키에서 제외한다. 아직 실제 infinite-query hook은 없다.
- `mock-goal-direct-log-store.ts`: owner·goal·key별 생성 요청, 정규화된 원본 본문 유지, 수정/취소된 현재 상태 replay, 내용이 달라진 key 재사용의 409/10004, 취소 후 수정의 409/70007, 다른 owner의 404/70006. guest 로그인 병합에 기록 소유권도 함께 이전한다.

## 저장·재시도 계약

직접 기록은 이미 한 일을 적는 경로다. 제목·실천 날짜는 필수이며 note와 timezone은 선택이다. 기본 timezone은 Asia/Seoul이다. PATCH도 날짜/시간대/제목/메모 전체 교체다. 생성 당시 선택한 Goal version은 날짜를 수정해도 바뀌지 않는다.

사용자 한 번의 저장 시도에 key와 원본 요청을 함께 유지해야 한다. timeout 뒤 재시도할 때 수정 중인 폼을 원본 key에 붙이지 않는다. 같은 정규화 본문은 같은 기록의 **현재 상태**를 반환하므로 수정·취소 이후에도 새 기록을 만들지 않는다. 취소 응답은 null이며 취소 시각은 반복 호출로 덮어쓰지 않는다. 취소 기록의 수정은 금지한다.

mock은 JSON 직렬화한 정규화 본문을 비교한다. 서버 SHA-256 형식의 구현 복제가 아니며 행 잠금/transaction/다중 서버 경합을 모사하지 않는다. owner·goal·key의 의미와 실패 경계를 맞추는 개발용 저장소다.

## 여정 조회 계약과 잔여

여정 GET은 회차를 생성하지 않는다. 31일 제한이 없으며 limit은 1~100(기본 50)이다. summary는 페이지가 아닌 전체 기간 기준이다. sourceType+sourceId를 원본 식별자로 사용하고 PLAN_OCCURRENCE의 연결 Task를 일회성 완료로 다시 집계하지 않아야 한다.

query timezone은 실천 시각/Task 완료 시각을 날짜로 바꿀 때 사용한다. 직접 기록은 날짜만 있으므로 practicedDate 자체를 사용한다. cursor는 owner·goal·기간·timezone과 원본 version에 묶인다. 409/70008은 `isGoalJourneyConflict`로 구분할 수 있다. 화면 연결 시 기존 페이지/cursor를 버리고 첫 페이지부터 다시 조회해야 하며 여기서는 자동 재조회하지 않는다.

**여정 통합 mock·일회성 Task의 새 Goal 연결은 다음 F1c-2다.** 이번 작업의 여정 wrapper는 실제 API 계약만 준비했으며 mock 경로는 아직 지원하지 않는다. 빈 여정/가짜 summary로 성공을 반환하지 않는다. F1c의 AI 비활성 상태 모델링도 잔여다. 직접 기록 작성/수정 UI·저장 시도 보존·cache 갱신과 여정 화면은 F4에서 연결한다. 기존 화면은 그대로다.

## 검증 상태

정규화 replay·편집/취소 후 replay·변경된 본문 409·취소 반복·취소 후 수정 금지, 적용일별 Goal snapshot과 수정 후 보존, goal별 key scope·owner 격리/guest 병합, 잘못된 본문/키가 저장 시도를 점유하지 않는 사례를 작성했다. 사용자 요청대로 테스트·`npm run validate`·실제 화면 감사·실 API 호출은 실행하지 않았다. 포맷만 적용했으며 동작 통과로 기록하지 않는다.
