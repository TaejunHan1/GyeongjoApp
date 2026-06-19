import { supabase } from './supabase';
import { getCurrentUserInfo } from './supabaseHelper';

async function resolveUserId(explicitId) {
  if (explicitId) return explicitId;
  const info = await getCurrentUserInfo();
  if (!info?.success || !info.user?.id) return null;
  return info.user.id;
}

export async function getActivityNotifications(userId = null, limit = 300) {
  try {
    const uid = await resolveUserId(userId);
    if (!uid) return { success: false, error: 'not_logged_in', data: [] };

    const { data, error } = await supabase.rpc(
      'get_user_activity_notifications',
      {
        p_user_id: uid,
        p_limit: limit,
      },
    );

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'activity_notifications_failed',
      data: [],
    };
  }
}

export async function updateActivityNotificationStatus(
  notificationId,
  status = 'read',
  userId = null,
) {
  try {
    const uid = await resolveUserId(userId);
    if (!uid) return { success: false, error: 'not_logged_in' };

    const { data, error } = await supabase.rpc(
      'update_user_activity_notification_status',
      {
        p_user_id: uid,
        p_notification_id: notificationId,
        p_status: status,
      },
    );

    if (error) throw error;
    return data ? { success: true } : { success: false, error: 'not_found' };
  } catch (error) {
    return { success: false, error: error.message || 'update_failed' };
  }
}

export async function logActivityNotification({
  userId = null,
  type,
  category = 'activity',
  title,
  body = null,
  eventId = null,
  entityType = null,
  entityId = null,
  metadata = {},
  dedupeKey = null,
} = {}) {
  try {
    const uid = await resolveUserId(userId);
    if (!uid) return { success: false, error: 'not_logged_in' };
    if (!type || !title) return { success: false, error: 'missing_fields' };

    const { data, error } = await supabase.rpc(
      'create_user_activity_notification',
      {
        p_user_id: uid,
        p_type: type,
        p_category: category,
        p_title: title,
        p_body: body,
        p_event_id: eventId,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_metadata: metadata || {},
        p_dedupe_key: dedupeKey,
      },
    );

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message || 'log_failed' };
  }
}
