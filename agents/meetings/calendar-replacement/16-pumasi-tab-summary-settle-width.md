# 16. 품앗이 탭라벨/요약금액/정산토글/너비 수정

**일시**: 2026-04-15
**작업자**: team-lead (직접 수정)
**팀**: calendar-replacement

---

## 수정 내용

### 1. 탭 라벨 "미정산 N" → "줬음 N"
미정산 여부와 무관하게 항상 "줬음 N" 형태로 표시.

### 2. 정산완료 배지 → 토글 버튼
`settlePumasiGave` 제거, `togglePumasiSettle(id, currentSettled)` 추가.
완료 배지를 누르면 미정산으로 되돌림. 미정산 버튼을 누르면 정산완료 처리.

### 3. 받은금액/낸금액 필터 반영
필터 적용 시:
- 받은금액 = `filteredPumasiReceived` 합계
- 낸금액 = `pumasiGave` 중 `linked_guest_id`가 필터된 받음 항목과 연결된 것의 합계
- 라벨에 경조사명 또는 "필터" 표시

필터 없을 때:
- 전체 합계, 라벨 "전체"

### 4. 품앗이 장부 너비
`pmSection.paddingHorizontal: 20` 제거.
outer `content` 스타일이 이미 `paddingHorizontal: 20`을 갖고 있어서 이중 적용되어 다른 섹션보다 좁았음.

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |
