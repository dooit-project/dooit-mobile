# 상세 시안 생성 프롬프트

2026-10-24 · built-in image_gen 사용. 각 호출에는 아래 공통문과 해당 방향문을 이어서 전달하고 동일한 로컬 참조 이미지 두 장을 첨부했다.

첨부 순서: Image 1은 `../../audits/task-detail-design-review-2026-10-24/01-current-detail-390.jpg`, Image 2는 `../goal-lanes-correction-2026-10-21/reference.png`다.

## 공통문

```text
Use case: ui-mockup. Create a realistic, production-quality Korean mobile task detail UI for the EXISTING dooit app. This is a proposed visual design, not an actual screenshot or shipped feature.
Target logical dimensions 390 x 844, portrait matching that ratio. App content only, edge-to-edge rectangle, no phone bezel/body/notch/OS status bar/clock/battery/home indicator/browser chrome/device shadow, no comparison board, no explanatory annotations, no concept title or option number outside the UI.
Image 1 is the current actual detail screen: use its real data and app styling as grounding, but reorganize the hierarchy; do not clone its empty gaps or feature-list layout. Image 2 is the user's approved Today design: preserve its clean white surface, goal blue dot, simple round completion controls, disciplined typography and calm gray secondary text. Do not import Today bottom navigation or a dooit motivational header into a full-page task detail.
Visual language: immaculate white background; ink #0F172A; secondary #667080; action blue #0875FF. Refined Korean sans such as Pretendard/Noto Sans KR; task title 22px/30 medium-semibold, body16/24, small metadata13/18, section label14/20 semibold. 20px side margins, 56px compact toolbar, 8/12px related-item spacing, 24/32px section spacing; do not apply the same gap mechanically to every element. Accurate optical alignment and generous touch targets44 while icons are20-24. Strong hierarchy from spacing and typography before decoration. No big cards, no gradients, no shadows, no ornamental illustrations, no progress percent, no streak or motivational praise, no AI button. No all-caps labels. No thin rules dividing task rows. Do not add priority/tags/comments/assignees/new features to fill space.
Shared realistic illustrative content, exact Korean strings:
Goal: "토익 900점 받기" with small blue dot and subtle navigation chevron, near the task title, never tucked into bottom accordion.
Task: "토익 시험 접수" with an empty round checkbox for direct completion; checkbox and title optically aligned. No big "할 일 상세" heading.
Execution day "실행일" / "오늘 · 10월 24일".
Actual scheduled event "일정" / "10월 24일 (토) 14:00–14:30".
These are distinct fields; never imply moving execution day changes the event time. Current date anchor is 2026-10-24, Saturday.
Description: "시험 일정과 준비물을 확인한 뒤 접수하기."
Checklist: label "체크리스트"; two unchecked items "시험 일정 확인하기" and "응시료 결제하기"; modest "+ 항목 추가" action. These are hypothetical planned steps, no invented completed performance.
Visible toolbar edit label "수정", and recognizable ellipsis menu for record/delete. Record/delete remain available via ellipsis, not independent large body rows. No permanent delete action on the main body.
Focused screen for reading task context and completing it; do not turn it into an edit form. Dates appear as readable tappable fields. One clear main action is the round completion checkbox; no full-width start/complete button.
Use precise clean Korean glyphs, believable density and purposeful unfilled white space.
```

## 구조화된 상세

```text

Direction name: Structured details.
Design one full-page task detail. Toolbar: back arrow left, "수정" and ellipsis right. A small goal breadcrumb sits below the toolbar, then round checkbox + task title. Immediately underneath, build two compact property rows, icon + readable field label + value + chevron: execution day, then event schedule. Keep labels and values aligned with consistent columns, but no boxes around the rows. Under execution day only, retain three small quiet text shortcuts "내일", "7일 후", "기록함" as a single subtle accessory row; they must be visually subordinate to the current date, never above the event value. This is the conservative discoverability-focused layout.
Below the two related date rows, show description and checklist as a clean content section. Two checklist items are plain rows with round checks, no cards. Keep all meaningful content comfortably within top 600px and use quiet remaining whitespace, no scattered management actions near bottom. Do not add section headings like "일정 정보" that repeat the field label.
```

## 내용 중심 상세

```text

Direction name: Content-first detail.
Design a notably calmer, more editorial single full-page detail, with the same shared content as the other directions. No floating card or bottom sheet. Put a back arrow, the SMALL blue-dot goal breadcrumb "토익 900점 받기", "수정" and an ellipsis into a balanced compact toolbar. The goal is navigational context, not a large heading. Let the task title with a simple empty round checkbox lead the body near y100 logical px.
Directly below the title, a restrained compact two-line date block: first the actual event row labelled "일정" with the date/time readable in one line at body size (allow tasteful natural wrap if needed), then the smaller editable execution-day row "실행일  오늘 · 10월 24일" with a tiny downward chevron. Group these tightly as CURRENT information. No shortcut buttons, no duplicate "일정 정보" heading, no "오늘" badge, no separate date card, no repeated field headers in oversized type.
Then the short description as plain readable secondary body text, without a heading "설명". Below it one intentional 28px separation into the checklist: small "체크리스트" label, two neat pending round-checkbox rows, and understated "+ 항목 추가" in muted gray-blue. Completion check beside the task remains the main action, no large blue submit button.
Keep meaningful content within top 500-550 logical pixels and leave natural unfilled white space below. A strong professional hierarchy with finely balanced type weights, aligned icon/text centers and more compact grouping than a settings list. Preserve 44px hit areas even when drawn icons look smaller. No dividers or shadows. The visual goal is precise, quiet and desirable, with the task and its meaning taking center stage.
```

## 목록 위 상세 패널

```text

Direction name: Context-preserving detail panel.
Design a single focused mobile screen where the task detail opens as a tall bottom sheet over the existing Today list, rather than a separate page. Target exact portrait framing of 390x844 logical px. White sheet starts near y130 with a restrained 16px corner radius and tiny centered drag handle. Keep a small top glimpse of the original Today app visible under a soft neutral dimming scrim: the dooit header and "One step, your pace." line from reference image 2, followed by the top goal rail. The underlying page must stay faithful to the approved image: NO giant Today title/date, NO cards, NO changed bottom tabs. The sheet covers the bottom tab bar, and only the top glimpse of Today is visible. This is an in-app bottom sheet, not a phone mask or a centered app card.
At the top of the sheet put small "토익 900점 받기" goal breadcrumb with blue dot; on the right a clear close X and ellipsis, with "수정" as a quiet text action near them if space permits. Do not add a back arrow or the generic heading "할 일 상세". The task title with an empty round completion checkbox is the main content heading.
Below, compact grouped CURRENT execution day and scheduled event rows, exact separate labels and shared values. Each row is editable on tap. No shortcut buttons. After these rows, short description and two checklist items; understated "+ 항목 추가". Keep all shared task content readable within the sheet, no clipped text or content behind a home indicator. No fake performance, no progress percentage.
This layout should clearly feel quicker to open/close while preserving the user's place in the existing app. Clean alignment, strong hierarchy, calm density; no nested cards inside the sheet, no large CTAs, no visible record/delete rows. Include only one design in this output.
```
