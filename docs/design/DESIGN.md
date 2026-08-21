# ToDoLab Mobile Design System

## 1. 문서 목적

이 문서는 ToDoLab 모바일 클라이언트의 시각 언어와 상호작용 원칙을 AI와 개발자가 같은 기준으로 적용하기 위한 `DESIGN.md`다.

구현 일정과 기능 범위는 [ROADMAP.md](../product/ROADMAP.md)에서 관리하고, 이 문서는 Android, iOS, Web 화면이 어떤 모습과 경험을 가져야 하는지 정의한다.

현재 구현된 디자인 토큰과 공통 컴포넌트를 기준선으로 삼는다. 문서와 코드가 다르면 `src/theme/`의 실제 토큰을 먼저 확인하고, 의도된 변경이라면 코드와 이 문서를 함께 갱신한다.

## 2. Design Intent

ToDoLab은 사용자를 재촉하는 생산성 도구가 아니라, 오늘 실제로 끝낼 일을 차분히 고르고 실행하도록 돕는 동반자다.

목표 인상:

- calm: 정보와 색을 절제해 해야 할 일에 집중시킨다.
- clear: 다음 행동과 현재 상태를 한눈에 이해할 수 있어야 한다.
- encouraging: 실패나 미완료를 비난하지 않고 다시 판단할 기회를 준다.
- practical: 장식보다 빠른 입력, 한 손 조작, 읽기 쉬운 구조를 우선한다.
- trustworthy: 일관된 파란색과 명확한 상태색으로 안정감을 준다.

핵심 문장:

> 매일 펼쳐 보는 차분한 종이 플래너처럼, 이번 주의 시간과 오늘의 실행을 한눈에 정리한다.

### Visual concept: Quiet Paper Planner

ToDoLab의 시각 콘셉트는 `Quiet Paper Planner`다. 노트·다이어리의 정돈감과 기록하고 싶은 분위기를 가져오되, 종이 질감이나 손글씨를 과도하게 흉내 내는 skeuomorphism은 피한다.

- 배경은 누런 paper tone보다 새하얀 surface와 아주 옅은 cool gray를 사용한다.
- 제목과 본문은 ink 계열의 짙은 neutral로 표시하고 굵기 종류를 줄인다.
- 카드가 겹치는 dashboard 대신 얇은 rule, section 여백, 작은 날짜 column으로 정보를 구분한다.
- 완료 check, 오늘 날짜, 중요한 일정에만 muted highlighter accent를 사용한다.
- 둥근 카드와 pill을 모든 정보에 반복하지 않고 입력, 선택, 떠 있는 surface처럼 실제 경계가 필요한 곳에만 사용한다.
- 손글씨 font, 찢어진 종이, tape, 강한 paper texture는 기본 UI에 사용하지 않는다.
- 애니메이션은 종이를 꾸미는 효과보다 check, page 전환, 일정 이동의 결과를 설명하는 데 사용한다.

이 콘셉트의 목적은 “예쁜 장식”이 아니라 사용자가 앱을 열었을 때 빈 노트처럼 부담이 적고, 기록이 쌓일수록 정돈된 개인 플래너처럼 느끼게 하는 것이다.

UI/UX 개편 방향:

- 화면을 큰 카드가 반복되는 대시보드보다 빠르게 훑을 수 있는 compact card list로 구성한다.
- Task와 일정은 각각 경계가 보이는 작은 카드로 구분하되, 카드 안에 또 다른 카드나 상시 버튼 행을 중첩하지 않는다.
- 여백은 정보 관계를 설명할 만큼만 사용하고, 핵심 데이터보다 장식과 안내가 더 많은 공간을 차지하지 않게 한다.
- 접근성을 위한 터치 영역과 화면에 보이는 control 크기를 분리한다.
- 페이지 설명은 사용 목적을 한 줄로 알려주되, 이미 제목이나 데이터가 설명하는 내용을 반복하지 않는다.

## 3. Product Experience

참고 제품의 기능을 그대로 복제하지 않고 다음 경험 패턴만 ToDoLab 흐름에 맞게 사용한다.

- Things: Today 중심의 실행 순서와 일정·할 일 분리
- Microsoft To Do: 하루 단위 선별과 추천
- Todoist: 빠른 추가와 짧은 입력 흐름
- TickTick: 날짜 탐색과 할 일의 결합
- MyTurn: 오늘 행동을 작게 시작하고 한 단계씩 완료하는 진행감

공식 제품 자료에서 공통적으로 확인되는 장점은 “기능 수”보다 현재 필요한 항목만 보여 주는 집중 구조다. Todoist의 빠른 추가와 최소 목록, Things의 Today·Inbox·Logbook 역할 분리, TickTick의 날짜와 목록 연결을 우선 참고한다. 장식은 이 흐름을 설명하거나 행동 결과를 피드백할 때만 추가한다.

핵심 사용자 흐름:

```text
빠르게 기록
→ 오늘 할 일로 선별
→ 실행 가능한 순서로 정리
→ 완료
→ 완료 로그로 성취 확인
→ 미완료 항목 재판단
```

## 4. Color System

### Brand and neutrals

기본 화면은 흰 배경, 밝은 sheet surface, ink text, muted blue-gray accent로 구성한다. 형광펜을 연상시키는 sage·amber·powder blue는 의미가 있는 작은 면적에만 사용한다.

| Role             | Light       | Dark                     | Usage                        |
| ---------------- | ----------- | ------------------------ | ---------------------------- |
| primary          | `#526879`   | `#9CB4C5`                | 주요 CTA, 선택, 활성 상태    |
| primary pressed  | `#405666`   | `#B5C8D5`                | 주요 CTA pressed 상태        |
| primary soft     | `#E8EEF1`   | `rgba(156,180,197,0.16)` | 선택, 일정 highlight         |
| background       | `#FFFFFF`   | `#171816`                | 앱 기본 배경                 |
| surface          | `#FFFFFF`   | `#22231F`                | sheet, 탭 바, 주요 컨테이너  |
| surface muted    | `#F8FAFC`   | `#2C2E29`                | 입력, pressed, 보조 영역     |
| surface elevated | `#FFFFFF`   | `#30322D`                | modal, 떠 있는 surface       |
| border           | `#E2E8F0`   | `#3D4038`                | 일반 경계                    |
| border strong    | `#CBD5E1`   | `#55594E`                | 입력·선택 컨트롤의 강한 경계 |
| text             | `#282722`   | `#F2EFE7`                | ink 제목과 본문              |
| text secondary   | `#6F6B62`   | `#BBB6AA`                | 설명과 메타데이터            |
| text muted       | `#747067`   | `#9A958A`                | placeholder, 비활성 정보     |
| text on primary  | `#FFFFFF`   | `#FFFFFF`                | primary surface 위 텍스트    |
| overlay          | translucent | translucent              | modal backdrop               |

### Semantic colors

| Meaning | Main      | Soft light | Usage                     |
| ------- | --------- | ---------- | ------------------------- |
| success | `#3F6B4A` | `#DDE7D5`  | 완료, 저장 성공           |
| warning | `#845A16` | `#F4E2AE`  | 주의, 미룸, 과부하        |
| danger  | `#B91C1C` | `#FEF2F2`  | 오류, 삭제 등 파괴적 행동 |

색상만으로 상태를 전달하지 않는다. 아이콘, 문구, 체크 상태 또는 선 장식을 함께 사용한다.

### Accent color distribution

화면이 회색과 흰색만 반복되어 밋밋해 보이지 않도록 semantic color를 작은 면적에 분산한다. 카드 전체를 상태색으로 채우거나 항목마다 임의의 색을 배정하지 않는다. 기본 인상은 네이버 모바일 앱처럼 밝은 흰 배경, 선명한 텍스트, 얇은 쿨그레이 라인으로 둔다.

- Task 기본 surface는 neutral을 유지하고 선택·주요 행동에 primary blue를 사용한다.
- 일정은 시간 text, 작은 calendar icon 또는 2–3px accent 중 한 곳에만 primary blue를 사용한다.
- 완료는 rounded-square check와 완료 metadata에 success green을 사용하고 카드 전체를 green surface로 만들지 않는다.
- D-Day와 오늘 마감은 warning amber를 제한적으로 사용한다.
- 오류와 삭제 이외에는 danger red를 장식색으로 사용하지 않는다.
- Calendar의 선택 날짜는 primary-soft surface와 primary text, 오늘은 outline 또는 작은 dot로 서로 구분한다.
- light/dark 모두 soft surface의 면적은 카드 전체의 약 10–20% 이내를 우선하며 text 대비 4.5:1을 유지한다.
- 탭 루트 화면에서는 하단 탭과 중복되는 큰 page title을 반복하지 않고, 첫 콘텐츠가 바로 보이게 한다.
- Section 구분은 marker emoji나 원형 badge보다 제목, count, 간격, 카드 경계로 우선 표현한다.

## 5. Typography

별도 브랜드 폰트가 확정되기 전까지 플랫폼 system font를 사용한다. 글꼴보다 명확한 크기와 굵기 위계를 우선하며, 사용자 글꼴 크기 설정을 막지 않는다.

| Variant    | Size | Line height | Default use                            |
| ---------- | ---: | ----------: | -------------------------------------- |
| display    | 30px |        38px | 빈 상태 등 제한된 핵심 메시지          |
| title      | 20px |        28px | compact page header 제목               |
| body large | 16px |        22px | section 제목과 카드의 제한된 주요 정보 |
| body       | 14px |        20px | Task 제목과 일반 본문                  |
| label      | 13px |        18px | 버튼과 입력 보조 정보                  |
| caption    | 12px |        16px | 메타데이터와 상태 정보                 |

Weights:

- regular `400`: 일반 본문
- medium `500`: 가벼운 강조
- semibold `600`: label과 선택 상태
- bold `700`: 제목, 버튼, 주요 항목
- heavy `800`: 날짜 숫자와 강한 화면 제목

Rules:

- display와 title에는 `-0.4`의 tight tracking을 사용할 수 있다.
- 탭 이름을 반복하는 `TODAY`, `CALENDAR`, `MORE` 같은 영문 eyebrow는 기본 page header에서 사용하지 않는다.
- 긴 Task 제목은 최대 두 줄을 기본으로 하며, 주요 행동을 밀어내지 않아야 한다.
- 보조 설명은 크기를 지나치게 줄이지 말고 secondary 색으로 위계를 만든다.
- Task 제목은 기본적으로 body medium을 사용하고, 모든 목록 항목을 bold나 body large로 강조하지 않는다.
- 사용자의 글꼴 확대를 존중하되 큰 글꼴에서는 설명과 metadata를 줄이고 제목과 핵심 행동을 우선 보존한다.

## 6. Spacing, Shape, and Depth

### Spacing

4px grid를 사용한다.

```text
4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64
```

- 화면 좌우 padding: mobile 기본 16px, Web 16–24px
- 일반 section gap: 16–24px
- 카드 기본 padding: 16px
- 조밀한 form/card padding: 12~16px
- 관련 항목 내부 gap: 4~12px

### Radius

| Token | Value | Usage                     |
| ----- | ----: | ------------------------- |
| sm    |   6px | 작은 제어 요소            |
| md    |  10px | 버튼, 입력, 날짜 버튼     |
| lg    |  12px | 기본 카드                 |
| xl    |  16px | 큰 container              |
| full  | 999px | pill, 원형 체크, 상태 dot |

### Depth

- 기본 surface는 그림자 대신 1px border로 구분한다.
- 한 컴포넌트에 강한 border와 강한 shadow를 동시에 사용하지 않는다.
- 그림자는 modal이나 실제로 떠 있는 surface처럼 elevation이 필요한 경우에만 절제해서 사용한다.
- blur, glass, gradient는 기능적 이유와 검증된 대비가 없으면 기본 디자인에 추가하지 않는다.

## 7. Layout

- 화면은 safe area를 존중한다.
- 모바일에서 한 손 조작과 세로 흐름을 우선한다.
- 주요 CTA는 가능한 한 엄지 접근 영역에 둔다.
- 콘텐츠 최대 너비는 기본 720px이며 중앙 정렬한다. 생산성 목록과 설정 허브는 폭이 넓어져도 읽기 순서를 유지한다.
- 카드와 section을 무조건 중첩하지 않는다. 배경, 간격, divider 중 가장 단순한 구획 방법을 선택한다.
- Today에서는 실행할 Task가 가장 강한 시각적 우선순위를 갖는다.
- 캘린더 일정, 추천, 지난 미완료는 핵심 Task 목록을 압도하지 않아야 한다.
- 첫 viewport 안에 화면의 핵심 content 또는 핵심 행동이 보여야 한다.
- 화면명, 날짜, 인사, 설명이 같은 맥락을 반복하면 compact header 하나로 합친다.
- 상단의 장식적·설명적 영역보다 실제 데이터 영역에 더 많은 세로 공간을 배정한다.

### Responsive device ranges

고정된 단말 이름이나 한 가지 해상도에 맞추지 않고 아래 폭 구간을 기준으로 설계한다.

| Range       | Reference    | Layout rule                                                     |
| ----------- | ------------ | --------------------------------------------------------------- |
| compact     | 320–359px/pt | 좌우 12px, 설명과 metadata 우선 축약, 수평 버튼 묶음 금지       |
| regular     | 360–399px/pt | 기본 모바일 기준, 한 손 조작과 세로 목록 우선                   |
| wide mobile | 400–599px/dp | 정보 우선순위는 유지하고 불필요하게 카드와 글자를 확대하지 않음 |
| tablet      | 600–839px/dp | readable width 유지, 필요할 때 master-detail 또는 2열 검토      |
| Web         | 840px 이상   | 중앙 정렬, hover·focus·keyboard 행동 추가, 모바일 행 밀도 유지  |

Today, Task, Calendar, 프로필은 tablet·Web에서도 기본 720px 단일 열을 유지한다. 프로필의 목적지는 카드 grid가 아니라 icon, title, optional description, chevron으로 구성한 세로 navigation row로 표시한다.

검증 기준:

- 최소 `320px Web`, `375pt iPhone`, `430dp Android`를 공통 회귀 기준으로 사용한다.
- iOS의 Dynamic Type와 Android의 font scale `1.0`, `1.3`, `1.5`에서 핵심 제목과 행동이 잘리지 않아야 한다.
- 세로 크기가 작은 단말에서도 첫 viewport에 핵심 데이터나 핵심 행동이 보여야 한다.
- landscape, browser zoom 200%, safe area, 하단 탭, 키보드가 콘텐츠와 CTA를 가리지 않아야 한다.
- 폭이 넓어져도 글자, 체크, 버튼을 비례 확대하지 않고 readable width와 여백으로 대응한다.
- 폭이 840px 이상이어도 높이가 600px 미만인 landscape viewport는 desktop 다열 layout 대신 모바일 세로 흐름을 유지한다.

### Page header

- 모든 주요 화면은 공통 `PageHeader` 계층을 사용한다.
- 기본 구성은 20–22px 제목, 선택적인 13–14px 한 줄 설명, 우측의 compact action이다.
- 페이지 설명은 최대 한 줄을 우선하며 두 줄이 필요하면 compact 폭과 큰 글꼴에서 행동을 밀어내지 않는지 확인한다.
- 뒤로 가기는 큰 텍스트 버튼이 아니라 platform navigation 또는 44pt 터치 영역의 icon button을 사용한다.
- 빈 상태와 오류 상태가 이미 맥락을 설명하면 page header 설명을 반복하지 않는다.
- section header는 16–17px 제목과 count 또는 한 개의 보조 행동으로 제한한다.

### Today Content Priority

Today의 기본 정보 순서는 다음과 같다.

```text
주간 날짜 strip
→ 존재하는 일정
→ 오늘 실행 Task
→ 정리할 항목 진입점
→ 최근 완료 3개
```

- Today는 하단 tab과 오늘 선택 원이 현재 맥락을 전달하므로 별도 화면명·월·날짜 header를 두지 않는다.
- 주간 strip은 기본적으로 외곽선과 날짜 열 구분선 없이 표시하고 월 경계 날짜만 `9/1`처럼 월을 포함한다.
- 큰 인사말은 상시 navigation 요소가 아니며 빈 상태나 의미 있는 피드백에서만 사용한다.
- 날짜를 top bar와 별도 대형 카드에서 중복 표시하지 않는다.
- 일정은 시간 약속과 하루의 제약 조건을 먼저 파악할 수 있도록 Task보다 위에 두되, 데이터가 있을 때만 표시한다.
- 오늘 실행 Task는 사용자가 스크롤하기 전에 최소 한 개 이상 보여야 한다.
- 여러 날에 걸친 일정은 오늘과 시간이 겹치면 표시하고 `진행 중 · 7월 3일–5일`처럼 전체 기간과 현재 상태를 함께 알린다.
- 지난 미완료, 추천, 기록함은 Today 안에서 카드로 펼치지 않고 한 손으로 닫기 쉬운 bottom sheet 또는 전용 정리 화면에서 처리한다.
- 완료 목록은 항목이 있으면 최근 3개를 기본으로 보여 주고 완료 수, 전체 보기와 접기 affordance를 제공한다.
- 일정 section은 데이터가 있을 때만 표시한다.

## 8. Components

### Button

- primary: blue fill, white bold label, 주요 행동에 사용한다.
- secondary: primary-soft fill, blue label, 보조 선택에 사용한다.
- ghost: transparent fill, secondary label, 낮은 우선순위 행동에 사용한다.
- danger: red fill, white label, 확인된 파괴적 행동에 사용한다.
- 기본 radius는 10px이다.
- 일반 텍스트 버튼의 최소 높이는 44px, 강조 CTA는 48–52px이다.
- icon과 compact action은 보이는 크기를 작게 유지하되 전체 hit area는 최소 44×44pt로 제공한다.
- loading 중에는 중복 입력을 막고 spinner와 busy 상태를 제공한다.
- 한 화면에서 primary CTA를 경쟁적으로 여러 개 배치하지 않는다.
- 목록 항목마다 여러 개의 텍스트 버튼을 상시 노출하지 않고 swipe, overflow menu, context action을 우선한다.
- 화면 전체를 수정하는 행동은 카드 metadata 옆 ghost text보다 `PageHeader`의 icon+label secondary action을 우선한다.

### Card

- 기본 radius는 12px, border는 1px이다.
- default는 surface, muted는 surface-muted, outlined는 transparent 배경을 사용한다.
- 카드 전체가 눌리는 경우 pressed 상태를 명확히 제공한다.
- 카드 중첩과 반복적인 그림자로 정보 구조를 만들지 않는다.
- Today·정리할 항목·완료·D-Day의 실행 row는 10px radius, 최소 60px 높이, 12px 좌우 inset을 공통으로 사용한다.
- row 안의 체크·메뉴·이동·재열기 action은 시각적 크기와 관계없이 최소 44×44pt hit area를 유지한다.

### State Feedback

- 조회·mutation·서버 제출 오류와 짧은 성공 피드백은 compact `InlineNotice`를 기본으로 사용한다.
- 필드 형식이나 필수값 오류는 해당 입력 바로 아래에 표시하고 서버 오류와 시각적으로 분리한다.
- 로딩은 목록 skeleton 또는 44–64px 높이의 compact spinner row로 표시한다.
- 빈 상태는 맥락과 다음 행동만 짧게 제공하며 큰 illustration이나 장식 card를 사용하지 않는다.
- 삭제 확인처럼 사용자의 주의를 강하게 요구하는 파괴적 행동만 danger card를 허용한다.

### Input

- 기본 높이는 최소 44px, radius는 10px이다.
- surface-muted 배경과 border를 사용한다.
- 오류 상태에서는 danger border와 설명 문구를 함께 표시한다.
- placeholder만으로 필수 의미를 전달하지 않는다.
- 키보드가 열린 상태에서도 입력과 저장 행동이 가려지지 않아야 한다.

### Quick Add

- 모바일 기본 상태에서는 큰 입력 카드보다 하단 추가 버튼이나 한 줄 composer를 우선한다.
- 입력을 시작하면 필요한 필드와 저장 행동이 점진적으로 확장된다.
- Today에서는 하단 FAB를 유일한 기본 추가 진입점으로 사용하며 header에 같은 목적의 `+`를 중복하지 않는다.
- Calendar처럼 선택한 날짜 맥락이 있는 화면의 추가 버튼은 해당 날짜에 생성된다는 계약이 있을 때만 노출한다.
- FAB를 사용할 때 마지막 목록 항목과 겹치지 않도록 하단 inset을 확보한다.
- 빠른 추가가 실행 Task보다 더 많은 영구적 세로 공간을 차지하지 않게 한다.

### Visual character and delight

- 화면마다 새로운 장식 문법을 만들지 않고 rounded-square, compact row, soft accent를 반복해 제품 인상을 만든다.
- section 사이에는 16–20px, 같은 목록 항목 사이는 8px을 기본으로 해 “전부 같은 카드”처럼 보이지 않게 리듬을 만든다.
- 주요 section에는 필요할 때만 16–20px symbol 또는 작은 tinted icon background를 한 개 사용한다.
- 완료 시 check 변화, 짧은 success feedback, 선택적 haptic을 150–220ms 안에 제공하되 confetti나 큰 점수 animation은 사용하지 않는다.
- Today의 완료 목록은 항목이 있으면 최근 3개를 기본 노출하고 더 많은 항목만 사용자 요청으로 펼친다.
- 빠른 기록 결과는 저장 위치만 알리지 않고 방금 만든 제목과 `오늘 할 일로 이동`·`내용 확인` 행동을 함께 제공한다.
- 빈 상태 illustration은 화면 기능을 설명할 때만 사용하고 일상적으로 자주 비는 목록에는 짧은 문구와 CTA를 우선한다.
- pressed, selected, focused 상태는 surface·outline·opacity 중 최소 두 가지 단서로 구분한다.
- 매력은 색의 개수보다 정렬, 여백, 즉시 반응, 일관된 문구에서 만든다.

### Compact Task Card

- Task의 기본 표현은 각 항목의 경계가 분명한 compact card다.
- 한 줄 Task의 목표 높이는 60–72px이며, 제목이 두 줄이거나 metadata가 있을 때만 자연스럽게 확장한다.
- 카드 간 gap은 8px, 기본 radius는 10–12px, padding은 12px를 사용한다.
- 기본 surface와 1px border로 구분하고 반복적인 그림자는 사용하지 않는다.
- 완료 control은 `20×20px` rounded square와 radius `5–6px`를 사용한다. 원형 checkbox를 기본으로 사용하지 않는다.
- 보이는 완료 control과 별개로 독립된 hit area는 최소 44×44pt를 제공한다.
- 미완료는 surface 배경과 border-strong, 완료는 primary 또는 success 배경과 흰 check glyph를 사용한다.
- 제목은 기본적으로 14–16px medium, 최대 두 줄을 사용한다.
- 설명은 목록에서 기본적으로 숨기거나 한 줄로 제한하고 상세 화면에서 전체 내용을 제공한다.
- category, all-day, D-Day를 모두 pill로 나열하지 않는다. 현재 판단에 필요한 metadata만 11–13px 한 줄로 표시한다.
- 시간, 날짜, D-Day처럼 행동 판단에 직접 필요한 정보가 장식 badge보다 우선한다.
- 왼쪽 accent bar는 기본 Task에 사용하지 않는다. 우선순위처럼 명시적인 의미가 생길 때만 작은 색상 신호를 사용한다.
- 완료 Task는 작은 완료 control, secondary 제목, 취소선으로 표현하며 강한 success surface를 반복하지 않는다.
- 제목 영역은 상세 보기, 완료 control은 완료 전환으로 행동을 분리한다.
- overflow action은 `⋯` 또는 platform context menu로 제공하고 여러 text button을 별도 행에 상시 배치하지 않는다.
- 길게 누른 drag와 상세 보기, 완료 control의 터치 행동이 충돌하지 않아야 한다.

### Compact Schedule Card

- 일정은 Task와 같은 작은 surface card를 사용하고 완료 가능한 항목에는 동일한 rounded-square 완료 control을 표시한다.
- 기본 구조는 `완료 control → 제목과 metadata → 상세 affordance`다.
- 시작·종료 시간은 별도 고정 열로 제목을 오른쪽에 밀지 않고 제목 아래 metadata의 첫 항목으로 표시한다.
- metadata 순서는 `시간 → 장소 또는 category → D-Day`로 제한하고 한 줄을 우선한다.
- 기본 높이는 56–68px, 카드 간 gap은 8px을 목표로 한다.
- 종료 시간, 장소, 설명은 존재하는 핵심 정보만 한 줄로 표시한다.
- 일정 유형 색은 시간, 작은 선 또는 icon 중 한 곳에만 사용하고 시간 정렬을 위해 과도한 고정 너비를 만들지 않는다.
- 시간순으로 정렬하고 Task drag 순서에는 포함하지 않는다.
- 여러 날 일정은 첫날에만 반복 생성하지 않고, Today에서는 오늘과 겹치는 하나의 카드로 표시한다.
- 기간 표기는 `오늘까지`, `3일 중 2일째`, `7월 3일–5일`처럼 사용자가 현재 위치와 종료 시점을 함께 이해할 수 있어야 한다.
- 시작·종료 시각이 있는 여러 날 일정은 전체 기간을 우선하고 오늘 구간의 시각은 보조 정보로 표시한다.

### Compact completed card

- Today와 완료 기록의 완료 항목은 미완료 `TaskCard`와 같은 60–72px 골격, padding, 제목 시작선을 유지한다.
- 완료 check, 취소선 제목, `완료 HH:mm · category` 한 줄만 기본 노출한다.
- `다시 열기` text button을 별도 하단 행에 상시 표시하지 않는다.
- 다시 열기는 완료 check 재선택 또는 overflow action으로 제공하며, 잘못 누르기 쉬운 화면에서는 확인 없는 전체 카드 action으로 사용하지 않는다.
- 완료 항목이 펼쳐져도 카드 높이가 행동 하나 때문에 두 배 가까이 커지지 않아야 한다.

### Calendar surface

- Calendar는 월 navigation, 선택일 기준 3주 날짜 grid, 선택 날짜 목록의 세 계층만 유지한다.
- 3주 grid는 이전 주, 현재 주, 다음 주를 보여 주며 월 경계 날짜는 muted tone으로 표시한다.
- 월 제목과 이전·다음 이동은 한 줄에 두고 중복된 기간 문구나 큰 설명을 추가하지 않는다.
- 이전·다음 chevron은 현재 선택 날짜 기준으로 정확히 1주씩 이동한다. 보이는 범위의 끝으로 점프하지 않는다.
- 월 제목은 눌러서 달력 grid와 같은 폭의 월 선택 panel을 펼칠 수 있다. panel은 보조 control이므로 버튼 높이와 간격을 compact하게 유지해 달력과 선택 날짜 목록을 과하게 밀지 않는다.
- Calendar와 Today 주간 strip은 바깥 카드와 내부 grid를 중첩하지 않는다. 필요하면 grid 자체의 얇은 border 하나만 사용한다.
- 날짜 cell은 기본적으로 flat하게 두고 선택 날짜만 primary-soft surface, 오늘은 outline 또는 4px dot로 표시한다.
- 주말은 secondary text로만 구분하고 빨강·파랑을 장식적으로 반복하지 않는다.
- 일정·완료·미룸·D-Day 상태 dot은 한 cell에 최대 3개까지만 표시하며 초과 상태는 개수로 축약한다.
- 여러 날 일정은 날짜마다 끊어진 dot으로 반복하지 않고 날짜 grid 위의 연속 bar로 표현한다.
- 연속 bar는 주 경계에서 시각적으로 잘리더라도 양 끝 continuation 표시를 유지하고, 겹치는 일정은 최대 2–3개 lane 뒤 `+N`으로 축약한다.
- bar에는 짧은 제목을 한 번만 표시하고 색상만으로 일정을 구분하지 않으며 선택·상세 접근이 가능한 최소 44pt hit area를 별도로 제공한다.
- 선택 날짜와 아래 목록 사이의 gap을 줄여 어떤 날짜의 항목인지 즉시 연결되게 한다.
- 320px에서도 7열이 잘리지 않아야 하며 각 날짜 cell의 세로 hit area는 최소 44pt를 유지한다.
- 달력 전체에 강한 border, 각 날짜의 개별 border, 다중 shadow를 동시에 사용하지 않는다.

### Badge and Pill

- full radius와 작은 수평 padding을 사용한다.
- 일반 메타데이터는 neutral surface, 선택·브랜드 문맥은 primary-soft를 사용한다.
- 긴 문장이나 주요 행동을 badge 안에 넣지 않는다.

### Navigation

- 하단 탭은 `오늘`, `달력`, `프로필` 세 개만 유지한다.
- `D-Day`는 독립 탭에서 제거하고 Today의 목표 진입점과 프로필의 목표 관리 section으로 이동한다.
- `더보기` 탭은 제거하고 완료 기록, 설정, 알림, 테마, 개인정보를 프로필 안의 세로 navigation으로 제공한다.
- 루틴, 통계, 피드는 제품의 독립된 핵심 영역이 되기 전까지 탭으로 추가하지 않는다.
- 빠른 추가는 탭이 아니라 Today의 하단 FAB로 유지한다.
- 기록함 데이터는 Today의 `정리할 항목`에서 처리하되 독립 탭으로 노출하지 않는다.
- 독립 Inbox 화면은 유지하지 않고 날짜 없는 기록의 조회·정리는 Today 흐름에 포함한다.
- 3주 달력은 주 높이를 동일하게 유지하고 주 경계에 얇은 neutral rule을 사용한다.
- 날짜 열 경계에도 같은 rule을 더 낮은 대비로 사용해 일 단위 칸을 구분한다.
- 시간이 있는 하루 일정은 Today 주간 strip과 Calendar 3주 grid 모두에서 제목을 가능한 만큼 표시한다. 좁은 날짜 cell에서도 해당 날짜에 “무슨 일정이 있는지”가 먼저 보여야 하며, 시간은 상세 목록 meta와 accessibility label에서 보완한다.
- Today 주간 strip은 하루 일정을 점으로만 축약하지 않고 한 줄 label을 함께 제공한다.
- Task 사이에는 4px 안팎의 작은 간격만 두고, 임의 색상은 쓰지 않는다. 색은 일정·완료·경고처럼 의미가 정해진 상태에만 사용한다.
- Task와 일정은 개별적인 낮은 radius outline row로 구분하되 떠 있는 큰 카드처럼 보이는 그림자는 사용하지 않는다.
- Today의 일정 row는 시간 제약을 빠르게 알아볼 수 있도록 아주 옅은 amber tint를 사용할 수 있다. 실행 Task는 흰 row를 유지해 오늘 실제 할 일을 가장 담백하게 읽히게 한다.
- 둥근 row는 내부 배경을 같은 radius로 clip해 모서리에 다른 surface 색이 비치지 않게 한다.
- 실행 Task는 수동 순서 변경 UI를 기본 노출하지 않으며 서버가 제공하는 실행 순서를 그대로 사용한다.
- Calendar의 날짜·하루 일정·기간 bar는 하나의 동일한 horizontal inset과 7등분 좌표계를 공유한다.
- Calendar header는 작은 이전/다음 chevron과 큰 월 제목만 유지하고 보조 오늘 버튼은 두지 않는다. 월 제목은 선택 가능한 control로 처리하되 별도 큰 버튼처럼 보이지 않게 한다.
- 정리할 항목의 즉시 action은 큰 채움 버튼보다 compact ghost action을 사용한다.
- 정리할 항목의 미완료·추천·기록은 같은 Task row를 사용하고 `오늘로 ›`, `추가 ›`, `열기 ›`처럼 낮은 강조의 텍스트 action으로 처리한다.
- planner section은 공통 `SectionHeader`의 8px 의미 marker, 굵은 제목, 우측 count·action 문법을 사용한다.
- 목표 화면은 개별 목표를 낮은 outline row로 표시하고 생성·메뉴 action은 ghost 수준으로 유지한다.
- 완료 기록은 주 이동과 날짜 선택을 한 compact surface로 묶고 완료 checkbox로 다시 열기 동작을 처리해 중복 버튼을 줄인다.
- Task 작성은 하나의 flat sheet 안에서 제목·유형·일정 날짜·시간·선택 정보를 나누고 입력 배경과 취소 action의 대비를 낮춘다.
- Quick Capture와 sheet형 입력의 focus 상태는 브라우저 기본 파란 outline처럼 튀지 않게 한다. focus는 primary-soft border와 흰 surface 전환으로 표시하고, 오류 상태만 danger border를 사용한다.
- Task 상세는 hero·날짜·정보·목표를 낮은 outline section으로 구분하고 metadata 행에는 얇은 rule을 사용한다.
- 과거 기록 검색은 프로필의 보조 목적지로 두고 날짜·키워드·상태를 함께 탐색할 수 있게 한다.
- active tab은 icon의 테마 primary·옅은 pill뿐 아니라 label의 primary 색·굵기와 indicator를 함께 사용하고, inactive tab은 text-muted를 사용한다.
- iOS는 SF Symbols, Android와 Web은 대응하는 Material 계열 symbol을 사용한다.
- 아이콘 의미와 접근성 label은 플랫폼 간 동일해야 한다.

### Today weekly strip

- Today 상단은 별도 월·화면 제목 없이 `요일 7개 → 날짜 7개 → 상태 점/기간 bar` 순서의 compact weekly strip을 사용한다.
- Today 주간 strip은 외곽선과 세로 rule 없이 간격과 선택 상태로 읽히게 한다. Calendar의 3주 grid 경계는 일정 bar 정렬을 위해 유지할 수 있다.
- 일정·오늘 할 일·완료 section marker는 각각 amber·powder blue·sage 의미색을 사용한다.
- 탭 루트의 `오늘`, `달력`, `프로필` 상단에는 하단 탭과 중복되는 `PageHeader` title을 두지 않는다.
- light theme의 section marker는 진한 semantic 원색이 아니라 amber·powder blue·sage highlighter token을 직접 사용한다.
- pastel section marker는 밝은 paper 위에서도 구분되도록 같은 의미의 semantic outline을 1px 사용한다.
- Today 주간 strip에 일정 제목 label이 보이지 않는 compact 상태에서는 작은 일정 존재 dot을 사용하고, 제목 label과 dot을 동시에 반복하지 않는다.
- Calendar의 date dot은 일정 개수가 아니라 “오늘”을 표시할 때만 사용한다.
- Calendar 하단에는 일정/완료/D-Day filter chip을 기본 노출하지 않는다. 날짜를 선택하면 바로 해당 날짜의 `예정`과 `완료` 목록으로 이어져야 한다.
- Profile 목적지는 좌우 inset이 있는 독립 rounded row와 목적별 accent icon을 사용한다.
- 빠른 기록 입력은 “할 일을 입력하세요”처럼 직접적인 문구와 12px 이상의 좌우 inset을 사용한다.
- 우측 상단에 `언젠가`, 통계, filter 같은 별도 목적지 버튼을 두지 않는다.
- 오늘은 ink fill 또는 outline, 사용자가 선택한 날짜는 muted highlighter fill로 구분한다.
- 일정이 있는 날짜는 최대 1–3개의 작은 점으로 표시하고 여러 날 일정은 날짜 아래 한 줄 bar로 잇는다.
- strip 전체 높이는 100–140px 안에서 유지하고 첫 Today Task를 화면 밖으로 밀어내지 않는다.
- 주간 strip에서 날짜를 선택하면 아래 일정 preview만 바뀌며, Today 실행 Task의 기준 날짜를 몰래 바꾸지 않는다.

### Screen patterns

- Today: 주간 날짜 strip, 존재하는 일정 card, Task card, `정리할 항목`, 최근 완료 3개 순서만 기본 노출한다.
- Today의 진행 요약 card, 과부하 meter, 기록함 Task 전체 목록은 기본 화면에 상시 노출하지 않는다.
- 지난 미완료, 추천, 기록함은 `정리할 항목` 한 줄 진입점과 sheet 또는 별도 화면으로 합친다.
- Calendar: compact 월 header, 선택일 기준 3주 grid, 선택 날짜 compact 목록 순서를 유지한다.
- D-Day: compact header의 추가 행동, D-Day 숫자 중심 목표 card, 필요할 때 펼치는 연결 Task 순서를 사용한다.
- Profile: 모든 폭에서 52–60px 세로 navigation row와 divider를 사용하고 desktop에서도 가로 tile로 전환하지 않는다.
- Completed: 통계보다 완료 card 목록을 우선하고 날짜 선택과 요약을 compact하게 둔다.
- Task 작성·상세: 제목, 유형, 일정 날짜, 시작·종료 시간처럼 자주 쓰는 필드를 먼저 두고 낮은 빈도의 설명·카테고리는 점진적으로 펼친다.
- 빈 상태와 오류는 가능한 한 큰 카드 대신 inline state를 사용하고 문구와 CTA를 한 번씩만 제공한다.

### Component meaning

- `TaskCard`: rounded-square 완료 control이 있는 실행 가능한 할 일이다.
- `ScheduleCard`: 완료 control과 제목 아래 시간 metadata가 분리된 일정이다.
- `NavigationRow`: 다른 화면이나 정리 흐름으로 이동하는 메뉴다.
- 같은 surface를 사용하더라도 control과 metadata 구조로 세 의미를 즉시 구분할 수 있어야 한다.

## 9. Content and Tone

문구는 짧고 구체적이며 비난하지 않는 존댓말을 사용한다.

Preferred:

- “가장 중요한 일부터 하나씩 끝내보세요.”
- “날짜는 나중에 정해도 괜찮아요.”
- “다시 시도해 주세요.”
- “기록함에 추가했어요.”

Avoid:

- 실패를 사용자 탓으로 돌리는 문구
- 불필요하게 긴 설명
- 같은 화면에서 서로 다른 용어로 동일한 개념 표현
- 완료를 강요하거나 과도하게 게임화하는 표현

탭 이름은 `오늘`, `달력`, `프로필` 세 개로 한국어 통일한다. 날짜 없는 기록과 정리는 Today의 `정리할 항목`에서 처리하고, 검색·완료 기록·설정은 Profile shortcut으로 둔다. 기능 용어는 화면 전체에서 일관되게 사용한다.

## 10. Interaction and Motion

Motion duration tokens:

- fast: 150ms
- normal: 220ms
- slow: 320ms

Rules:

- 애니메이션은 상태 변화와 공간 이동을 이해시키는 데 사용한다.
- 완료 피드백은 빠르고 가볍게 처리하며 다음 Task를 방해하지 않는다.
- 네트워크 mutation 중 중복 입력을 차단한다.
- 성공 시 가벼운 햅틱과 짧은 피드백을 사용할 수 있다.
- 장시간 지속되거나 반복되는 장식 애니메이션은 사용하지 않는다.
- reduced motion 설정을 존중해야 한다.
- 수동 정렬이 가능한 목록은 모바일에서 long press drag, Web에서 drag handle을 기본으로 한다.
- 드래그 중 현재 위치와 drop 위치를 시각적으로 제공하고, 놓은 뒤 optimistic update와 실패 복구를 지원한다.
- 재정렬을 위한 `⋯`와 위/아래 버튼 행은 기본 UI에 노출하지 않는다.
- VoiceOver, TalkBack 사용자는 accessibility custom action, Web keyboard 사용자는 단축키 또는 focus context action으로 같은 재정렬 기능에 접근한다.
- 정렬이나 grouping 때문에 수동 재정렬이 불가능한 화면에서는 drag affordance를 표시하지 않는다.

## 11. Screen States

모든 데이터 화면은 다음 상태를 정상 흐름의 일부로 설계한다.

- initial loading 또는 skeleton
- pull to refresh
- empty state와 다음 행동 CTA
- inline error와 retry
- mutation pending과 중복 입력 방지
- success feedback
- offline 또는 timeout 안내

여러 행이 나타나는 초기 목록 조회는 정적인 skeleton row를 사용하고, 단건·짧은 조회는 compact spinner를 유지한다. skeleton 자체에는 반복 animation을 사용하지 않는다.

목록 데이터 갱신에 실패해도 기존 데이터를 가능한 한 유지한다. 전체 화면 오류는 화면을 구성할 데이터가 전혀 없을 때만 사용한다.
오류·경고·성공 피드백은 공통 `InlineNotice`의 낮은 outline과 semantic soft color를 사용하며 큰 Card를 새로 만들지 않는다.

## 12. Accessibility

- 모든 터치 대상은 최소 44×44pt를 유지한다.
- WCAG 대비를 고려하고 색상만으로 상태를 전달하지 않는다.
- VoiceOver, TalkBack에서 역할, 상태, label을 제공한다.
- checkbox와 상세 보기처럼 행동이 다른 영역을 하나의 모호한 터치 대상으로 합치지 않는다.
- 큰 글꼴에서 주요 CTA, Task 제목, 오류 문구가 잘리지 않아야 한다.
- 동적 상태 변화에는 적절한 live region 또는 접근성 알림을 제공한다.
- 파괴적 행동은 확인 또는 실행 취소 가능성을 검토한다.

## 13. Platform Behavior

핵심 기능과 디자인 언어는 Android, iOS, Web에서 동일하게 유지하고 플랫폼 관습이 다른 부분만 분기한다.

- Android: system back과 Material 계열 symbol 관습을 존중한다.
- iOS: safe area, modal, SF Symbols 관습을 존중한다.
- Web: hover, focus-visible, keyboard navigation을 추가하고 720px max width를 유지한다.
- 플랫폼별 구현 차이가 핵심 사용자 흐름이나 용어 차이로 이어지지 않게 한다.
- Android와 iOS에서 같은 dp/pt 값을 기계적으로 확대하지 않고 실제 font scale, safe area, navigation bar를 포함해 검증한다.
- tablet과 넓은 Web에서 모바일 UI를 단순 확대하지 않는다. 목록 readable width와 필요 시 보조 pane으로 남는 공간을 사용한다.

## 14. Do and Don't

Do:

- primary blue를 주요 행동과 현재 선택에 집중해서 사용한다.
- 여백과 타이포그래피로 우선순위를 만든다.
- 사용자가 지금 할 수 있는 다음 행동을 분명히 보여준다.
- 완료와 오류에 색상, 아이콘, 문구를 함께 사용한다.
- 기존 token과 공통 component를 우선 재사용한다.
- Android, iOS, Web과 light/dark theme를 함께 고려한다.

Don't:

- 모든 카드와 제목을 blue로 강조하지 않는다.
- 큰 인사, 날짜 카드, 요약 카드를 연속 배치해 핵심 목록을 초기 화면 아래로 밀지 않는다.
- 무거운 shadow, gradient, glass effect를 기본 장식으로 사용하지 않는다.
- 작은 회색 텍스트로 정보 밀도를 억지로 높이지 않는다.
- mobile 화면에 desktop table이나 과밀한 calendar cell을 축소해 넣지 않는다.
- 새로운 색상, radius, spacing 값을 화면 안에 임의로 추가하지 않는다.
- 완료 경험을 confetti, streak, 점수 등으로 과도하게 게임화하지 않는다.
- 완료 요약은 완료한 일 수와 기록이 있는 날 정도만 보여주며, 순위·최고 기록·실패 평가를 만들지 않는다.
- Task 완료 control에 원형 checkbox를 기본 사용하지 않는다.
- Today에 진행 요약, 과부하, 추천, 지난 미완료, 기록함 전체 목록을 각각 독립 card로 모두 펼치지 않는다.

## 15. Known Gaps

다음 항목은 아직 확정된 디자인 규칙이 아니며 구현과 검증을 거쳐 이 문서에 반영한다.

- ToDoLab 고유의 브랜드 자산과 wordmark
- system font를 대체할 브랜드 typography 필요 여부
- 아이콘 크기, stroke, filled/outlined 사용 규칙
- modal, bottom sheet, toast의 세부 visual specification
- Quick Capture composer의 collapsed/expanded/focus 상태 visual specification
- Calendar 일정 pill/bar의 최소 크기, overflow, touch target, 접근성 label 규칙
- 하단 tab active/inactive icon tone과 label contrast 규칙
- Profile shortcut icon set의 플랫폼별 fallback과 web glyph 렌더링 규칙
- 햅틱과 motion의 상황별 매핑
- 빈 상태 illustration의 사용 여부와 스타일
- dark mode의 실제 기기별 시각 검증
- Web의 hover, focus, 넓은 화면 레이아웃 세부 규칙

## 16. Maintenance

다음 변경에는 이 문서의 동시 갱신 여부를 확인한다.

- theme token 추가 또는 변경
- 공통 UI component의 variant 변경
- 새로운 상태색이나 interaction pattern 도입
- 탭과 핵심 정보 구조 변경
- 플랫폼별 visual behavior 분기
- 브랜드 font, icon, illustration 도입

화면 하나만을 위한 예외보다 재사용 가능한 semantic token과 component variant를 먼저 검토한다. 새 규칙이 두 곳 이상에서 반복되면 공통화하고 이 문서에 기록한다.
