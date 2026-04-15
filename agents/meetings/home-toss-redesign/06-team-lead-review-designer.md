# 06. team-lead의 디자이너 산출물 검토

**일시**: 2026-04-15
**검토자**: team-lead (PM)
**대상**: designer 산출물 (Task #2)

---

## designer 산출물 요약

### 파일
1. `/tmp/homescreen-redesign-spec.md` (920줄, 31KB) — 재설계 spec
   - 회의록 폴더 복사본: `05-designer-spec.md`
2. `04-designer-report.md` — designer가 직접 작성한 회의록

### 핵심 디자인 결정
1. **토스 표준 준수**
   - 카드: `borderRadius: 16`, `shadow: 0 2 8 rgba(0,0,0,0.08)`
   - Primary: `#3182F6`, Text: `#191F28`, Secondary: `#8B95A1`, BG: `#F2F4F6`
   - Typography: Title 22/700 → Section 18/700 → Body 15/600 → Meta 13/400

2. **기능 유지 확인**
   - 48개 체크리스트 → 전부 매핑 완료
   - 헤더(1) + 웰컴(4) + 경조사(2) + 내 주최(탭 2 + 페이지) + 캘린더 + 모달 7개 + 실시간 1 = ✅

3. **이전 실패 회피 전략**
   - ❌ 플랫 → ✅ Shadow + Radius 16
   - ❌ 이모지 → ✅ Ionicons + 실제 이미지 유지
   - ❌ 섹션 제거 → ✅ 5개 메인 섹션 전부 유지
   - ❌ 감각 없는 ListRow → ✅ 좌측 accent bar + 위계

4. **주요 UI 컴포넌트 선택**
   - 세그먼트 컨트롤: Pill 배경 (토스 표준)
   - 경조사 티켓: 좌측 4px accent bar + 날짜 박스 + 정보 + 화살표
   - 모달 애니메이션: slideUp / scale / fadeIn
   - 페이지네이션: 3개씩 점 인디케이터 또는 `< 1/3 >` 형식

---

## team-lead 검토 의견

### ✅ 승인 — frontend 착수 지시

### 강점
1. **이전 실패 원인 4가지를 명확히 인지하고 회피 전략 수립** — 특히 "이모지 금지, 실제 Ionicons/이미지 유지" 원칙은 이번 작업의 핵심
2. **48개 기능 체크리스트를 전부 매핑** — 섹션 누락 위험 없음
3. **좌측 accent bar 티켓 디자인** — 기존 것을 살리면서 토스답게 정돈, 사용자가 "전 디자인이 더 나았다"고 한 부분을 존중
4. **개발자에게 전달할 구체적 가이드** (아이콘 목록, 색상 상수, 애니메이션 코드, 모달 스택) — frontend가 바로 착수 가능

### 주의 포인트 (frontend에게 강조할 것)
1. **웰컴 배너의 fadeAnim 애니메이션 로직은 절대 건드리지 말 것** — 기존 Animated.Value와 useEffect 그대로 유지
2. **7개 모달의 state와 show/hide 핸들러 22개는 완전히 보존** — 모달 JSX 렌더 트리거 조건만 바뀔 뿐 로직은 불변
3. **CalendarComponent와 EventAddModal은 인라인 정의되어 있음** — 이 서브 컴포넌트들도 건드리지 말 것 (인벤토리 참조)
4. **FREE/PREMIUM 분기 조건은 disabled 속성과 스타일에만 적용** — 분기 로직 자체는 유지
5. **실시간 Supabase 구독** (realtimeChannels) — useEffect 그대로 유지

### 다음 단계
- Task #3 frontend 스폰
- 구현 후 `npx expo export --platform web --no-minify`로 syntax 검증 필수
- 구현 후 JSX 태그 balance 검증 필수
