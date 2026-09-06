# Task Category Navigation Design QA

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
