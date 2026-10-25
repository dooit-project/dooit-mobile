# 개인 Task ID 접근 권한 검증

2026-10-25 · 모바일 `5fc024d` 이후 working tree · UI 변경 없음

## 결과

**로컬 STG의 명시 범위 통과, 운영 배포/재검증 대기.** 숫자 Task ID를 알아도 타인의 개인 Task를 조회·수정할 수 없어야 한다. 모바일 URL `/tasks/4`는 화면 주소이고 실제 데이터 경계는 인증된 `/api/v1/tasks/{id}`의 서버 소유권 검사다.

- 직접 실행: `npm run smoke:task-authorization:real`에 해당하는 Node 검증기. 전용 게스트2개/개인 Task3개/각 체크리스트를 새로 만들고 그 ID만 사용했다.
- 대상: `http://127.0.0.1:18080`, STG image `stg-b9495f0-20261025163438`, SHA `b9495f031dcd041fec46ef6085a07fcf9252fd8d`. 실행 시작/끝 metadata가 일치했다.
- 결과: [구조화된 실제 결과](./result.json)46개 확인 중 거부 요청35개, 실패0. 소유자 Task/체크리스트 정상 조작, 원본 보존과 타 계정 목록 비노출도 포함한다.
- 정리: 이번 최종 실행의 Task3개를 소유자 자격으로 삭제한 뒤404를 확인했고 두 계정에 logout을 요청했다. 게스트 계정·멱등성 기록은 서버의 기존 만료 정리 대상이다. stateless access token의 즉시 폐기나 계정 row 삭제까지 확인한 것은 아니다. 실제 credential과 합성 데이터 본문/ID는 결과 파일에 저장하지 않았다.

## 직접 확인한 요청

| 범위                                                                                | 기대/실제                   | 건수 |
| ----------------------------------------------------------------------------------- | --------------------------- | ---: |
| 미인증 Task 조회/수정/완료/재개/삭제, 체크리스트 조회/생성/수정/완료/재개/정렬/삭제 | 401                         |   12 |
| 다른 계정이 같은 개인 Task/체크리스트를 요청                                        | 404, 데이터 비노출          |   12 |
| 잘못된 JWT의 Task 조회                                                              | 401, 빈 응답 허용           |    1 |
| 옛 `/api/tasks/{id}` 우회 조회                                                      | 미인증401/인증403           |    2 |
| 본인 Task + 다른 Task의 item ID 혼합, 타 계정 본인 Task + 상대 item 혼합            | 수정/완료/재개/삭제 각각404 |    8 |
| 소유자 정상 조작 및 원본 보존/목록 격리                                             | 정상 응답/원본 불변         |   11 |

404 하나만으로 통과시키지 않는다. 동일 연산이 소유자에게 성공하는 양성 대조를 먼저 실행한다. 400/500을 차단 성공으로 취급하지 않으며 오류 응답에 합성 원본이 섞였거나, 거부 후 원본이 바뀌거나, 정리에 실패해도 최종 결과가 실패다. 부모/자식 검사는 같은 소유자의 서로 다른 Task도 포함한다. 거부 전후 비교는 모두 GET 결과를 비교한다.

## 실행 도구와 회귀 검사

```sh
npm run smoke:task-authorization:real
```

새 검증기는 localhost/127.0.0.1:18080만 허용한다. 임의 host·8080·userinfo·경로/query/hash를 거부하고 redirect를 따르지 않는다. 서버가 `stg-` image임을 확인하기 전 fixture를 만들지 않는다. `DOOIT_AUTHZ_API_URL`은 이 고정 로컬 STG 주소의 호스트 표기만 바꿀 수 있다. 운영 대상으로 이 명령을 사용하지 않는다.

검증기 자체의12개 회귀 테스트는 우발적 허용200,404 속 원본 노출, 오류 메시지 속 원본, 잘못된400, 거부 후 변경, 소유자에게도 없는 route, 정리 실패, 운영 host 차단과 오류 내용/credential 비출력을 확인한다. 이는 서버 권한 검사의 대체가 아니며 위 실제 실행과 구분한다.

초기 실행에서 검증기와 실제 계약의 차이를 보정했다. 현재 STG 게스트는 refreshToken=null을 허용하고 잘못된 JWT는 빈401일 수 있다. 또 체크리스트 생성 응답과 DB 재조회 시각 정밀도 차이를 변경으로 잘못 판단하지 않도록 생성 응답 대신 GET 기준선을 사용했다. 실패를 통과로 바꾸기 위한 상태코드 완화나 timestamp 삭제는 하지 않았고 보정 후 전체를 다시 실행했다. 초기 실행의 합성 Task는 모두 정리했으며 최초 계약 검사에서 만든 빈 게스트1개와 이후 게스트들은 만료 정리 대상이다.

`npm run validate` 전체 통과:120 suites /637 tests, opt-in STG1개 제외. 이번 검증기 회귀12개를 포함하며 일반 validate는 실제 네트워크 권한 검사를 자동 실행하지 않는다.

## 백엔드 source/보고와 운영 경계

형제 `backend` 저장소를 읽기 전용으로 확인했다. 마지막 확인 HEAD는 `bc55e44c8f90c93377dcb1f5b895629b99dcce45`다. 수정/테스트/커밋/배포/DB 작업은 하지 않았다.

- `TaskV1Controller`: JWT의 사용자를 `CurrentUserService`에서 얻고 소유자용 service 호출.
- `TaskService.getTaskForOwner`/`TaskTxService`: `findByIdAndOwnerId` 경로.
- `TaskRepository`: 개인 owner 조회에 `PERSONAL` scope도 포함.
- `TaskChecklistItemService`: 부모 접근 권한과 `findByIdAndTaskId` 검사. Workspace는 멤버/역할 검사를 별도로 수행한다.
- `SecurityConfig`: v1 인증 필수, 옛 `/api/tasks`와 하위 경로 denyAll.
- 백엔드 `docs/mobile/MOBILE_API_BACKEND_STATUS.md`의10월25일 회신: 서버 회귀34개/전체692개, STG 거부38건/원본 보존 통과 **보고**. 이 숫자는 모바일이 새로 직접 수행한35건과 다른 범위다.
- 같은 보고에서 운영 image `6cdc9e5`에는 이번 legacy 차단 수정이 **미반영**이라고 명시한다. 공개 운영 metadata 도구 조회도 접근 불가여서 이번에는 운영 버전을 직접 확인하지 못했다. 운영에 이미 수정됐다고 판단하지 않는다.

운영 반영과 운영 전용 전용 계정 회귀는 [백엔드 전달 요청서](../../api/API_TASK_AUTHORIZATION_VERIFICATION_REQUEST.md)를 따른다. 실제 회원 계정 조합, Workspace 역할 전체, 반복 series/Goal 연결/전체 검색 endpoint, 화면의404·계정 전환 cache·브라우저 캐시·다른 브라우저 UI는 이번 직접 실행 범위가 아니다. 개인 소유권과 의도된 Workspace 공유 권한을 혼동하지 않는다.

근거 원칙은 [OWASP BOLA](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)다. UUID나 화면에서 버튼 숨기기는 서버 인가를 대체하지 않는다. 기존 URL/숫자 ID/API 계약/모바일 화면은 바꾸지 않았다. Android/iOS/Web 공통 API에 대한 검증 도구·문서 변경이며 플랫폼 실행 코드는 변경하지 않았다.
