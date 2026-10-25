# 상세 패널 보정 생성 프롬프트

2026-10-24 · built-in image_gen · 첨부 원본: `03-context-panel.png` · 출력: `04-context-panel-refined.png`

```text
Edit the attached dooit Korean mobile task detail mockup into a refined recommended version. Use case ui-mockup. Keep the same bottom-sheet interaction model and same underlying dimmed Today app context. This is a proposed design, not a real app screenshot. Use the reference as the exact chosen direction; do not invent a new app style.
Target logical 390 x 844 portrait, same aspect ratio as reference. One screen, no comparison board, no option label. App content only, no device frame/notch/OS status bar/home indicator/browser chrome or decorative illustration.
Keep white surface, blue #0875FF action/goal marker, ink #0F172A, secondary #667080, quiet Korean sans typography. Main title 22/30 semibold, body16/24, metadata13/18. 20px content edges. No task row borders, gradients, nested cards, badges, progress percentages or made-up accomplishments.
Preserve the top glimpse of dimmed dooit header "One step, your pace." and the goal "토익 900점 받기"; do not redesign the underlying Today screen. Keep the sheet beginning at about y135 logical px, with a subtle drag handle and modest top corners, extending to the bottom edge.
REFINEMENTS:
- Compact panel toolbar: small blue-dot goal breadcrumb "토익 900점 받기" left; modest "수정", ellipsis, and close X right. No generic '할 일 상세' heading. Goal should not compete with task title.
- Main title "토익 시험 접수" is left aligned. Its empty round checkbox must be SMALL: 24 logical px, visually the SAME size as the simple check circles used in Today, NOT the oversized 30+ px ring in the reference. Give 44px invisible touch area; center circle on the title's first line. Use an 8-12px gap from check to title. Do not make the checkbox a decorative emblem. Reduce all checklist circles to the same quiet 24px size.
- Put current actual event FIRST directly below title as one compact tappable row: a 20px clock/calendar icon, label "일정" and value "10월 24일 (토) 14:00–14:30", with a small trailing chevron. Use natural wrapping for the value if necessary, keeping the title/label hierarchy clear.
- Put execution day SECOND directly beneath it as a subordinate tappable row: calendar icon, small label "실행일", value "오늘 · 10월 24일", and small down chevron. These are separate concepts and must never look like duplicated dates. Current date anchor 2026-10-24 Saturday. No shortcut buttons on this main screen.
- Description below date block: "시험 일정과 준비물을 확인한 뒤 접수하기." Body16 secondary. OMIT redundant heading "설명".
- A single clean checklist area below description with small label "체크리스트", two unchecked rows "시험 일정 확인하기" and "응시료 결제하기", followed by a subdued "+ 항목 추가". No checklist card, divider lines or progress score. All are hypothetical pending planned steps, not completion evidence.
- Improve rhythm by grouping associated information closely: small toolbar-to-title gap, 16px title-to-date block, 8-12px between the date rows, 24px to description, 24px to checklist. The reference has excessive repeated tall gaps; reduce them without crowding. Keep readable type and touch areas, no font shrinking.
- Keep record info, goal management and delete accessible through the ellipsis rather than large rows in the sheet. Do not add footer CTA, timers, AI or new features.
The result should feel refined, professional and immediately useful: clearly show which goal this belongs to, the task itself, its actual appointment time, execution day and practical next steps. Keep the chosen bottom-sheet structure; change only the stated scale, ordering, grouping and emphasis.
```
