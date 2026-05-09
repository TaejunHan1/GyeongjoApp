import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const REVIEW_PHONE_DISPLAY = '010-0000-0000';
export const REVIEW_PHONE_E164 = '+821000000000';
export const REVIEW_VERIFICATION_CODE = '000000';
export const REVIEW_USER_NAME = '정담 심사 계정';

export const isReviewPhone = (phone) => {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  return digits === '01000000000' || digits === '821000000000';
};

const rememberSession = async (userInfo) => {
  await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
  await AsyncStorage.setItem('isLoggedIn', 'true');
};

export const signInReviewUser = async () => {
  const baseProfile = {
    phone: REVIEW_PHONE_E164,
    name: REVIEW_USER_NAME,
    phone_verified: true,
    provider: 'phone',
  };

  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('phone', REVIEW_PHONE_E164)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message || '심사용 계정 조회에 실패했습니다.');
  }

  let user = existingUser;

  if (!user) {
    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert([baseProfile])
      .select('id, name, phone')
      .single();

    if (createError) {
      throw new Error(createError.message || '심사용 계정 생성에 실패했습니다.');
    }

    user = createdUser;
  }

  const userInfo = {
    userId: user.id,
    userName: user.name || REVIEW_USER_NAME,
    userPhone: user.phone || REVIEW_PHONE_E164,
    phone: user.phone || REVIEW_PHONE_E164,
    carrier: null,
    authMethod: 'review',
    isLoggedIn: true,
    loginAt: new Date().toISOString(),
    loginTime: new Date().toISOString(),
  };

  await rememberSession(userInfo);

  return userInfo;
};
