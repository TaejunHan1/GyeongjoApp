// ============================================================================
// AI 추천 크레딧 클라이언트
// ----------------------------------------------------------------------------
// - Vercel API 프록시(/api/ai-budget, /api/ai-money) 호출 래퍼
// - 프록시 내부에서 consume_ai_credit RPC 로 무료/크레딧 차감 처리
// - 반환: { success, content?, usedFree?, balance?, error? }
// ----------------------------------------------------------------------------
import { supabase } from './supabase';
import { getCurrentUserInfo } from './supabaseHelper';

const WEB_BASE = 'https://contribution-web-srgt.vercel.app';
const AI_BUDGET_URL = `${WEB_BASE}/api/ai-budget`;
const AI_MONEY_URL  = `${WEB_BASE}/api/ai-money`;

// 기능별 크레딧 차감량 (서버 쪽과 동일하게 유지)
export const AI_COST = {
  budget: 5,
  money: 3,
};

// 내부: 현재 로그인된 userId 얻기
async function resolveUserId(explicitId) {
  if (explicitId) return explicitId;
  const info = await getCurrentUserInfo();
  if (!info?.success || !info.user?.id) return null;
  return info.user.id;
}

// ----------------------------------------------------------------------------
// AI 기능별 상태 조회 — 무료 체험 가능 여부 + 현재 잔액
//   return: { success, budgetFreeAvailable, moneyFreeAvailable, balance }
// ----------------------------------------------------------------------------
export async function getAiStatus(userId = null) {
  const uid = await resolveUserId(userId);
  if (!uid) {
    return {
      success: false,
      budgetFreeAvailable: false,
      moneyFreeAvailable: false,
      balance: 0,
      error: 'not_logged_in',
    };
  }

  const { data, error } = await supabase
    .from('v_user_ai_status')
    .select('balance, budget_free_used, money_free_used')
    .eq('user_id', uid)
    .single();

  if (error) {
    return { success: false, budgetFreeAvailable: false, moneyFreeAvailable: false, balance: 0, error: error.message };
  }

  return {
    success: true,
    budgetFreeAvailable: !data?.budget_free_used,
    moneyFreeAvailable: !data?.money_free_used,
    balance: data?.balance ?? 0,
  };
}

// ----------------------------------------------------------------------------
// 공통: AI 프록시 호출
// ----------------------------------------------------------------------------
async function callAiProxy(url, { userId, prompt, systemPrompt }) {
  const uid = await resolveUserId(userId);
  if (!uid) return { success: false, error: 'not_logged_in' };
  if (!prompt) return { success: false, error: 'missing_prompt' };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid, prompt, systemPrompt }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 402) {
      return {
        success: false,
        error: 'insufficient_balance',
        balance: data?.balance ?? 0,
      };
    }

    if (!res.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || `http_${res.status}`,
        balance: data?.balance,
      };
    }

    return {
      success: true,
      content: data.content,
      usedFree: !!data.usedFree,
      balance: data.balance ?? 0,
    };
  } catch (e) {
    return { success: false, error: 'network_error', message: String(e?.message || e) };
  }
}

// ----------------------------------------------------------------------------
// AI 예산 추천
// ----------------------------------------------------------------------------
export async function callAiBudget({ userId, prompt, systemPrompt } = {}) {
  return callAiProxy(AI_BUDGET_URL, { userId, prompt, systemPrompt });
}

// ----------------------------------------------------------------------------
// AI 축의금 추천
// ----------------------------------------------------------------------------
export async function callAiMoney({ userId, prompt, systemPrompt } = {}) {
  return callAiProxy(AI_MONEY_URL, { userId, prompt, systemPrompt });
}

// ----------------------------------------------------------------------------
// 에러 판별
// ----------------------------------------------------------------------------
export function isInsufficientBalance(result) {
  return !!result && result.success === false && result.error === 'insufficient_balance';
}
