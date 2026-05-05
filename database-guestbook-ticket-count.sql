-- ============================================================================
-- 하객 접수 식권 수 저장
-- ----------------------------------------------------------------------------
-- - guest_book 한 행마다 하객이 요청한 식권 수를 저장
-- - 0이면 식권 없음
-- ============================================================================

ALTER TABLE guest_book
  ADD COLUMN IF NOT EXISTS ticket_count integer NOT NULL DEFAULT 0;

ALTER TABLE guest_book
  DROP CONSTRAINT IF EXISTS guest_book_ticket_count_nonneg;
ALTER TABLE guest_book
  ADD CONSTRAINT guest_book_ticket_count_nonneg
  CHECK (ticket_count >= 0);

COMMENT ON COLUMN guest_book.ticket_count IS '하객 접수 시 요청한 식권 수';

CREATE INDEX IF NOT EXISTS guest_book_event_ticket_count_idx
  ON guest_book (event_id, ticket_count)
  WHERE ticket_count > 0;
