# 브랜드 자산 점검

Last updated: 2026-08-23

## 점검 범위

2026-08-23에 현재 `icon.png`, Android adaptive foreground·background·monochrome, `splash-icon.png`, `favicon.png` 원본을 직접 확인했다. PNG 크기와 설정 연결은 `npm run check:release-assets`로 별도 검사한다.

## 현재 판정

| 자산               | 판정        | 확인 내용                                                                     |
| ------------------ | ----------- | ----------------------------------------------------------------------------- |
| 앱 icon            | 교체 필요   | 파란 설계 격자와 추상 `A` 형태로, ToDoLab의 일정·완료 의미가 드러나지 않는다. |
| Android foreground | 임시 사용   | 중심 여백은 충분하지만 앱 icon과 같은 추상 `A`라 최종 브랜드 표식은 아니다.   |
| Android background | 임시 사용   | 밝은 파란 배경과 가이드 형태가 앱의 warm paper 디자인 언어와 다르다.          |
| Android monochrome | 임시 사용   | 단색 형태는 명확하지만 원본 심볼을 교체하면 함께 다시 만들어야 한다.          |
| splash             | 조건부 통과 | 흰색 심볼과 기존 흰색 배경의 대비 문제를 primary `#526879` 배경으로 수정했다. |
| favicon            | 교체 필요   | 48px에서도 보이지만 추상 `A`라 서비스 식별성이 약하다.                        |

현재 자산은 Expo 초기 자산 계열의 일관된 한 세트이므로 개발·내부 preview에는 사용할 수 있다. Store와 공개 Web에서는 ToDoLab 고유 자산으로 교체해야 한다.

## 이번 수정

- `expo-splash-screen` 배경을 흰색에서 앱 light theme primary `#526879`로 바꿨다.
- 흰색 splash mark가 배경 위에서 사라지지 않도록 정적 설정 검사에 배경값을 추가했다.
- 실제 기기에서 splash crop, 화면 전환과 dark mode 상태는 아직 확인하지 않았다.

## 최종 자산 요구사항

- 작은 크기에서도 `완료` 또는 `일정` 제품 의미를 한 가지 단순한 실루엣으로 전달한다.
- 글자나 세밀한 grid 없이 48px favicon과 Android monochrome에서 식별할 수 있어야 한다.
- light·dark wallpaper와 원형·squircle mask에서 외곽이 잘리지 않아야 한다.
- 앱의 paper·powder·sage 계열과 어울리되, 선택 상태나 성공 상태와 혼동되지 않는 브랜드 색을 정한다.
- 앱 icon, adaptive foreground·background·monochrome, favicon, splash를 같은 원본에서 플랫폼별로 export한다.
- 실제 Android launcher preview, iOS mask, Web browser tab과 splash 전환을 확인한 뒤 `최종`로 표시한다.

새 심볼은 바로 production 자산으로 교체하지 않는다. 먼저 3개 이하의 시각 방향을 비교하고 하나를 선택한 뒤 전체 크기 세트를 만든다.
