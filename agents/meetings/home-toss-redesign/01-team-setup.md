# 01. 팀 구성 및 태스크 설정

**일시**: 2026-04-15
**주관**: team-lead (PM, Opus 4.6)

---

## 팀 구성 (4인 실무 + PM 1인)

| 이름 | 역할 | 모델/타입 | 주요 책임 |
|------|------|-----------|-----------|
| **team-lead** | PM | Opus 4.6 (메인 세션) | 전체 조율, 최종 승인, 회의록 관리 |
| **planner** | 기획자 | Explore 서브에이전트 | 현재 HomeScreen 기능 전수 분석, 체크리스트 작성 |
| **designer** | 디자이너 | Explore 서브에이전트 | 토스 스타일 재설계 spec 작성 |
| **frontend** | 개발자 | general-purpose 서브에이전트 | 실제 코드 구현 (JSX + styles) |
| **qa** | QA | Explore 서브에이전트 | 기능 유지 검증, 디자인 품질 검증 |

---

## 팀원 선정 근거

### 왜 4인 축소인가
- basic-team.md(10인)의 백엔드, 비즈니스 기획, 보안 QA는 이번 UI-only 작업에 불필요
- 실무적으로 사이클이 빨라야 함 (이전에 혼자 해서 망한 경험 있음)
- 각 역할이 명확하게 분리됨

### 왜 기획자가 먼저 분석하는가
이전 실패의 가장 큰 원인이 **"기존에 뭐가 있는지 충분히 인지하지 못한 채 리디자인"**이었음.
기획자가 HomeScreen의 모든 기능을 카탈로그화하지 않으면, 디자이너가 기능을 누락하거나 개발자가 섹션을 삭제해버릴 위험이 있음.

### 왜 Explore를 많이 쓰는가
- planner, designer, qa는 **코드를 수정할 필요 없음** (분석·설계·검증만 함)
- Explore는 Read/Grep/Glob만 가능하므로 실수로 코드 손상시킬 위험 없음
- frontend만 general-purpose (실제 파일 수정 필요)

---

## 태스크 의존성

```
#1 기능 인벤토리 (planner)
    ↓ blocks
#2 재설계 spec (designer)
    ↓ blocks
#3 코드 구현 (frontend)
    ↓ blocks
#4 QA 검증 (qa)
```

순차 실행. 선행 작업 완료 후 다음 단계 진행.

---

## 생성된 태스크

### Task #1: HomeScreen 기능 전수 분석 및 보존 체크리스트 작성
- **담당**: planner
- **산출물**: `/tmp/homescreen-feature-inventory.md`
- **포함 항목**: State, Ref, 핸들러, 섹션, 모달, 네비게이션, Supabase 데이터, 구독 등급 분기, 애니메이션

### Task #2: 토스 디자인 스타일 HomeScreen 재설계안 작성
- **담당**: designer
- **산출물**: `/tmp/homescreen-redesign-spec.md`
- **의존**: #1 완료 후 시작
- **포함 항목**: wireframe, 섹션별 컴포넌트 매핑, 색상 팔레트, typography, spacing, 상태별 디자인

### Task #3: 재설계안 기반 HomeScreen 코드 구현
- **담당**: frontend
- **산출물**: 수정된 `src/screens/main/HomeScreen.js`
- **의존**: #2 완료 후 시작
- **제약**: JSX + StyleSheet만 수정, 로직은 건드리지 않음

### Task #4: 기능 유지 및 디자인 품질 QA
- **담당**: qa
- **산출물**: `/tmp/homescreen-qa-report.md`
- **의존**: #3 완료 후 시작
- **검증 기준**: 인벤토리(#1) 체크리스트 모든 항목 통과 여부

---

## 스폰 순서

team-lead는 태스크 의존성을 고려해 다음과 같이 스폰:

1. **planner + designer** 동시 스폰 (designer는 TaskList polling으로 planner 완료 대기)
2. planner 완료 통지 수령 → designer에게 시작 지시
3. designer 완료 → frontend 스폰
4. frontend 완료 → qa 스폰
5. qa 통과 → team-lead 최종 승인 → 사용자에게 보고

**현재 시점**: planner 실행 중, designer는 Explore 특성상 대기 상태 유지 불가로 종료됨. planner 완료 후 재스폰 예정.
