-- ─────────────────────────────────────────────────────────────
-- 종이 청첩장 (Paper Invitations) 테이블
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS paper_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 선택한 템플릿
  template_id text NOT NULL,         -- e.g. 'floral-classic'
  category text NOT NULL,            -- floral / minimal / modern / vintage / korean

  -- 사용자 입력 데이터
  groom text,
  bride text,
  date_str text,                     -- '2026.10.17 SAT'
  time_str text,                     -- '2:00 PM'
  venue text,                        -- '그랜드 하얏트 서울'
  address text,                      -- '서울시 용산구 한남대로 123'
  photo_url text,                    -- Supabase Storage 경로

  -- 사용자가 드래그/리사이즈로 조정한 레이아웃 (JSON)
  -- { photo: {x,y,w,h}, names: {x,y,size}, date: {x,y,size}, venue: {x,y,size} }
  -- 좌표는 percent (0~100), size는 pt (260 base 기준)
  layout jsonb DEFAULT '{}'::jsonb,

  -- 상태
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  pdf_url text,                      -- 완성된 PDF 경로 (선택)

  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_paper_invitations_user
  ON paper_invitations(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- updated_at 자동 갱신 트리거
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_paper_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_paper_invitations_updated_at ON paper_invitations;
CREATE TRIGGER trg_paper_invitations_updated_at
  BEFORE UPDATE ON paper_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_paper_invitations_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE paper_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own paper invitations" ON paper_invitations;
CREATE POLICY "Users can view their own paper invitations"
  ON paper_invitations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own paper invitations" ON paper_invitations;
CREATE POLICY "Users can insert their own paper invitations"
  ON paper_invitations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own paper invitations" ON paper_invitations;
CREATE POLICY "Users can update their own paper invitations"
  ON paper_invitations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own paper invitations" ON paper_invitations;
CREATE POLICY "Users can delete their own paper invitations"
  ON paper_invitations FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket for invitation photos (run in Supabase dashboard or via SQL)
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('paper-invitations', 'paper-invitations', true)
ON CONFLICT (id) DO NOTHING;

-- 본인 파일만 업로드/수정/삭제, 모두 조회 가능
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

-- 사용 예시:
-- 사진 업로드 경로: paper-invitations/{user_id}/{invitation_id}/main.jpg
