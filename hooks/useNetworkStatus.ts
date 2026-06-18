import { useNetworkState } from 'expo-network';
import { useMemo } from 'react';

/**
 * Derived online flag for UI + mutations.
 * Treats `isInternetReachable === null` as "unknown" and falls back to `isConnected`.
 */
export function useNetworkStatus() {
  const state = useNetworkState();

  return useMemo(() => {
    const connected = state.isConnected !== false;
    const reachable = state.isInternetReachable;
    const isOnline =
      connected && (reachable === undefined || reachable === null ? true : reachable);
    return {
      isOnline,
      type: state.type,
      raw: state,
    };
  }, [state.isConnected, state.isInternetReachable, state.type]);
}
