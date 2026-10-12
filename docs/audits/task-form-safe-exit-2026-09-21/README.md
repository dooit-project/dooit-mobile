# Task 작성 화면 안전한 복귀 감사

## 문제와 목표

`/tasks/new`를 새로고침하거나 주소로 직접 열면 navigation history가 없어 상단 뒤로가기와 하단 취소가 처리되지 않았다. 앱 내부에서 진입한 경우에는 기존 화면으로 돌아가고, 이전 화면이 없는 경우에는 Today로 이동해야 한다.

## 구현

- `router.canGoBack()`이 참이면 기존 `back()` 동작을 유지한다.
- 이전 화면이 없으면 `router.replace('/')`로 Today를 안전한 기본 목적지로 사용한다.
- 상단 뒤로가기와 하단 취소가 같은 복귀 함수를 사용한다.
- 화면 배치와 문구는 바꾸지 않았다.

## 실제 화면 감사

| 상태                        | 근거                                                                 | 결과                                      |
| --------------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| 직접 연 새 일정, 390×844    | [`01-direct-schedule-390x844.png`](./01-direct-schedule-390x844.png) | 상단 뒤로가기와 하단 취소가 함께 보임     |
| 직접 진입 후 Today, 390×844 | [`02-fallback-today-390x844.png`](./02-fallback-today-390x844.png)   | 취소 뒤 Today로 이동하고 작성 화면이 닫힘 |

- Web Chrome, mock API, light theme에서 확인했다.
- 직접 연 아이디어에서 상단 뒤로가기를 눌렀을 때 `/`로 이동했다.
- Today에서 아이디어 작성으로 들어간 뒤 상단 뒤로가기를 누르면 history의 Today로 복귀했다.
- 직접 연 일정에서 취소를 눌렀을 때 `/`로 이동했다.
- browser console error는 0건이다.
- `leaveNewTaskScreen` 단위 테스트로 history 유무의 두 분기를 확인했다.
- Android hardware back과 iOS swipe gesture는 이번 Web 감사 범위 밖이다.

final result: passed
