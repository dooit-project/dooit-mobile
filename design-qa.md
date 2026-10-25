# 최신 UX 재검토 — 상세 패널의 예상 동작과 실제 연결

2026-10-25 · Product Design audit · [새 캡처/외부 공식 비교/우선순위](./docs/audits/task-detail-external-review-2026-10-25/README.md)

실제390/320의 아이콘·행/조작 영역 검사와 키보드 복귀는 통과했다. 하지만 목표 경로 목적지, 더보기의 제목164px 이동, 무변경 버리기 확인, 일정 편집 범위, 작동하지 않는 손잡이의 P2 후속이 남았다. 이번은 감사/문서만이며 코드 수정은 하지 않았다. 아래 시안 일치/명시 기능 passed는 당시 한정된 범위의 결과다.

final result: blocked

이는 추가 UX 보완의 판정이다. 앱 접근/캡처가 막힌 상태는 아니다. 자세한 근거는 새 감사의 단계1–7을 따른다.

---

# 이전 Design QA — 선택05 개인 Task 상세 패널

2026-10-24 · 미커밋 working tree · 실제 Chrome 확장 Web/mock/goal-lanes

- Source truth: [05](./docs/design/task-detail-options-2026-10-24/05-context-panel-aligned.png), 853×1844. 동일 내용의 [최종 실제390](./docs/audits/task-detail-panel-2026-10-24/11-final-390.jpg)은390×844다. source를390×844 CSS로 정규화한 [전체/부분 비교 보드](./docs/audits/task-detail-panel-2026-10-24/14-source-comparison.jpg)를 직접 열고 비교했다. 보드 아래는 양쪽 y145부터280px 영역이다.
- Viewport/state: 390×844, light, 토익 목표/일정/실행일/설명/미완료 하위 항목2개. 실제320/430·긴 제목·직접 URL도 확인했다. 최종 캡처의 viewport를 실측과 대조했다.
- Findings/fixes: P2 시작 간격/정보 행 높이/추가 색/체크 축을 초기01→02→03→최종11에서 수정·재비교했다. 기능 검사에서 초점 복귀, Chrome Back 작성 보호, 입력란 Escape 전파를 수정하고 재검사했다. [이력·실제 증거](./docs/audits/task-detail-panel-2026-10-24/README.md).
- Fonts/layout/colors/assets/copy: 공통22/30·16/24·13/18과 역할별 아이콘,84% 패널/카드 없는 배치/블록 중앙, 기존 토큰/파란 수정·추가/원형 체크를 확인했다. 신규 raster는 없고 실제 공통 glyph/wordmark다. 본문은 동일 데이터이며 배경 문구만 기존 영어 순환 기능의 다른 문장이다.
- Intentional/P3: 승인된 작은 실제 헤더 유지, 체크리스트 더보기로 기존 편집/순서/삭제 보존, glyph/폰트 획·수px 간격·추가44px 조작 영역의 차이. 현재 확인 범위에 남은 P0/P1/P2는 없다.
- Interactions: 오늘/계획/달력 열기/닫기/선택/정확한 초점 복귀, Tab/Shift+Tab, 완료/취소, 하위 항목 추가/체크/취소, 수정 저장/취소/입력 보호, 날짜 이동/일정 유지, 기록/목표 목록/삭제 취소, 직접/잘못된 URL. 최종 console error0. 영구 삭제는 하지 않았다.
- Verification: 실제 좌표6개 통과, `npm run validate` 118 suites/606 tests 통과(STG1 제외). native/글자 확대/운영 API/오류 복구·실제 알림은 미확인. Navigation API 미지원/취소 불가 Web traversal에는 추가 Back 보호가 적용되지 않는다.

final result: passed

판정 범위는 위 개인 Task 패널의 실제 Web 확인 조건이다.

---

# 이전 국소 Design QA — 개인 상세 정보·행동 정렬

**2026-10-24 후속 정렬 보정:** 패널 시안의 일정/실행일 아이콘을 전체 정보 블록 중앙으로 맞춘 [05 시안](./docs/design/task-detail-options-2026-10-24/05-context-panel-aligned.png)이 최신이다. 실제 패널은 아직 구현 전이다. 재발 방지를 위해 [필수 기본 시각 검사](./docs/qa/UI_VISUAL_ACCEPTANCE.md)와 공통 개발 Web 측정 표식/`check:ui-layout`을 추가했다. [새 실제 감사](./docs/audits/ui-alignment-regression-2026-10-24/README.md)에서 Chrome 확장 연결을 복구해 오늘320/390/430·계획390의 정렬/영역을 측정하고 캡처를 직접 확인했다. native/확대/새 패널은 미확인이다.

**2026-10-24 추가 재평가:** 아래 passed는 정렬·명시 동작 범위다. [상세 디자인 재검토](./docs/audits/task-detail-design-review-2026-10-24/README.md)에서 정보 순서·관리 행동 비중·완료 진입을 재설계 대상으로 남겼다. 최종 디자인 확정은 보류하며 구조 3안을 비교한 뒤 선택한다.

후속으로 세 시안을 비교하고 사용자 첨부/추천 위임을 반영해 [패널 권장안과04 보정](./docs/design/task-detail-options-2026-10-24/RECOMMENDED_DIRECTION.md)을 정리했다. 새 패널은 아직 구현/실제 감사 전이며 아래 정렬 검사와 구분한다.

2026-10-24 · `5e6463f` 이후 working tree · 미커밋. [범위/실제 전후/전체 흐름/한계](./docs/audits/task-detail-alignment-2026-10-24/README.md).

- 원본의 흰 배경·단순 정보 위계와 승인된 상세 구성을 유지했다. 개인 상세의 grouped 내부 padding을 제거하고 x20 본문 축, 왼쪽 정보 값·공통 추가 행·왼쪽 관리 버튼을 적용했다. 공통 Button 기본 정렬과 다른 outlined 사용처는 유지한다.
- 같은 390px 일정 상세 전후를 직접 열어 비교했다. Web 320/430 긴 제목/체크리스트, 추가·완료·취소, 기록 Enter 접기, 기존 목표 펼침/접기, 삭제/편집 취소, 날짜 내일/오늘 복귀를 확인했다. 체크리스트의 실제 Web checked/expanded 누락도 보완했다.
- 최종 기록 버튼 x20/폭350/높이44와 expanded=false 확인. 임시 제목/체크리스트는 mock reload로 제거하고 기본 데이터·viewport에 복귀했다. 수집한 최종 tab 로그 8개 중 error0이며 기존 deprecation 경고는 남는다.
- 기존 Chrome 탭의 debugger 연결이 끊겨 inventory/troubleshooting 후 같은 Chrome 확장에 새 로컬 탭을 열어 복구했다. IAB/Playwright 전환은 없다.
- `npm run validate`: 116 suites / 597 tests 통과, STG 1개 제외. 영향은 Android/iOS/Web이며 native·확대1.5·dark·보조 기술·실제 서버/실패·반복/DONE/INBOX/Workspace 실사용은 미확인이다.
- 일반 TaskCard/ScheduleCard의 제목 두 줄 제한은 다음 단위다. 새 Goal 연결·UX-14 캐시/반복 폼 개선도 완료로 처리하지 않는다.

final result: passed (개인 상세 정렬, 실제 Web 확인 범위)

---

# 이전 국소 Design QA — 계획 선택 목표 탭

2026-10-23 · `3cd3254` 이후 working tree · 미커밋. [범위/원본/실제 전후/한계](./docs/audits/goal-tab-visibility-2026-10-23/README.md).

- 가로 목표 탭·전체 목표·색상/밑줄/높이·저장 계약을 유지하며 GoalTabs로 측정/노출을 묶었다. 생성 직후/늦은 layout/내용/화면 폭 변경 후 선택 탭을 드러내고 긴 이름은 한 줄 말줄임한다.
- 같은 320px 긴 목표 전후를 직접 비교했다. 새 목표 생성/전체 목록 선택·390/430 변경·기존 목표 마지막 선택 복원을 실제 확인했다. 선택 1개·Tab 진입점 1개·본문 연결을 DOM/AX로 확인했다.
- Web 화살표/Home/End는 초점만 이동, Enter/Space 선택, Tab으로 전체 목표 이동 확인. Space 기본 동작 누락은 보완 후 재검증했다. 편집 중 탭 disabled/tabindex-1 유지.
- 임시 목표는 로컬 mock 메모리만 사용하고 reload로 기본 데이터에 복귀했다. 원래 토익 목표와 기본 viewport로 돌렸다. 최종 tab error 로그 0.
- Android/iOS/Web 영향. native/fontScale1.5/dark/스크린리더/실제 API/오류/계정 전환과 실제 순서 편집 후 재노출은 미확인이다.
- `npm run validate`: 116 suites / 597 tests 통과, STG 1개 제외. 동작 경계 테스트 5개 추가.

final result: passed (계획 목표 탭 노출/상태, 실제 Web 범위)

---

# 이전 국소 Design QA — 공통 버튼 위계와 상태

2026-10-23 · `1192c38` 이후 working tree · 미커밋. [원본/범위/실제 전후/한계](./docs/audits/button-hierarchy-2026-10-23/README.md).

- Button의 일반 16/24·compact 14/20 역할을 정리하고 목표/반복 계획 취소는 ghost로 낮췄다. 오늘 추가·목표 레일·원형 체크·계획 아이콘 중앙·버튼 목적지/위치는 유지한다.
- 테두리 2 공간 고정과 로딩 중 내용 공간/문자열 접근성 이름 유지. loading의 busy/disabled·선택·이름 복구 회귀 테스트를 추가했다. 실제 로딩 폭을 브라우저에서 실측한 것은 아니다.
- 같은 390 목표 작성 전후를 직접 열었다. 저장 전후 316×44, 날짜 작은 버튼 초점 전후 66.6875×44다. Web 320/430·키보드·빈 입력 안내·취소·개인 상세/편집 복귀 확인. 최종 tab error 로그 0.
- 공통 Android/iOS/Web 영향. 실제 확인은 Web light의 명시 화면이며 native/fontScale1.5/dark/스크린리더/반복 계획 폼/실제 로딩과 실패는 미확인이다.
- `npm run validate` 115 suites / 592 tests 통과, STG 1개 제외.

final result: passed (이번 공통 Button, 실제 Web 확인 범위)

---

# 이전 국소 Design QA — 목표 제목과 항목 글자/행

사용자 추가 지적 후 계획의 아이콘 정렬은 [두 줄 전체 중앙](./docs/audits/item-optical-alignment-2026-10-23/README.md)으로 재보정했다. 아래 초기 ‘유형 그림 첫 줄’ 결정은 대체한다. 390 텍스트와 icon slot 중앙 모두 y=225, 같은 상태 전후·다른 목표 320/430·상세/복귀 확인. 오늘 체크와 글자 역할은 유지한다. native/확대는 미확인이다.

2026-10-23 · `f1f07be` 이후 working tree · 미커밋. [원본·범위·실제 전후·남은 차이](./docs/audits/goal-item-typography-2026-10-23/README.md).

- 오늘/계획의 목표 제목 18/26, 본문 16/24·보조 13/18을 공통 AppText/ItemCopy로 공유한다. 유형 그림은 ItemLeading으로 첫 줄에 맞추고, 오늘 체크는 44 이상 터치 영역과 첫 줄 중앙을 함께 유지한다.
- 흰 바탕·레일·체크·4탭·작은 헤더·추가 버튼 유지. 같은 390px 실제 전후를 직접 열어 비교했다. 계획 행 최소 72→64, 제목/목표일/보조 크기를 역할에 맞게 정리했다.
- Web 320px 긴 제목/설명과 기본 계획, 430px 기본 오늘 확인. 완료/취소·상세 이동·기존 수정 UI 저장/원문 복원 확인. 오늘 첫 체크 중앙과 제목 첫 줄 중앙은 모두 y=138이었다.
- 긴 문구 검증은 로컬 mock 일회성 항목을 임시 수정한 뒤 원문과 fixture 상태로 복구했다. 계획 목록에 편집 전 제목이 남는 별도 캐시 경계는 UX-14로 기록했고 해결됐다고 표현하지 않는다.
- Android/iOS/Web 영향. 실제 확인은 Web light이며 native·fontScale 1.5·dark·스크린리더·운영 API·실패 상태는 미확인이다. 새 Goal 반복 목록의 실데이터 편집 상태와 다른 화면/버튼 위계는 후속이다.
- `npm run validate` 114 suites / 591 tests 통과, STG 1개 제외. 최종 tab error 로그 0. source/시각 수치를 복제하는 새 테스트는 추가하지 않았다.

final result: passed (이번 오늘/계획 글자·행 정렬, 실제 Web 범위)

---

# 이전 국소 Design QA — Drawer 아이콘/글자 균형

2026-10-23 · `0702a28` 이후 working tree · 미커밋. [범위·측정·실제 전후](./docs/audits/drawer-icon-alignment-2026-10-23/README.md).

- 공통 `AppIcon`에 메뉴 20px/명시적 줄 높이 역할을 추가하고 Drawer 목록에만 적용했다. 다른 화면·헤더·닫기·탭의 아이콘 크기와 메뉴 글자/행 간격은 유지한다.
- 한 줄 메뉴의 박스와 실제 획 범위 중앙은 기존에도 일치했다. 전역 상하 이동 대신 아이콘/16px 글자의 크기 균형을 보정했고, 두 줄 카테고리는 제목 줄에 폴더와 화살표를 맞췄다.
- 같은 390×844·light·mock·메뉴 상태로 실제 전후를 캡처했다. 320×844에서 label 유지·가로 overflow 없음, 카테고리 펼침/접힘, Web aria-expanded false/true, Escape 후 열기 버튼 초점 복귀, 닫기 44×44 확인. 최종 tab error 로그 0.
- 최초 탭은 종료된 서버의 과거 화면이어서 실제 변경 후 근거로 쓰지 않았다. Expo 서버 복구 후 기준 커밋/변경 코드를 순서대로 같은 데이터로 렌더링해 새 전후를 저장했다. 320 첫 capture는 resize 직후 320×693으로 찍혀 폐기하고 320×844로 재촬영했다.
- 영향 플랫폼 Android/iOS/Web. 실제 확인은 Web 기본 글자 크기이며 native·fontScale 1.5·dark·VoiceOver/TalkBack은 미확인이다. 카테고리 제목 줄 높이는 fontScale을 사용하지만 실제 확대 검증을 대신하지 않는다.
- `npm run validate`: 114 suites / 591 tests 통과, STG 1개 제외. 스타일 수치를 복제하는 새 테스트는 추가하지 않았다.

final result: passed (이번 메뉴 균형 보정, 실제 Web 범위)

---

# 이전 국소 Design QA — 공통 아이콘

2026-10-22 · `20b9211` 이후 working tree · 미커밋. [범위·실제 전후·조작·남은 차이](./docs/audits/common-icons-2026-10-22/README.md).

- 원본 [목표 레일 시안](./docs/design/goal-lanes-correction-2026-10-21/reference.png)을 확인하고 기존 구성 안의 아이콘만 보정. `AppIcon`의 list 24/action 22/meta 14/navigation 28로 연결했다.
- 같은 390px·mock·문구·체크 상태의 계획/Drawer/상세/추가 메뉴/달력/돌아보기 전후, 320px 오늘/계획을 실제 Chrome 확장으로 확인했다. 선택된 해·목표색·원형 체크·탭 순서·본문 간격 유지.
- 닫기 두 버튼 44×44, 메뉴 Escape 초점 복귀, 주/연도 이동 복귀, 개인 상세 편집/취소/복귀, 빠른 작성 닫기 확인. 버튼·탭 접근성 이름/상태 유지, 장식 glyph 숨김.
- native에서는 탭/조작 그림이 공통 폰트 glyph로 바뀐다. 실제 Android/iOS·font scale 1.5·dark·VoiceOver/TalkBack·전체 실패 상태는 미확인이다. legacy 아이콘/체크리스트·제목/행/버튼·달력 구조 등은 후속 범위다.
- `npm run validate` 114 suites / 591 tests 통과, STG 1개 제외. 초기 빠른 작성 테스트의 UI mock 누락을 보완하고 전체 재실행했다. `git diff --check` 통과, 최종 tab error 로그 0.

final result: passed (이번 공통 아이콘 범위, 실제 Web)

---

# 이전 국소 Design QA — 공통 보조 색상

2026-10-22 · `a3943d2` 이후 working tree · 미커밋. [변경 범위·실제 전후·대비](./docs/audits/neutral-text-2026-10-22/README.md).

- 원본 [흰 바탕·목표색 레일](./docs/design/goal-lanes-correction-2026-10-21/reference.png)과 승인된 VC-02 색 역할을 확인했다. light 보조 텍스트/아이콘만 공통 중립색으로 보정했다.
- 같은 390×844·mock·문구·체크 상태의 오늘/계획/달력/돌아보기 전후, 320px 오늘을 실제 Chrome 확장에서 확인했다. 기존 주 텍스트·목표색·브랜드·선택 파랑·크기·구조 유지.
- surface 대비 textSecondary 7.56:1, textMuted 5.01:1. 선택 label의 기존 파랑과 비활성 label의 새 중립색을 computed color로 확인했다.
- 공통 아이콘·글자/행/버튼 규격과 전체 UX 미완료는 유지한다. native/dark/글자 확대/모든 보조 화면 상태는 이번 범위 밖이다.
- `npm run validate` 114 suites / 591 tests 통과, STG 1개 제외. 기존 light/dark 대비 검사와 문서/정적 검사 포함. 최종 tab error 로그 0.

final result: passed (공통 보조 색상, 실제 Web 범위)

---

# 이전 국소 Design QA — 공통 헤더·Today 간격

2026-10-22 · `479ae87` 이후 working tree · 미커밋. [실제 캡처와 변경 범위](./docs/audits/header-alignment-2026-10-22/README.md).

- 원본: [사용자 첨부 시안](./docs/design/goal-lanes-correction-2026-10-21/reference.png), [같은 문구/내용의 이전 실제](./docs/audits/goal-lanes-correction-2026-10-21/12-today-final-390.png), [최종 실제 390](./docs/audits/header-alignment-2026-10-22/05-today-final-390.jpg).
- 헤더/Drawer wordmark 공통화, 헤더 56 + inset·720 최대 폭·메뉴 24/터치 44, Today 위 간격 16. 기존 목표 레일/원형 체크/네 탭 유지.
- 320/390/430/1024px 실제 Chrome 확장 캡처, 문구 수동 순환·숨김/기본 복원·메뉴 Escape 초점 복귀 확인. 긴 명언 잘림은 헤더용 문구 선별로 수정하고 설정 원문/출처 유지.
- 같은 상태 비교에서 원본의 큰 상단 공백은 기존 사용자 결정에 따라 복제하지 않은 차이다. 글꼴 완전 일치는 아니다.
- 남은 공통 UI·전체 디자인 과제는 아래 전체 감사와 로드맵에서 추적한다. native/dark/글자 확대/실제 API 미확인. 이번 국소 판정을 전체 앱의 완성도 승인으로 사용하지 않는다.
- 최종 소스의 [390px 실제 화면](./docs/audits/header-alignment-2026-10-22/15-final-today.jpg), `npm run validate` 114 suites / 591 tests 통과, STG 1개 제외. 같은 tab error 로그 0.

final result: passed (헤더·Today 간격·헤더용 문구, Web 범위)

---

# 전체 디자인 판정 — 후속 개선 필요

2026-10-22 · `479ae87` 이후 동일 working tree. [실제 Web 재감사](./docs/audits/visual-cohesion-2026-10-22/README.md)에서 새 캡처 23장으로 주요 흐름을 재검토했다. 헤더의 글자/아이콘 비율과 최대 폭, 선택 목표 노출, 반복 오류 복귀, 상세 정보 축·달력 공간 배분을 개선해야 한다. 아래 10월 21일 `passed`는 선택 시안의 국소 정합성 결과이며 전체 앱의 전문적인 완성도 승인으로 사용하지 않는다.

- 사용자 승인 fallback: IAB/Chrome 확장 복구 실패 후 로컬 Playwright 1.55.0 / 임시 Chrome 155.0.8059.85.
- 실제 환경: localhost:8082 mock/개발 fixture, 390×844, 오늘 320×844·1024×844. 기존 사용자 profile과 운영 API는 사용하지 않음.
- 이번 작업: 감사·문서만 추가. 앱 소스 변경·커밋·푸시 없음. 발견 사항 VC-01–08은 [개선 기준](./docs/design/VISUAL_COHESION_REVIEW_2026-10-22.md)과 [로드맵](./docs/product/ROADMAP.md)에서 추적한다.
- 한계: native/dark/font scale/보조 기술/실제 API 전체 검증 미완료. 일부 보조 화면 내부는 이번 run 범위 밖이다.

---

# 10월 21일 Design QA — 첨부 원본의 흰 배경·목표 색상 레일

2026-10-21 · `479ae87` 이후 working tree · 아래 판정은 **기존 Task Today의 시각 보정과 공통 탐색** 범위다. 새 Goal 회차/Task 연결/주간 여정 전체 구현 판정과 구분한다. 이전 카드형 시안 연결은 참조 오류로 정정했고 아래 과거 판정은 당시 기록으로 보존한다.

- Source visual truth: [사용자가 첨부한 원본](./docs/design/goal-lanes-correction-2026-10-21/reference.png), 853×1844. 번호 대신 파일 자체를 고정했다.
- Implementation: [최종 실제 오늘](./docs/audits/goal-lanes-correction-2026-10-21/12-today-final-390.png), 390×844 light/mock Web, density 1.
- State: 두 목표·다섯 항목·완료 상태·영문 문구가 동일. 기존 D-Day/Task의 opt-in 개발 fixture이며 운영/새 Goal API 완료의 증거가 아니다.
- Full-view comparison: [최종 비교 보드](./docs/audits/goal-lanes-correction-2026-10-21/16-reference-comparison-final.png), 850×940. 원본을 비율 유지 논리 폭 390/높이 약 843으로 정규화하고 실제는 390×844로 비교했다.
- Focused evidence: [320px 수정 후](./docs/audits/goal-lanes-correction-2026-10-21/11-today-320-fixed.png), [430px](./docs/audits/goal-lanes-correction-2026-10-21/10-today-430.png), [탭 키보드 초점](./docs/audits/goal-lanes-correction-2026-10-21/13-keyboard-tab-focus.png). 원본 크기로 읽혀 별도 crop은 필요하지 않았다.
- Fonts: 목표 18/26, 항목 16/24, 메타 13/18, 탭 14/20. 원본 폰트 파일은 미확인, 기존 플랫폼 sans-serif 사용. 글자 획의 완전 일치는 아니다.
- Layout/colors: 카드/회색 바탕 제거, 흰 배경·4px 목표색 레일·원형 마커·넓은 추가 버튼·탭 밑줄. 기존 목표색을 보존해 sage가 원본보다 차분하며 체크 테두리는 대비를 높였다. 헤더는 기존 52 + native safe area를 유지하고 생성 이미지의 큰 상단 공백은 복제하지 않았다.
- Assets/copy: 기존 Feather/MCI/Ionicons/iOS SF Symbols 사용, 새 이미지/폰트 의존성 없음. 목표/항목/메타/‘할 일 추가’/네 탭 문구를 일치시켰다.
- Comparison history: 첫 비교의 큰 18px 본문을 16으로 줄이고 여분 행 간격 제거. 320px ‘돌아보기’ 잘림을 탭 여백 축소로 수정하고 재캡처했다.
- Primary interactions: 완료 유지/취소/재완료, 추가 메뉴→빠른 입력→닫기, 목표 메뉴 펼침/닫기, 계획→상세 왕복, Tab 초점 확인. 해당 최종 responsive tab의 console errors 0.
- Browser: 내장 surface 미제공으로 기존 Chrome 확장을 이어 사용. evaluate는 DOM 실측만 했으며 상태/데이터를 주입하지 않았다.
- Validation: `npm run validate` 113 suites / 589 tests passed, STG 1개 제외.
- Actionable P0/P1/P2 in this visual correction: none. 미완료 제품 흐름은 아래 별도 경계를 따른다.
- Remaining/limits: native safe area·font scale 1.5·dark·보조 기술·운영 API/실패·긴 목록 미검증. 폰트/아이콘 획 차이는 P3 시각 후속이다. 새 Goal 회차/연결/여정·오늘 작성 목적지·목표 메뉴의 특정 목표 자동 선택은 기존 로드맵의 미완료 기능이며 이번 판정에 포함하지 않는다.
- Detailed evidence: [구현 결정](./docs/design/goal-lanes-correction-2026-10-21/README.md), [실제 감사](./docs/audits/goal-lanes-correction-2026-10-21/README.md).

final result: passed

---

# 과거 Design QA — 잘못 연결한 카드형 시안

아래 원본 연결과 판정은 위 첨부 원본 기준으로 대체됐다. 현재 구현 기준으로 사용하지 않는다.

# 최신 Design QA — 목표 묶음 3번

`479ae87`로 첫 보정을 커밋한 뒤 [계획·상세의 디자인 확장과 실제 흐름](./docs/audits/plan-detail-surfaces-2026-10-21/README.md)을 추가 확인했다. 계획 320/390/430, 상세 320/390에서 빈 정보 축소·체크리스트 저장/취소·기록 펼침·날짜 변경과 상태 표시를 검토했고 `npm run validate` 584개 테스트가 통과했다. 이 국소 확장은 미커밋이다. 아래의 새 Goal 회차/완료 연결에 대한 전체 선택 시안 판정은 여전히 별도 미완료다.

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
