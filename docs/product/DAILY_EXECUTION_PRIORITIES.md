# 오늘 실행 루프 우선순위

Last updated: 2026-09-02

## 목표

Dooit의 슬로건인 “생각난 일은 가볍게 기록하고, 오늘 해야 할 일은 선명하게.”를 제품의 반복 행동으로 만든다.

```text
빠른 기록 → 오늘 계획 → 한 가지 실행 → 하루 마감 → 다음 날 복구
```

기능 수를 늘리는 것보다 기존 기록함·Today·완료·추천·오래 미룬 일의 연결을 먼저 개선한다. 경쟁 앱의 habit, Pomodoro, matrix, 자동 일정 배치를 한꺼번에 도입하지 않는다.

## 프론트엔드 우선순위

### F0. 기존 출시 후보 검증

새 제품 기능보다 현재 APK·production API·알림·복구 검증을 먼저 완료한다. 새 기능은 별도 prototype 또는 feature flag로 작업해 출시 후보 기준선을 흔들지 않는다.

### F1. 오늘 계획 MVP

현재 API의 기록함, 오래 미룬 Task, Today 추천과 날짜 이동 mutation을 조합해 짧은 계획 흐름을 만든다.

1. 어제 또는 오래 미룬 항목을 확인한다.
2. 기록함과 추천에서 오늘 가져올 항목을 고른다.
3. 오늘 목록을 재정렬한다.
4. 첫 1~3개를 “먼저 할 일”로 확인하고 Today로 돌아간다.

초기 prototype의 “계획 완료 여부”와 마지막 노출 날짜는 계정별 local preference로 저장할 수 있다. Task 자체의 핵심 여부는 서버 계약 전까지 영구 데이터처럼 저장하거나 동기화됐다고 표현하지 않는다.

완료 판단:

- 기존 API만으로 mock Web과 Android에서 정상·빈 상태·부분 실패가 동작한다.
- 계획을 건너뛰어도 Today를 계속 사용할 수 있다.
- 추천 API 실패가 Today 핵심 목록을 막지 않는다.
- 선택한 항목이 실제 Today 이동·순서와 일치한다.

### F1. 하루 마감 MVP

미완료 Today Task를 한 화면에서 검토하고 기존 날짜 이동·기록함 이동·미룸 사유 mutation으로 처리한다.

- 내일로 이동
- 날짜 선택
- 기록함으로 이동
- 하지 않기로 결정할 때 삭제 또는 별도 확인
- 완료 수, 이동 수, 남은 수를 기기에서 계산해 결과로 표시

서버 집계가 생기기 전에는 연속 달성, 점수, 장기 생산성 통계를 제공하지 않는다.

완료 판단:

- 각 항목의 처리 결과가 Today·Calendar·기록함 cache에 일관되게 반영된다.
- 중간 실패 시 완료된 mutation과 실패한 mutation을 구분해 재시도할 수 있다.
- 앱을 닫거나 날짜가 바뀌어도 처리되지 않은 Task가 유실되지 않는다.

### F1. 전역 메뉴와 스마트 진입점

[`NAVIGATION_INFORMATION_ARCHITECTURE.md`](./NAVIGATION_INFORMATION_ARCHITECTURE.md)의 1단계 prototype에 다음 진입점을 우선 배치한다.

- 오늘
- 달력
- 기록함
- 오래 미룬 일 또는 하루 정리
- 완료 기록
- 목표
- 공유 공간
- 검색·템플릿·설정

카테고리보다 이미 신뢰할 수 있는 서버 조회 결과를 먼저 사용한다. `예정`은 Calendar range 조회로 표현하되 별도 스마트 목록이 필요한지는 사용 흐름을 보고 결정한다.

### F2. 한 가지 실행하기

Today에서 Task 하나를 선택해 다른 목록을 잠시 접는 session-only 집중 화면을 검증한다.

- Task 제목과 설명
- 완료
- 잠시 미루기 또는 Today 순서 뒤로 보내기
- 상세 열기

Pomodoro, 연속 집중 시간과 통계는 포함하지 않는다. 사용자가 실제로 다음 행동을 시작하는 데 도움이 되는지 먼저 확인한다.

### F2. 앱 밖 빠른 기록 탐색

기존 quick capture API를 재사용해 플랫폼별 비용이 낮은 순서로 검토한다.

1. 공유 메뉴에서 텍스트·URL을 확인한 뒤 기록함에 저장
2. 공식 SDK가 지원하는 iOS 홈 화면 widget의 기록 진입
3. 제3자 패키지 또는 자체 config plugin 기반 iOS·Android quick action
4. 음성 입력

Expo SDK 56 기술 판단과 구현 격리 기준은 [`OUTSIDE_APP_QUICK_CAPTURE_SPIKE.md`](./OUTSIDE_APP_QUICK_CAPTURE_SPIKE.md)를 따른다. 공식 `expo-widgets`는 iOS만 지원하므로 Android widget을 같은 단계의 필수 범위로 묶지 않는다. development build 필요 여부와 앱이 종료된 상태의 인증 bootstrap을 먼저 확인하고 Web에는 native 기능을 억지로 맞추지 않는다.

### F3. 백엔드 계약 연결

- 오늘의 핵심 항목 영속화와 여러 기기 동기화
- 예상 소요 시간 입력과 Today 총량 표시
- 일괄 계획·마감 저장
- 가벼운 체크리스트
- 카테고리 관리

세부 계약은 [`API_DAILY_EXECUTION.md`](../api/API_DAILY_EXECUTION.md)를 따른다.

## 백엔드 요청 우선순위

| 순위 | 요청                               | 필요한 이유                                                    | 프론트 선행 가능 범위                   |
| ---- | ---------------------------------- | -------------------------------------------------------------- | --------------------------------------- |
| B0   | 일일 계획과 핵심 Task 1~3개 영속화 | 기기 변경·재설치·Web/Native 사이에서 오늘 계획을 동일하게 유지 | local preference 기반 UX prototype      |
| B0   | Task 예상 소요 시간                | 일정과 Task를 합쳐 오늘 분량을 판단                            | 고정 예시 또는 입력 UI prototype만 가능 |
| B1   | 일일 계획·마감 batch mutation      | 여러 Task를 순차 변경하다 일부만 성공하는 문제 방지            | 항목별 mutation과 부분 실패 UX 검증     |
| B1   | 체크리스트 item CRUD·정렬·완료     | 큰 Task를 바로 실행 가능한 다음 행동으로 분해                  | 정적 prototype만 가능                   |
| B2   | 일일 결과 summary                  | 여러 기기에서 완료·이동·미결정 수를 같은 기준으로 표시         | 현재 조회 결과로 당일 요약 계산         |
| B2   | 카테고리 entity와 집계             | 전역 메뉴에서 안정적인 카테고리 탐색 제공                      | 자유 입력 category 검색만 유지          |

## 의도적으로 보류

- 습관 tracker
- Eisenhower Matrix
- Kanban·Gantt·Timeline
- AI 자동 일정 재배치
- 생산성 점수와 연속 달성
- 댓글·파일·복잡한 Workspace activity feed

위 기능은 오늘 실행 루프의 사용성과 반복 사용이 먼저 확인된 뒤 별도 문제 정의가 있을 때 검토한다.
