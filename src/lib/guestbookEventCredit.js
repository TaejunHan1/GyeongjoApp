import { supabase } from './supabase';
import { getCurrentUserInfo } from './supabaseHelper';
import { getAlimtalkBalance } from './alimtalkCredit';

export const GUESTBOOK_EVENT_UNLOCK_COST = 1250;

async function resolveUserId(explicitId) {
  if (explicitId) return explicitId;
  const info = await getCurrentUserInfo();
  if (!info?.success || !info.user?.id) return null;
  return info.user.id;
}

export async function getGuestbookEventAccessState({ userId = null, eventId } = {}) {
  const uid = await resolveUserId(userId);
  if (!uid) return { success: false, error: 'not_logged_in', unlocked: false, balance: 0 };
  if (!eventId) return { success: false, error: 'missing_event_id', unlocked: false, balance: 0 };

  const balanceRes = await getAlimtalkBalance(uid);
  const balance = balanceRes?.success ? Number(balanceRes.balance || 0) : 0;

  const { data, error } = await supabase.rpc('get_guestbook_event_access_state', {
    p_event_id: eventId,
  });

  if (!error) {
    const result = Array.isArray(data) ? data[0] : data;
    return {
      success: true,
      unlocked: !!result?.unlocked,
      priceCredits: Number(result?.price_credits || GUESTBOOK_EVENT_UNLOCK_COST),
      balance,
    };
  }

  const fallback = await supabase
    .from('guestbook_event_unlocks')
    .select('event_id, price_credits')
    .eq('event_id', eventId)
    .maybeSingle();

  if (!fallback.error) {
    return {
      success: true,
      source: 'table',
      unlocked: !!fallback.data,
      priceCredits: Number(fallback.data?.price_credits || GUESTBOOK_EVENT_UNLOCK_COST),
      balance,
    };
  }

  return {
    success: true,
    unlocked: false,
    priceCredits: GUESTBOOK_EVENT_UNLOCK_COST,
    balance,
    warning: error.message || fallback.error?.message,
  };
}

export async function unlockGuestbookEvent({
  userId = null,
  eventId,
  price = GUESTBOOK_EVENT_UNLOCK_COST,
} = {}) {
  const uid = await resolveUserId(userId);
  if (!uid) return { success: false, error: 'not_logged_in', unlocked: false, balance: 0 };
  if (!eventId) return { success: false, error: 'missing_event_id', unlocked: false, balance: 0 };

  const cost = Number(price || GUESTBOOK_EVENT_UNLOCK_COST);
  const { data, error } = await supabase.rpc('unlock_guestbook_event_access', {
    p_user_id: uid,
    p_event_id: eventId,
    p_price_credits: cost,
  });

  if (!error) {
    const result = Array.isArray(data) ? data[0] : data;
    return {
      success: !!result?.success,
      unlocked: !!result?.success,
      alreadyUnlocked: !!result?.already_unlocked,
      balance: Number(result?.new_balance || 0),
      error: result?.error || null,
    };
  }

  return {
    success: false,
    unlocked: false,
    error: 'setup_required',
    message: error.message,
    balance: 0,
  };
}
