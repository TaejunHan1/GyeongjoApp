-- ─────────────────────────────────────────────────────────────
-- Storage bucket 정책만 따로 (bucket 자체는 대시보드에서 만든 후 실행)
-- ─────────────────────────────────────────────────────────────

-- 만약 bucket을 SQL로 만들고 싶다면:
INSERT INTO storage.buckets (id, name, public)
VALUES ('paper-invitations', 'paper-invitations', true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 정책 (RLS) — 본인 폴더에만 업로드, 모두 조회 가능
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can view paper invitation images" ON storage.objects;
CREATE POLICY "Anyone can view paper invitation images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'paper-invitations');

DROP POLICY IF EXISTS "Users can upload paper invitation images" ON storage.objects;
CREATE POLICY "Users can upload paper invitation images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'paper-invitations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their paper invitation images" ON storage.objects;
CREATE POLICY "Users can update their paper invitation images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'paper-invitations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their paper invitation images" ON storage.objects;
CREATE POLICY "Users can delete their paper invitation images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'paper-invitations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
