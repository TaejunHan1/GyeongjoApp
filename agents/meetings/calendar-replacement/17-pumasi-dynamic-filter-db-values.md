# 17. 품앗이 필터 DB 실제 값으로 동적 표시

**일시**: 2026-04-15
**작업자**: team-lead (직접 수정)
**팀**: calendar-replacement

---

## 사용자 피드백

> "groom other 이런거로 저장되어있는 사람들이 있어서 금액이 이상하게 잡히네"
> "데이터베이스에 있는 relation 컬럼값들을 다 보여줘야겠네"

---

## 원인

- Step 2에서 `['신랑측', '신부측']` 하드코딩 → DB에 'groom', 'bride', 'groom other', '미분류' 등 다양한 값이 있어서 매칭 안 됨
- 필터 적용 시 해당 값들이 제외되어 받은 금액 집계 오류

---

## 수정 내용

### availableSides 추가 (relation_category DB 실제 값)
```js
const availableSides = pumasiFilterEvent
  ? [...new Set(pumasiReceived
      .filter(g => g.event_id === pumasiFilterEvent.id)
      .map(g => g.relation_category)
      .filter(Boolean))]
  : [];
```

### Step 2: 하드코딩 제거 → availableSides 동적 렌더링
- '전체' 선택지 추가 (null = 필터 없음)
- 다음 버튼 항상 활성화 (전체 선택 가능)

### Step 1 → Step 2 진입 조건
- 기존: `event_type === 'wedding'` 일 때만 Step 2
- 수정: `availableSides.length > 0` 일 때 Step 2, 없으면 바로 Step 3

### availableRelations (relation_detail)
- 기존과 동일하게 DB 실제 값 동적 표시 유지

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |
