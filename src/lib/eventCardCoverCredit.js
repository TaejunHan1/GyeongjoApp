import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getCurrentUserInfo } from './supabaseHelper';
import { getAlimtalkBalance } from './alimtalkCredit';

const LOCAL_KEY_PREFIX = 'event_card_cover_purchases:';

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

async function saveLocalOwned(userId, coverKeys) {
  const unique = Array.from(new Set((coverKeys || []).filter(Boolean)));
  await AsyncStorage.setItem(localKey(userId), JSON.stringify(unique));
  return unique;
}

async function rememberLocalOwned(userId, coverKey) {
  const current = await readLocalOwned(userId);
  if (!current.includes(coverKey)) current.push(coverKey);
  return saveLocalOwned(userId, current);
}

export async function getEventCardCoverPurchaseState(userId = null) {
  const uid = await resolveUserId(userId);
  if (!uid) {
    return { success: false, error: 'not_logged_in', coverKeys: [], balance: 0 };
  }

  const balanceRes = await getAlimtalkBalance(uid);

  const { data, error } = await supabase
    .from('event_card_cover_purchases')
    .select('cover_key')
    .eq('user_id', uid);

  if (error) {
    const localKeys = await readLocalOwned(uid);
    return {
      success: true,
      source: 'local',
      coverKeys: localKeys,
      balance: balanceRes?.success ? balanceRes.balance : 0,
      warning: error.message,
    };
  }

  const serverKeys = (data || []).map((row) => row.cover_key).filter(Boolean);
  const coverKeys = Array.from(new Set(serverKeys));
  await saveLocalOwned(uid, coverKeys);

  return {
    success: true,
    source: 'server',
    coverKeys,
    balance: balanceRes?.success ? balanceRes.balance : 0,
  };
}

export async function purchaseEventCardCover({
  userId = null,
  coverKey,
  price,
}) {
  const uid = await resolveUserId(userId);
  if (!uid) return { success: false, error: 'not_logged_in', balance: 0 };
  if (!coverKey) return { success: false, error: 'missing_cover_key', balance: 0 };

  const cost = Number(price || 0);
  if (cost <= 0) {
    await rememberLocalOwned(uid, coverKey);
    const balanceRes = await getAlimtalkBalance(uid);
    return {
      success: true,
      coverKey,
      balance: balanceRes?.success ? balanceRes.balance : 0,
      alreadyOwned: true,
    };
  }

  const { data, error } = await supabase.rpc('purchase_event_card_cover', {
    p_user_id: uid,
    p_cover_key: coverKey,
    p_price_credits: cost,
  });

  if (!error) {
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.success) {
      await rememberLocalOwned(uid, coverKey);
      return {
        success: true,
        coverKey,
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

  const balanceRes = await getAlimtalkBalance(uid);
  const balance = balanceRes?.success ? Number(balanceRes.balance || 0) : 0;
  if (balance < cost) {
    return { success: false, error: 'insufficient_balance', balance };
  }

  const nextBalance = balance - cost;
  const updateRes = await supabase
    .from('users')
    .update({ alimtalk_balance: nextBalance })
    .eq('id', uid)
    .gte('alimtalk_balance', cost);

  if (updateRes.error) {
    return {
      success: false,
      error: 'setup_required',
      balance,
      message: updateRes.error.message || error.message,
    };
  }

  await supabase
    .from('event_card_cover_purchases')
    .upsert(
      [{
        user_id: uid,
        cover_key: coverKey,
        price_credits: cost,
      }],
      { onConflict: 'user_id,cover_key' }
    );

  await supabase
    .from('alimtalk_transactions')
    .insert([{
      user_id: uid,
      type: 'adjust',
      credits_change: -cost,
      balance_after: nextBalance,
      memo: `event_card_cover:${coverKey}`,
    }]);

  await rememberLocalOwned(uid, coverKey);
  return { success: true, coverKey, balance: nextBalance };
}
