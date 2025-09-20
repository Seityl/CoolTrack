import { useState, useCallback } from 'react';

export const useRefresh = (onRefresh: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return { isRefreshing, refresh };
};