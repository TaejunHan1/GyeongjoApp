# 07. 품앗이 바텀시트 토스 디자인 재구현

**일시**: 2026-04-15
**작업자**: frontend (general-purpose, Sonnet)
**팀**: calendar-replacement
**소요 토큰**: 52,560
**도구 호출**: 17회

---

## 사용자 피드백

> "바텀하단 시트모달이 토스 디자인이야?"
> "신랑측 신부측 선택 했으면 신랑측의 어떤 관계를 특정할건지 신부측의 어떤 관계를 특정할건지에 대한 내용이 있어야 할거 아냐"
> "모달들이 바텀하단시트모달이? 이게 토스디자인이야?"

---

## 문제점 (이전 구현)

| 문제 | 내용 |
|------|------|
| 토스 디자인 미적용 | 그냥 흰 배경 리스트였음, handle bar 없음 |
| 신랑측/신부측 단계 없음 | 경조사 선택 후 바로 관계 선택으로 넘어감 |
| 라디오 버튼 없음 | 항목이 선택됐는지 시각적 구분 불명확 |

---

## 수정 내용

### 토스 바텀시트 디자인 규칙 적용

| 요소 | 스펙 |
|------|------|
| Handle bar | width:40, height:4, borderRadius:2, bg:#E5E8EB, 상단 중앙 |
| 컨테이너 | borderTopRadius:24, paddingHorizontal:20, paddingBottom:40 |
| 제목 | fontSize:20, fontWeight:'800', color:'#191F28' |
| 항목 행 | paddingVertical:16, borderBottom:#F2F4F6 |
| 라디오(비활성) | 22px circle, border:2px #D1D6DB |
| 라디오(활성) | 22px circle, bg:#3182F6, 내부 8px 흰 dot |
| 선택된 텍스트 | color:'#3182F6', fontWeight:'700' |
| 배경 오버레이 | rgba(0,0,0,0.5) |

### 필터 바텀시트 3단계 구조

```
Step 1: 어떤 경조사인가요?
  └── wedding 선택 → Step 2
  └── funeral 선택 → Step 3 (신랑/신부측 건너뜀)

Step 2: 어느 측 하객인가요? (wedding only)
  ├── 신랑측 → Step 3
  └── 신부측 → Step 3

Step 3: 관계를 선택해주세요
  ├── 전체
  └── (선택된 측의 관계 목록 — relation_category 기반)
```

### 신랑측/신부측 필터링 로직

```js
// relation_category 값이 "신랑 친구", "신부 가족" 형태
if (pumasiFilterSide === '신랑측') {
  if (!item.relation_category?.includes('신랑')) return false;
} else if (pumasiFilterSide === '신부측') {
  if (!item.relation_category?.includes('신부')) return false;
}
```

### 새 state

```js
const [pumasiFilterSide, setPumasiFilterSide] = useState(null); // '신랑측' | '신부측' | null
```

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |
