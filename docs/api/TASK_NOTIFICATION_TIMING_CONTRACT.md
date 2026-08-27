# 일정별 알림 시각 API 계약

Last updated: 2026-08-27

## 목적

사용자가 일정마다 시작 시각 알림, 미리 알림 또는 알림 끄기를 선택할 수 있게 한다. 백엔드를 설정 원본으로 사용해 재설치·계정 전환·다른 기기에서도 같은 시각을 유지한다.

## 채택된 타입

백엔드는 제안했던 중첩 `notificationPreference` 대신 하위 호환 가능한 두 필드를 `TaskRequest`와 `TaskResponse`에 채택했다.

```ts
type TaskNotificationFields = {
  notificationEnabled?: boolean | null; // 생략하면 true
  notifyAt?: string | null; // null이면 startAt 기준
};
```

모바일은 시작 시각·분 전 선택을 UI에서 `notifyAt` 절대 시각으로 계산한다.

## 후보 응답

후보의 `scheduledAt`은 실제 예약 시각이다. `notifyAt`이 있으면 같은 값을, 없으면 `startAt`을 사용한다.

```ts
type TaskNotificationCandidateResponse = {
  notificationKey: string;
  taskId: number;
  scheduledAt: string;
  notifyAt: string | null;
  recurrenceSeriesId: number | null;
  occurrenceDate: string | null;
  suppressLocalNotification: boolean;
  task: TaskResponse;
};
```

모바일은 `scheduledAt`을 로컬 예약 시각으로 사용하고 `notifyAt` 변화도 fingerprint에 포함한다. `suppressLocalNotification=true`인 후보는 예약하지 않는다.

## 검증 규칙

- `notificationEnabled=false`는 후보 목록에서 제외한다.
- `notifyAt=null`이면 시작 시각에 알린다.
- `notifyAt`은 시작 시각이 있는 Task에만 설정할 수 있다.
- 알림이 비활성화된 Task에는 `notifyAt`을 설정할 수 없다.
- 모바일 UI의 우선 선택지는 시작 시각과 5·10·15·30·60분 전이다.
- 과거 예약 시각은 후보에서 제외하고 잘못된 조합은 HTTP 400으로 응답한다.

## 반복·계정·push

- 반복 생성 시 알림 필드는 recurrence series와 occurrence에 보존한다.
- occurrence 수정은 `recurrenceScope=THIS|THIS_AND_FUTURE|ALL`을 따른다.
- materialize된 occurrence는 날짜 이동만큼 `notifyAt`도 이동한다.
- guest 승격과 기존 계정 병합 시 Task와 함께 알림 필드를 보존한다.
- 계정 전환 후 이전 계정 후보가 현재 예약에 섞이지 않아야 한다.
- 서버 push가 같은 `notificationKey`를 담당하면 `suppressLocalNotification=true`를 반환한다.

## 구현 상태와 순서

1. 백엔드 요청·응답·후보와 통합 테스트 반영은 완료됐다.
2. 구버전 클라이언트는 추가 필드를 무시하고 기존 시작 시각 알림을 유지한다.
3. 모바일 타입, 생성·편집 UI와 후보 fingerprint 연결은 완료됐다.
4. real API에서 단건·반복·종일·계정 전환·push suppression을 검증한다.
5. Android·iOS에서 시작 시각, 5·10·15·30·60분 전과 알림 끄기를 검증한다.

## 모바일 구현

- 일정 생성·편집에서 알림 끄기, 시작 시각, 5·10·15·30·60분 전을 선택한다.
- 분 전 선택은 저장 시 `notifyAt` 절대 시각으로 계산하며 날짜 경계도 함께 이동한다.
- 종일 일정은 기존 로컬 정책에 맞춰 당일 오전 9시 또는 알림 끄기만 제공한다.
- 후보 `scheduledAt`을 실제 OS 예약 시각으로 사용하고 `notifyAt` 변경도 fingerprint에 포함한다.
- Android·iOS는 로컬 알림을 다시 맞추며 Web은 알림 예약 없이 동일한 Task 설정만 저장한다.
