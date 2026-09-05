# Task Checklist Design QA

final result: passed

## Comparison target

- Source visual truth: [`docs/audits/task-checklist-2026-09-05/option-a-circle-refined.png`](./docs/audits/task-checklist-2026-09-05/option-a-circle-refined.png)
- Normalized source: [`docs/audits/task-checklist-2026-09-05/reference-selected-390x844.png`](./docs/audits/task-checklist-2026-09-05/reference-selected-390x844.png)
- Implementation: `src/features/tasks/task-checklist-section.tsx`
- Implementation screenshot: [`docs/audits/task-checklist-2026-09-05/01-personal-2-of-4-390x844.png`](./docs/audits/task-checklist-2026-09-05/01-personal-2-of-4-390x844.png)
- State: personal Task, four items, two completed, light theme

## Normalization

- Source pixels: 853×1844.
- Normalized source pixels: 390×844 using a mechanical resize for the nearly identical aspect ratio.
- Implementation pixels and CSS viewport: 390×844, device scale factor 1.
- Browser: local Chrome/Playwright fallback because the in-app browser connection was unavailable.

## Findings

- No actionable P0, P1, or P2 mismatch remains.
- Typography uses the existing Dooit `AppText` scale and is intentionally denser than the generated source while preserving its hierarchy.
- Layout keeps the selected hero → expanded checklist → date quick actions order, 16px page margins, grouped rows, and outlined add action.
- Colors map to existing theme tokens rather than sampling generated pixels; light-theme contrast remains covered by the theme tests.
- The circular indicator is rendered with `react-native-svg`; standard checkbox and chevron icons use the established Expo Symbols library. There are no raster placeholder assets.
- App-specific copy preserves `체크리스트`, `N개 남음`, item titles, and the existing date-action wording. The capture task has no description, so the existing empty-description copy differs from the visual target without changing the checklist design.

## Focused interaction evidence

- Empty and add-input states: `00-personal-empty-390x844.png`, `03-personal-add-editor-390x844.png`.
- Item action disclosure: `02-personal-actions-390x844.png`.
- A separate crop was unnecessary because the checklist occupies most of the 390px full-view width and all labels, borders, icons, and control spacing are readable at original resolution.

## Comparison history

1. The first interaction run exposed the Web console error `Invalid DOM property transform-origin` from the SVG rotation origin.
2. The progress arc was changed to a single SVG `transform` rotation, then the complete create·complete·reopen·edit·reorder·delete flow was rerun.
3. The final 390×844 captures have zero console errors and no visible error overlay.

## Residual test gaps

- Workspace VIEWER visual state on a real multi-account session
- Android/iOS font scale 1.5, dark theme, safe area, and screen reader order
- production API latency, 403 role changes, and offline recovery
