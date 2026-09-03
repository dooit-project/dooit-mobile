# UX Review

Last updated: 2026-09-03

이 문서는 현재 화면에서 유지할 UX 결정과 아직 검증할 위험만 기록한다. 완료된 수정 과정과 과거 화면별 pass 기록은 보관하지 않는다. 시각 기준은 [`DESIGN.md`](./DESIGN.md), 현재 화면 구조는 [`SCREEN_GUIDE.md`](./SCREEN_GUIDE.md), 앞으로 할 일은 [`ROADMAP.md`](../product/ROADMAP.md)를 따른다.

## 현재 핵심 흐름

### 최초 사용

- 인증 정보가 없는 사용자는 Today가 아니라 공개 `/start`에서 시작 방식을 먼저 선택한다.
- 기본 행동은 `로그인 없이 시작`이며 이것은 서버 게스트 계정이다.
- `로그인 또는 계정 만들기`와 선택형 `기능 둘러보기`를 같은 화면에서 제공한다.
- 게스트 발급 실패나 저장 token 확인 실패는 데이터 화면에 영역별 오류를 만들지 않고 시작 단계에서 복구한다.
- 로그인·회원가입 화면에는 게스트 계속 사용 또는 시작 화면 복귀 동선이 있어야 한다.
- 최신 Web 근거는 [`uf-01-first-use-2026-08-23`](../audits/uf-01-first-use-2026-08-23/README.md)에 둔다.

### Today와 기록함

- 첫 viewport에는 오늘 일정 또는 오늘 할 일의 실제 콘텐츠와 빠른 기록 행동이 보여야 한다.
- 하단 `오늘` tab과 오늘 날짜의 선택 상태가 맥락을 이미 전달하므로 주간 strip 위에 `오늘`, 월 이름, 전체 날짜를 별도 제목으로 반복하지 않는다.
- Today 주간 strip은 바깥 테두리와 날짜 열 구분선을 제거하고 오늘 선택 원, 일정 유무 표시와 간격으로 상태를 구분한다. 월이 바뀌는 날짜만 `9/1`처럼 월을 포함한다.
- 빠른 기록은 날짜 없는 Inbox seed를 만드는 짧은 입력이다. 상세 필드는 Task 작성 화면에서 다룬다.
- 날짜를 해석하지 못한 빠른 기록은 저장 직후 제목, `기록함에 저장` 상태, `오늘 할 일로 이동`, `내용 확인`을 같은 결과 영역에서 보여 준다.
- Inbox는 독립 tab이 아니라 Today의 `정리할 항목`으로 진입한다.
- 빠른 등록 결과는 composer 종료 뒤 최신 기록 1개 preview로 유지하고, 지난 미완료·추천은 `하루 정리`로 분리했다. 기준은 [`QUICK_CAPTURE_INBOX_UX_PROPOSAL.md`](../product/QUICK_CAPTURE_INBOX_UX_PROPOSAL.md)를 따른다.
- 빈 Today는 인증 오류나 샘플 데이터를 보여 주지 않고 첫 Task 작성 CTA를 제공한다.
- 오늘 완료한 일은 결과 피드백이므로 항목이 있으면 최근 3개를 기본으로 펼치고, 나머지는 `전체 N개 보기`로 확장한다.

### Calendar와 일정

- Calendar는 3주 날짜 흐름과 선택 날짜의 예정·완료 목록을 연결한다.
- 하루 일정과 여러 날 bar는 Task보다 시각적 무게가 강하지 않아야 한다.
- 320px에서도 7열과 기간 bar가 화면 폭을 밀지 않아야 한다.
- 시간 일정과 종일 일정은 입력·표시·알림 시각에서 서로 다른 의미를 유지한다.

### 계정과 설정

- 더보기는 계정 상태와 주요 목적지의 허브이며 설정 항목을 과도하게 복제하지 않는다.
- 게스트 사용자는 현재 데이터가 계정 연결 전임을 이해할 수 있어야 한다.
- 설정은 앱 사용 가이드, 로컬 알림 권한과 동기화 상태를 제공하며 API·token 진단 정보는 development build에서만 표시한다.
- 알림 거부 상태에서는 OS 권한 요청을 반복하지 않고 기기 설정 이동을 제공한다.

### Task 상세

- 기본 카드에는 제목·상태·설명, 다음 카드에는 날짜 빠른 변경을 둔다.
- `수정`은 Task 종류 metadata와 나란히 두지 않고 페이지 헤더 우측의 icon+label secondary action으로 제공한다.
- 일정 정보는 일정·반복·계획일·목표일·종일·카테고리만 같은 그룹으로 표시한다.
- D-Day 상태는 관리 행동에서 한 번만 표시하고 미룸·이월 기록은 실제 값이 있을 때만 별도 그룹으로 표시한다.
- 체크리스트는 Task의 다음 행동을 보여 주는 한 단계 목록으로 두고 별도 날짜·담당자·알림을 중첩하지 않는다.
- Workspace VIEWER에게 체크리스트 변경 행동을 보여 준 뒤 403으로 막는 흐름을 기본 UX로 삼지 않는다.
- 최신 Web 근거는 [`uf-03-task-crud-2026-08-24`](../audits/uf-03-task-crud-2026-08-24/README.md)에 둔다.

### Navigation과 선택 상태

- 하단 tab은 icon 배경만이 아니라 활성 label의 색·굵기와 선택 indicator를 함께 사용해 현재 위치를 표시한다.
- 색이나 icon 채움 하나만으로 선택 상태를 전달하지 않으며 `selected` 접근성 상태를 유지한다.
- Workspace 내부 tab과 Search filter처럼 text·surface·border가 함께 바뀌는 control은 현재 기준을 유지한다.
- 개인 카테고리 요약은 `전체`·`미분류`·이름과 필요한 count만 보여 주며 Workspace 범위와 섞지 않는다.

## 2026-08-21 화면 피드백 결정

사용자 제공 Today·Task 상세 캡처와 현재 코드를 함께 확인했다. shadcn/ui의 [Calendar](https://ui.shadcn.com/docs/components/base/calendar), [Tabs](https://ui.shadcn.com/docs/components/base/tabs), [Card](https://ui.shadcn.com/docs/components/base/card), [Badge](https://ui.shadcn.com/docs/components/radix/badge)의 선택·행동·구획 원칙을 비교 기준으로 사용하되 React Native 컴포넌트를 그대로 복제하지 않는다.

| 문제 유형                  | 확인 화면                                | 결정                                                                                          |
| -------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| 중복된 위치·날짜 문맥      | Today의 `8월`, 오늘 선택 원, 하단 `오늘` | 독립 제목을 제거하고 주간 strip을 첫 콘텐츠로 둔다. 월 경계만 날짜 cell에서 표시한다.         |
| 장식적 경계                | Today 주간 strip의 외곽선·세로선         | Today에서는 제거한다. Calendar grid는 일정 bar 정렬 기능이 있으므로 얇은 경계를 유지한다.     |
| 약한 주요 행동             | Task 상세 카드 우측 `수정`               | 페이지 헤더 action으로 이동한다. 종류 metadata와 행동을 분리한다.                             |
| icon에 치우친 선택 상태    | 하단 Today·Calendar·더보기 tab           | icon, label, indicator가 함께 변하도록 한다. Workspace tab과 Search filter는 현 상태 유지다.  |
| 저장 후 객체가 보이지 않음 | 날짜 없는 빠른 기록                      | 방금 저장한 제목과 목적지, Today 이동·상세 행동을 즉시 보여 준다. Inbox 전체는 펼치지 않는다. |
| 결과를 숨기는 기본 접힘    | Today의 오늘 완료한 일                   | 최근 3개를 기본 노출한다. D-Day 관리, 추가 정보 form은 점진적 공개이므로 접힘을 유지한다.     |
| 동등해 보이는 action 묶음  | Workspace Task의 D-Day·제목 수정·삭제    | 별도 점검 대상으로 관리한다. 주요 행동 하나와 overflow menu로 나눌 수 있는지 확인한다.        |

공통 판정 기준:

- 이미 tab, 선택 상태, 콘텐츠가 설명하는 화면명·날짜는 다시 쓰지 않는다.
- border는 입력, focus, 선택 또는 데이터 정렬처럼 기능이 있을 때만 유지한다.
- 저장·완료·이동 뒤에는 방금 바뀐 객체와 다음 행동을 같은 viewport에서 확인할 수 있어야 한다.
- 기본 접힘은 설정·관리·긴 부가 정보에 사용하고, 사용자의 직전 행동 결과에는 사용하지 않는다.
- card 안의 metadata와 수정·삭제 같은 행동을 같은 text 위계로 나란히 두지 않는다.

### 문장과 줄바꿈

- 제목의 강제 개행은 의미 단위가 분명하고 320px·font scale 1.5에서도 각 줄이 잘리지 않을 때만 사용한다.
- 본문은 강제 개행에 의존하지 않고 화면 폭과 글자 크기에 따라 자연스럽게 흐르게 한다.
- 한 줄 끝에 조사만 남거나 다음 줄에 `수 있어요`, `주세요`, `합니다`처럼 짧은 서술어만 고립되지 않도록 문장을 먼저 짧게 다듬는다.
- 설명 문구는 한 문장에 한 가지 정보만 담고, 모바일에서는 2~3줄 안에 핵심 행동과 결과가 읽히게 한다.
- `Task`, `Today`, `Calendar`, `D-Day` 같은 제품 용어와 한국어 조사가 줄 경계에서 부자연스럽게 분리되지 않는지 320px·390px·430px에서 확인한다.
- `numberOfLines`는 카드 제목처럼 공간 제약이 명확한 곳에만 사용하며 중요한 안내·오류·행동 결과는 말줄임하지 않는다.

## 현재 확인된 기준

- Web 320×844, 390×844, 430×932 최초 사용 화면은 가로 overflow 없이 동작한다.
- Web 320px·390px·430px와 browser zoom 150%에서 시작·로그인·회원가입 제목과 주요 CTA가 잘리지 않는다.
- 게스트 설명은 430px에서 마지막 `요.`가 고립되지 않도록 한 문장 길이를 줄였다.
- 더보기의 계정 상태와 메뉴 설명은 320px·browser zoom 150%에서도 말줄임 없이 표시한다.
- 기능 둘러보기는 compact 화면에서 세로 스크롤로 Today·Calendar·D-Day 설명에 접근한다.
- 로그인 선택 뒤 시작 화면 또는 게스트 사용으로 돌아갈 수 있다.
- 게스트 생성 뒤 빈 Today로 이동하며 `인증 정보가 필요합니다` 같은 오류를 노출하지 않는다.
- 주요 form은 명시적 label, password 보기 label, 오류 문구, focus border를 제공한다.
- 주요 touch action은 44pt 이상을 목표로 한다.

## 남은 UX 위험

### 정보 구조와 상태 표현

- Today, Calendar, Search, Completed, D-Day, 하루 정리의 빈 상태가 제목·설명·주 행동을 같은 순서와 위계로 제공하는가
- Calendar의 빈 날짜에서 사용자가 그 날짜의 일정 또는 Task를 바로 추가할 수 있는가
- 더보기의 계정 정보와 목표·검색·완료 기록·설정 메뉴가 서로 다른 그룹으로 인식되는가
- 카드와 테두리가 실제 정보 그룹보다 과도하게 반복되어 화면을 조각내지 않는가

### 문장과 줄바꿈

- 320px·390px·430px에서 본문 마지막 줄에 한두 어절만 남아 읽는 리듬이 끊기지 않는가
- font scale 1.5에서 강제 개행 제목이 3줄 이상으로 깨지거나 잘리지 않는가
- 버튼과 메뉴 설명이 말줄임되어 핵심 행동 또는 상태를 숨기지 않는가
- 한국어와 영문 제품 용어가 섞인 문장에서 조사·단위·날짜가 부자연스럽게 분리되지 않는가

### 네이티브 입력과 레이아웃

- Android back이 키보드 닫기와 화면 뒤로 가기를 올바른 순서로 처리하는가
- iOS home indicator와 Android navigation bar가 하단 composer·CTA를 가리지 않는가
- font scale 1.5에서 제목·오류·주요 버튼이 잘리거나 순서가 뒤집히지 않는가
- 375pt iPhone과 430dp Android에서 Calendar bar와 Task form이 안정적인가

공통 Screen의 SafeAreaView와 scroll keyboard inset을 기준으로 사용한다. 로그인·회원가입 form은 별도의 KeyboardAvoidingView를 중첩하지 않으며, Today의 하단 빠른 기록만 절대 배치 layer에서 키보드 높이를 별도로 반영한다. 실제 home indicator·navigation bar·키보드 조합은 실기기 smoke에서 확인한다.

### 긴 목록과 밀집 일정

- Today의 오늘 할 일은 처음 20개를 렌더링한다. 완료 목록은 최근 3개를 기본 노출하고 전체 보기 뒤에는 20개 단위로 추가한다. Completed의 선택 날짜 목록도 처음 20개 뒤 사용자가 요청할 때 추가한다.
- Calendar 일정 막대는 화면에 두 lane만 배치하고 나머지는 `+N` 전체 목록 행동으로 연결한다.
- 실제 API 지연과 운영 데이터 규모의 렌더링 시간은 release 후보에서 별도로 측정한다.

### 큰 글꼴과 명암

- 공통 Button은 고정 높이가 아닌 최소 높이를 사용해 label이 커지면 세로로 확장한다.
- 제목, 주요 CTA, 오류와 상태 안내에는 줄 수 제한을 두지 않는다. 공간이 제한된 일정 bar와 보조 metadata만 한 줄로 줄인다.
- light·dark theme의 기본·보조·상태 text와 primary·secondary button surface는 자동 대비 테스트를 유지한다.
- font scale 1.5의 실제 줄바꿈과 control 높이는 Android·iOS 실기기에서 별도로 확인한다.

### 접근성

- VoiceOver·TalkBack 읽기 순서가 화면의 시각 순서와 일치하는가
- checkbox, 일정 bar, tab, 알림 설정이 역할·상태·행동 결과를 전달하는가
- drag 또는 정렬 행동에 화면 읽기 사용자가 접근 가능한 대체 수단이 있는가
- 성공·오류 상태가 색상 외 문구와 live region으로 전달되는가

코드 기준으로 Task·일정 완료 control은 checkbox 역할과 checked·busy·disabled 상태를 제공한다. Calendar 일정 bar와 tab은 button·selected 의미를 유지하며, 빠른 기록은 expanded 상태, 알림 권한은 상태 label과 live region을 제공한다. 실제 읽기 순서와 발음은 VoiceOver·TalkBack smoke에서 별도로 확인한다.

### 인증과 데이터 신뢰

- 게스트 병합 실패·offline·token 만료에서 사용자가 데이터 보존 상태를 정확히 이해하는가
- 앱 삭제 후 서버 게스트 데이터의 복구 한계가 안내 문구와 모순되지 않는가
- 계정 전환 뒤 이전 계정의 화면 cache와 로컬 알림 제목이 남지 않는가

### 알림

- 최초 실행에서 권한을 요청하지 않는가
- 시간 일정과 종일 일정 알림 문구·시각이 실제 기기에서 자연스러운가
- foreground·background·cold start 알림 선택이 같은 Task 상세로 이어지는가
- 권한 거부 후 Settings → 기기 설정 → 앱 복귀 흐름이 막히지 않는가

## 다음 리뷰 순서

1. 최신 Android preview APK에서 최초 사용과 로그인·게스트 흐름
2. 320dp·390dp·430dp, font scale 1.5, light·dark, 키보드·navigation bar
3. 알림 권한 허용·거부와 시간·종일 일정 수신
4. TalkBack 핵심 흐름과 Task 완료·알림 선택 피드백
5. production API 지연·offline·계정 전환 상태
