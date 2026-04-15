# 05. 품앗이 장부 UX 재수정 (2차)

**일시**: 2026-04-15
**작업자**: frontend (general-purpose, Sonnet)
**팀**: calendar-replacement
**소요 토큰**: 47,319
**도구 호출**: 18회

---

## 사용자 피드백 (1차 구현 후)

> "어떤 경조사의 어떤 관계를 특정할건지를 내가 하라고 하지 않았어?"
> "내가 받음 부분에서 버튼 눌러서 기록 부분이 열리게 되었을 경우 줬음 기록하기가 올라왔을때 이름이랑 금액은 내가 받음 그대로 불러오고 수정이 가능하긴 하지만"
> "버튼을 만들어서 하게 되면 내 경조사 목록을 바텀 하단 시트모달로 불러와서 선택하고 다음 어떤 관계를 특정해서 갖고올까요 부분 나와서 뭐 다음 눌러서 하게 되어서 내가 받음 부분을 불러와야지"

---

## 1차 구현의 문제점

| 문제 | 내용 |
|------|------|
| 경조사/관계 필터 없음 | guest_book 전체를 그냥 보여줬음 |
| 받음 → 줬음 기록 연결 없음 | 별도 "+ 기록" 버튼으로만 추가 가능했음 |
| 자동채움 없음 | 줬음 추가 시 이름/금액 직접 입력해야 했음 |

---

## 2차 수정 내용

### 새 UX 흐름

```
내가 받음 탭
├── [경조사·관계 선택] 필터 버튼
│   └── 탭 → 바텀시트 Step 1: 내 경조사 선택
│           └── 선택 → Step 2: 관계 선택 (해당 경조사의 관계 목록 자동 추출)
│                   └── 선택 → 필터 적용된 목록 표시
│
└── 각 항목에 [줬음 기록] 버튼
    └── 탭 → 줬음 기록 바텀시트 (이름/금액/경조사종류 자동채움, 수정 가능)
```

### 추가된 state

| state | 역할 |
|-------|------|
| pumasiFilterEvent | 선택된 경조사 객체 { id, event_name, event_type } |
| pumasiFilterRelation | 선택된 관계 문자열 |
| showPumasiFilterSheet | 필터 바텀시트 표시 여부 |
| pumasiFilterStep | 1=경조사선택, 2=관계선택 |
| showPumasiGaveSheet | 줬음 기록 바텀시트 표시 여부 |

### 필터링 로직

```js
const filteredPumasiReceived = pumasiReceived.filter(item => {
  if (pumasiFilterEvent && item.event_id !== pumasiFilterEvent.id) return false;
  if (pumasiFilterRelation && item.relation_category !== pumasiFilterRelation) return false;
  return true;
});

const availableRelations = pumasiFilterEvent
  ? [...new Set(pumasiReceived
      .filter(g => g.event_id === pumasiFilterEvent.id)
      .map(g => g.relation_category).filter(Boolean))]
  : [];
```

### 줬음 기록 자동채움

받음 항목의 [줬음 기록] 버튼 탭 시:
```js
setPumasiGaveForm({
  recipient_name: item.guest_name,       // 자동채움
  amount: String(item.amount || ''),     // 자동채움 (수정 가능)
  occasion: event_type 기반 자동변환,    // wedding→결혼, funeral→장례
  event_date: 오늘 날짜,
  linked_guest_id: item.id,              // guest_book 연결
});
```

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |

---

## DB 관련

- pumasi_gave 테이블 SQL: `supabase-migrations/pumasi_gave.sql`
- **사용자가 Supabase 대시보드 SQL Editor에서 직접 실행 필요**
