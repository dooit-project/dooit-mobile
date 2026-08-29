# 성능 점검 기준

Dooit 모바일의 성능 목표는 “빠른 앱”처럼 보이는 것이 아니라, 사용자가 오늘 할 일을 열고 완료하는 흐름이 끊기지 않는 것이다. 초기 진입, 긴 목록, 캘린더 렌더링을 우선 점검한다.

## 측정 대상

| 대상      | 주요 화면                         | 점검 이유                                 |
| --------- | --------------------------------- | ----------------------------------------- |
| 초기 진입 | Today                             | 앱을 열자마자 가장 먼저 만나는 화면       |
| 긴 목록   | Search, Completed, Today Review   | 과거 기록과 정리 항목이 늘어나는 구간     |
| 캘린더    | Calendar month grid, period bars  | 날짜 grid와 일정 bar 계산이 반복되는 구간 |
| 상세      | Task detail, D-Day connected task | 화면 전환과 mutation feedback 확인        |

## 성능 예산

실기기 기준으로 다음을 목표로 한다.

- Today 첫 skeleton 또는 첫 content 표시: 1초 이내
- Today core query 완료 후 첫 실행 Task 표시: 2초 이내
- Calendar 월 이동 후 날짜 grid 반응: 즉시 또는 100ms 이내 체감
- Search 입력 후 화면 멈춤 없음
  - 입력값은 debounce/deferred value를 사용한다.
  - pagination은 명시적 “더 보기” 또는 무한 스크롤 중 하나로 통일한다.
- 완료/다시 열기 mutation: 버튼 pending state가 즉시 보인다.

## 긴 목록 기준

현재 `Screen`은 공통 ScrollView 기반이다. 다음 조건 중 하나를 만족하면 가상화 목록 도입을 검토한다.

- 한 화면에 50개 이상 row가 렌더링된다.
- Search 결과가 pagination 없이 100개 이상 노출된다.
- Completed 주간 기록에서 하루 30개 이상 완료 항목이 자주 나타난다.
- Today Review의 지난 미완료·추천·기록함 합산이 50개를 넘는다.

가상화 후보:

- `FlatList` 또는 SectionList
- section header가 필요한 Today Review는 SectionList 우선 검토
- row 높이가 거의 고정된 Task list는 `getItemLayout` 가능성 확인

## 캘린더 렌더링 기준

- Calendar 3주 grid 날짜 계산은 `selectedDate`가 바뀔 때만 수행한다.
- 기간 bar layout은 입력 `tasks`, `dates`가 바뀔 때만 다시 계산한다.
- 같은 일정 ID가 범위 조회에서 중복되어도 한 번만 표시한다.
- 월 이동 button을 연속 탭해도 이전 layout이 깜빡이며 남지 않아야 한다.
- event label은 cell 밖으로 넘치지 않고 `+N`으로 축약된다.

## 느린 네트워크 기준

- 초기 로딩은 `ListSkeleton`을 사용하고 busy 상태를 제공한다.
- refresh 중에는 기존 데이터를 유지한다.
- network, timeout, 5xx는 공통 retry 정책을 따른다.
- 오류 화면은 재시도 버튼과 사용자용 문구를 함께 제공한다.

## 측정 전 체크리스트

- mock 모드와 real 모드를 분리해서 확인한다.
- Android 저사양 기기 또는 emulator에서 Today와 Calendar를 우선 확인한다.
- Web은 320px, 375px, 430px, 720px 폭에서 확인한다.
- dev mode 성능 수치만으로 판단하지 않고 production build 또는 EAS preview build에서 재확인한다.
- 측정 로그에는 Task 제목, 검색어, D-Day 목표명 같은 원문 데이터를 남기지 않는다.
