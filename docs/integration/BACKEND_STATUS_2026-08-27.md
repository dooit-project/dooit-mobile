# 백엔드 요청 완료 확인

확인일: 2026-08-27

## 기준

- 저장소: 인접 `todolab-backend`
- 확인 source: `fd2a7e3`
- 원격 기준: `origin/main`은 `06108bd`; local HEAD의 후속 5개 commit과 운영 문서·script 미커밋 변경은 별도 반영 필요
- 검증: `./gradlew test --rerun-tasks` — `BUILD SUCCESSFUL`, 5 tasks executed

이 결과는 source 구현 완료를 의미한다. production API URL, 적용 migration, 메일·CORS 환경 설정과 실행 metadata가 같은 배포인지까지 증명하지는 않는다.

## 요청별 상태

| 요청                     | 근거                 | 백엔드 상태                                           | 모바일 후속                                    |
| ------------------------ | -------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| 내용 있는 Workspace 삭제 | `b292654`            | cascade 삭제·통합 테스트 완료                         | 최신 배포 real smoke                           |
| 실행 버전 metadata       | `74c7a37`            | `GET /api/v1/system/metadata` 완료                    | commit/image/version 기록                      |
| 비밀번호 재설정          | `7f6feee`            | request·verify·confirm, TTL·rate limit·deep link 완료 | form·deep link·메일 smoke                      |
| CORS·cache               | `897e87d`            | `Authorization`·`Idempotency-Key`, `no-store` 완료    | 운영 origin smoke                              |
| 생성 멱등성              | `bd427b1`            | 24시간 replay, 409와 replay header 완료               | 프론트 연결 완료, real smoke                   |
| refresh·logout           | `5b572a9`, `4c5c63a` | rotation·reuse detection, 30/90일 완료                | native 연결 완료, 실서버 smoke·Web cookie 확정 |
| Workspace 초대 거절      | `144d18f`            | PENDING → REMOVED와 권한 테스트 완료                  | 확인 UI·cache mutation                         |
| Task 알림 시각           | `bc5bd73`            | `notificationEnabled`·`notifyAt` 완료                 | 프론트 연결 완료, 실기기 smoke                 |

## production 반영 전 확인

1. 필요한 backend commit과 migration을 하나의 배포 단위로 반영한다.
2. `GET /actuator/health/readiness`와 `GET /api/v1/system/metadata`를 확인한다.
3. metadata의 commit/image가 실행 OpenAPI와 migration 기록에 대응하는지 확인한다.
4. `EXPO_PUBLIC_API_URL=<배포 URL> npm run check:backend-deployment`를 실행한다.
5. Workspace 삭제, 비밀번호 메일 복구, CORS·cache와 역할별 smoke 결과를 [`SMOKE_TEST_LOG.md`](../qa/SMOKE_TEST_LOG.md)에 기록한다.

## 프론트 구현 순서

1. 비밀번호 재설정 UI와 deep link
2. Workspace 초대 거절
3. native refresh credential 실기기·실서버 smoke와 Web HttpOnly cookie 계약 확정
4. 생성 mutation timeout·replay real smoke
5. Task 알림 시각 Android·iOS 실기기 smoke
