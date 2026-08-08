# 계약 전 질문 카드 Implementation Log

## 수정한 파일

- `src/screens/main/guides/host/ContractQuestionCardsScreen.js`
- `src/screens/main/GuideScreenToss.js`
- `src/screens/main/guides/themes/GuideThemeMinimal.js`
- `src/screens/main/guides/tossStyle.js`
- `src/navigation/AppNavigator.js`
- `src/navigation/AuthNavigator.js`
- `docs/agent/features/2026-07-08-contract-question-cards/FEATURE_SPEC.md`
- `docs/agent/features/2026-07-08-contract-question-cards/IMPLEMENTATION_LOG.md`
- `docs/agent/features/2026-07-08-contract-question-cards/QA_REPORT.md`
- `docs/agent/LOOP_STATE.md`

## 구현 내용

- 주최자 가이드 카테고리에 `계약 전 질문 카드`를 추가했다.
- 새 화면 `ContractQuestionCardsScreen`을 만들었다.
- 결혼식/장례식 세그먼트를 구현했다.
- 비용, 인원·식사, 취소·변경, 현장, 서류 칩 필터를 구현했다.
- 꼭 물어볼 질문 요약 카드와 개별 질문 카드를 구현했다.
- 질문 복사 기능을 `expo-clipboard`로 구현했다.
- 로그인 앱 네비게이터와 비로그인 가이드 네비게이터에 화면을 등록했다.

## 변경하지 않은 영역

- 예식비 진단 계산 로직
- 견적 입력 바텀시트
- 결제/크레딧
- Supabase DB/RPC
- 하객접수/서명패드
- 청첩장/부고장 템플릿

## 주요 결정

- 견적판독기는 기존 기능이 있으므로 제외했다.
- 질문 카드는 데이터 저장 없이 정적 콘텐츠로 시작했다.
- 상담 자리에서 바로 쓰는 기능이므로 `복사` 기능을 넣었다.
- 비회원도 가이드 먼저 보기에서 접근 가능하도록 AuthNavigator에도 등록했다.

## 남은 TODO

- 질문 문구를 실제 상담 사례 기준으로 더 다듬기
- 복사 성공 피드백을 공통 토스트 컴포넌트로 교체할지 검토
- 사용자가 직접 질문을 추가하고 저장하는 기능은 다음 루프에서 검토
- 예식비 진단 결과에서 특정 질문으로 연결하는 딥링크는 추후 검토
