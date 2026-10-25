# 상세 패널 정렬 보정 프롬프트

2026-10-24 · 04 원본을 첨부한 built-in ImageGen 편집 · 생성 이미지, 실제 앱 아님

```text
Edit the attached dooit detail-panel mockup to correct vertical alignment and spacing ONLY. Keep the chosen bottom sheet, the same underlying dimmed Today screen, all Korean text, event values, small circles, white surface, hierarchy, colors and tool positions. This is a refined design mockup, not an actual app screenshot. One portrait frame, logical390x844, same853x1844 reference ratio, no phone frame/OS bars or annotations.
CRITICAL defect: the left clock and calendar currently align near the small field LABEL, so they float above the middle of the complete label-and-value block. Fix BOTH rows independently.
For the schedule row, treat "일정" plus "10월 24일 (토) 14:00–14:30" as ONE text block. Center the left clock vertically on the WHOLE two-line text block, not on the label and not on the date value alone. Center the right chevron at exactly that same vertical coordinate. The clock must visibly move DOWN from the reference.
For the execution-day row, treat "실행일" plus "오늘 · 10월 24일 (토)" as ONE text block. Center the left calendar vertically on the WHOLE two-line block. Center the right down chevron at that same height. The calendar must visibly move DOWN from the reference.
Mathematical layout model for each field: label18px height +4px gap +value24px height =46px complete text height. A24px icon has its TOP11px below the text block TOP and its CENTER23px below the text block TOP. A16px chevron has TOP15px below text block TOP. Do NOT put the icon top at the label top. Apply this at the output scale.
Single-line controls follow a DIFFERENT rule: task-title round checkbox centered on the title first line; checklist circles centered on each checklist text line; toolbar blue dot/edit/ellipsis/close centered on their one-line toolbar content; "+ 항목 추가" plus and text centered together. Keep circle visual24px, invisible hit targets44px. Do not apply one global downward shift to all icons.
Review whole screen rhythm: field rows56-64px minimum depending on text, related rows12px gap;24px between date block, description, checklist. Keep text readable, preserve natural whitespace below, do not expand every row with arbitrary empty padding. Long text should have room to wrap. Icon and text starts must align on the same content grid. No added lines/cards/shadows/large buttons, no extra features. Text exact, current date2026-10-24 Saturday.
Keep source title "토익 시험 접수", goal "토익 900점 받기", description "시험 일정과 준비물을 확인한 뒤 접수하기.", checklist "시험 일정 확인하기", "응시료 결제하기", "+ 항목 추가", toolbar "수정". No captions or option labels outside the UI.
```

결과는 `05-context-panel-aligned.png`로 보존한다. 원본 생성 경로는 `.codex/generated_images/01a13055-f292-79e1-af47-0524f7d66d35/exec-b54ccac0-82c9-4679-8b23-cf95325ff2bd.png`다. 05는 새 선택안 번호가 아니라 기존 패널의 보정 버전이다.
