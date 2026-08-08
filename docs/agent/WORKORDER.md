# 작업서

## 현재 작업명

정담 앱 하네스 엔지니어링 기반 구축

## 목표

AI 에이전트가 정담 앱을 수정할 때 작업 범위, 금지 영역, 검증 기준, 반복 루프를 명확히 따르도록 기본 하네스를 만든다.

## 현재 우선순위

1. 하네스 문서 구축
2. 제품 기획 하네스 구축
3. 개발·QA 하네스 구축
4. 예식비 진단 화면 안정화
5. 결제/크레딧 회귀 방지 체크리스트 강화
6. 웹/앱 템플릿 동기화 작업 방식 정리

## 이번 루프 범위

- `AGENTS.md` 생성
- `docs/agent/HARNESS.md` 생성
- `docs/agent/WORKORDER.md` 생성
- `docs/agent/LOOP_STATE.md` 생성

## 이번 루프에서 하지 않을 것

- 앱 UI 추가 수정
- 결제/크레딧 코드 수정
- DB 스키마 수정
- 배포 빌드 실행

## 작업 지시 템플릿

다음 작업부터는 아래 프롬프트를 그대로 사용한다.

```text
AGENTS.md와 docs/agent/HARNESS.md, PRODUCT_PLANNING_HARNESS.md, DEVELOPMENT_QA_HARNESS.md, WORKORDER.md, LOOP_STATE.md를 먼저 읽고 작업해줘.

이번 목표:
[여기에 목표 작성]

진행 방식:
1. 관련 코드와 문서를 먼저 읽어.
2. 위험 영역을 판단해.
3. UI/UX 작업이면 기획 의도, 화면 상태, 디자인 기준을 짧게 정리해.
4. 가장 작은 수정 단위 하나를 정해.
5. 수정해.
6. 가능한 검증을 실행해.
7. 코드 수정이 있으면 기능별 IMPLEMENTATION_LOG.md와 QA_REPORT.md를 작성/갱신해.
8. LOOP_STATE.md에 결과와 다음 루프를 기록해.

주의:
- 요청 범위 밖의 리팩토링 금지.
- 결제/크레딧/서명 인식 로직은 명확한 요청 없이 건드리지 말 것.
- UI는 Android 키보드, iOS Safe Area, 작은 화면을 고려할 것.
- 드랍다운/셀렉트는 기본 UI를 그대로 쓰지 말고 커스텀 드랍다운, 바텀시트 선택기, 칩 선택기 중에서 설계할 것.
- 작업 후 수정 이유, 검증 결과, 남은 문제를 반드시 기록할 것.
- QA Report 없이 완료라고 말하지 말 것.
```

## 제품 기획 작업 지시 템플릿

```text
AGENTS.md와 docs/agent/HARNESS.md, PRODUCT_PLANNING_HARNESS.md, DEVELOPMENT_QA_HARNESS.md, WORKORDER.md, LOOP_STATE.md를 먼저 읽고 작업해줘.

이번 목표:
정담 앱 전체를 훑고, 결혼식/장례식에 꼭 필요한 기능과 사용자를 붙잡을 수 있는 킥 기능을 기획해줘.

진행 방식:
1. 현재 앱 구조와 주요 화면, 이미 구현된 기능을 먼저 파악해.
2. 결혼 주최자, 장례 주최자/상주, 하객/조문객, 일반 사용자, 운영자 관점으로 사용자군을 나눠.
3. Product Lead, Wedding PM, Funeral PM, Guest Experience PM, Retention/Growth PM, UX Researcher, Product Designer, Tech Lead, Revenue/Ops Lead가 회의하듯 각자 의견과 반대 의견을 내.
4. 기능 후보를 Must, Kick, Retention, Revenue, Later로 분류해.
5. 토스 스타일 디자인 원칙을 기준으로 1차 MVP 작업서를 만들어.
6. 바로 개발하지 말고, 먼저 기획 결과와 개발 우선순위를 문서화해.
7. LOOP_STATE.md에 이번 기획 결과와 다음 루프를 기록해.
```

## UI/UX 작업서 템플릿

```text
목표:
[화면/기능 이름]의 사용자 흐름과 디자인을 개선한다.

기획 정리:
- 사용자 상황:
- 핵심 행동:
- 정보 우선순위:
- 필요한 상태:
- 입력 방식:

디자인 규칙:
- 기본 드랍다운 금지. 커스텀 드랍다운/바텀시트/칩 선택기 사용.
- 작은 화면, Android 키보드, iOS Safe Area 확인.
- 긴 텍스트와 빈 상태를 고려.

완료 조건:
- 핵심 행동이 1번의 흐름으로 완료된다.
- 터치 영역과 상태 피드백이 명확하다.
- JSX 파싱 또는 앱 실행 검증을 통과한다.
- LOOP_STATE.md에 작업 기록이 남는다.
```

## 개발·QA 작업 지시 템플릿

```text
AGENTS.md와 docs/agent/HARNESS.md, PRODUCT_PLANNING_HARNESS.md, DEVELOPMENT_QA_HARNESS.md, WORKORDER.md, LOOP_STATE.md를 먼저 읽고 작업해줘.

이번 목표:
[개발할 기능 또는 수정할 문제]

진행 방식:
1. Feature Spec을 먼저 만들거나 기존 작업서를 갱신해.
2. 영향 범위와 고위험 영역을 정리해.
3. 작은 단위로 구현해.
4. 수정 파일과 이유를 IMPLEMENTATION_LOG.md에 기록해.
5. 자동 검증과 수동 QA 항목을 QA_REPORT.md에 기록해.
6. 테스트하지 못한 항목은 이유를 적어.
7. LOOP_STATE.md에 다음 루프를 기록해.

완료 조건:
- 코드가 반영되어 있다.
- 자동 검증 또는 가능한 대체 검증이 실행되어 있다.
- QA Report가 있다.
- 남은 리스크가 문서화되어 있다.
```

## 예식비 진단 후속 작업서

```text
목표:
예식비 진단 화면의 지역 선택, 내 견적 입력 바텀시트, 로딩 로티, 결과 안내 UI를 안정화한다.

완료 조건:
- 지역 선택 단계가 자연스럽다.
- 단계형 입력에 뒤로가기/닫기/진행 상태가 명확하다.
- Android 키보드가 입력창을 가리지 않는다.
- 결과에 지역, 표본 수, 예상 총액, 상위/하위 퍼센트가 나온다.
- JSX 파싱 검증을 통과한다.
```

## 결제/크레딧 후속 작업서

```text
목표:
크레딧 충전/차감/새로고침/중복 터치 상황에서 손실이나 중복 지급이 생기지 않게 점검한다.

완료 조건:
- 결제 성공 후 RevenueCat Webhook 반영 경로가 명확하다.
- transaction_id 기반 중복 방지가 유지된다.
- 생성 완료 전 크레딧 차감 여부가 명확하다.
- 새로고침/앱 리로드 중 크레딧 손실이 없는지 확인한다.
```
