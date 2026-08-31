# 좌측 메뉴 320px·키보드 접근성 감사

Last updated: 2026-09-01

## 환경

- Expo Web static export · mock guest
- viewport: 320×700
- browser color scheme: light

## 구현 전 발견

- 메뉴를 열었을 때 keyboard focus가 drawer 안으로 이동한다는 보장이 없었다.
- 닫은 뒤 trigger로 focus를 복원하는 동작이 없었다.
- 짧은 viewport에서 바깥 document가 함께 scroll되어 brand header와 닫기 버튼이 화면 밖으로 움직일 수 있었다.

## 수정과 결과

1. **초기 focus — 통과**
   - 메뉴가 열리면 close button으로 keyboard와 screen reader focus를 이동한다.
2. **Web Escape — 통과**
   - 실제 `Escape` keypress 후 dialog 수가 0이 됐다.
3. **focus 복귀 — 통과**
   - 닫힌 뒤 `나의 플래너 메뉴 열기` button이 다시 active element가 됐다.
4. **Android back — 코드 경로 확인**
   - React Native `Modal.onRequestClose`가 같은 close handler를 사용한다.
   - 실제 Android 기기 검증은 남아 있다.
5. **320px scroll — 통과**
   - drawer 내부 ScrollView만 움직이고 brand header와 close button은 유지된다.
   - 마지막 `설정`까지 scroll해 접근 가능하다.
   - 상단: [`menu-320.png`](./menu-320.png)
   - 하단: [`menu-320-end.png`](./menu-320-end.png)

## 남은 검증

- dark mode 실제 캡처
- font scale 1.5
- VoiceOver·TalkBack 읽기 순서와 modal 외부 탐색 차단
- Android back과 iOS swipe 실제 기기 동작
