import { focusManager, onlineManager } from '@tanstack/react-query';
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';
import { AppState, type AppStateStatus } from 'react-native';

function networkStateToOnline(s: NetworkState): boolean {
  if (s.isConnected === false) return false;
  if (s.isInternetReachable === false) return false;
  return true;
}

/** Wire React Query to RN app focus + Expo network (refetchOnReconnect / paused queries). */
export function registerQueryNativeSync(): void {
  focusManager.setEventListener((handleFocus) => {
    const onChange = (status: AppStateStatus) => {
      handleFocus(status === 'active');
    };
    const sub = AppState.addEventListener('change', onChange);
    handleFocus(AppState.currentState === 'active');
    return () => sub.remove();
  });

  onlineManager.setEventListener((setOnline) => {
    void getNetworkStateAsync().then((s) => setOnline(networkStateToOnline(s)));
    const sub = addNetworkStateListener((s) => setOnline(networkStateToOnline(s)));
    return () => sub.remove();
  });
}
