# 최신 Design QA — 목표 묶음 3번

2026-10-21 · `ddde85b` 이후 working tree. 현재 판정은 이 절을 우선하며 아래 과거 `passed`는 당시 변경에 대한 기록이다.

- Source visual truth: [선택한 3번 생성 이미지](./docs/design/soft-goal-surfaces-2026-10-21/selected-today.png), 853×1844.
- Implementation: [실제 오늘 화면](./docs/audits/soft-goal-surfaces-2026-10-21/15-today-final.png), 390×844, light/mock Web, density 1.
- Full-view comparison: [동일 논리 폭 비교 보드](./docs/audits/soft-goal-surfaces-2026-10-21/16-reference-comparison.png). Source 폭 390, 비율 유지 높이 약 843. Browser board 850×940.
- State: 선택 시안은 새 Goal 두 개와 완료 포함 5개 예시, 실제는 기존 mock D-Day/일정/일반 Task. 상태가 달라 전체 1:1 구현 완료 판정은 보류한다.
- Focused evidence: [하단 초점 확대 없이 읽을 수 있는 390px 캡처](./docs/audits/soft-goal-surfaces-2026-10-21/14-tab-focus-fixed.png), [320px 긴 제목](./docs/audits/soft-goal-surfaces-2026-10-21/08-today-320.png). 같은 입력의 전체 비교와 원본 크기 캡처에서 글자/행/탭을 확인했으며 별도 crop은 만들지 않았다.
- Fonts/layout/colors/assets/copy와 P1/P2 수정 이력: [상세 감사](./docs/audits/soft-goal-surfaces-2026-10-21/README.md).
- Fixed: 탭 label 잘림, 사각형 선택 배경, focus outline clipping, 오늘 scrollbar에 의한 폭 축소.
- Remaining P1: 새 Goal 회차와 완료 목록이 오늘에 연결되지 않아 선택 시안의 내용/상태 전체를 재현하지 못한다. 이번은 기존 목록의 시각 보정이며 이를 전체 선택안 구현 완료로 넘기지 않는다.
- Primary interactions: 상세/복귀, 추가 메뉴, 네 탭 이동, Tab 초점. Console errors: 0. Native/실제 API/오류·복구 상태는 미검증.
- Next: 디자인 우선으로 계획·상세·작성 구조를 보정하고, 새 Goal/완료 연결 후 동일 데이터 상태로 전체 시안을 다시 비교한다.

final result: blocked

---

# Task Category Navigation Design QA

## 2026-09-17 재로그인 이메일 유지

- [재로그인 이메일과 삭제 동작 감사](./docs/audits/login-email-prefill-2026-09-17/README.md)
- 등록 계정 세션 만료의 이메일 채움, 44px 삭제 버튼, 삭제 후 포커스 복귀와 최초 로그인 빈 상태를 390×844 Web 화면에서 확인했다.

## 2026-09-17 탭 상단 safe area

- [탭 상단 흰색 구간 원인과 수정 후 감사](./docs/audits/top-content-gap-2026-09-16/README.md)
- 오늘·달력·더보기의 중복 top safe area를 제거하고 콘텐츠 상단 간격을 16px로 통일했다. Web 390×844와 320×844에서 탭 이동, 콘텐츠, 빠른 기록과 하단 탭을 확인했다.

## 2026-09-16 로그인 상태별 문구

- [첫 로그인·세션 만료 문구 감사](./docs/audits/login-copy-2026-09-16/README.md)
- 첫 로그인에는 `로그인해요`, 등록 계정의 세션 만료에만 `다시 로그인해요`가 표시되는 것을 390×844 Web 화면에서 확인했다.

## 2026-09-14 하단 탭 보완

- [하단 탭 높이·safe area 검토와 실제 캡처](./docs/audits/bottom-tab-safe-area-2026-09-14/README.md)
- Web 320/390/430 화면과 탭 이동 확인, 전체 validate 통과. 내장 브라우저가 제공되지 않아 앞선 감사의 Chrome 연결을 이어 사용했다. Android·iOS 홈 제스처 영역과 실제 글자 배율 검증은 새 설치 빌드에서 필요하다.

final result: passed

## 2026-09-21 Task 작성 화면 안전한 복귀

- [직접 진입과 앱 내부 진입 복귀 감사](./docs/audits/task-form-safe-exit-2026-09-21/README.md)
- 작성 화면을 직접 열었을 때 뒤로가기와 취소가 Today로 이동하고, 앱 내부 진입은 기존 history로 돌아가는 것을 Web Chrome에서 확인했다.

final result: passed

## 2026-09-20 Task 작성 기본 정보 우선 노출

- [Task 작성 점진적 공개 검토와 실제 화면 감사](./docs/audits/task-form-progressive-disclosure-2026-09-20/README.md)
- 새 일정과 새 아이디어의 선택 정보를 기본 접힘으로 바꾸고, 유형별 제목 예시와 44px 추가 정보·선택 행동을 적용했다.
- Web Chrome의 390×844와 320×844에서 일정 기본·펼침, 아이디어 기본 상태와 접근성 tree를 확인했다.

final result: passed

## 2026-09-18 Today 하단 작성 진입·브랜드 크기

- Source visual truth: [`docs/audits/today-capture-dock-2026-09-18/reference-before-390x844.jpg`](./docs/audits/today-capture-dock-2026-09-18/reference-before-390x844.jpg)와 사용자의 배치 수정 지시
- Implementation screenshot: [`docs/audits/today-capture-dock-2026-09-18/01-today-dock-390x844.jpg`](./docs/audits/today-capture-dock-2026-09-18/01-today-dock-390x844.jpg)
- Viewport and normalization: source와 implementation 모두 390×844 CSS pixels, density 1
- State: light theme, mock API, 신규 게스트 빈 상태
- Full-view evidence: [`05-comparison.png`](./docs/audits/today-capture-dock-2026-09-18/05-comparison.png)
- Focused evidence: 320px dock·composer와 390px drawer는 audit의 `02`, `03`, `04` 캡처로 확인했다. 글자와 control이 원본 크기에서 읽혀 별도 crop은 만들지 않았다.
- Typography: 독립된 `오늘` display text를 제거하고 header wordmark는 title, drawer wordmark는 display scale로 올렸다.
- Spacing: 작성 진입은 하단 tab 위에 고정하고 scroll content에 144px bottom padding을 제공한다.
- Colors: 기존 surface, border, amber, sage, blue token을 그대로 사용한다.
- Assets: 기존 Material Community Icons와 `SymbolView`만 사용하며 새 raster·SVG asset은 없다.
- Copy: 상단 `오늘`을 제거하고 onboarding 안내를 `화면 아래에서`로 수정했다. 하단 tab과 `오늘 할 일`은 navigation·section 이름으로 유지한다.
- Primary interactions: 일정·아이디어 작성 이동, 할 일 composer open/close, drawer open/close를 확인했다.
- Browser console errors: zero. 기존 React Native Web `shadow*` deprecation warning은 이 변경 밖에 남아 있다.
- Actionable P0/P1/P2: none.
- Remaining P3/device checks: native safe area·keyboard, font scale 1.5, dark theme, screen readers, 긴 목록의 마지막 row.

Comparison history:

1. 이전 구현은 작성 진입이 첫 viewport 상단에 있었다.
2. 작성 진입을 하단 dock으로 이동하고 상단 display text를 제거했다.
3. 390×844와 320×844에서 label, tab, composer, drawer를 다시 캡처해 겹침이 없음을 확인했다.

final result: passed

## Comparison target

- Source visual truth: [`docs/audits/task-categories-2026-09-06/reference-selected-390x844.png`](./docs/audits/task-categories-2026-09-06/reference-selected-390x844.png)
- Implementation: `src/components/navigation/planner-drawer.tsx`
- Implementation screenshot: [`docs/audits/task-categories-2026-09-06/02-expanded-populated-390x844.png`](./docs/audits/task-categories-2026-09-06/02-expanded-populated-390x844.png)
- State: light theme, category drawer expanded, four personal Tasks across three named categories

## Normalization

- Generated source pixels: 853×1844, mechanically normalized to 390×844 for comparison.
- Implementation pixels and CSS viewport: 390×844, device scale factor 1.
- Browser: Chrome with the selected 390×844 viewport.

## Findings

- No actionable P0, P1, or P2 visual mismatch remains.
- Typography intentionally uses the established Dooit `AppText` scale instead of the generated source's oversized type. The parent row, secondary total and nested labels preserve the same hierarchy at the existing drawer density.
- Layout keeps the selected order `오늘 → 달력 → 카테고리 → 기록함 → 오래 미룬 일 → 완료 기록`. The nested list uses a thin guide, 48px rows and right-aligned counts without badges.
- Colors use existing surface, border, primary-soft and text tokens. The category section adds no arbitrary category colors or shadows.
- The folder and disclosure icons use the existing Material Community Icons family. There are no raster placeholders or custom SVG substitutes.
- Copy is limited to the API-provided display name and `taskCount`; Workspace Tasks and unsupported management actions are not shown.

## Focused interaction evidence

- Collapsed state: `00-collapsed-390x844.png`.
- Empty category state: `01-expanded-390x844.png`.
- Populated expanded state: `02-expanded-populated-390x844.png`.
- Named category result: `03-category-results-390x844.png`.
- A separate crop was unnecessary because all category labels, counts, guide, icon and disclosure states are legible in the original 390px capture.

## Comparison history

1. The first populated capture was taken before the Chrome viewport override was restored and was discarded.
2. The viewport was reset to 390×844, the same expanded state was recaptured, and the source and implementation were opened together for comparison.
3. The named `업무` category closed the drawer and opened `/search?browse=categories&category=업무` with two exact-match results. The result-description Korean particle was then replaced with the neutral `기준으로` wording.
4. Final browser console errors: zero.

## Residual contract gap

- `GET /api/v1/tasks/search` cannot currently express `category IS NULL`. `미분류` count is shown from the summary API but its navigation row remains disabled until the backend adds an explicit uncategorized filter.

## Residual device gaps

- 320dp and 430dp, font scale 1.5, dark theme
- Android TalkBack, iOS VoiceOver and native drawer gesture/back behavior
- production API latency, category changes while the drawer is open and offline recovery

## 2026-09-18 Today 유형별 작성 진입

- Source visual truth: [`docs/audits/today-capture-entry-2026-09-18/reference-selected.png`](./docs/audits/today-capture-entry-2026-09-18/reference-selected.png)
- Implementation screenshot: [`docs/audits/today-capture-entry-2026-09-18/01-today-empty-390x844.jpg`](./docs/audits/today-capture-entry-2026-09-18/01-today-empty-390x844.jpg)
- Viewport and normalization: generated source 853×1844, mechanically normalized to 390×844; implementation 390×844 CSS pixels at density 1
- State: light theme, mock API, 신규 게스트 빈 상태
- Full-view evidence: [`04-comparison-full.png`](./docs/audits/today-capture-entry-2026-09-18/04-comparison-full.png)
- Focused header evidence: [`05-comparison-header.png`](./docs/audits/today-capture-entry-2026-09-18/05-comparison-header.png)
- Interaction evidence: 일정은 오늘 날짜가 선택된 `새 일정`, 할 일은 기존 composer, 아이디어는 `새 아이디어`로 진입했다.
- Typography: existing `AppText` scale and weights preserve the selected hierarchy without adding a font dependency.
- Spacing: 320px first pass에서 `아이디어`가 잘려 아이콘, gap, padding과 label size를 줄인 뒤 전체 label을 재확인했다.
- Colors: existing highlight amber, sage and blue tokens map to the three types. Final idle borders blend into `surfaceMuted`.
- Assets: `SymbolView` icons only; no generated runtime asset, placeholder, custom SVG or CSS drawing.
- Copy: recommendation copy and `시작하기` were omitted as requested. Date, `오늘`, `무엇을 남길까요?` and the three type labels remain.
- State difference: source has populated lists while implementation evidence is the mock guest empty state. The focused header is state-equivalent; existing list and empty components were intentionally preserved.
- Browser console errors: zero. Existing React Native Web `shadow*` deprecation warning remains outside this change.
- Remaining P3/device checks: dark theme, font scale 1.5, native Android/iOS and screen readers.

Comparison history:

1. 320px first capture found the `아이디어` label truncated.
2. Icon size, gap, horizontal padding and label size were reduced.
3. 320×844 and 390×844 captures confirmed all three labels and touch targets remain visible.

final result: passed

## 2026-10-18 빠른 기록 STG 연동

[코드·자료 사전 검토와 검증 기록](docs/design/QUICK_CAPTURE_STG_INTEGRATION_2026-10-18.md). Today의 TODO 선택을 저장 유형으로 전달하고 mock도 서버와 맞췄다. 기존 UI 구조와 디자인 토큰은 유지했다. 실제 모바일 client→STG 수용 예시는 통과했다. iab/Chrome 연결 불가로 새 화면 캡처·시각·키보드·보조 기술 감사는 보류이며 통과 판정하지 않는다. Android/iOS 실기기와 PRD 배포도 미확인이다.
