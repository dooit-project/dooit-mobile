# Product Design 검토 정책

Last updated: 2026-09-02

화면 수정과 신규 사용자 기능이 구현 편의만으로 결정되지 않도록 Product Design 검토, 실제 화면 캡처와 검증 결과를 같은 작업 범위에서 관리한다.

## 적용 대상

다음 변경은 구현 전에 Product Design 검토를 거친다.

- 신규 화면, modal, drawer, sheet, tab, 주요 component
- 내비게이션·정보 구조·사용자 흐름 변경
- 주요 행동의 위치·위계·문구 변경
- 빈 상태·오류·복구·권한 제한 상태 추가
- 기존 화면의 밀도·색·타이포그래피·레이아웃을 눈에 띄게 바꾸는 작업

텍스트 오탈자, 보이지 않는 refactor, 테스트·API client·build script만 바꾸는 작업은 제외할 수 있다. 다만 사용자에게 보이는 결과가 달라지면 검토 대상으로 되돌린다.

## 기본 절차

1. **문제와 목표 정의**
   - 대상 사용자, 화면, 해결할 불편과 성공 조건을 한 문단으로 정리한다.
   - 현재 화면·유사 흐름·design token·공통 component를 먼저 확인한다.
2. **구현 전 Product Design 검토**
   - 기존 패턴 안의 작은 변경은 구조·위계·문구를 검토한다.
   - 신규 화면이나 구조가 여러 방식으로 가능한 경우 390×844 기준 시각안 3개를 비교하고 선택 전 구현하지 않는다.
   - 기능을 보여주기 위한 불필요한 card·badge·tab·설정은 추가하지 않는다.
3. **구현**
   - 선택한 시각 목표와 기존 design system을 따른다.
   - 정상 상태뿐 아니라 loading·empty·error·disabled·부분 성공·복구를 함께 구현한다.
4. **구현 후 실제 화면 감사**
   - mock 또는 재현 가능한 데이터로 실제 앱 화면을 새로 캡처한다.
   - 캡처를 직접 확인한 뒤 UX, 시각 완성도와 접근성 위험을 화면 단계별로 기록한다.
   - 기존 캡처나 파일명만 보고 통과 판정하지 않는다.
5. **수정과 재검증**
   - 치명적·높음 문제는 같은 변경에서 수정한다.
   - 중간·낮음 문제는 로드맵 또는 관련 audit에 근거와 함께 남긴다.
   - `npm run validate`와 영향 플랫폼 검증을 완료한다.

## 로컬 브라우저 선택 기준

OpenAI의 [Browser 공식 문서](https://learn.chatgpt.com/docs/browser)는 ChatGPT 데스크톱 앱의 내장 브라우저가 사용자와 ChatGPT가 웹사이트와 로컬 웹 앱을 같은 화면에서 보며 preview, 시각 feedback과 interaction 검증을 수행하는 surface라고 설명한다. 일반 browser profile이나 기존 tab을 그대로 사용해야 할 때는 browser extension을 사용하도록 구분한다.

Dooit의 로컬 Web 검증은 다음 순서를 기본으로 한다.

1. **ChatGPT 앱 내장 브라우저**
   - localhost의 Expo Web 화면, mock flow, responsive viewport, keyboard focus와 실제 캡처 검증의 기본 surface다.
   - 별도 Chrome profile이나 기존 로그인 상태가 필요하지 않은 개발·디자인 QA에 우선 사용한다.
2. **Chrome 확장 연결**
   - 기존 Chrome tab, 로그인 session, extension, 일반 browser profile 또는 Chrome 고유 동작이 검증 조건일 때 사용한다.
   - 사용자가 Chrome을 요청하거나 같은 Chrome 상태를 이어서 확인해야 할 때도 이 경로를 유지한다.
3. **로컬 Playwright**
   - 선택한 browser surface가 로컬 주소를 열지 못하고 연결·주소·server 상태 복구로도 해결되지 않을 때 사용하는 자동화 fallback이다.
   - 전환 사유, viewport, browser channel, 캡처와 console 결과를 해당 audit README와 `design-qa.md`에 기록한다.

어떤 surface를 사용해도 source visual과 implementation capture를 같은 viewport와 상태로 비교하고, 실제로 확인하지 않은 interaction이나 접근성 동작은 통과로 기록하지 않는다.

## 검토 기준

### 사용성

- 첫 화면에서 현재 위치와 다음 행동이 분명한가
- 자주 쓰는 행동이 불필요한 중간 화면을 거치지 않는가
- 저장·완료·이동 결과와 실패·재시도가 같은 맥락에서 이해되는가
- 사용자가 중단·뒤로 가기·건너뛰기를 안전하게 할 수 있는가
- 빈 상태가 시작 방법을 설명하고 과도한 기능을 권하지 않는가

### 미감과 일관성

- spacing, alignment, typography가 정보 위계를 먼저 만드는가
- divider와 surface tint로 충분한 곳에 border·shadow를 남용하지 않는가
- card 안에 card가 중첩되거나 모든 row가 독립 card처럼 보이지 않는가
- Dooit의 white surface, muted blue·sage·amber와 조용한 밀도를 유지하는가
- Android·iOS·Web에서 같은 역할이 같은 시각 언어를 쓰는가

### 접근성

- 핵심 touch target이 최소 44pt인가
- 색 이외의 label·icon·state로 선택·완료·오류를 전달하는가
- screen reader 이름·역할·상태와 읽기 순서가 자연스러운가
- keyboard focus, Escape, Android back과 modal focus 복귀가 동작하는가
- 320px, 390px, 430px와 font scale 1.5에서 핵심 행동이 유지되는가

## Figma 사용 기준

Figma는 매 화면 변경의 필수 단계가 아니다. 다음 경우에만 Product Design 검토와 함께 사용한다.

- 사용자가 Figma 산출물 또는 검토 보드를 명시적으로 요청한 경우
- 여러 화면의 흐름·비교안을 팀과 공유해야 하는 경우
- design token·component·variant를 library로 관리해야 하는 경우
- 캡처와 발견 사항을 장기 보존할 시각 보드가 필요한 경우

단순한 구현 전 검토와 구현 후 감사는 저장소의 Markdown, 실제 캡처와 코드가 원본이다. Figma를 사용하더라도 저장소의 판정과 링크를 함께 갱신한다.

## 기록 위치

- 제품 방향과 우선순위: `docs/product/`
- 색·타이포·component 결정: `docs/design/`
- 화면별 감사와 캡처: `docs/audits/<topic>-YYYY-MM-DD/`
- 출시 전 확인: `docs/qa/RELEASE_CHECKLIST.md`
- 최신 대표 화면: `docs/screenshots/`

감사 README에는 대상 commit, viewport, API mode, 플랫폼, 단계별 상태, 문제 심각도, 접근성 검증 한계와 후속 작업을 기록한다.

## 완료 조건

- 구현 전 선택한 방향과 구현 결과가 일치한다.
- 정상·빈 상태·오류·복구 중 변경과 관련된 상태를 실제로 확인했다.
- 치명적·높음 UX 문제와 접근성 blocker가 남아 있지 않다.
- 남은 문제는 담당 문서와 로드맵에서 추적 가능하다.
- 코드·문서·캡처와 `npm run validate`가 같은 commit 기준을 가리킨다.
