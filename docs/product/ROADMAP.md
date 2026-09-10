# Dooit Mobile Roadmap

Last updated: 2026-09-11

현재 단계는 핵심 기능 구현 이후의 연동·출시 검증이다. 제품 범위는 [PRD](./PRD.md), API 배포 상태는 [연동 현황](../integration/FRONTEND_BACKEND_STATUS.md), 확인 결과는 [smoke log](../qa/SMOKE_TEST_LOG.md)에 둔다. 이 문서는 남은 작업의 우선순위만 관리한다.

## P0. Android preview와 운영 API 검증

- [ ] 2026-09-10 제출한 [Android preview 빌드](https://expo.dev/accounts/hyunseung2/projects/dooit-mobile/builds/23dcd244-9d8a-4be1-bd45-284ba0e8a531)의 최종 상태와 APK를 확인한다. EAS project 연결과 managed keystore 생성은 완료됐고 새 키 fingerprint·복구 기준은 기록이 필요하다.
- [ ] 백엔드 신규 API를 포함한 production commit/image, 실행 OpenAPI와 필수 migration 적용 기록을 같은 배포 기준으로 확인한다.
- [ ] local guest 생성 500과 Workspace 반복 Task의 D-Day 연결 500을 복구한 인스턴스에서 real smoke를 재실행한다. 백엔드 변경은 별도 저장소에서 진행한다.
- [ ] Android에서 Expo Go·Metro 없는 cold start, 게스트·계정 시작, 핵심 개인·Workspace 흐름과 신규 일일 실행 API를 검증한다.
- [ ] APK·frontend/backend 버전·API URL·기기·설치 결과와 최소 하루 사용 결과를 smoke log에 기록한다.

## P1. 품질·오류 복구 검증

- [ ] Android에서 320·390·430dp, font scale 1.5, dark mode·키보드 상태를 확인한다. Web light 반응형 근거는 [2026-09-09 audit](../audits/responsive-core-2026-09-09/README.md)에 있다.
- [ ] 승인된 플랫폼에서 VoiceOver·TalkBack, Android back, iOS gesture, safe area·focus 복귀를 확인한다.
- [ ] production Workspace 초대·체크리스트를 OWNER·EDITOR·VIEWER별로 검증한다. local 체크리스트 역할 경계는 통과했다.
- [ ] 비밀번호 재설정 메일·deep link, guest 병합, refresh rotation·reuse, logout을 production에서 확인한다.
- [ ] 로컬 알림의 권한·실제 전달·선택·앱 종료 상태와 중복 방지를 기기에서 확인한다.
- [ ] 생성 mutation timeout·동일 key replay·payload 충돌 409와 네트워크 복구를 real smoke한다.
- [ ] 실제 API 지연·대량 데이터에서 Today·Completed·Calendar 성능을 측정한다.
- [ ] 운영 Web의 CORS·CSP·cache·직접 경로·세션 만료를 검증하고 HttpOnly refresh cookie 운영 여부를 확정한다.
- [ ] 오류 수집 운영 책임자와 Sentry project·DSN을 확정한 뒤 privacy 기준에 맞춰 연결한다.
- [ ] [릴리즈 체크리스트](../qa/RELEASE_CHECKLIST.md)에 후보별 결과를 대조하고 플랫폼별 배포 범위를 확정한다.

## 조건 충족 후 진행

- 미분류 목록 탐색: null-category 검색 계약이 준비된 뒤 활성화한다. 현재 요약 count와 이름 있는 카테고리 탐색은 구현됐다.
- 카테고리 CRUD·정렬: 관리 UX와 삭제 정책을 결정한 뒤 계약을 요청한다.
- 계획·마감 atomic batch: 단건 처리의 부분 실패가 실제로 반복될 때 요청한다.
- 공유 메뉴·iOS widget: 별도 native build에서 인증 bootstrap·cold start·취소·재시도를 검증한 뒤 출시 포함 여부를 결정한다.
- 서버 push: token lifecycle·발송 멱등성·local suppression 검증과 활성화 승인을 거친다.

추가 기능 후보와 제외 범위는 [PRD](./PRD.md), Store·OTA 승격 조건은 [배포 범위 정책](./RELEASE_SCOPE_POLICY.md)를 따른다.
