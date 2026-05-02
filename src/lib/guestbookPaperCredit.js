import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getCurrentUserInfo } from './supabaseHelper';
import { getAlimtalkBalance } from './alimtalkCredit';

const LOCAL_KEY_PREFIX = 'guestbook_paper_purchases:';

async function resolveUserId(explicitId) {
  if (explicitId) return explicitId;
  const info = await getCurrentUserInfo();
  if (!info?.success || !info.user?.id) return null;
  return info.user.id;
}

const localKey = (userId) => `${LOCAL_KEY_PREFIX}${userId}`;

async function readLocalOwned(userId) {
  try {
    const raw = await AsyncStorage.getItem(localKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function saveLocalOwned(userId, templateIds) {
  const unique = Array.from(new Set((templateIds || []).filter(Boolean)));
  await AsyncStorage.setItem(localKey(userId), JSON.stringify(unique));
  return unique;
}

async function rememberLocalOwned(userId, templateId) {
  const current = await readLocalOwned(userId);
  if (!current.includes(templateId)) current.push(templateId);
  return saveLocalOwned(userId, current);
}

export async function getGuestbookPaperPurchaseState(userId = null) {
  const uid = await resolveUserId(userId);
  if (!uid) {
    return { success: false, error: 'not_logged_in', templateIds: [], balance: 0 };
  }

  const balanceRes = await getAlimtalkBalance(uid);
  const localIds = await readLocalOwned(uid);

  const { data, error } = await supabase
    .from('guestbook_paper_purchases')
    .select('template_id')
    .eq('user_id', uid);

  if (error) {
    return {
      success: true,
      source: 'local',
      templateIds: localIds,
      balance: balanceRes?.success ? balanceRes.balance : 0,
      warning: error.message,
    };
  }

  const serverIds = (data || []).map((row) => row.template_id).filter(Boolean);
  const templateIds = Array.from(new Set([...serverIds, ...localIds]));
  if (templateIds.length !== localIds.length) {
    await saveLocalOwned(uid, templateIds);
  }

  return {
    success: true,
    source: 'server',
    templateIds,
    balance: balanceRes?.success ? balanceRes.balance : 0,
  };
}

export async function purchaseGuestbookPaperTemplate({
  userId = null,
  eventId = null,
  templateId,
  price,
}) {
  const uid = await resolveUserId(userId);
  if (!uid) return { success: false, error: 'not_logged_in', balance: 0 };
  if (!templateId) return { success: false, error: 'missing_template_id', balance: 0 };

  const cost = Number(price || 0);
  if (cost <= 0) {
    await rememberLocalOwned(uid, templateId);
    const balanceRes = await getAlimtalkBalance(uid);
    return {
      success: true,
      templateId,
      balance: balanceRes?.success ? balanceRes.balance : 0,
      alreadyOwned: true,
    };
  }

  const { data, error } = await supabase.rpc('purchase_guestbook_paper_template', {
    p_user_id: uid,
    p_template_id: templateId,
    p_price_credits: cost,
    p_event_id: eventId ?? null,
  });

  if (!error) {
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.success) {
      await rememberLocalOwned(uid, templateId);
      return {
        success: true,
        templateId,
        balance: result.new_balance ?? 0,
        alreadyOwned: !!result.already_owned,
      };
    }
    return {
      success: false,
      error: result?.error || 'purchase_failed',
      balance: result?.new_balance ?? 0,
    };
  }

  // 개발 DB에 아직 RPC가 적용되지 않은 경우를 위한 보수적 폴백.
  // 운영에서는 database-guestbook-paper-templates.sql의 RPC가 원자적으로 처리한다.
  const balanceRes = await getAlimtalkBalance(uid);
  const balance = balanceRes?.success ? Number(balanceRes.balance || 0) : 0;
  if (balance < cost) {
    return { success: false, error: 'insufficient_balance', balance };
  }

  const nextBalance = balance - cost;
  const updateRes = await supabase
    .from('users')
    .update({ alimtalk_balance: nextBalance })
    .eq('id', uid);

  if (updateRes.error) {
    return {
      success: false,
      error: 'setup_required',
      balance,
      message: updateRes.error.message || error.message,
    };
  }

  await supabase
    .from('guestbook_paper_purchases')
    .upsert(
      [{
        user_id: uid,
        template_id: templateId,
        price_credits: cost,
        event_id: eventId ?? null,
      }],
      { onConflict: 'user_id,template_id' }
    );

  await rememberLocalOwned(uid, templateId);
  return { success: true, templateId, balance: nextBalance };
}
