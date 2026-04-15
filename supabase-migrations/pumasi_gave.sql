-- 품앗이 장부: 내가 다른 사람 경조사에 줬음 기록
CREATE TABLE IF NOT EXISTS pumasi_gave (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  linked_guest_id uuid,          -- guest_book.id 연결 (nullable)
  recipient_name text NOT NULL,   -- 받은 사람 이름
  amount integer NOT NULL,        -- 내가 준 금액
  occasion text,                  -- 경조사 종류 (결혼, 장례 등)
  event_date date,
  settled boolean DEFAULT false,  -- 상환 완료 여부
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE pumasi_gave ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pumasi records"
  ON pumasi_gave FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
