# 브랜드 자산 점검

Last updated: 2026-08-30

## 점검 범위

2026-08-23에 현재 `icon.png`, Android adaptive foreground·background·monochrome, `splash-icon.png`, `favicon.png` 원본을 직접 확인했다. PNG 크기와 설정 연결은 `npm run check:release-assets`로 별도 검사한다.

## 현재 판정

| 자산               | 판정      | 확인 내용                                                               |
| ------------------ | --------- | ----------------------------------------------------------------------- |
| 앱 icon            | 적용 완료 | 둥근 paper tile과 check를 결합한 Dooit 심볼을 1024px 자산으로 적용했다. |
| Android foreground | 적용 완료 | adaptive icon safe zone 안에 같은 심볼을 배치했다.                      |
| Android background | 적용 완료 | 브랜드 primary `#526879` 단색 배경으로 통일했다.                        |
| Android monochrome | 적용 완료 | 작은 크기에서도 식별되는 check 실루엣을 단색 mask로 사용한다.           |
| splash             | 적용 완료 | primary 배경 위에 같은 paper tile 심볼이 표시된다.                      |
| favicon            | 적용 완료 | 같은 원본에서 48px 투명 PNG를 생성해 Web 설정에 연결했다.               |

모든 플랫폼 자산은 `assets/images/dooit-minimal-icon-v3.png`에서 파생한다. `scripts/generate-brand-assets.py`를 실행하면 규격별 PNG를 동일한 기준으로 다시 생성할 수 있다.

## 이번 수정

- `expo-splash-screen` 배경을 흰색에서 앱 light theme primary `#526879`로 바꿨다.
- 흰색 splash mark가 배경 위에서 사라지지 않도록 정적 설정 검사에 배경값을 추가했다.
- 임시 Expo `A` 심볼을 Dooit paper-check icon으로 교체했다.
- iOS icon, Android adaptive foreground·background·monochrome, splash와 favicon을 한 원본에서 생성한다.
- 실제 기기에서 splash crop, 화면 전환과 dark mode 상태는 아직 확인하지 않았다.

## 최종 자산 요구사항

- 작은 크기에서도 `완료` 또는 `일정` 제품 의미를 한 가지 단순한 실루엣으로 전달한다.
- 글자나 세밀한 grid 없이 48px favicon과 Android monochrome에서 식별할 수 있어야 한다.
- light·dark wallpaper와 원형·squircle mask에서 외곽이 잘리지 않아야 한다.
- 앱의 paper·powder·sage 계열과 어울리되, 선택 상태나 성공 상태와 혼동되지 않는 브랜드 색을 정한다.
- 앱 icon, adaptive foreground·background·monochrome, favicon, splash를 같은 원본에서 플랫폼별로 export한다.
- 실제 Android launcher preview, iOS mask, Web browser tab과 splash 전환을 확인한 뒤 `최종`로 표시한다.

새 심볼은 바로 production 자산으로 교체하지 않는다. 먼저 3개 이하의 시각 방향을 비교하고 하나를 선택한 뒤 전체 크기 세트를 만든다.
