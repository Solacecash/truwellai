import { QueryClient, onlineManager } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount) => {
        if (!onlineManager.isOnline()) return false;
        return failureCount < 2;
      },
    },
  },
});
