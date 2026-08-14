# 일정별 알림 시각 API 요구 계약

Last updated: 2026-08-14

## 목적

사용자가 일정마다 시작 시각 알림, 미리 알림 또는 알림 끄기를 선택할 수 있게 한다. 설정은 계정과 반복 일정에 속하므로 모바일 기기 로컬 저장소가 아니라 백엔드를 원본으로 사용한다.

현재 `TaskUpsertRequest`에는 알림 설정이 없고 `TaskNotificationCandidateResponse.scheduledAt`은 일정 시작 시각이다. 따라서 프론트만 변경하면 재설치·계정 전환·다른 기기에서 설정이 사라지거나 서로 다른 시각에 알릴 수 있다.

## 제안 타입

```ts
type TaskNotificationMode = 'NONE' | 'AT_START' | 'MINUTES_BEFORE';

type TaskNotificationPreferenceRequest = {
  mode: TaskNotificationMode;
  minutesBefore?: number | null;
  allDayTime?: string | null; // HH:mm:ss
};

type TaskNotificationPreferenceResponse = {
  mode: TaskNotificationMode;
  minutesBefore: number | null;
  allDayTime: string | null;
};
```

`TaskUpsertRequest`에는 선택 필드 `notificationPreference`를 추가하고 `TaskResponse`에는 정규화된 `notificationPreference`를 반환한다.

## 후보 응답 변경

기존 `scheduledAt`은 일정 자체의 시작 시각 의미로 유지하고 실제 알림 시각인 `notifyAt`을 추가한다.

```ts
type TaskNotificationCandidateResponse = {
  notificationKey: string;
  taskId: number;
  scheduledAt: string;
  notifyAt: string;
  recurrenceSeriesId: number | null;
  occurrenceDate: string | null;
  suppressLocalNotification: boolean;
  task: TaskResponse;
};
```

모바일은 `notifyAt`만 로컬 예약 시각으로 사용한다. `suppressLocalNotification=true`인 후보는 기존처럼 예약하지 않는다.

## 검증 규칙

- `NONE`은 후보 목록에서 제외한다.
- `AT_START`의 `minutesBefore`는 `null`이다.
- `MINUTES_BEFORE`는 `minutesBefore`가 필요하며 우선 허용값은 `5`, `10`, `15`, `30`, `60`이다.
- 시간 일정의 `allDayTime`은 `null`이다.
- 종일 일정은 `allDayTime`을 사용하며 기본값은 사용자 timezone의 `09:00:00`이다.
- 계산된 `notifyAt`이 현재보다 과거라면 후보에서 제외한다.
- 잘못된 조합은 HTTP 400과 안정적인 API error code로 응답한다.

## 반복 일정

- 반복 생성 시 preference는 recurrence series에 저장한다.
- occurrence 수정은 기존 `recurrenceScope=THIS|THIS_AND_FUTURE|ALL`과 같은 범위를 적용한다.
- `THIS` 수정은 해당 occurrence에 override를 남긴다.
- materialize된 각 occurrence의 후보는 최종 적용된 preference로 `notifyAt`을 계산한다.

## 계정과 push 정책

- guest 승격과 기존 계정 병합 시 Task와 함께 preference를 보존한다.
- 계정 전환 후 이전 계정 preference가 현재 후보에 섞이지 않아야 한다.
- 서버 push가 같은 `notificationKey`를 담당하면 `suppressLocalNotification=true`를 반환한다.
- push idempotency는 현재 `notificationKey` 정책을 유지하며 알림 시각 변경 시 미발송 건만 새 `notifyAt`으로 갱신한다.

## 하위 호환과 배포 순서

1. 백엔드가 요청 필드를 선택값으로 수용하고 응답에 preference와 `notifyAt`을 추가한다.
2. 구버전 클라이언트는 추가 응답 필드를 무시하고 기존 시작 시각 알림을 유지한다.
3. 모바일이 새 필드를 읽고 생성·편집 UI를 노출한다.
4. real API에서 단건·반복·종일·계정 전환·push suppression을 검증한다.
5. 검증 후 백엔드 기본 preference 정책을 확정한다.

## 완료 판단

- Task 생성·수정·조회와 notification candidates 문서 및 통합 테스트에 위 계약이 반영된다.
- 모바일의 후보 fingerprint가 `notifyAt` 변경을 감지해 기존 예약을 취소하고 다시 예약한다.
- Android·iOS에서 시작 시각, 5·10·15·30·60분 전, 종일 지정 시각, 알림 끄기가 검증된다.
