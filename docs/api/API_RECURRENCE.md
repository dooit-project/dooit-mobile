# 반복 Task·일정 API 계약

Last updated: 2026-08-12

반복 규칙과 실제 occurrence를 분리한다. 반복 계산·materialize·예외 상태는 백엔드가 소유하고 모바일은 생성 요청, 범위 선택, occurrence 표시와 상태 변경을 담당한다.

## 생성 계약

```json
{
  "title": "업무 회의",
  "type": "SCHEDULE",
  "startAt": "2026-08-18T09:00:00",
  "endAt": "2026-08-18T10:00:00",
  "recurrence": {
    "frequency": "WEEKLY",
    "interval": 1,
    "byDays": ["TU"]
  }
}
```

지원 입력:

- `frequency`: `DAILY`, `WEEKLY`, `MONTHLY`
- `interval`: 1–99
- `byDays`: 주간 요일
- `byMonthDays`: 월간 날짜
- `recurrenceUntil` 또는 `recurrenceCount`: 선택적 종료 조건
- `timeZone`: 현재 서비스 기준 `Asia/Seoul`

## 응답 모델

- `recurrenceSeriesId`: 반복 묶음 ID
- `recurrence`: 반복 series 상세
- `recurrenceRule`: RRULE 호환 표현
- `recurrenceStartAt`: 첫 발생 시각
- `occurrenceDate`: 현재 occurrence 날짜
- `originalOccurrenceDate`: 이동·수정 전 날짜
- `recurrenceException`: `SKIPPED`, `MOVED`, `MODIFIED`

Today와 Calendar 조회는 요청 범위 안의 occurrence를 materialize해 반환한다. 무한 반복 전체를 미리 Task row로 만들거나 모바일이 자체 계산하지 않는다. 여러 날 반복 일정은 [`API_SCHEDULE_RANGE.md`](./API_SCHEDULE_RANGE.md)의 겹침 규칙을 따른다.

## 수정·삭제 범위

```text
PUT    /api/v1/tasks/{id}?recurrenceScope=THIS|THIS_AND_FUTURE|ALL
DELETE /api/v1/tasks/{id}?recurrenceScope=THIS|THIS_AND_FUTURE|ALL
```

- `THIS`: 현재 occurrence만
- `THIS_AND_FUTURE`: 현재 occurrence와 이후
- `ALL`: 반복 전체

모바일은 반복 항목 수정·삭제 전에 범위를 선택하게 한다. 단건 건너뛰기는 `DELETE recurrenceScope=THIS`로 처리하고 이후 occurrence는 유지한다.

## 상태와 캐시

- 완료·미룸·이동·건너뛰기는 occurrence별 상태다.
- mutation 성공 뒤 Today, Calendar, Done, Search, detail cache를 최신 응답으로 맞춘다.
- scope 변경 뒤 관련 query 전체를 invalidate해 materialize 결과를 다시 받는다.
- 완료·건너뛴 occurrence는 다음 notification candidates에서 제외돼야 한다.
- 모바일 로컬 알림 책임은 [`API_NOTIFICATIONS.md`](./API_NOTIFICATIONS.md)를 따른다.

## 현재 검증 기준

2026-08-02 local real API smoke에서 다음 흐름이 통과했다.

- 반복 생성과 nested `recurrence` 응답
- Today·Calendar occurrence materialize
- occurrence 완료·미룸·건너뛰기
- 이후 occurrence 유지
- `recurrenceScope=ALL` 정리
- 완료·건너뛴 occurrence의 notification candidates 제외

현재 모바일은 반복 없음·매일·매주·매월·사용자 지정 입력과 `THIS`, `THIS_AND_FUTURE`, `ALL` 수정·삭제 UI를 제공한다.

## 남은 검증

- 최신 backend 배포와 현재 앱 commit 조합의 real smoke 재실행
- 월말·윤년·DST 또는 사용자 time zone 도입 시 경계
- 반복 전체 수정 뒤 기존 완료 기록 보존
- offline·중복 요청에서 scope mutation idempotency
- 실제 기기에서 occurrence 변경 뒤 Calendar와 로컬 알림 갱신
