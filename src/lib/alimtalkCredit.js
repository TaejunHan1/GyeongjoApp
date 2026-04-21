// ============================================================================
// 카카오 알림톡 크레딧 관리
// ----------------------------------------------------------------------------
// - 앱 내에서 알림톡 발송할 때 잔액 차감 → 발송 → 실패 시 자동 환불
// - 웹 경로(QR 부조 제출)는 무료이므로 이 파일과 무관
// ============================================================================

import { supabase } from './supabase';
import { getCurrentUserInfo } from './supabaseHelper';

const ALIMTALK_API_URL =
  'https://contribution-web-srgt.vercel.app/api/send-alimtalk-receipt';

// ----------------------------------------------------------------------------
// 내부: 현재 로그인된 userId 얻기
// ----------------------------------------------------------------------------
async function resolveUserId(explicitId) {
  if (explicitId) return explicitId;
  const info = await getCurrentUserInfo();
  if (!info?.success || !info.user?.id) return null;
  return info.user.id;
}

// ----------------------------------------------------------------------------
// 현재 잔액 조회
//   return: { success, balance, error? }
// ----------------------------------------------------------------------------
export async function getAlimtalkBalance(userId = null) {
  const uid = await resolveUserId(userId);
  if (!uid) return { success: false, balance: 0, error: 'not_logged_in' };

  const { data, error } = await supabase
    .from('users')
    .select('alimtalk_balance')
    .eq('id', uid)
    .single();

  if (error) return { success: false, balance: 0, error: error.message };
  return { success: true, balance: data?.alimtalk_balance ?? 0 };
}

// ----------------------------------------------------------------------------
// 알림톡 발송 (크레딧 1건 차감)
//
// 흐름:
//   1) deduct_alimtalk_credit RPC → 잔액 부족이면 바로 실패 반환
//   2) 웹 API로 실제 발송 요청
//   3) 발송 실패 시 refund_alimtalk_credit으로 되돌림
//
// 반환:
//   { success: true,  balance }                               // 정상 발송
//   { success: false, error: 'insufficient_balance', balance } // 잔액 부족
//   { success: false, error: 'send_failed', balance, refunded: true, message }
//   { success: false, error: 'not_logged_in' | 'deduct_failed' | ... }
// ----------------------------------------------------------------------------
export async function sendAlimtalkWithCredit({
  userId,
  eventId,
  contributionId,
  phone,
  guestName,
  amount,
  side,
  relationship,
  isResend = false,
}) {
  const uid = await resolveUserId(userId);
  if (!uid) return { success: false, error: 'not_logged_in' };

  // --- 1) 크레딧 차감 (원자적) ---
  const { data: deductData, error: deductError } = await supabase.rpc(
    'deduct_alimtalk_credit',
    {
      p_user_id: uid,
      p_event_id: eventId ?? null,
      p_contribution_id: contributionId ?? null,
    }
  );

  if (deductError) {
    return {
      success: false,
      error: 'deduct_failed',
      message: deductError.message,
    };
  }

  const deduct = Array.isArray(deductData) ? deductData[0] : deductData;
  if (!deduct?.success) {
    return {
      success: false,
      error: deduct?.error || 'deduct_failed',
      balance: deduct?.new_balance ?? 0,
    };
  }

  // --- 2) 웹 API로 실제 알림톡 발송 ---
  const cleanPhone = String(phone || '').replace(/-/g, '').trim();
  let apiResult = null;
  try {
    const res = await fetch(ALIMTALK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        guestName,
        amount,
        side: side || 'groom',
        relationship: relationship || 'other',
        eventId,
        contributionId,
        isResend,
      }),
    });
    apiResult = await res.json();
  } catch (e) {
    apiResult = { success: false, error: e?.message || 'network_error' };
  }

  // --- 3) 발송 실패 시 환불 ---
  if (!apiResult?.success) {
    const { data: refundData } = await supabase.rpc('refund_alimtalk_credit', {
      p_user_id: uid,
      p_event_id: eventId ?? null,
      p_contribution_id: contributionId ?? null,
      p_reason: `send_failed:${apiResult?.error || 'unknown'}`.slice(0, 200),
    });
    const refund = Array.isArray(refundData) ? refundData[0] : refundData;

    return {
      success: false,
      error: 'send_failed',
      message: apiResult?.error || 'unknown',
      balance: refund?.new_balance ?? deduct.new_balance,
      refunded: true,
    };
  }

  // --- 4) 성공 ---
  return { success: true, balance: deduct.new_balance };
}

// ----------------------------------------------------------------------------
// 잔액 부족 에러 판별 헬퍼
// ----------------------------------------------------------------------------
export function isInsufficientBalanceError(result) {
  return result && !result.success && result.error === 'insufficient_balance';
}
