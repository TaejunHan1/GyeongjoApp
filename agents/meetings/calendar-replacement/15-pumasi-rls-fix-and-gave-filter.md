# 15. 품앗이 RLS 오류 수정 + 줬음 기록 후 받음 목록 제거

**일시**: 2026-04-15
**작업자**: team-lead (직접 수정)
**팀**: calendar-replacement

---

## 이슈 1: RLS 42501 오류

### 원인
앱이 Twilio 폰 인증을 사용하므로 `userInfo.userId`는 custom `users` 테이블 UUID.
`signInAnonymously()`로 만들어진 Supabase 익명 세션의 `auth.uid()`는 별개의 UUID.
insert 시 `user_id = userInfo.userId`를 넣으면 RLS `auth.uid() = user_id` 조건 불일치 → 42501.

### 수정
`getSupabaseAuthId()` 헬퍼 추가 — `supabase.auth.getSession()`으로 실제 `auth.uid()` 획득:

```js
const getSupabaseAuthId = async () => {
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  return currentSession?.user?.id || null;
};
```

`addPumasiGave`, `loadPumasiGave` 모두 이 값을 `user_id`로 사용.

### RLS 정책
`auth.uid() = user_id` 원래 정책 그대로 유지 (보안 정상).

---

## 이슈 2: 줬음 기록 후 받음 목록에서 사라지지 않음

### 원인
`filteredPumasiReceived`에서 이미 줬음 기록이 있는 항목을 걸러내지 않았음.

### 수정
`linked_guest_id` 기반으로 이미 기록된 항목 제외:

```js
const gaveLinkedIds = new Set(pumasiGave.map(g => g.linked_guest_id).filter(Boolean));

const filteredPumasiReceived = pumasiReceived.filter(item => {
  if (gaveLinkedIds.has(item.id)) return false;
  // ...기존 필터 조건
  return true;
});
```

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |
