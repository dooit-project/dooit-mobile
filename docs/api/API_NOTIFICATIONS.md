# 로컬 알림 계약

Last updated: 2026-08-12

ToDoLab의 현재 알림은 백엔드 후보를 기준으로 모바일 기기에 예약하는 best-effort 로컬 알림이다. 반복 계산과 Task 상태는 백엔드가 소유하고 OS 권한·예약·취소는 모바일이 담당한다.

## 백엔드 계약

```http
GET /api/v1/tasks/notification-candidates?from=YYYY-MM-DD&to=YYYY-MM-DD
```

- `from`, `to`는 양끝 날짜를 포함하며 최대 31일이다.
- 완료·삭제·건너뛴 occurrence와 Inbox 항목은 후보에서 제외한다.
- 반복 occurrence는 조회 범위 안에서 백엔드가 materialize한다.
- `notificationKey`는 단건 `task:{taskId}`, 반복 `recurrence:{seriesId}:{occurrenceDate}` 형식이다.
- `scheduledAt`은 모바일 예약의 기준 시각이다.
- `suppressLocalNotification=true`이면 모바일은 예약하지 않는다.
- `task`에는 알림 제목과 상세 이동에 필요한 원본 Task 응답을 포함한다.

응답에서 모바일이 사용하는 필드:

```ts
type TaskNotificationCandidateResponse = {
  notificationKey: string;
  taskId: number;
  scheduledAt: LocalDateTimeString;
  recurrenceSeriesId: number | null;
  occurrenceDate: LocalDateString | null;
  suppressLocalNotification: boolean;
  task: TaskResponse;
};
```

## 모바일 정책

- 최초 실행에서는 권한을 요청하지 않는다.
- 첫 미래 일정 저장 또는 Settings의 명시적 행동 뒤에만 사전 설명과 OS 권한 요청을 제공한다.
- 이미 허용·거부된 권한은 반복 요청하지 않는다. 거부 상태는 기기 설정 이동을 제공한다.
- 오늘부터 30일 범위를 조회하고 실제 전달 시각이 가까운 50개만 예약한다.
- 시간 일정은 `scheduledAt`, 종일 일정은 해당 날짜 오전 9시에 알린다.
- 알림 제목은 Task 제목이며 시간 일정과 종일 일정은 서로 다른 본문을 사용한다.
- 예약 데이터에 `source=todolab-task`, `taskId`, fingerprint를 저장한다.
- fingerprint가 같은 예약은 유지하고 변경·삭제된 예약만 교체한다.
- 앱 활성화와 Task 생성·수정·완료·재개·이동·삭제 뒤 동기화한다.
- 로그아웃·계정 전환 시 ToDoLab source 예약만 제거한다.
- foreground에서는 배너·목록·소리를 허용한다.
- 알림 선택은 `taskId`를 검증한 뒤 Task 상세로 이동한다.

## 중복 방지

- 서버 push가 활성화된 후보는 `suppressLocalNotification=true`로 내려야 한다.
- 모바일은 이 값을 신뢰해 같은 Task의 로컬 예약을 만들지 않는다.
- 서버 push source와 전송 이력은 백엔드 계약이며 현재 모바일의 로컬 예약 상태와 섞지 않는다.

## 실패 처리

- 권한 거부, 후보 조회 실패, OS 예약 실패가 Task 저장을 실패로 바꾸지 않는다.
- 동기화 실패는 앱 활성화, 다음 Task 변경, Settings 수동 동기화 때 다시 시도한다.
- 알림 응답 복원 실패는 앱 시작이나 이후 알림 listener를 막지 않는다.
- 앱 삭제 시 기기 예약과 local preference는 OS에 의해 제거될 수 있으며 서버 Task 원본에는 영향을 주지 않는다.

## 남은 검증

- Android/iOS 실제 권한 창과 설정 복귀
- 시간 일정·종일 일정 전달 시각과 중복 수신
- foreground·background·cold start 알림 선택
- 완료·삭제·건너뜀·계정 전환 뒤 예약 제거
- 시간대·기기 날짜 변경 뒤 재동기화

상세 실기기 항목은 [`PLATFORM_QUALITY_CHECKLIST.md`](../qa/PLATFORM_QUALITY_CHECKLIST.md)를 따른다.
