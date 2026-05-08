// 전역 navigation ref — 컴포넌트 밖(Context 등)에서 navigation 호출용
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// 지정한 탭으로 이동 — 스택 위에 쌓인 화면만 pop하고 MainTabs/탭 상태는 보존
// (전체 reset하면 MyEventsScreen 등이 리마운트되며 튜토리얼 체크 ref가 초기화됨)
export function resetToTab(tabName) {
  if (!navigationRef.isReady()) return;

  const state = navigationRef.getRootState?.();
  const currentRoute = state?.routes?.[state.index];
  const isAlreadyAtRootTabs = currentRoute?.name === 'MainTabs' && state?.routes?.length === 1;

  // 루트 스택이 MainTabs 하나뿐인 상태에서 popToTop을 보내면 개발 경고가 발생한다.
  if (!isAlreadyAtRootTabs && navigationRef.canGoBack()) {
    navigationRef.goBack();
    requestAnimationFrame(() => resetToTab(tabName));
    return;
  }

  // MainTabs 내부에서 해당 탭으로 전환
  navigationRef.navigate('MainTabs', { screen: tabName });
}
