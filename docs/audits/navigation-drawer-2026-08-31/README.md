# 좌측 탐색 메뉴 구현 감사

Last updated: 2026-08-31

## 범위

- 시각 목표: 사용자가 선택한 조합 — 1안의 `dooit / 나의 플래너` 헤더와 2안의 단일 목록형 메뉴
- 구현: Web mock export, 390×844, light theme
- 실제 캡처: [`implementation-open-final.png`](./implementation-open-final.png)

## 확인 결과

1. **메뉴 진입 — 양호**
   - 최상위 tab에서 좌측 상단의 `나의 플래너 메뉴 열기` 버튼이 한 번만 노출된다.
   - 초기 구현에서 tab별 header가 접근성 트리에 중복되던 문제는 navigator 밖의 공통 header 하나로 옮겨 해결했다.
2. **열림 상태 — 양호**
   - 브랜드와 현재 위치가 먼저 보이고, dimmed background와 닫기 버튼으로 modal 경계가 분명하다.
   - 메뉴 행은 최소 60px이며 label, icon과 선택 배경을 함께 사용한다.
3. **목적지 이동 — 양호**
   - `달력` 선택 후 `/calendar` 이동과 menu 닫힘을 확인했다.
   - backdrop 선택 후 dialog가 닫히는 것을 확인했다.
4. **시각 비교 — 양호**
   - 상단은 선택한 1안의 브랜드 위계를 유지했다.
   - 본문은 2안처럼 section 제목과 보조 설명을 줄이고 한 줄 목적지 목록으로 정리했다.
   - 390px에서 마지막 `설정`까지 첫 viewport에 보이며 세로 scroll도 허용한다.

## 남은 문제

- **해결 — smart 진입 분리:** `기록함`과 `오래 미룬 일`은 focus query로 각 범위만 보여 준다. 결과는 [`navigation-smart-entry-2026-09-01`](../navigation-smart-entry-2026-09-01/README.md)에서 확인했다.
- **P2 — 실제 기기 접근성 미검증:** 320px, font scale 1.5, dark, VoiceOver·TalkBack, Android back과 Web Escape는 후속 검증 대상이다.
- **P3 — 전환 기간 중 목적지 중복:** 하단 `더보기`와 drawer 목적지가 함께 존재한다. 발견성 검증 후 하단 구조 단순화를 판단한다.

## 검증

- 메뉴 opener 수: 1
- `/calendar` 이동 후 dialog 수: 0
- backdrop 닫기 후 dialog 수: 0
- browser console error: 0
- `npm run validate`: 통과, 81 suites · 426 tests
