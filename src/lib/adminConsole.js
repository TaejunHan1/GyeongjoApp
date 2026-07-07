import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const ADMIN_PHONE_DIGITS = '01058359358';

export const normalizePhoneDigits = (phone) => {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0082') && digits.length >= 13) return `0${digits.slice(4)}`;
  if (digits.startsWith('82') && digits.length >= 11) return `0${digits.slice(2)}`;
  return digits;
};

export const isAdminUser = (userInfo, session) => {
  const phoneCandidates = [
    userInfo?.phone,
    userInfo?.phoneNumber,
    session?.user?.phone,
    session?.user?.user_metadata?.phone,
  ];
  return phoneCandidates.some((phone) => normalizePhoneDigits(phone) === ADMIN_PHONE_DIGITS);
};

export const getCurrentAppUserId = (userInfo, session) =>
  userInfo?.userId || userInfo?.id || session?.user?.id || null;

export const getActiveAdminModals = async (targetScreen, userId = null) => {
  try {
    const now = Date.now();
    const { data, error } = await supabase
      .from('admin_app_modals')
      .select('*')
      .eq('is_active', true)
      .in('target_screen', ['all', targetScreen])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const modals = (data || []).filter((modal) => {
      const startsAt = modal.starts_at ? new Date(modal.starts_at).getTime() : null;
      const endsAt = modal.ends_at ? new Date(modal.ends_at).getTime() : null;
      return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
    });

    const visible = [];
    for (const modal of modals) {
      const localKey = `admin_modal_dismissed:${userId || 'anon'}:${modal.id}`;
      const localDismissed = await AsyncStorage.getItem(localKey);
      if (localDismissed === 'true') continue;
      visible.push(modal);
    }

    return { success: true, data: visible };
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

export const dismissAdminModal = async (modalId, userId = null, forever = false) => {
  try {
    if (!modalId) return { success: false, error: 'missing_modal_id' };
    const localKey = `admin_modal_dismissed:${userId || 'anon'}:${modalId}`;
    if (forever) {
      await AsyncStorage.setItem(localKey, 'true');
    }

    if (userId) {
      await supabase
        .from('admin_app_modal_dismissals')
        .upsert(
          {
            modal_id: modalId,
            user_id: userId,
            dismissed_forever: forever,
            dismissed_at: new Date().toISOString(),
          },
          { onConflict: 'modal_id,user_id' },
        );
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAdminDashboard = async (adminUserId) => {
  const { data, error } = await supabase.rpc('admin_get_dashboard', {
    p_admin_user_id: adminUserId,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data: Array.isArray(data) ? data[0] : data };
};

export const getAdminUsers = async (adminUserId) => {
  const { data, error } = await supabase.rpc('admin_get_users', {
    p_admin_user_id: adminUserId,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
};

export const getAdminUserEvents = async (adminUserId, targetUserId) => {
  const { data, error } = await supabase.rpc('admin_get_user_events', {
    p_admin_user_id: adminUserId,
    p_target_user_id: targetUserId,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
};

export const getAdminEventGuests = async (adminUserId, eventId) => {
  const { data, error } = await supabase.rpc('admin_get_event_guests', {
    p_admin_user_id: adminUserId,
    p_event_id: eventId,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
};

export const adjustAdminUserCredits = async ({
  adminUserId,
  targetUserId,
  delta,
  memo,
}) => {
  const { data, error } = await supabase.rpc('admin_adjust_user_credits', {
    p_admin_user_id: adminUserId,
    p_target_user_id: targetUserId,
    p_delta: Number(delta || 0),
    p_memo: memo || 'admin_adjust',
  });
  if (error) return { success: false, error: error.message };
  const result = Array.isArray(data) ? data[0] : data;
  return result?.success
    ? { success: true, data: result }
    : { success: false, error: result?.error || 'adjust_failed', data: result };
};

export const listAdminModals = async (adminUserId = null) => {
  if (adminUserId) {
    const { data, error } = await supabase.rpc('admin_get_modals', {
      p_admin_user_id: adminUserId,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  }

  const { data, error } = await supabase
    .from('admin_app_modals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
};

export const saveAdminModal = async (payload) => {
  const normalized = {
    title: payload.title?.trim(),
    body: payload.body?.trim() || null,
    image_url: payload.image_url?.trim() || null,
    target_screen: payload.target_screen || 'all',
    starts_at: payload.starts_at || null,
    ends_at: payload.ends_at || null,
    cta_label: payload.cta_label?.trim() || null,
    cta_url: payload.cta_url?.trim() || null,
    priority: Number(payload.priority || 0),
    is_active: payload.is_active !== false,
  };

  if (payload.admin_user_id) {
    const { data, error } = await supabase.rpc('admin_save_modal', {
      p_admin_user_id: payload.admin_user_id,
      p_modal_id: payload.id || null,
      p_title: normalized.title,
      p_body: normalized.body,
      p_image_url: normalized.image_url,
      p_target_screen: normalized.target_screen,
      p_starts_at: normalized.starts_at,
      p_ends_at: normalized.ends_at,
      p_cta_label: normalized.cta_label,
      p_cta_url: normalized.cta_url,
      p_priority: normalized.priority,
      p_is_active: normalized.is_active,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data: Array.isArray(data) ? data[0] : data };
  }

  const query = payload.id
    ? supabase.from('admin_app_modals').update(normalized).eq('id', payload.id).select().single()
    : supabase.from('admin_app_modals').insert([normalized]).select().single();

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data };
};

export const deleteAdminModal = async (modalId, adminUserId = null) => {
  if (adminUserId) {
    const { data, error } = await supabase.rpc('admin_delete_modal', {
      p_admin_user_id: adminUserId,
      p_modal_id: modalId,
    });
    if (error) return { success: false, error: error.message };
    const result = Array.isArray(data) ? data[0] : data;
    return result?.success
      ? { success: true, data: result }
      : { success: false, error: result?.error || 'delete_failed' };
  }

  const { error } = await supabase.from('admin_app_modals').delete().eq('id', modalId);
  if (error) return { success: false, error: error.message };
  return { success: true };
};
