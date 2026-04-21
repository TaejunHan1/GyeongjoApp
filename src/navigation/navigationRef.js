// 전역 navigation ref — 컴포넌트 밖(Context 등)에서 navigation 호출용
import { createNavigationContainerRef, StackActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// 지정한 탭으로 이동 — 스택 위에 쌓인 화면만 pop하고 MainTabs/탭 상태는 보존
// (전체 reset하면 MyEventsScreen 등이 리마운트되며 튜토리얼 체크 ref가 초기화됨)
export function resetToTab(tabName) {
  if (!navigationRef.isReady()) return;
  try {
    // 스택 최상위(MainTabs)까지 pop — EventDetail / GuestWriting / GuestConfirm 등 모두 제거
    navigationRef.dispatch(StackActions.popToTop());
  } catch (_) {
    // 이미 MainTabs밖에 없으면 조용히 패스
  }
  // MainTabs 내부에서 해당 탭으로 전환 (탭 스크린은 리마운트 안 됨)
  navigationRef.navigate('MainTabs', { screen: tabName });
}
