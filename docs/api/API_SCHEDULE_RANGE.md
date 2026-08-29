# 여러 날 일정 범위 조회 계약

Today와 Calendar가 여러 날에 걸친 일정을 빠뜨리거나 날짜마다 중복 생성하지 않도록 필요한 API 계약이다. 백엔드 구현은 `dooit-backend` 저장소에서 진행한다.

## Today 조회

`GET /api/v1/tasks/today?date=YYYY-MM-DD`는 일반 Today Task와 함께 요청 날짜에 걸쳐 있는 `SCHEDULE`을 반환해야 한다.

일정 포함 기준은 서울 기준 하루 구간과 일정 범위의 겹침이다. 종료 경계의 최종 inclusive/exclusive 규칙은 백엔드 확인 후 확정한다.

```text
schedule.startAt < nextDayStart
AND
(schedule.endAt ?? schedule.startAt) > dayStart
```

- 시작일이 이전 날짜여도 오늘까지 이어지면 반환한다.
- 종료 시각이 없으면 시작 시각이 속한 날짜에만 반환한다.
- 시간이 없는 종일 일정은 `plannedDate`가 요청 날짜와 같은 경우 반환한다.
- `endAt`이 `00:00:00`이면 해당 날짜는 점유하지 않는 exclusive 종료 경계로 처리한다.
- 종일 여러 날 일정도 종료 날짜 자정은 exclusive이며 화면에는 실제 점유한 전날까지 표시한다.
- 동일 일정은 응답에 한 번만 포함한다.
- 여러 날 일정은 Today 실행 순서와 `todayOrder` 계산에서 제외한다.

## Calendar 범위 조회

`DAY`, `WEEK`, `MONTH` 조회는 요청 범위와 겹치는 모든 `SCHEDULE`을 원본 `id`, `startAt`, `endAt`, `allDay`와 함께 반환해야 한다.

```text
schedule.startAt < rangeEndExclusive
AND
(schedule.endAt ?? schedule.startAt) > rangeStart
```

클라이언트가 날짜별 복제 항목을 합치는 방식은 사용하지 않는다. 하나의 일정 응답을 주 경계에서 시각적으로 나눠 연속 bar로 그린다.

## 확인이 필요한 경계

- 백엔드가 자정 종료와 종일 일정의 종료일을 exclusive로 처리하는지 확인
- 잘못된 `endAt < startAt` 요청의 validation 오류
- 서비스 기준 시간대 `Asia/Seoul`
- 향후 사용자별 time zone 도입 시 offset 또는 zone 식별자

프론트 mock과 단위 테스트의 현재 기준은 `src/utils/schedule-range.ts`에 있다. 실제 연결 전 백엔드 응답이 같은 규칙을 따르는지 확인한다.
