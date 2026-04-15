# 10인 기본 팀 프롬프트
> 사용 시점: 새 화면 추가, API 연동, 일반 기능 개발

---

에이전트 팀을 만들어서 아래 기능을 개발해줘.

**[기능 설명]**: (여기에 원하는 기능 설명을 작성하세요)

---

## 프로젝트 컨텍스트

- **앱**: 정담 (경조사 관리 앱)
- **스택**: React Native + Expo SDK 54 + Supabase + JavaScript
- **디자인**: Toss Design System (TDS) 스타일 참고 (`tossdesignstyle.md`)
- **주요 파일**: `src/screens/`, `src/lib/supabaseHelper.js`, `src/styles/constants.js`
- **네비게이션**: React Navigation 6 (Bottom Tab + Stack)
- **인증**: 전화번호 OTP (Twilio)

---

## 팀 구성 (10인)

### 1. 기획자A (UX 기획)
- 사용자 관점 기능 분석
- User Flow 설계 (정상/에러/엣지케이스/빈 상태)
- 한국 경조사 문화 특성 반영

### 2. 기획자B (비즈니스 기획)
- 비즈니스 요구사항 분석
- 유사 서비스 분석 (토스, 청첩장 앱 등)
- 기능 우선순위 및 수익화 관점 검토

### 3. 디자이너A (UI 설계)
- TDS 컴포넌트 기반 화면 설계
- 컴포넌트: Badge, Button, BottomSheet, ListRow, Tab, Toast, Modal, TextField, BottomCTA, Dialog, Checkbox, Switch, SegmentedControl, ProgressBar, Skeleton, Top, TableRow, Rating 등
- 화면별 컴포넌트 조합 및 네비게이션 흐름도

### 4. 디자이너B (UX 디자인)
- 인터랙션 패턴 (애니메이션, 트랜지션)
- 로딩/빈 상태/에러 상태 디자인
- 접근성 및 다양한 화면 크기 대응

### 5. PM (프로젝트 매니저)
- 기획팀 PRD + 디자인팀 화면설계서 수령 및 검토
- 기술적 타당성 검토
- 태스크를 프론트엔드/백엔드로 분리하여 개발자에게 오더
- QA 결과 검토 후 최종 판단

### 6. 프론트엔드 개발자
- React Native + Expo로 화면 구현
- TDS 스타일 컴포넌트 사용
- 네비게이션 연결
- 실제 파일 수정/생성

### 7. 백엔드 개발자
- Supabase 테이블/RLS 정책 설계
- Edge Function 또는 Database Function 구현
- 인증/권한 처리
- SQL 마이그레이션 파일 작성

### 8. QA 테스터A (기능 테스트)
- PRD 수용기준(AC) 기반 테스트
- 기획자가 설계한 User Flow 검증
- 엣지 케이스 테스트
- 버그 발견 시 재현 경로 포함하여 PM에게 보고

### 9. QA 테스터B (UI/UX 테스트)
- 화면설계서와 실제 구현 일치 여부 검증
- TDS 컴포넌트 Props 올바른 적용 확인
- 반응형/다양한 화면 크기 확인

### 10. QA 테스터C (보안/성능 테스트)
- Supabase RLS 정책 검증 (다른 사용자 데이터 접근 차단 확인)
- SQL Injection, XSS 등 보안 취약점 체크
- 불필요한 리렌더링 및 메모리 누수 확인

---

## 팀 운영 규칙

1. **기획팀 토론**: 기획자A와 B가 최소 3회 의견 교환 후 PRD 완성
2. **디자인팀 토론**: 디자이너A와 B가 최소 2회 의견 교환 후 화면설계서 완성
3. **PM 검토**: PRD + 화면설계서 검토 → 부족한 점은 해당 팀에 피드백 → 재작업 요청 가능
4. **개발**: PM 승인 후 프론트엔드/백엔드 동시 진행
5. **QA 사이클**: 테스트 → 버그 PM 보고 → PM이 개발자에게 수정 지시 → 재테스트 (최대 3회)
6. **이의 제기**: 모든 팀원은 다른 팀원의 결론에 언제든 이의 제기 가능
7. **최종 승인**: PM이 한다
