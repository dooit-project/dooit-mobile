# 탭 상단 흰색 구간 감사

Last updated: 2026-09-17

## 감사 범위

- 사용자 보고: 공통 상단 헤더의 하단 테두리 아래에 일정한 흰색 구간이 보인다.
- 대상: 오늘·달력·더보기 탭의 헤더와 첫 콘텐츠 사이 간격.
- 환경: Chrome, localhost:8090, mock API, 390×844. 저장소 기본 내장 브라우저 연결을 사용할 수 없어 기존 Chrome 연결을 사용했다.

## 화면별 확인

1. [오늘](./01-today-390.png): 헤더 하단 y=56, 주간 스트립 상단 y=72로 Web에서는 16px 간격이다.
2. [달력](./02-calendar-390.png): 헤더 아래 16px 콘텐츠 padding 뒤 안내문이 시작한다. 안내문이 끝난 뒤 달력 제목이 이어지므로 제목 위치만 재면 공백이 과대 측정된다.
3. [더보기](./03-more-390.png): 헤더 하단 y=56, 첫 섹션 제목 y=88로 32px 간격이다. `ProfileOverview`가 명시한 `spacing[8]`과 일치한다.

세 화면 모두 Web에서 보이는 흰 구간은 코드에 지정된 콘텐츠 상단 padding이다. 오늘·달력은 16px, 더보기는 32px라 완전히 같은 값은 아니다.

## 원인과 native 위험

공통 `PlannerHeader`는 `paddingTop: insets.top`으로 상단 safe area를 이미 포함한다. 그 아래의 모든 탭 화면은 공통 `Screen`을 사용하며, `Screen`의 `SafeAreaView`에는 `edges`가 지정되지 않았다. 현재 `react-native-safe-area-context`의 기본값은 top·right·bottom·left를 모두 additive로 적용한다.

따라서 Android·iOS 실제 앱에서는 헤더에서 상단 inset을 한 번 적용한 뒤 탭 콘텐츠에서 같은 top inset을 다시 적용할 수 있다. 사용자가 본 고정 흰 구간은 화면별 16/32px padding에 이 중복 safe-area 값이 더해진 결과일 가능성이 높다. Web은 top inset이 0이라 중복을 재현하지 못한다.

## 적용한 수정

- `Screen`에 safe-area edges를 선택할 수 있는 속성을 추가했다.
- 공통 탭 레이아웃 아래의 오늘·달력·더보기는 left·right만 적용한다. 상단은 `PlannerHeader`, 하단은 tab bar가 담당한다.
- 더보기의 32px 상단 padding을 오늘·달력과 같은 16px로 맞췄다.

## 수정 후 Product Design 감사

환경: Chrome, localhost:8090, mock API. 390×844와 320×844. 내장 브라우저가 현재 제공되지 않아 연결된 Chrome을 사용했다.

1. [오늘 390×844](./04-after-today-390.png): 정상. 헤더 하단 y=56, 첫 콘텐츠 y=72로 의도한 16px 간격이다.
2. [달력 390×844](./05-after-calendar-390.png): 정상. 안내문부터 달력, 빈 상태까지 잘림이나 겹침 없이 유지된다.
3. [더보기 390×844](./06-after-more-390.png): 정상. 첫 섹션 y=72로 오늘·달력과 같은 16px 간격이 됐다.
4. [오늘 320×844](./07-after-today-320.png): 정상. 좁은 화면에서도 주간 스트립, 안내문, 빠른 기록 버튼과 하단 탭이 유지된다.

이번 실행에서 네 캡처를 새로 저장하고 직접 확인했다. 높은 심각도의 Web 시각·사용성 문제는 발견하지 않았다. 실제 Android·iOS inset 높이, 가로 화면, 노치 기기와 스크린리더 동작은 Web 캡처만으로 확인할 수 없다.
