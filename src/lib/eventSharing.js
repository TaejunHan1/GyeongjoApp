import { supabase } from './supabase';
import { getCurrentUserInfo } from './supabaseHelper';
import { normalizePhone } from './phoneUtils';

async function resolveUser(explicitUser = null) {
  if (explicitUser?.id) return explicitUser;
  const info = await getCurrentUserInfo();
  if (!info?.success || !info.user?.id) return null;
  return info.user;
}

function normalizeRole(role) {
  if (['manager', 'viewer', 'reception'].includes(role)) return role;
  return 'manager';
}

export function getRoleLabel(role) {
  switch (role) {
    case 'viewer': return '보기 전용';
    case 'manager':
    case 'reception':
    default:
      return '공동 관리';
  }
}

export async function getCurrentEventAccessRole(eventId, user = null) {
  const currentUser = await resolveUser(user);
  if (!currentUser?.id || !eventId) {
    return { success: false, role: 'viewer', isOwner: false, canManage: false, error: 'not_logged_in' };
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, user_id')
    .eq('id', eventId)
    .single();

  if (eventError) {
    return { success: false, role: 'viewer', isOwner: false, canManage: false, error: eventError.message };
  }

  if (event?.user_id === currentUser.id) {
    return { success: true, role: 'owner', isOwner: true, canManage: true };
  }

  const normalized = normalizePhone(currentUser.phone || '');
  const filters = [`user_id.eq.${currentUser.id}`];
  if (normalized) filters.push(`phone_normalized.eq.${normalized}`);

  const { data: member, error: memberError } = await supabase
    .from('event_members')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'active')
    .or(filters.join(','))
    .limit(1)
    .maybeSingle();

  if (memberError) {
    return { success: false, role: 'viewer', isOwner: false, canManage: false, error: memberError.message };
  }

  const role = member?.role || 'viewer';
  return {
    success: true,
    role,
    isOwner: false,
    canManage: role === 'manager' || role === 'reception',
  };
}

export async function getSharedEventsForCurrentUser(user = null) {
  const currentUser = await resolveUser(user);
  if (!currentUser?.id) return { success: false, data: [], error: 'not_logged_in' };

  const normalized = normalizePhone(currentUser.phone || '');
  const filters = [`user_id.eq.${currentUser.id}`];
  if (normalized) filters.push(`phone_normalized.eq.${normalized}`);

  const { data: memberships, error: memberError } = await supabase
    .from('event_members')
    .select('*')
    .eq('status', 'active')
    .or(filters.join(','));

  if (memberError) {
    return { success: false, data: [], error: memberError.message };
  }

  const rows = memberships || [];
  const eventIds = Array.from(new Set(rows.map((row) => row.event_id).filter(Boolean)));
  if (eventIds.length === 0) return { success: true, data: [], memberships: [] };

  const { data: events, error: eventError } = await supabase
    .from('events')
    .select(`
      id,
      event_name,
      event_type,
      event_date,
      ceremony_time,
      main_person_name,
      groom_name,
      bride_name,
      location,
      template_style,
      status,
      created_at,
      updated_at,
      user_id,
      custom_message,
      allow_messages,
      message_placeholder,
      additional_info,
      image_urls
    `)
    .in('id', eventIds)
    .order('created_at', { ascending: false });

  if (eventError) {
    return { success: false, data: [], error: eventError.message };
  }

  const membershipByEvent = rows.reduce((acc, row) => {
    acc[row.event_id] = row;
    return acc;
  }, {});

  return {
    success: true,
    memberships: rows,
    data: (events || []).map((event) => ({
      ...event,
      shared_access: true,
      shared_member_id: membershipByEvent[event.id]?.id,
      shared_role: membershipByEvent[event.id]?.role || 'viewer',
      shared_display_name: membershipByEvent[event.id]?.display_name,
    })),
  };
}

export async function getEventMembers(eventId) {
  if (!eventId) return { success: false, data: [], error: 'missing_event_id' };

  const { data, error } = await supabase
    .from('event_members')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) return { success: false, data: [], error: error.message };
  return { success: true, data: data || [] };
}

export async function inviteEventMember({
  eventId,
  phone,
  displayName = '',
  role = 'manager',
  userId = null,
}) {
  const currentUser = await resolveUser(userId ? { id: userId } : null);
  if (!currentUser?.id) return { success: false, error: 'not_logged_in' };

  const { data, error } = await supabase.rpc('upsert_event_member', {
    p_inviter_id: currentUser.id,
    p_event_id: eventId,
    p_phone: phone,
    p_display_name: displayName || null,
    p_role: normalizeRole(role),
  });

  if (error) return { success: false, error: error.message };
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.success) return { success: false, error: result?.error || 'invite_failed' };
  return { success: true, memberId: result.member_id };
}

export async function removeEventMember(memberId, userId = null) {
  const currentUser = await resolveUser(userId ? { id: userId } : null);
  if (!currentUser?.id) return { success: false, error: 'not_logged_in' };

  const { data, error } = await supabase.rpc('disable_event_member', {
    p_actor_id: currentUser.id,
    p_member_id: memberId,
  });

  if (error) return { success: false, error: error.message };
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.success) return { success: false, error: result?.error || 'remove_failed' };
  return { success: true };
}

export async function updateSharedEventAdditionalInfo(eventId, additionalInfo, userId = null) {
  const currentUser = await resolveUser(userId ? { id: userId } : null);
  if (!currentUser?.id) return { success: false, error: 'not_logged_in' };

  const { data, error } = await supabase.rpc('update_shared_event_additional_info', {
    p_actor_id: currentUser.id,
    p_event_id: eventId,
    p_additional_info: additionalInfo || {},
  });

  if (error) return { success: false, error: error.message };
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.success) return { success: false, error: result?.error || 'update_failed' };
  return { success: true };
}
