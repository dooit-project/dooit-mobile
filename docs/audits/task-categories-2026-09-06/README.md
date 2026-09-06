# 개인 Task 카테고리 탐색 검토

## 결정

- Product Design 세 안 중 접이식 카테고리 목록을 선택했다.
- 사용자의 피드백에 따라 카테고리를 완료 기록 아래가 아니라 달력 바로 아래, 기록함 바로 위로 올렸다.
- 기본은 접힌 한 줄이며 펼치면 `전체`, 이름 있는 개인 카테고리, `미분류`와 `taskCount`를 표시한다.
- Workspace Task와 category 관리 행동은 포함하지 않는다.

## 구현 결과

| 캡처                                | 상태                    | 판정 |
| ----------------------------------- | ----------------------- | ---- |
| `00-collapsed-390x844.png`          | 접힌 기본 상태          | 통과 |
| `01-expanded-390x844.png`           | 카테고리 없음           | 통과 |
| `02-expanded-populated-390x844.png` | 개인 카테고리 세 개     | 통과 |
| `03-category-results-390x844.png`   | `업무` exact-match 결과 | 통과 |

- 카테고리 parent row는 loading, error/retry, empty와 expanded 접근성 상태를 제공한다.
- `전체`와 이름 있는 카테고리를 선택하면 drawer를 닫고 기존 검색 화면의 category browse 상태로 이동한다.
- 검색 화면의 category chip도 summary API 결과를 사용해 자유 입력 category와 어긋나지 않는다.
- 관련 단위 테스트, TypeScript와 lint가 통과했고 390×844 Chrome console error는 0개다.

## 백엔드 요청

`GET /api/v1/tasks/search`의 `category`는 문자열 exact match만 지원해 `category=null`을 찾을 수 없다. cursor pagination 결과를 클라이언트에서 재집계하지 않고 `미분류` 탐색을 완성하려면 `uncategorized=true`처럼 명시적인 null-category 필터가 필요하다. 계약 전까지 메뉴는 count를 표시하되 `미분류` 이동은 비활성화한다.

## 브라우저

이 검증은 사용자가 허용한 Chrome에서 390×844 viewport로 수행했다. 화면 소스는 선택한 생성 시안을 390×844로 정규화해 구현 캡처와 같은 비교 입력에서 확인했다.
