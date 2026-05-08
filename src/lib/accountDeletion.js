import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const normalizePhone = (value) => String(value || '').replace(/[^\d+]/g, '');

async function removeStorageFolder(bucket, folderPath) {
  const { data: entries, error } = await supabase.storage
    .from(bucket)
    .list(folderPath, { limit: 1000 });

  if (error || !entries?.length) return;

  const filePaths = [];

  for (const entry of entries) {
    const childPath = `${folderPath}/${entry.name}`;
    if (entry.id || entry.metadata) {
      filePaths.push(childPath);
    } else {
      await removeStorageFolder(bucket, childPath);
    }
  }

  if (filePaths.length > 0) {
    await supabase.storage.from(bucket).remove(filePaths).catch(() => {});
  }
}

async function removeAccountStorage(userId) {
  await Promise.allSettled([
    removeStorageFolder('event-images', userId),
    removeStorageFolder('paper-invitations', userId),
  ]);
}

export async function deleteCurrentAccount({ userId, phone }) {
  if (!userId) {
    return { success: false, error: '사용자 정보를 확인할 수 없습니다.' };
  }

  try {
    await removeAccountStorage(userId);

    const { data, error } = await supabase.rpc('delete_jeongdam_account_v2', {
      p_user_id: userId,
      p_phone: normalizePhone(phone),
    });

    if (error) {
      const message = error.message || '계정 삭제에 실패했습니다.';
      const needsSqlUpdate = /storage tables|storage api|delete_jeongdam_account_v2/i.test(message);
      return {
        success: false,
        error: needsSqlUpdate
          ? '계정 삭제 SQL이 아직 최신 버전으로 적용되지 않았습니다. database-account-deletion.sql을 Supabase SQL Editor에서 다시 실행해주세요.'
          : message,
      };
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.success) {
      const messageByCode = {
        missing_user_id: '사용자 정보를 확인할 수 없습니다.',
        user_not_found: '이미 삭제되었거나 존재하지 않는 계정입니다.',
        phone_mismatch: '현재 로그인된 휴대폰 번호와 계정 정보가 일치하지 않습니다.',
      };

      return {
        success: false,
        error: messageByCode[result?.error] || '계정 삭제에 실패했습니다.',
      };
    }

    await AsyncStorage.multiRemove([
      'userInfo',
      'isLoggedIn',
      'appSettings',
      'notificationPermissionAsked',
      'notificationPermissionGranted',
    ]);

    await supabase.auth.signOut().catch(() => {});

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || '계정 삭제 중 오류가 발생했습니다.' };
  }
}
