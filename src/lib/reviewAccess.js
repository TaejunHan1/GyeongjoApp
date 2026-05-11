import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const REVIEW_PHONE_DISPLAY = '010-0000-0000';
export const REVIEW_PHONE_E164 = '+821000000000';
export const REVIEW_VERIFICATION_CODE = '000000';
export const REVIEW_USER_NAME = '정담 심사 계정';
export const INTERNAL_TEST_VERIFICATION_CODE = '999999';
export const INTERNAL_TEST_PHONES = [
  '+821058359358',
  '+821058479358',
];

const onlyDigits = (phone) => String(phone || '').replace(/[^\d]/g, '');

export const isReviewPhone = (phone) => {
  const digits = onlyDigits(phone);
  return digits === '01000000000' || digits === '821000000000';
};

export const isInternalTestPhone = (phone) => {
  const digits = onlyDigits(phone);
  return digits === '01058359358' ||
    digits === '821058359358' ||
    digits === '01058479358' ||
    digits === '821058479358';
};

export const isBypassAuthPhone = (phone) => (
  isReviewPhone(phone) || isInternalTestPhone(phone)
);

const formatInternalPhone = (phone) => {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.startsWith('010') && digits.length === 11) {
    return `+82${digits.slice(1)}`;
  }
  if (digits.startsWith('8210')) {
    return `+${digits}`;
  }
  return phone;
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

export const signInInternalTestUser = async (phone) => {
  const formattedPhone = formatInternalPhone(phone);
  if (!isInternalTestPhone(formattedPhone)) {
    throw new Error('내부 테스트 번호가 아닙니다.');
  }

  const fallbackName = formattedPhone === INTERNAL_TEST_PHONES[0]
    ? '정담 테스트 계정 1'
    : '정담 테스트 계정 2';

  const baseProfile = {
    phone: formattedPhone,
    name: fallbackName,
    phone_verified: true,
    provider: 'phone',
  };

  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('phone', formattedPhone)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message || '테스트 계정 조회에 실패했습니다.');
  }

  let user = existingUser;

  if (!user) {
    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert([baseProfile])
      .select('id, name, phone')
      .single();

    if (createError) {
      throw new Error(createError.message || '테스트 계정 생성에 실패했습니다.');
    }

    user = createdUser;
  }

  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);

  const userInfo = {
    userId: user.id,
    userName: user.name || fallbackName,
    userPhone: user.phone || formattedPhone,
    phone: user.phone || formattedPhone,
    carrier: null,
    authMethod: 'internal_test',
    isLoggedIn: true,
    loginAt: new Date().toISOString(),
    loginTime: new Date().toISOString(),
  };

  await rememberSession(userInfo);

  return userInfo;
};
