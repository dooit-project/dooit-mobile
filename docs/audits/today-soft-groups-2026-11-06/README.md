# 오늘 화면의 옅은 목표 묶음과 간결한 추가 버튼

2026-11-06 · Android/iOS/Web 공통 React Native 코드 · mock Web 실제 화면 확인

## 범위와 근거

- **사용자 선택:** [선택한 1번](../../design/today-soft-groups-2026-11-06/selected-reference.png)의 목표별 구분을 유지하고, 박스를 옅고 가볍게 하면서 2번의 간결한 추가 버튼을 반영한다. [보정된 시각 목표](../../design/today-soft-groups-2026-11-06/refined-reference.png)는 사용자 요청을 조합해 생성한 이미지이며 실제 캡처가 아니다.
- **변경:** 오늘의 목표별 색상·목표 없는 그룹에 옅은 표면을 적용하고, 큰 전체 너비 추가 버튼을 오른쪽의 작은 공통 `Button`으로 바꿨다. 목표·할 일 긴 제목은 두 줄로 강제 절단하지 않는다. Web 추가 메뉴는 키보드로 열 때 초점이 메뉴로 들어가고 Escape로 닫으면 추가 버튼으로 돌아온다.
- **유지:** 체크·되돌리기, 일정/할 일/아이디어 추가, 목표색, 목표 없는 항목과 기존 네 탭의 라우트·이름. 시안의 일정 앞 달력 아이콘은 현재 바로 완료 체크할 수 있는 동작과 달라 이번 단위에서 바꾸지 않았다. 시안의 ‘목표/기록’ 탭 이름도 계획·회고의 역할을 전체적으로 정할 때 별도로 다룬다.
- **범위 밖:** 평소/작은 행동 선택, 신규 Goal의 일회성 작업 연결, 계획·기록 화면 및 PC 전용 레이아웃. 기존 진행 중인 돌아보기 변경을 수정하지 않았다.

## 실제 화면

- [변경 전 390px](./before-390.png) / [변경 후 390px](./after-390.png) / [320px](./after-320.png) / [430px](./after-430.png)
- [어두운 테마 390px](./dark-390.png) / [빈 상태 390px](./empty-390.png)
- [추가 메뉴](./after-menu.png) / [320px 긴 항목과 스크롤](./long-title-320.png)
- [보정 시안과 실제 비교](./comparison-390.png) / [목표 영역 확대 비교](./comparison-detail-390.png). 시안은 852×1846을 390×844로 축소했고 실제 캡처는 390×844, deviceScaleFactor 1이다. 양쪽은 같은 목표 예시를 사용하지만 실제 mock에만 추가 설명·완료 문구가 있으므로 완전히 동일 데이터는 아니다.

목표 구분, 버튼의 위치·형태와 체크/글자 중심을 확인했다. 실제 정보가 있는 설명과 완료 표시는 시안에서 빠졌더라도 보존한다. 목표 없는 긴 항목은 스크롤 끝까지 읽을 수 있었으나 빠른 기록 API가 제목과 원문 설명을 나누는 기존 동작까지 변경한 것은 아니다.

## 스킬과 참고 기준

- **Product Design `ideate`·`image-to-code` / `design-qa`:** 선택된 실제 이미지를 열고 보정 시안을 만든 뒤 오늘의 범위를 구현·비교했다. 시안과 실제 화면, 의도적으로 남긴 차이를 분리해 기록했다.
- **Expo Design System·Vercel React Native:** 기존 테마·간격·공통 `Button`/`ItemCopy` 및 `Pressable` 사용을 확인했다. iOS의 safe area 권고는 이 단위에서 플랫폼 전체에 일괄 적용하지 않았다.
- **better-ui·better-layout·better-typography·better-writing:** 목표 구분·버튼 중심·긴 문구·기존 문구 유지를 검토했다. `better-interface`와 나머지 색상·접근성 지침도 읽었으나 보조 기술을 포함한 정식 전 범위 종합 감사는 수행하지 않았고 전체 통과로 판정하지 않는다.
- **UI UX Pro Max:** 모바일 조작 영역·간격 기준을 검색했다. Web에서 수집된 44px 기하 검사와 Android 권장 크기/실기기 확인은 구분한다.
- **Web Interface Guidelines:** 최신 [원문](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)의 포커스·조작 이름·긴 텍스트 지침을 해당 컴포넌트에 참고했다. 키보드 진입·Escape·초점 복귀는 실제 Web에서 확인했으며 전체 규칙 감사 통과는 아니다.
- **공식 자료:** [Android 접근성 가이드](https://developer.android.com/guide/topics/ui/accessibility/apps#interactive-elements)의 조작 영역과 대비를 참고했다. 다른 앱을 직접 조작해 비교하지 않았다.

## 검증과 한계

- 사용자에게 사전에 허용받은 Playwright·headless Chrome mock 환경을 사용했다. 내장 브라우저/Chrome 확장의 접근 호스트는 연결되지 않았다.
- 320/390/430px의 새로운 DOM 보고서는 `npm run check:ui-layout`에서 각각 7행·8조작 영역 통과했다. 320px 긴 항목 상태는 8행·9조작 영역, 390px 어두운 테마는 7행·8조작 영역 통과했다. 이 값은 화면에 표시된 표식의 기하 검사이며 글리프의 광학 중심이나 전체 접근성을 증명하지 않는다.
- 추가 메뉴 열기/닫기, 키보드 Enter·Tab·Escape와 초점 복귀, 완료/완료 취소를 확인했고 확인한 페이지 오류는 없었다. 해당 목표색 6개와 밝은/어두운 토큰의 조합은 계산상 보조 텍스트 대비 4.5:1 이상이나 실제 native 렌더링·전체 색상 대비를 측정한 것은 아니다.
- Android/iOS 실기기, 글자 확대 1.5, 화면 읽기 도구, 운영 API와 모든 오류 상태는 미확인이다. 원본 대비 추가 문구·일정 체크·탭 이름의 차이를 위에 기록했다.
