# 핵심 화면 반응형 점검

- 점검일: 2026-09-09
- 환경: mock Web, Chrome, light theme
- viewport: 320×844, 390×844, 430×844
- 범위: Today, drawer, 빠른 기록, Calendar

ChatGPT 앱 내장 브라우저 연결을 만들 수 없어 프로젝트 원칙에 따라 Chrome으로 점검했다. 이번 결과는 Web 레이아웃 근거이며 Android·iOS 실기기 판정을 대신하지 않는다.

## 결과

| 순서 | 상태                         | 조건    | 판정                                                                      |
| ---- | ---------------------------- | ------- | ------------------------------------------------------------------------- |
| 1    | Today 기본                   | 320×844 | 안내 문구, 빈 상태 CTA, FAB, 하단 tab이 잘리지 않는다.                    |
| 2    | drawer 기본                  | 320×844 | 주요 메뉴와 category 진입이 한 열에 맞는다.                               |
| 3    | Today 기본                   | 390×844 | 콘텐츠 위계와 여백이 안정적이다.                                          |
| 4    | Today 기본                   | 430×844 | 폭 증가에도 콘텐츠가 과도하게 벌어지지 않는다.                            |
| 5    | Today, Chrome zoom 150% 시도 | 390×844 | React Native Web `fontScale`이 바뀌지 않아 큰 글꼴 근거로 사용할 수 없다. |
| 6    | 빠른 기록 열림               | 320×844 | 닫기, 입력, 추가 action과 하단 tab이 겹치지 않는다.                       |
| 7    | drawer 하단                  | 320×844 | 스크롤 뒤 검색, Task 템플릿, 설정에 접근할 수 있다.                       |
| 8    | drawer category 펼침         | 320×844 | category 목록이 폭 안에 맞고 하단 메뉴는 스크롤로 접근할 수 있다.         |
| 9    | Calendar 기본                | 320×844 | 7열, 월 이동, 빈 상태 CTA와 하단 tab이 잘리지 않는다.                     |

## 캡처

1. [Today 320×844](./01-today-light-320x844.png)
2. [Drawer 320×844](./02-drawer-light-320x844.png)
3. [Today 390×844](./03-today-light-390x844.png)
4. [Today 430×844](./04-today-light-430x844.png)
5. [Chrome zoom 시도 390×844](./05-today-zoom-390x844.png)
6. [빠른 기록 320×844](./06-quick-capture-light-320x844.png)
7. [Drawer 하단 320×844](./07-drawer-bottom-light-320x844.png)
8. [Drawer category 펼침 320×844](./08-drawer-category-light-320x844.png)
9. [Calendar 320×844](./09-calendar-light-320x844.png)

## 판정

- **PASS — Web light:** 320px, 390px, 430px의 핵심 화면과 320px drawer·빠른 기록·Calendar에서 가로 overflow나 주요 action 잘림을 찾지 못했다.
- **PASS — 기본 접근성 구조:** tab 선택 상태, drawer dialog, 메뉴·날짜·주요 action의 접근성 label을 유지한다. 공용 Button은 최소 44dp, drawer 행은 60dp, category 행은 48dp를 사용한다.
- **주의:** 320px drawer는 하단 항목이 스크롤로 접근 가능하지만 스크롤 표시가 없어 추가 메뉴 존재를 놓칠 수 있다.
- **제외:** Web의 세로 scrollbar는 Chrome 렌더링 특성이므로 native 결함으로 판정하지 않는다.
- **NOT VERIFIED:** 실제 font scale 1.5, dark mode, 가상 키보드, safe area·gesture, VoiceOver·TalkBack은 Android 또는 iOS에서 별도 캡처가 필요하다.

## 다음 확인

Android preview에서 320dp 또는 가장 좁은 지원 폭을 기준으로 font scale 1.5, dark mode, 가상 키보드가 열린 빠른 기록과 Calendar를 캡처한다.
