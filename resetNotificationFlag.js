// 알림 권한 플래그 리셋 스크립트
import AsyncStorage from '@react-native-async-storage/async-storage';

export const resetNotificationFlag = async () => {
  try {
    await AsyncStorage.removeItem('notificationPermissionAsked');
    await AsyncStorage.removeItem('notificationEnabled');
    console.log('✅ 알림 권한 플래그 리셋 완료!');
    console.log('앱을 다시 시작하면 알림 모달이 나타납니다.');
  } catch (error) {
    console.error('리셋 실패:', error);
  }
};

// HomeScreen.js의 useEffect에 임시로 추가할 코드:
// resetNotificationFlag();