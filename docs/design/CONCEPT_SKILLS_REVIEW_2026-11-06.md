# 화면 초안·시안 스킬 조사

2026-11-06 · GitHub 공개 자료 조사 및 모바일 시안 스킬 도입 · 이미지 생성 없음

## 확인 배경

기존에 추가한 스킬은 감사와 구현 품질 검토에 비중이 있었다. 새 화면의 사용 흐름과 시각안을 만드는 작업도 구분해 검토했다. 아래는 공개 README와 지정된 SKILL.md를 읽은 결과이며, 별도 후보를 실제로 실행하거나 산출물 품질을 비교한 결과는 아니다. 숫자는 확인 시점의 저장소 전체 GitHub stars로 개별 스킬의 사용량이나 품질이 아니다.

| 후보                                                                                                               | 초기 초안에 도움이 되는 부분                                                      | Dooit 적용 판단                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Product Design ideate](https://github.com/openai/plugins/blob/main/plugins/product-design/skills/ideate/SKILL.md) | 제공된 시안·화면을 참조하고 세 개의 독립된 이미지 방향을 만든다.                  | **현재 이용 가능.** 목표 시안과 실제 화면을 첨부해 새 구조의 3안을 만든다. 작은 보정에 새 구조를 강제하지 않는다.                                                                                                                            |
| [imagegen-frontend-mobile](https://github.com/Leonxlnx/imagegen-skills/tree/main/skills/imagegen-frontend-mobile)  | iOS·Android용 모바일 화면과 여러 화면의 일관된 시안 이미지에 초점이 있다.         | **프로젝트에 도입.** 다음 신규 구조에서 Product Design ideate와 같은 조건으로 비교한다. 결과는 이미지이며 작동하는 앱이 아니다. 배경 질감·이미지·폰 프레임에 대한 기본 선호보다 Dooit의 선택된 흰 화면·목표별 구조와 사용자 요청을 우선한다. |
| [ui-design-brainstorm](https://github.com/Michael-Ma/skills/tree/main/skills/ui-design-brainstorm)                 | 대표 사용자 행동, 고정할 요소와 바꿀 요소를 정하고 다른 방향을 이미지로 비교한다. | 초기 정보 위계 탐색에 참고 가능하나 Product Design ideate와 겹친다. 현재 별도 설치 이점은 검증되지 않았다.                                                                                                                                   |
| [Figma generate design](https://github.com/figma/mcp-server-guide/tree/main/skills/figma-generate-design)          | Figma의 컴포넌트·변수를 이용해 편집 가능한 화면을 구성한다.                       | 현재 Figma 스킬과 도구가 제공된다. 사용자가 Figma 산출물을 원하거나 공유·라이브러리 관리가 필요할 때 사용하며, 이미지 생성만 필요한 작업에 강제하지 않는다.                                                                                  |
| [Stitch Design](https://github.com/google-labs-code/stitch-skills)                                                 | Stitch에서 텍스트/이미지로 화면과 변형을 생성한다.                                | Stitch MCP 설정이 필요하고 현재 사용 가능한 도구에서 확인되지 않았다. 현재는 미연결 후보로 둔다.                                                                                                                                             |

기존 [Impeccable shape](../../.agents/skills/impeccable/reference/shape.md)는 구현 전 문제·사용자·상태를 정리하는 기능도 있다. 다만 실제 컨텍스트 실행에서 루트 PRODUCT.md/DESIGN.md가 없다고 보고했으므로 새 구조 초안에 지장이 없는지 확인해야 하며, 기존 [제품 경험](../product/PERSONAL_SYSTEM_EXPERIENCE.md)과 [기준 이미지](./DESIGN_IMPLEMENTATION_GUIDE.md)를 대체하지 않는다. UI UX Pro Max는 디자인 시스템·패턴을 검색해 초안을 보조할 수 있지만 결과를 시각 시안이나 사용자 검증으로 취급하지 않는다.

## 도입 기록

- 모바일 시안 스킬은 [원본 커밋 beb16b0](https://github.com/Leonxlnx/imagegen-skills/tree/beb16b0d0f4dae9a6f5cb04ea41e97b93a54ab8e/skills/imagegen-frontend-mobile)을 프로젝트의 [스킬 디렉터리](../../.agents/skills/imagegen-frontend-mobile/SKILL.md)에 설치했고, 같은 커밋의 MIT 라이선스를 함께 보존했다. 안내 문서만 포함하며 별도 런타임 의존성이나 자동 hook을 설치하지 않았다.
- 기존 Product Design과 모바일 시안 스킬의 결과를 아직 생성·비교하지 않았으므로 어느 쪽이 더 좋다고 판정하지 않는다. 두 도구의 역할과 비교 시점은 [초안 제작 절차](../qa/PRODUCT_DESIGN_REVIEW_POLICY.md#새-화면-초안과-선택한-시안의-연결)에 연결했다.
- `ui-design-brainstorm`은 기존 ideate와 겹치고 추가 이점이 아직 확인되지 않아 보류한다. Stitch는 연결되지 않은 외부 서비스가 필요해 보류한다.

## 비교 실험 제안

다음에 의미 있는 새 화면/구조가 필요할 때 동일한 사용자 목적, 기존 시안, 데이터, 390×844 조건으로 Product Design ideate와 mobile 이미지 스킬을 각각 시험한다. 구조 차이·글자 가독성·시안 일관성·실제 기능과의 부합을 비교하고 사용자 선택을 기록한다. 생성 이미지의 오타·가짜 데이터·동작은 실제 구현으로 검증하지 않은 것으로 취급한다. 사용자 선택 후 구현하고 동일 조건의 실제 캡처·기존 검증을 수행한다. 기존 선택안의 국소 보정에는 이 비교를 의무화하지 않는다.

2026-11-06 GitHub 표시 기준 imagegen-skills 저장소는 65 stars였다. 이 모바일 스킬은 이전에 별점이 높은 taste-skill 저장소에 있다가 분리됐으므로 이전 저장소의 별점을 새 저장소의 별점으로 옮겨 적지 않는다. ui-design-brainstorm 저장소는 0 stars, Stitch skills는 약 8.7k stars였다. 수치는 품질 보증이 아니며 변할 수 있다.
