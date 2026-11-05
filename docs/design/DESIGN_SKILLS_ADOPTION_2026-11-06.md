# 디자인 스킬 프로젝트 도입과 시범 검토

2026-11-06 · Dooit Mobile · 스킬 설치 및 코드 수동 검토

## 설치한 스킬

공식 GitHub 원문과 설치된 `SKILL.md`를 읽은 뒤 `skill-installer`의 공식 helper로 프로젝트 `.agents/skills`에 설치했다. 앱 실행 의존성을 추가하거나 스킬의 외부 실행 파일을 실행하지 않았다. Codex가 새로 설치된 스킬을 자동 발견하는 것은 다음 턴부터다. 기존 Product Design 감사와 실제 화면·DOM 검사를 대체하지 않는다.

| 스킬                                                                            | 출처                                                                                                          | 역할                                                                                                                                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [frontend-design](../../.agents/skills/frontend-design/SKILL.md)                | [Anthropic 공식 저장소](https://github.com/anthropics/skills/tree/main/skills/frontend-design)                | 제품에 맞는 시각 위계, 간격·문구와 불필요한 장식 점검                                                                                                                        |
| [vercel-react-native-skills](../../.agents/skills/react-native-skills/SKILL.md) | [Vercel Labs 공식 저장소](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-native-skills)   | Expo/React Native의 목록·입력·안전 영역 등 구현 검토                                                                                                                         |
| [web-design-guidelines](../../.agents/skills/web-design-guidelines/SKILL.md)    | [Vercel Labs 공식 저장소](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | Web의 키보드, 터치 영역, 접근성 및 긴 콘텐츠 검토. 수행 시 [최신 기준](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)을 다시 읽는다 |

설치 직후 GitHub `main` 조회값은 Anthropic `ca45fc496a3436251f191354091d557da31c15b5`, Vercel `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`였다. 설치 helper는 `main`을 받았으므로 이 값은 조회 시점 기록이며 다운로드의 커밋 고정을 보증하지 않는다. 설치된 SKILL.md SHA-256: frontend `d91970639e9f5c37682ac7ab60094d35f1c7c1f38d731bd56396563aee10c1d3`, React Native `4012750a5ccbe064ca04af3835d5d1b011979d2d09d9b6df1c8128fac58e0a66`, Web `f4647ca866a3accf763777f83e7682954f0187cd6bea7eea0399796652414e8f`. frontend-design의 Apache 2.0 라이선스 원문은 설치 디렉터리에 있다. Vercel React Native 스킬은 MIT를 명시한다.

## 이번 시범 적용

범위는 현재 작업 중인 [오늘 항목](../../src/features/today/today-overview.tsx)과 [돌아보기 화면](../../src/features/completed/weekly-evidence-overview.tsx) 코드다. [기존 실제 mock 화면](../audits/review-goal-journey-2026-11-05/04-review.png)을 맥락으로 확인했으며 이번에 새 화면을 캡처하거나 실기기 접근성을 측정한 것은 아니다.

- **frontend-design:** 돌아보기의 ‘반복 계획 체크’는 UNKNOWN 결과를 과장하지 않는 장점이 있지만 여러 계획이 있을 때 어떤 계획인지 구별하기 어렵다. 계획명에 수행량이 포함될 수 있으므로 계획명을 곧 수행 내용으로 표현하지 않는 별도 정보 설계가 필요하다. 선택된 흰 바탕·목표색 구조와 사용자의 문구 선호가 스킬의 일반적인 개성/폰트 권고보다 우선한다.
- **Web guidelines:** 오늘의 할 일 상세와 돌아보기의 일부 상세 진입이 `Pressable`의 버튼으로 구현돼 있다. Web에서 링크의 새 탭·컨텍스트 메뉴 동작이 필요한지 확인할 후보다. 코드 검토 결과이며 실제 키보드·마우스 조작을 통과/실패로 판정한 것은 아니다. 자동 완료 체크와 상세 버튼의 초점, 텍스트 확대·고정 요소 가림도 실제 환경에서 후속 확인한다.
- **React Native:** 공통 Screen은 `ScrollView`, 돌아보기는 목표별로 처음 20건을 표시하고 더 보기로 확장한다. 스킬은 가상화를 권하지만 현재 항목 수·기기 성능을 측정하지 않았으므로 성능 문제를 단정하거나 FlashList 등 새 의존성을 바로 추가하지 않는다. 기록·목표가 많은 조건에서 측정 후 판단한다. `formatDateLabel`은 호출마다 `Intl.DateTimeFormat`을 생성하므로 대량 기록의 성능 후보이나 병목 여부는 미측정이다.
- **플랫폼 차이:** iOS의 자동 content inset이나 라이브러리 교체 권고를 Android·Web에 일괄 적용하지 않는다. 기존 safe area·스크롤·기준 시안과 실기기 검증을 먼저 따른다.

스킬은 검토 지침이지 `npm run validate` 같은 자동 품질 보증 도구가 아니다. 시범 검토는 코드·기존 캡처를 근거로 한 후보 도출이며 Product Design의 새 화면 감사나 플랫폼 실측을 통과했다는 뜻이 아니다. 변경은 기존 제품 작업과 분리해 기록한다.

설치된 원문의 YAML frontmatter와 이름·설명은 프로젝트의 기존 Node YAML 파서로 확인했다. `quick_validate.py`는 현재 Python 환경에 PyYAML이 없어 실행하지 못했으므로 그 검사 통과를 주장하지 않는다. 외부 원본의 형식을 바꾸지 않도록 `.agents/skills/`는 Prettier 대상에서 제외하고, `npm run validate`는 통과했다.

## 추가 후보 조사

2026-11-06: 기존 설치 당시에는 아래 후보들을 비교하지 않았다. 이후 원문과 설치 구성·필요한 실행 경로를 확인하고 유용한 후보를 프로젝트에 추가했다. 별점은 해당일 GitHub 저장소 표시 수치로, 특정 스킬의 검증된 품질이나 설치 수를 뜻하지 않는다.

- [Impeccable](https://github.com/pbakaus/impeccable): 약 103.4k stars. `critique`, `audit`, `polish` 등으로 기존 화면의 위계·간격·상태를 점검하고, 자체 detector는 소스 패턴과 실행 중 웹 페이지를 구분해 검사한다. SKILL.md에 native 화면용 지침도 명시돼 있어 우선 시범 후보이나 실제 React Native 적용은 확인하지 않았다. 기본 스킬이 컨텍스트 launcher를 호출하며 실행 파일이 내려받아질 수 있다. 문서상 live Apply에는 별도 agent 실행과 승인·샌드박스 우회 경로가 있으므로 live/자동 hook은 별도로 검토한다. 사용자 승인 시 지정 버전의 내용·필요 파일을 확인하고 프로젝트 범위의 읽기/감사 방식부터 시험한다.
- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill): 약 145.5k stars. 검색 가능한 스타일·UX 항목과 React Native 지침, Python 표준 라이브러리 검색을 제공한다. 긴 제목·터치·비어 있는 상태 등 특정 문제의 대안 탐색 후보로 적합하다. 생성된 색·폰트·시안은 기존 제품 기준을 덮어쓰지 않는다. 스킬과 데이터/스크립트 경로를 설치 전에 함께 확인한다.
- [Taste Skill](https://github.com/Leonxlnx/taste-skill): 약 110.4k stars. 주된 지침이 기업용 웹사이트·랜딩 페이지 제작이어서 앱의 실행 화면에 우선 설치할 후보는 아니다. 모바일 이미지 생성 스킬은 별도 저장소로 옮겨졌으며 이번에 검증하지 않았다.

### 추가 설치 및 확인

| 설치 스킬                                                              | 고정 소스 커밋                                                                  | 주 용도                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Impeccable](../../.agents/skills/impeccable/SKILL.md)                 | `pbakaus/impeccable@c8891a9ae865d6ee311836ae5199bfce0fe115b1`                   | 기존 화면 critique·polish와 관련 native/Web 감사 |
| [UI UX Pro Max](../../.agents/skills/ui-ux-pro-max/SKILL.md)           | `nextlevelbuilder/ui-ux-pro-max-skill@b7d5353e0130feb8c5574ef1251f8a1db1873ccb` | UX·React Native의 구체적인 문제 검색             |
| [Expo Design System](../../.agents/skills/expo-design-system/SKILL.md) | `expo/skills@a9e5bd3fa00b4e61f632e43f85da73aee1942582`                          | 기존 Expo 토큰·공통 컴포넌트와 화면의 일관성     |
| [break-ui](../../.agents/skills/break-ui/SKILL.md)                     | `emilkowalski/skills@c8a79627b59d72d764d6ab6f2c87c09a48169833`                  | 실제 허용 길이·빈 목록·작은 화면의 경계 상태     |

설치 helper가 복사한 각 디렉터리에 원본 저장소의 해당 커밋 라이선스를 보존했고, Impeccable의 NOTICE도 포함했다. 자동 hook/live 편집은 설치하거나 활성화하지 않았다. Vercel의 이전 스킬 저장소에는 루트 LICENSE 파일이 없어 파일 복사는 404였으며 README와 React Native 스킬은 MIT를 명시한다.

Impeccable launcher가 공식 검증 경로로 엔진 `0.1.18`을 다운로드한 뒤 `context --target src/features/today/today-overview.tsx`를 실행했다. 프로젝트의 기존 UI는 인식하지만 루트 `PRODUCT.md`/`DESIGN.md`는 없다고 보고한다. 실제 제품과 디자인 기준은 [제품 경험](../product/PERSONAL_SYSTEM_EXPERIENCE.md)과 [기준 이미지·구현 가이드](./DESIGN_IMPLEMENTATION_GUIDE.md)에 있으므로 새 문서 부재를 새 디자인 허가로 해석하지 않는다. 시범 `detect --json`을 오늘·돌아보기 TSX에 실행한 결과 빈 배열이었다. 이는 소스 패턴 검사 결과이며 렌더링된 Web·native 접근성이나 디자인 완성도 통과가 아니다. 네이티브 감사 가이드도 detector 결과와 별도로 적용한다.

UI UX Pro Max의 로컬 검색으로 긴 텍스트와 React Native 터치/접근성을 조회했다. React Native 결과가 **0.86.x** 기준을 명시하여 이 프로젝트의 **0.85.3**에 대한 자동 적용 근거로 쓰지 않는다. 최신 SDK 호환성과 실제 동작을 확인한다. 스킬의 검색 경로는 `.agents/skills/ui-ux-pro-max/scripts/search.py`를 사용하며 다른 에이전트 전용 환경 변수를 가정하지 않는다. 검색은 `--persist` 없이 수행해 별도 디자인 시스템을 만들지 않았다.

추가 조사한 [Expo Skills](https://github.com/expo/skills)와 [Emil Kowalski Skills](https://github.com/emilkowalski/skills)는 2026-11-06 GitHub 표시 약 4.1k/53.7k stars였다. Expo의 외부 feedback 전송 안내는 대외 메시지에 대한 별도 명시적 요청이 없으면 실행하지 않는다. `break-ui`의 보고 후 중단보다 사용자가 요청한 같은 범위의 수정·재검사가 우선한다. 새 스킬은 다음 턴부터 자동 발견 대상으로 나타난다.
