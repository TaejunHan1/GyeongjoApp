// ============================================================================
// 전화번호 정규화/비교 유틸
// ----------------------------------------------------------------------------
// DB에 +82 형식과 010 형식이 섞여 저장되어 있어 항상 표준화 후 비교해야 함.
// ============================================================================

/**
 * 어떤 형식이든 '01012345678' 형태(숫자 11자리, 010 시작)로 정규화.
 * 변환 불가 시 숫자만 뽑아서 반환.
 *
 *   '+821012345678' → '01012345678'
 *   '010-1234-5678' → '01012345678'
 *   '01012345678'   → '01012345678'
 *   '821012345678'  → '01012345678'
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits) return '';
  // +82 or 82 prefix
  if (digits.startsWith('82') && digits.length >= 11) {
    return '0' + digits.slice(2);
  }
  return digits;
}

/**
 * 두 전화번호를 정규화 후 비교. 빈값은 일치로 보지 않음.
 */
export function samePhone(a, b) {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  return na !== '' && na === nb;
}

/**
 * 한국 휴대폰 번호 형식으로 유효한지 판단 (010 + 8자리)
 */
export function isValidKoreanMobile(phone) {
  const n = normalizePhone(phone);
  return n.length === 11 && n.startsWith('010');
}
