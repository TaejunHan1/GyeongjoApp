# 정담 앱 에이전트 작업 규칙

이 저장소에서 AI 에이전트가 작업할 때는 먼저 아래 문서를 읽고 따른다.

- `docs/agent/HARNESS.md`
- `docs/agent/PRODUCT_PLANNING_HARNESS.md`
- `docs/agent/DEVELOPMENT_QA_HARNESS.md`
- `docs/agent/WORKORDER.md`
- `docs/agent/LOOP_STATE.md`

## 기본 원칙

- 사용자가 요청한 범위 밖의 리팩토링을 하지 않는다.
- 결제, 크레딧, RevenueCat, Supabase Edge Function, 하객접수 서명 인식 로직은 고위험 영역으로 취급한다.
- UI 수정은 작은 단위로 나누고, Android 키보드, iOS Safe Area, 작은 화면에서 깨질 가능성을 먼저 본다.
- 작업 후 가능한 검증을 실행하고, 실행하지 못한 검증은 이유를 남긴다.
- 같은 실수가 반복되면 `docs/agent/HARNESS.md`의 재발 방지 규칙에 추가한다.

## 작업 시작 프롬프트

새 작업을 시작할 때는 이렇게 요청한다.

```text
AGENTS.md와 docs/agent/HARNESS.md, PRODUCT_PLANNING_HARNESS.md, DEVELOPMENT_QA_HARNESS.md, WORKORDER.md, LOOP_STATE.md를 먼저 읽고 작업해줘.
이번 작업은 작은 루프로 진행하고, 수정 후 검증 결과와 다음 루프를 LOOP_STATE.md에 업데이트해줘.
```
