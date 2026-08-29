# 접근성·읽기 순서·글꼴 확대 점검표

이 문서는 Dooit 모바일을 Android, iOS, Web에서 실제로 점검할 때 사용하는 기준이다. 디자인 원칙은 [`DESIGN.md`](../design/DESIGN.md)를 따른다.

## 공통 기준

- 터치 대상은 최소 44×44pt를 유지한다.
- 화면에 보이는 작은 checkbox, icon, event bar도 실제 hit area는 충분히 넓어야 한다.
- 역할이 다른 행동은 하나의 터치 대상으로 합치지 않는다.
  - 예: 완료 checkbox와 상세 보기 영역은 별도 역할과 label을 가진다.
- 색상만으로 상태를 전달하지 않는다.
  - 완료, 오류, 선택, 반복, 일정 상태는 문구·역할·상태값 중 하나를 함께 제공한다.
- 공통 오류와 loading 상태는 `InlineNotice`, `ListSkeleton`의 접근성 속성을 우선 사용한다.
- 오류·경고 `InlineNotice`는 alert 역할과 live region으로 중요한 상태 변화를 전달한다.

## 화면별 읽기 순서

### Today

1. 페이지 맥락
2. 주간 날짜 strip
3. 일정 section
4. 오늘 할 일 section
5. 정리할 항목 진입점
6. 기본 노출된 최근 완료 3개와 전체 보기·접기
7. 빠른 기록 버튼 또는 composer

점검:

- 일정이 많아도 오늘 할 일 section이 지나치게 아래로 밀리지 않는지 확인한다.
- 완료 checkbox → Task 제목/상세 → 보조 행동 순서로 읽히는지 확인한다.
- 정리할 항목은 버튼 역할과 개수 정보를 함께 읽어야 한다.
- 빠른 기록 버튼과 입력창은 “기록함에 추가된다”는 목적을 hint로 제공해야 한다.

### Calendar

1. 페이지 제목
2. 월 이동 controls
3. Calendar 3주 grid 날짜
4. 일정 label 또는 기간 bar
5. 선택 날짜의 목록과 filter

점검:

- 날짜 cell은 선택 상태를 읽어야 한다.
- 하루 일정과 기간 일정은 접근성 label에서 구분되어야 한다.
- `+N` overflow는 해당 날짜의 전체 목록을 여는 버튼으로 읽혀야 한다.

### Search

1. 페이지 제목
2. 검색어 입력
3. 필터 그룹
4. 정렬 그룹
5. 검색 결과 목록

점검:

- 검색어 입력에는 목적이 hint로 제공되어야 한다.
- filter와 sort는 selected state를 제공해야 한다.
- 검색 결과는 날짜 기준과 날짜 label을 함께 읽어야 한다.

### Completed

1. 페이지 제목
2. 주 이동 controls
3. 일별 완료 count
4. 선택 날짜 완료 목록

점검:

- 날짜 버튼은 선택 상태와 완료 개수를 함께 읽어야 한다.
- 다시 열기 action은 완료 취소 의미가 명확해야 한다.

### 더보기

1. 페이지 제목
2. destination list
3. 각 목적지의 제목과 설명

점검:

- destination row는 list 안의 button으로 읽혀야 한다.
- API 연결, 앱 가이드, 알림처럼 목적이 다른 설정도 같은 row·section 문법과 명확한 상태 label을 유지한다.

## 글꼴 확대 기준

검증 배율:

- iOS Dynamic Type 기본, 큰 글꼴
- Android font scale `1.0`, `1.3`, `1.5`
- Web browser zoom 100%, 125%, 150%

점검:

- Task 제목과 primary action은 유지하고 metadata, 설명, 보조 count가 먼저 줄거나 생략된다.
- 버튼 text가 잘릴 때 icon-only로 바꾸지 않고 label을 유지할 수 있는지 먼저 확인한다.
- horizontal chip/filter는 overflow가 생기면 wrap 또는 scroll 중 하나로 명확하게 처리한다.
- 320px 폭에서 제목 2줄, 긴 category, 긴 시간 범위를 함께 확인한다.

## 명암과 상태

- `theme-contrast` 테스트는 최소 회귀선이고 실제 화면에서는 light/dark 둘 다 확인한다.
- hairline rule은 light/dark에서 section 구분이 가능해야 하지만 카드처럼 과하게 보이면 안 된다.
- pastel surface 위의 text는 4.5:1 이상을 목표로 한다.
- focus outline은 오류 border와 구분되어야 한다.

## 실제 기기 smoke test 항목

- VoiceOver: Today에서 첫 Task 완료 후 성공 안내가 읽히는지
- TalkBack: Calendar 날짜 이동과 일정 상세 진입이 끊기지 않는지
- Web keyboard: tab 순서가 시각 순서와 크게 어긋나지 않는지
- 큰 글꼴: Today 첫 viewport에서 일정과 오늘 할 일 중 최소 하나를 확인할 수 있는지
- 네트워크 오류: retry 버튼이 focus 가능하고 오류 문구가 live region으로 전달되는지

## 최소 smoke 순서

릴리즈 후보 또는 큰 UI 변경 뒤에는 아래 순서만큼은 실제 화면에서 확인한다.

### 1. Today

1. 화면 진입 후 주간 날짜 strip이 먼저 읽히고, 현재 날짜가 selected 상태로 전달되는지 확인한다.
2. 일정 section이 있으면 일정 제목, 시간 또는 기간, 반복 label, 상세 보기 목적이 한 문장으로 이해되는지 확인한다.
3. 오늘 할 일 checkbox가 `미완료` 또는 `완료됨` 상태를 읽고, 완료 후 성공 안내가 전달되는지 확인한다.
4. 오늘 할 일이 없을 때 `바로 기록하기` 버튼이 빠른 기록 composer를 열고, 입력 목적이 “기록함에 추가”로 전달되는지 확인한다.
5. 정리할 항목 row가 버튼으로 읽히고 미완료, 추천, 기록함 count가 함께 전달되는지 확인한다.

### 2. Calendar

1. 이전/다음 주 이동 control과 월 선택 control이 제목 주변에서 자연스럽게 탐색되는지 확인한다.
2. 날짜 cell은 날짜, 요일, 선택 상태를 읽어야 한다.
3. 하루 일정 label과 여러 날 기간 bar는 각각 “하루 일정”, “기간 일정”으로 구분되어야 한다.
4. 일정 overflow는 단순 장식이 아니라 해당 날짜 전체 목록을 여는 버튼으로 읽혀야 한다.
5. 선택 날짜 목록의 checkbox와 상세 보기 영역이 별도 control로 탐색되는지 확인한다.

### 3. 더보기와 보조 화면

1. 로그인 전후 identity card가 현재 상태를 명확히 읽는지 확인한다.
2. 로그인, 로그아웃, 검색, 목표, 완료 기록, 설정 row가 모두 button 역할과 목적 설명을 제공하는지 확인한다.
3. Search filter, Completed 주 이동, D-Day 목표 메뉴처럼 접히거나 선택되는 control은 expanded 또는 selected 상태를 제공해야 한다.

## 점검 기록 양식

```text
날짜:
커밋:
플랫폼: iOS / Android / Web
기기 또는 viewport:
font scale / zoom:
API 모드: mock / real

통과:
-

수정 필요:
- 화면:
  문제:
  재현 순서:
  기대 동작:
  우선순위: 높음 / 보통 / 낮음

보류:
-
```
