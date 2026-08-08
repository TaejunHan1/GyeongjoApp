# 정담 앱 개발·QA 하네스

이 문서는 정담 앱에서 기능을 기획한 뒤 실제 개발, QA, 테스트, 기록까지 이어가기 위한 하네스다.

## 목적

- 기획한 기능이 개발 중 흐려지지 않게 한다.
- 무엇을 왜 만들었는지, 어떤 파일을 어떻게 바꿨는지 기록한다.
- QA와 테스트를 개발 마지막에 대충 하지 않고 작업 루프 안에 포함한다.
- 다음 에이전트나 사람이 이어받아도 현재 상태를 이해할 수 있게 문서화한다.

## 개발팀 역할

기능 개발 작업은 아래 역할들이 함께 검토한다고 가정한다.

### Product Owner

- 기능 목표와 제외 범위를 확인한다.
- 사용자 가치와 완료 조건이 명확한지 본다.

### UX/UI Engineer

- 토스 스타일 디자인 규칙을 코드로 구현한다.
- 바텀시트, 커스텀 드랍다운, 칩, 토글, 입력 상태를 실제 화면 상태로 완성한다.

### Frontend Engineer

- React Native/Expo 코드 구조에 맞춰 구현한다.
- 기존 컴포넌트, 상태 관리, 네비게이션 패턴을 우선 사용한다.

### Backend/Data Engineer

- Supabase, RPC, Edge Function, DB 스키마 영향이 있는지 본다.
- 데이터 변경이 필요하면 마이그레이션과 롤백 위험을 기록한다.

### QA Engineer

- 기능 정상 동작, 에러 상태, 작은 화면, 키보드, Safe Area, 중복 터치, 새로고침, 권한 문제를 확인한다.

### Release Engineer

- 빌드, 버전 코드, 배포 트랙, App Store/Google Play 제출 영향이 있는지 본다.

## 기능 개발 루프

기능 개발은 아래 순서로 진행한다.

1. Feature Spec 작성 또는 갱신
2. 영향 범위 분석
3. 구현 계획 작성
4. 작은 단위 구현
5. 정적 검증
6. 수동 QA 체크리스트 작성
7. 테스트 결과 기록
8. 남은 리스크 기록
9. 다음 루프 제안

## 필수 산출물

기능 단위 작업을 하면 아래 문서를 남긴다.

### Feature Spec

위치:

```text
docs/agent/features/YYYY-MM-DD-feature-name/FEATURE_SPEC.md
```

내용:

- 사용자 요구사항
- 문제 정의
- 사용자군
- 핵심 사용자 흐름
- 화면/상태 목록
- 디자인 원칙
- 데이터 영향
- 고위험 영역
- 완료 조건

### Implementation Log

위치:

```text
docs/agent/features/YYYY-MM-DD-feature-name/IMPLEMENTATION_LOG.md
```

내용:

- 수정한 파일
- 수정 이유
- 주요 결정
- 변경하지 않은 것
- 위험한 선택과 대안
- 남은 TODO

### QA Report

위치:

```text
docs/agent/features/YYYY-MM-DD-feature-name/QA_REPORT.md
```

내용:

- 실행한 자동 검증
- 실행한 수동 검증
- 미실행 검증과 이유
- 발견한 문제
- 수정 여부
- 릴리즈 전 확인해야 할 것

## 공통 QA 체크리스트

모든 UI 기능:

- 작은 Android 화면에서 잘리는 부분이 없는가
- Galaxy 키보드가 입력창을 가리지 않는가
- iPhone Safe Area를 침범하지 않는가
- 긴 텍스트가 버튼/카드 밖으로 넘치지 않는가
- 뒤로가기, 닫기, 취소, 재시도 흐름이 있는가
- 로딩/빈 상태/에러 상태/성공 상태가 있는가
- 중복 터치로 중복 실행되지 않는가
- 기본 드랍다운/기본 피커를 그대로 쓰지 않았는가

결제/크레딧 기능:

- 결제 성공과 실패가 분리되어 있는가
- 같은 transaction_id가 중복 반영되지 않는가
- 새로고침/앱 리로드 중 크레딧 손실이 없는가
- 앱에서 직접 크레딧을 올리지 않는가
- RevenueCat Webhook과 Supabase Edge Function 경로가 유지되는가

청첩장/부고장 기능:

- 미리보기와 실제 웹 출력이 맞는가
- 업로드 사진 비율이 깨지지 않는가
- 템플릿 텍스트가 고정 이름을 박지 않는가
- 지도, 계좌, 날짜, 이름이 실제 데이터로 치환되는가
- 공유 링크에서 모바일 화면이 깨지지 않는가

하객접수 기능:

- 서명패드와 이름 인식 로직을 건드리지 않았는가
- 이름 확인, 금액 선택, 식권, 관계, 영수증 토글 흐름이 자연스러운가
- 뒤로가기/나가기/Safe Area가 정상인가
- 금액 누적/초기화가 명확한가

## 자동 검증 예시

JSX 파싱:

```bash
node - <<'NODE'
const fs = require('fs');
const parser = require('@babel/parser');
parser.parse(fs.readFileSync('src/screens/main/GuideScreenToss.js', 'utf8'), {
  sourceType: 'module',
  plugins: ['jsx'],
});
console.log('parse ok');
NODE
```

JSON 에셋 검증:

```bash
node -e "JSON.parse(require('fs').readFileSync('assets/lottie/estimate-loading.json','utf8')); console.log('json ok')"
```

Git 변경 확인:

```bash
git status --short
git diff --stat
```

## 기능 문서 생성 규칙

- 기능명이 정해지면 영어 kebab-case 폴더를 만든다.
- 날짜는 `YYYY-MM-DD`를 사용한다.
- 예: `docs/agent/features/2026-07-07-wedding-cost-diagnosis/`
- 코드 수정이 있는 루프는 해당 기능 폴더의 `IMPLEMENTATION_LOG.md`와 `QA_REPORT.md`를 갱신한다.
- 기획만 하는 루프는 `FEATURE_SPEC.md`까지만 작성해도 된다.

## 작업 금지

- Feature Spec 없이 큰 기능을 바로 개발하지 않는다.
- QA Report 없이 완료했다고 말하지 않는다.
- 테스트를 못 했는데 한 것처럼 말하지 않는다.
- 결제/크레딧/DB/서명 인식 로직을 부수면서 UI 작업이라고 포장하지 않는다.
