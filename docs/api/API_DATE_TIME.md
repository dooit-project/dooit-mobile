# API 날짜·시간 규칙

Dooit 백엔드와 모바일은 날짜와 시간을 아래 기준으로 교환한다.

## 기준 시간대

- 서비스 기준 시간대는 백엔드 `Constant.ZONE_ID`와 같은 `Asia/Seoul`이다.
- 모바일 기기의 현재 시간대가 달라도 API 날짜는 서울 기준으로 변환한다.
- 다른 시간대 지원이 필요해지면 offset 또는 사용자 time zone을 포함하도록 백엔드 계약부터 변경한다.

## JSON 형식

| Java 타입       | JSON 예시             | 의미                      |
| --------------- | --------------------- | ------------------------- |
| `LocalDate`     | `2026-06-23`          | 서울 기준 달력 날짜       |
| `LocalDateTime` | `2026-06-23T15:30:00` | 서울 기준 wall-clock 시간 |

백엔드 `LocalDateTime` 문자열에는 `Z` 또는 `+09:00` 같은 offset이 포함되지 않는다. 모바일에서 `Date`로 바꿀 때는 `+09:00`을 명시적으로 붙여 같은 시각으로 해석한다.

## 구현 원칙

- API 문자열을 `new Date(value)`로 직접 해석하지 않는다.
- API 요청 날짜는 `toApiLocalDate`, `toApiLocalDateTime`으로 만든다.
- API 응답 날짜는 `parseApiLocalDate`, `parseApiLocalDateTime`으로 해석한다.
- 날짜 이동은 기기 시간대의 DST 영향을 받지 않는 `shiftLocalDate`를 사용한다.
- 화면 표시는 `formatDateLabel`, `formatTimeLabel`을 사용한다.
- 잘못된 입력은 임의로 보정하지 않고 parse 함수에서 `null`을 반환한다.

관련 구현은 `src/utils/date-time.ts`에서 관리한다.
