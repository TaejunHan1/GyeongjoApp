import { supabase } from './supabase';
import { getCurrentUserInfo } from './supabaseHelper';

async function resolveUserId(explicitId) {
  if (explicitId) return explicitId;
  const info = await getCurrentUserInfo();
  if (!info?.success || !info.user?.id) return null;
  return info.user.id;
}

export async function getReciprocityNotifications(userId = null) {
  try {
    const uid = await resolveUserId(userId);
    if (!uid) return { success: false, error: 'not_logged_in', data: [] };

    const { data, error } = await supabase
      .from('event_reciprocity_notifications')
      .select(`
        id,
        receiver_user_id,
        original_event_id,
        new_event_id,
        status,
        source_guest_id,
        source_guest_name,
        source_guest_phone,
        source_amount,
        created_at,
        original_event:original_event_id (
          id,
          event_name,
          event_type,
          event_date
        ),
        new_event:new_event_id (
          id,
          event_name,
          event_type,
          event_date,
          main_person_name
        )
      `)
      .eq('receiver_user_id', uid)
      .neq('status', 'dismissed')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'reciprocity_notifications_failed', data: [] };
  }
}

export async function updateReciprocityNotificationStatus(notificationId, status = 'read', userId = null) {
  try {
    const uid = await resolveUserId(userId);
    if (!uid) return { success: false, error: 'not_logged_in' };

    const { data, error } = await supabase.rpc('update_reciprocity_notification_status', {
      p_user_id: uid,
      p_notification_id: notificationId,
      p_status: status,
    });

    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    return result?.success
      ? { success: true }
      : { success: false, error: result?.error || 'update_failed' };
  } catch (error) {
    return { success: false, error: error.message || 'update_failed' };
  }
}
