# 계약 전 질문 카드 QA Report

## 자동 검증

실행함:

```bash
node - <<'NODE'
const fs = require('fs');
const parser = require('@babel/parser');
[
  'src/screens/main/guides/host/ContractQuestionCardsScreen.js',
  'src/screens/main/GuideScreenToss.js',
  'src/screens/main/guides/themes/GuideThemeMinimal.js',
  'src/screens/main/guides/tossStyle.js',
  'src/navigation/AppNavigator.js',
  'src/navigation/AuthNavigator.js',
  'src/screens/event/EventDetailScreen.js',
].forEach(file => {
  parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  console.log(`${file} parse ok`);
});
NODE
```

결과:

- 전체 parse ok

## 수동 QA 체크리스트

- 가이드 탭 진입
- `행사를 준비해요` 선택
- `계약 전 질문 카드` 카드 노출 확인
- 카드 터치 시 화면 진입 확인
- 결혼식/장례식 세그먼트 전환 확인
- 비용, 인원·식사, 취소·변경, 현장, 서류 칩 필터 확인
- 요약 카드 복사 확인
- 개별 질문 복사 확인
- 긴 질문이 카드 밖으로 넘치지 않는지 확인
- 비로그인 `가이드 먼저 보기`에서 화면 진입 확인

## Android 작은 화면 확인

미실행. Galaxy 작은 화면에서 세그먼트, 칩, 질문 카드 줄바꿈 확인 필요.

## Galaxy 키보드 확인

입력창이 없는 기능이라 키보드 영향 없음.

## iPhone Safe Area 확인

미실행. SafeAreaView와 ScrollView 하단 여백 확인 필요.

## 중복 터치 확인

복사 버튼은 클립보드 동작만 수행하므로 서버 중복 위험 없음. 빠른 연속 터치 시 UI가 깨지지 않는지 확인 필요.

## 빈 상태/에러 상태 확인

- 현재 모든 필터에 질문이 존재한다.
- 클립보드 실패 에러 UI는 아직 별도 구현하지 않았다.

## 결제/크레딧 영향 여부

영향 없음.

## 미실행 테스트와 이유

- Expo 런타임 실기기 확인은 아직 실행하지 않았다.
- 비회원 플로우는 네비게이션 등록까지 정적 검증만 수행했다.
