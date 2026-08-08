# 루프 상태

## 현재 목표

정담 앱에 이미 있는 견적 판독/예식비 진단과 겹치지 않는 신규 가이드 기능을 추가한다.

## 현재 루프

- 번호: 6
- 상태: 진행 완료
- 날짜: 2026-07-08

## 이번 루프 요약

- 사용자가 견적판독기는 이미 가이드에 있다고 지적했다.
- 견적 계산/판독은 제외하고 `계약 전 질문 카드` 기능으로 방향을 확정했다.
- 주최자 가이드에 새 카드를 추가했다.
- 결혼식/장례식 계약 전 질문 화면을 새로 만들었다.
- 로그인/비로그인 네비게이션 모두에 화면을 등록했다.
- 예식비 진단, 크레딧, DB, 하객접수, 청첩장/부고장 템플릿은 수정하지 않았다.

## 이번에 파악한 앱 강점

- 가이드 탭 안에 예식비 진단과 준비 가이드가 이미 있다.
- 주최자/참여자 가이드 구조가 분리되어 새 주최자 기능을 넣기 쉽다.
- 공통 토스 스타일 카드, 칩, 헤더 패턴이 있다.
- 비회원도 가이드 먼저 보기로 일부 가이드를 볼 수 있다.

## 기존 기능 제외 목록

- 예식비 진단
- 견적 판독
- 가격 퍼센트 계산
- 비용 지도
- 청첩장/부고장 제작
- 하객접수
- 누가 얼마 냈는지 확인
- 감사 메시지
- 챙길 경조사

## 현재 빈틈

- 상담 자리에서 무엇을 물어봐야 하는지 모르는 문제는 기존 계산 기능과 다르다.
- 구두 약속, 특약, 취소 위약금, 보증인원, 빈소료 기준처럼 계약서에 남겨야 할 항목을 빠르게 볼 필요가 있다.
- 장례식장 계약 질문은 결혼식보다 더 급하게 필요하지만 앱 내 정보가 상대적으로 약하다.

## 최종 선정한 기능 3개

1. 계약 전 질문 카드: 상담 전에 꼭 물어볼 질문과 위험 신호를 카드로 제공
2. 행사 마감 플로우: 식대, 접수액, 답례, 내보내기를 한 흐름으로 마감
3. 장례 일정/장지 안내 고도화: 입관, 발인, 장지, 조문 가능 시간 구조화

## 1순위 기능

계약 전 질문 카드

선정 이유:

- 기존 견적 진단과 겹치지 않는다.
- 결혼식과 장례식 모두에 적용된다.
- DB 없이 빠르게 MVP를 만들 수 있다.
- 사용자가 상담 현장에서 바로 쓸 수 있다.
- 정담의 가이드 탭에 자연스럽게 들어간다.

## 실제 개발한 첫 MVP 내용

- `src/screens/main/guides/host/ContractQuestionCardsScreen.js` 생성
- 결혼식/장례식 세그먼트 추가
- 비용, 인원·식사, 취소·변경, 현장, 서류 필터 칩 추가
- 꼭 물어볼 질문 요약 카드 추가
- 질문별 이유, 확인 항목, 위험 신호 카드 추가
- 질문 복사 기능 추가
- `GuideScreenToss.js` 주최자 가이드 카드 추가
- `AppNavigator.js`, `AuthNavigator.js` 화면 등록
- `GuideThemeMinimal.js`, `tossStyle.js` 아이콘 버블 색상 등록

## 생성한 문서

- `docs/agent/features/2026-07-08-contract-question-cards/FEATURE_SPEC.md`
- `docs/agent/features/2026-07-08-contract-question-cards/IMPLEMENTATION_LOG.md`
- `docs/agent/features/2026-07-08-contract-question-cards/QA_REPORT.md`

## 이번 루프 검증

- `ContractQuestionCardsScreen.js` JSX parse OK
- `GuideScreenToss.js` JSX parse OK
- `GuideThemeMinimal.js` JSX parse OK
- `tossStyle.js` JSX parse OK
- `AppNavigator.js` JSX parse OK
- `AuthNavigator.js` JSX parse OK
- `EventDetailScreen.js` JSX parse OK
- Expo 런타임, Android/Galaxy, iOS Safe Area 실기기 확인은 미실행

## 다음 루프 제안

1. 계약 전 질문 카드 실기기 UI 확인
2. 질문 문구를 실제 상담 사례 기준으로 더 날카롭게 다듬기
3. 사용자가 직접 질문을 추가하고 저장하는 기능 검토
4. 예식비 진단 결과에서 관련 질문 카드로 연결하는 흐름 검토

## 남은 문제

- 예식비 진단 화면은 최근 수정이 많아 실제 Android/Galaxy 입력 플로우 확인이 필요하다.
- 결제/크레딧 경로는 별도 루프로 회귀 테스트 항목을 만들어야 한다.
- 웹 repo와 앱 repo를 같이 다루는 작업의 기준 문서가 아직 없다.
- 실제 디자인 컴포넌트 규격을 별도 디자인 시스템 문서로 분리할 필요가 있다.
