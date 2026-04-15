# 10. 품앗이 relation_detail 수정

**일시**: 2026-04-15
**작업자**: team-lead (직접 수정)
**팀**: calendar-replacement

---

## 사용자 피드백

> "guest_book 테이블에 relation_detail 부분이 있는데 왜 못불러와"

---

## 원인

`loadPumasiReceived` 의 select 쿼리에서 `relation_detail` 컬럼을 빠뜨림:
```js
// 잘못된 코드
.select('id, guest_name, amount, relation_category, event_id, created_at')
```

그리고 필터 로직이 `relation_category` 기반으로만 작성되어 세부 관계를 전혀 활용하지 못했음.

---

## 수정 내용

### 1. select 쿼리에 relation_detail 추가
```js
.select('id, guest_name, amount, relation_category, relation_detail, event_id, created_at')
```

### 2. 필터 로직 수정
```js
// 신랑측/신부측: relation_category 기준
if (pumasiFilterSide && item.relation_category !== pumasiFilterSide) return false;

// 친구/가족/친척 등: relation_detail 기준
if (pumasiFilterRelation && item.relation_detail !== pumasiFilterRelation) return false;
```

### 3. availableRelations — relation_detail 기반
```js
.map(g => g.relation_detail)  // relation_category → relation_detail 로 변경
```

### 4. 표시 텍스트
```
신랑측 친구 형태로: {relation_category} {relation_detail}
```

---

## guest_book 컬럼 구조 (확인됨)

| 컬럼 | 값 예시 |
|------|---------|
| relation_category | '신랑측', '신부측' |
| relation_detail | '친구', '가족', '친척', '직장동료' 등 |

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |
