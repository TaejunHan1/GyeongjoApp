// src/lib/paperInvitationHelper.js
// 종이 청첩장 Supabase CRUD + 사진 업로드
import { supabase } from './supabase';
// expo-file-system v19+ legacy API 사용 (readAsStringAsync 호환)
import * as FileSystem from 'expo-file-system/legacy';

/**
 * 청첩장 저장 (insert) — draft 상태로
 * @param {object} payload
 *   { template_id, category, groom, bride, date_str, time_str, venue, address, photo_url, layout }
 */
export async function createPaperInvitation(payload) {
  try {
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    console.log('[createPaperInvitation] user:', user?.id, 'authErr:', authErr);

    if (authErr) {
      console.error('[createPaperInvitation] auth error:', JSON.stringify(authErr));
      return { success: false, error: `인증 오류: ${authErr.message}` };
    }
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const insertPayload = { ...payload, user_id: user.id, status: 'draft' };
    console.log('[createPaperInvitation] inserting payload keys:', Object.keys(insertPayload));

    const response = await supabase
      .from('paper_invitations')
      .insert([insertPayload])
      .select()
      .single();

    console.log('[createPaperInvitation] full response:', JSON.stringify(response, Object.getOwnPropertyNames(response)));

    const { data, error, status, statusText } = response;

    if (error) {
      console.error('[createPaperInvitation] error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error('[createPaperInvitation] error keys:', Object.keys(error));
      console.error('[createPaperInvitation] status:', status, statusText);
      const msg = error.message || error.details || error.hint || error.code || `HTTP ${status} ${statusText}` || '알 수 없는 데이터베이스 오류';
      return { success: false, error: msg };
    }
    return { success: true, data };
  } catch (e) {
    console.error('[createPaperInvitation] EXCEPTION:', e?.message, e?.stack);
    return { success: false, error: e?.message || '예외 발생' };
  }
}

/**
 * 청첩장 업데이트 (layout 변경, 텍스트 수정 등)
 */
export async function updatePaperInvitation(id, payload) {
  const { data, error } = await supabase
    .from('paper_invitations')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updatePaperInvitation]', error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

/**
 * 사용자의 청첩장 목록 가져오기
 */
export async function listPaperInvitations() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: '로그인이 필요합니다.' };

  const { data, error } = await supabase
    .from('paper_invitations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * 청첩장 단일 조회
 */
export async function getPaperInvitation(id) {
  const { data, error } = await supabase
    .from('paper_invitations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

/**
 * 청첩장 삭제
 */
export async function deletePaperInvitation(id) {
  const { error } = await supabase.from('paper_invitations').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 사진 업로드 → public URL 반환
 * @param {string} localUri - 디바이스 로컬 사진 URI
 * @param {string} invitationId - 청첩장 ID (없으면 'temp')
 */
// base64 → Uint8Array (RN 환경에서 ArrayBuffer 업로드용)
function base64ToBytes(base64) {
  const binary = global.atob ? global.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function uploadInvitationPhoto(localUri, invitationId = 'temp') {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: '로그인이 필요합니다.' };

    // 진단: 현재 프로젝트의 bucket 목록 출력
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log('[uploadInvitationPhoto] buckets:', buckets?.map((b) => b.name));

    // 1) 로컬 파일을 base64로 읽음 (fetch+blob 보다 RN에서 신뢰성 높음)
    console.log('[uploadInvitationPhoto] reading file:', localUri);
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });
    console.log('[uploadInvitationPhoto] base64 length:', base64.length);

    // 2) ArrayBuffer 로 변환
    const bytes = base64ToBytes(base64);
    console.log('[uploadInvitationPhoto] bytes length:', bytes.length);

    const ext = (localUri.split('.').pop()?.toLowerCase() || 'jpg').replace(/\?.*$/, '');
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const path = `${user.id}/${invitationId}/main_${Date.now()}.${ext}`;

    // 3) 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('paper-invitations')
      .upload(path, bytes.buffer, {
        upsert: true,
        contentType,
      });

    if (uploadError) {
      console.error('[uploadInvitationPhoto] upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }
    console.log('[uploadInvitationPhoto] upload success:', uploadData);

    // 4) 공개 URL 생성
    const { data } = supabase.storage.from('paper-invitations').getPublicUrl(path);
    console.log('[uploadInvitationPhoto] publicUrl:', data.publicUrl);
    return { success: true, url: data.publicUrl, path };
  } catch (e) {
    console.error('[uploadInvitationPhoto] exception:', e?.message, e);
    return { success: false, error: e?.message || '업로드 예외' };
  }
}
