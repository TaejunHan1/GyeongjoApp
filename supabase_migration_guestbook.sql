-- 디지털 방명록 기능을 위한 guest_book 테이블 컬럼 추가
-- Supabase 대시보드 > SQL Editor에서 실행

ALTER TABLE guest_book
  ADD COLUMN IF NOT EXISTS input_method TEXT DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS handwriting_image_url TEXT,
  ADD COLUMN IF NOT EXISTS side TEXT DEFAULT 'groom';

-- input_method 값: 'web' | 'handwriting' | 'manual'
-- side 값: 'groom' | 'bride'

COMMENT ON COLUMN guest_book.input_method IS '입력 방식: web=원거리 부조, handwriting=현장 필기, manual=수동 입력';
COMMENT ON COLUMN guest_book.handwriting_image_url IS '필기 원본 이미지 URL (Supabase Storage)';
COMMENT ON COLUMN guest_book.side IS '신랑측/신부측: groom | bride';
