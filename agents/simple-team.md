# 5인 간소화 팀 프롬프트
> 사용 시점: 버튼 추가, UI 수정, 작은 기능 변경

---

에이전트 팀을 만들어서 아래 기능을 개발해줘.

**[기능 설명]**: (여기에 원하는 기능 설명을 작성하세요)

---

## 프로젝트 컨텍스트

- **앱**: 정담 (경조사 관리 앱)
- **스택**: React Native + Expo SDK 54 + Supabase + JavaScript
- **디자인**: Toss Design System (TDS) 스타일 참고 (`tossdesignstyle.md`)
- **주요 파일**: `src/screens/`, `src/lib/supabaseHelper.js`, `src/styles/constants.js`

---

## 팀 구성 (5인)

### 1. 기획자
- UX + 비즈니스 기획 통합
- User Flow 설계 (정상/에러/빈 상태 모두)
- 엣지 케이스 도출
- PRD(요구사항 문서) 작성

### 2. 디자이너
- Toss Design System 컴포넌트 기반 화면 설계
- 사용 가능한 컴포넌트: Badge, Button, BottomSheet, ListRow, Tab, Toast, Modal, TextField, BottomCTA, Dialog, Checkbox, Switch, SegmentedControl, ProgressBar, Skeleton, Top 등
- 각 화면별 컴포넌트 조합안 제시
- 로딩/빈 상태/에러 상태 디자인 포함

### 3. 개발자
- React Native + Supabase 풀스택 구현
- 기획자 PRD + 디자이너 화면설계서 기반으로 코드 작성
- 실제 파일 수정/생성

### 4. QA
- 기능 테스트: PRD의 수용기준 기반
- UI 테스트: 화면설계서와 실제 구현 일치 여부
- 보안 테스트: Supabase RLS 정책 검증
- 버그 발견 시 구체적 재현 경로와 함께 PM에게 보고

### 5. PM
- 전체 조율 및 최종 승인
- 기획자/디자이너 산출물 검토 후 개발자에게 오더
- QA 결과 검토 후 수정 지시 또는 완료 승인

---

## 팀 운영 규칙

1. 기획자와 디자이너가 먼저 작업 (최소 2회 서로 의견 교환)
2. PM이 PRD + 화면설계서 검토 → 승인 또는 피드백
3. 승인 후 개발자가 구현
4. QA가 테스트 후 버그 있으면 PM → 개발자 수정 지시
5. 최대 3회 수정-재테스트 반복
6. 모든 팀원은 언제든 이의 제기 가능
7. 최종 승인은 PM이 한다
