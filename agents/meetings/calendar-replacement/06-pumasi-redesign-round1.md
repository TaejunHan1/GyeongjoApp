# 06. 품앗이 장부 Supabase 기반 재구현 (1차)

**일시**: 2026-04-15
**작업자**: frontend (general-purpose, Sonnet)
**팀**: calendar-replacement
**소요 토큰**: 93,550
**도구 호출**: 29회

---

## 배경

사용자 요청:
- AsyncStorage 기반 품앗이 → Supabase 기반으로 전환
- "내가 받음" = guest_book 자동 연동 (하객이 이미 입력한 데이터)
- "내가 줬음" = 새 pumasi_gave 테이블에 저장
- 기록하기 버튼으로 직접 입력
- 방향 선택(받음/줬음) 불필요 → 탭으로 분리

---

## 생성된 파일

### supabase-migrations/pumasi_gave.sql
```sql
CREATE TABLE IF NOT EXISTS pumasi_gave (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  linked_guest_id uuid,
  recipient_name text NOT NULL,
  amount integer NOT NULL,
  occasion text,
  event_date date,
  settled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE pumasi_gave ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pumasi records"
  ON pumasi_gave FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## HomeScreen.js 변경

### 제거
- 기존 AsyncStorage 기반 pumasiRecords, showPumasiModal, pumasiForm state
- loadPumasiRecords, savePumasiRecord, settlePumasiRecord 함수
- 관련 JSX/모달/스타일 전부

### 추가
- pumasiTab, pumasiReceived, pumasiGave, showPumasiAddModal, pumasiGaveForm, guestBookList state
- loadPumasiReceived() — 내 이벤트의 guest_book 전부 로드
- loadPumasiGave() — pumasi_gave 테이블 로드
- addPumasiGave() — Supabase insert
- settlePumasiGave(id) — settled=true 업데이트
- 탭 UI (내가 받음 / 내가 줬음)
- 줬음 추가 모달 (guest_book 칩 선택 + 직접 입력)

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |

---

## 문제점 (다음 라운드에서 수정)

- 경조사/관계 필터 없음 → 05번 회의록에서 수정
- 받음 항목에서 직접 줬음 기록 불가 → 05번 회의록에서 수정
