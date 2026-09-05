# 화면 캡처 기준

`docs/screenshots`는 README와 화면 가이드에서 사용하는 현재 UI의 대표 캡처다.

## 최신 캡처

- 촬영일: **2026-09-05**
- 기준 커밋: `11a5727`
- 환경: Expo Web · mock API · Chrome · 390×844 · light theme
- 시간대: `Asia/Seoul`
- 캡처 도구: ChatGPT 앱 내장 브라우저가 `Invalid browser service environment`로 연결되지 않아 Chrome 자동화로 대체
- 상세 상태: [`manifest.json`](./manifest.json)

## 갱신 규칙

- 대표 캡처는 촬영일로부터 **7일째가 되기 전에** 갱신한다. 촬영 후 7일 이상 지나면 UI 변경이 없어도 다시 확인하고 촬영일을 갱신한다.
- 화면 구조, 하단 탭, 문구, 아이콘, 여백 또는 주요 데이터 상태가 바뀌면 7일을 기다리지 않고 즉시 다시 촬영한다.
- 캡처를 바꿀 때 PNG와 `manifest.json`의 촬영일, 기준 커밋, 환경, 화면 상태를 한 변경으로 갱신한다.
- `npm run docs:check`는 누락된 파일, manifest 밖의 PNG, 잘못된 날짜, 7일 초과를 검사한다.
- 캡처에는 mock 데이터만 사용하며 실제 이메일, 일정, 검색어 등 개인정보를 넣지 않는다.
- 마켓용 편집본은 대표 캡처가 바뀐 뒤 다시 export하고 [`APP_STORE_ASSETS.md`](../marketing/APP_STORE_ASSETS.md)에 export 날짜를 기록한다.

## Audit 캡처

`docs/audits`의 이미지는 특정 검증 시점의 증거이므로 같은 파일을 덮어쓰지 않는다. 각 audit README에 촬영일, 기준 커밋, 환경과 viewport를 기록한다. 최신 근거로 계속 참조할 audit이 7일을 넘으면 새 날짜 디렉터리에 다시 캡처하고 기존 자료는 과거 기록으로 취급한다.
