import { useCallback, useMemo, useState, useEffect } from 'react';
import { 
  useFrappeAuth, 
  useFrappeGetDocList, 
  useFrappeGetDocCount,
  useFrappePostCall
} from "frappe-react-sdk";
import { 
  FrappeNotificationLog,
  Notification,
  getRecentNotifications,
  filterNotificationsByStatus
} from "../utils/notificationUtils";

interface UseNotificationsOptions {
  autoRefreshInterval?: number;
  recentCount?: number;
  revalidateOnFocus?: boolean;
  pageSize?: number;
  enableAutoRefresh?: boolean;
  enablePagination?: boolean;
}

interface UseNotificationsReturn {
  // Data
  notifications: Notification[];
  recentNotifications: Notification[];
  unreadNotifications: Notification[];
  readNotifications: Notification[];
  unreadCount: number;
  totalCount: number;
  
  // Pagination
  hasMore: boolean;
  isLoadingMore: boolean;
  currentPage: number;
  totalPages: number;
  
  // Loading states
  isLoading: boolean;
  isValidating: boolean;
  error: any;
  
  // Actions
  markAsRead: (notificationName: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => void;
  loadMore: () => Promise<void>;
  resetPagination: () => void;
  
  // Utilities
  getNotificationsByStatus: (read: boolean) => Notification[];
}

export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const {
    autoRefreshInterval = 30000,
    recentCount = 5,
    revalidateOnFocus = true,
    pageSize = 20,
    enableAutoRefresh = true,
    enablePagination = false
  } = options;

  const { currentUser } = useFrappeAuth();
  const [accumulatedNotifications, setAccumulatedNotifications] = useState<FrappeNotificationLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Initial load - get first page
  const {
    data: initialNotifications = [],
    error,
    isLoading,
    isValidating,
    mutate: refreshInitialNotifications
  } = useFrappeGetDocList<FrappeNotificationLog>(
    'Notification Log',
    {
      filters: currentUser ? [['for_user', '=', currentUser]] : [],
      fields: ['name', 'subject', 'email_content', 'creation', 'read', 'for_user', 'type', 'document_type', 'document_name'],
      orderBy: {
        field: 'creation',
        order: 'desc'
      },
      limit: pageSize
    },
    undefined,
    {
      refreshInterval: enableAutoRefresh && autoRefreshInterval > 0 ? autoRefreshInterval : undefined,
      revalidateOnFocus,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 1000
    }
  );

  // Load more notifications using useFrappePostCall for manual triggering
  const { 
    call: loadMoreNotifications,
    loading: loadMoreLoading 
  } = useFrappePostCall('frappe.client.get_list');

  // Get accurate unread count
  const {
    data: unreadCount = 0,
    mutate: refreshUnreadCount
  } = useFrappeGetDocCount(
    'Notification Log',
    currentUser ? [['for_user', '=', currentUser], ['read', '=', 0]] : [],
    true,
    false,
    `unread-notifications-count-${currentUser}`,
    {
      refreshInterval: enableAutoRefresh && autoRefreshInterval > 0 ? autoRefreshInterval : undefined,
      revalidateOnFocus,
    }
  );

  // Get total notification count
  const {
    data: totalCount = 0,
    mutate: refreshTotalCount
  } = useFrappeGetDocCount(
    'Notification Log',
    currentUser ? [['for_user', '=', currentUser]] : [],
    true,
    false,
    `total-notifications-count-${currentUser}`,
    {
      refreshInterval: enableAutoRefresh && autoRefreshInterval > 0 ? autoRefreshInterval : undefined,
      revalidateOnFocus,
    }
  );

  // FIXED: Update accumulated notifications when initial data changes
  useEffect(() => {
    if (enablePagination) {
      // Always update when we have initial notifications, regardless of page or current state
      if (initialNotifications && Array.isArray(initialNotifications)) {
        // If we're on page 1 or have no accumulated data, replace completely
        if (currentPage === 1 || accumulatedNotifications.length === 0) {
          setAccumulatedNotifications(initialNotifications);
        }
      }
    }
  }, [initialNotifications, enablePagination, currentPage, accumulatedNotifications.length]);

  // FIXED: Ensure accumulated notifications are set even when not using pagination
  useEffect(() => {
    if (!enablePagination) {
      if (initialNotifications && Array.isArray(initialNotifications)) {
        setAccumulatedNotifications(initialNotifications);
      }
    }
  }, [initialNotifications, enablePagination]);

  // Reset everything when user changes
  useEffect(() => {
    setAccumulatedNotifications([]);
    setCurrentPage(1);
    setIsLoadingMore(false);
  }, [currentUser]);

  // Use custom backend methods for marking notifications as read
  const { 
    call: markSingleRead, 
    loading: markingRead, 
    error: markError 
  } = useFrappePostCall('cooltrack.api.v1.mark_notification_read');

  const { 
    call: markAllRead, 
    loading: markingAllRead, 
    error: markAllError 
  } = useFrappePostCall('cooltrack.api.v1.mark_all_notifications_read');

  // Transform notifications to ensure consistent structure
  const transformedNotifications = useMemo(() => {
    const notificationsToUse = enablePagination ? accumulatedNotifications : initialNotifications;
    
    // FIXED: Ensure we always have valid data to transform
    if (!notificationsToUse || !Array.isArray(notificationsToUse)) {
      return [];
    }
    
    return notificationsToUse.map((notification: FrappeNotificationLog): Notification => ({
      name: notification.name,
      subject: notification.subject,
      message: notification.email_content || '',
      created_on: notification.creation,
      read: notification.read === 1,
      for_user: notification.for_user,
      type: notification.type,
      document_type: notification.document_type,
      document_name: notification.document_name
    }));
  }, [accumulatedNotifications, initialNotifications, enablePagination]);

  // Calculate pagination info
  const totalPages = useMemo(() => {
    return enablePagination ? Math.ceil(totalCount / pageSize) : 1;
  }, [totalCount, pageSize, enablePagination]);

  const hasMore = useMemo(() => {
    if (!enablePagination) return false;
    const currentNotificationCount = accumulatedNotifications.length;
    return currentNotificationCount > 0 && currentNotificationCount < totalCount;
  }, [enablePagination, accumulatedNotifications.length, totalCount]);

  // Derived data using memoization for performance
  const recentNotifications = useMemo(() => 
    getRecentNotifications(transformedNotifications, recentCount), 
    [transformedNotifications, recentCount]
  );

  const unreadNotifications = useMemo(() => 
    filterNotificationsByStatus(transformedNotifications, false), 
    [transformedNotifications]
  );

  const readNotifications = useMemo(() => 
    filterNotificationsByStatus(transformedNotifications, true), 
    [transformedNotifications]
  );

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationName: string): Promise<void> => {
    if (!notificationName) {
      throw new Error('Notification name is required');
    }

    // Optimistically update local state for both pagination modes
    if (enablePagination) {
      setAccumulatedNotifications(prev => 
        prev.map(notif => 
          notif.name === notificationName 
            ? { ...notif, read: 1 } 
            : notif
        )
      );
    }

    try {
      await markSingleRead({
        notification_name: notificationName
      });
      
      // Refresh counts
      refreshUnreadCount();
      
      // For non-pagination mode, refresh the initial data
      if (!enablePagination) {
        refreshInitialNotifications();
      }
    } catch (error) {
      // Revert optimistic update on error
      if (enablePagination) {
        setAccumulatedNotifications(prev => 
          prev.map(notif => 
            notif.name === notificationName 
              ? { ...notif, read: 0 } 
              : notif
          )
        );
      }
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }, [markSingleRead, refreshUnreadCount, refreshInitialNotifications, enablePagination]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Store original for potential rollback
    const originalAccumulated = [...accumulatedNotifications];
    
    // Optimistically update local state
    if (enablePagination) {
      setAccumulatedNotifications(prev => 
        prev.map(notif => ({ ...notif, read: 1 }))
      );
    }

    try {
      await markAllRead({});
      
      // Refresh counts and data
      refreshUnreadCount();
      refreshTotalCount();
      
      // For non-pagination mode, refresh the initial data
      if (!enablePagination) {
        refreshInitialNotifications();
      }
    } catch (error) {
      // Revert on error
      if (enablePagination) {
        setAccumulatedNotifications(originalAccumulated);
      }
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }, [currentUser, markAllRead, refreshUnreadCount, refreshTotalCount, accumulatedNotifications, refreshInitialNotifications, enablePagination]);

  // Load more notifications
  const loadMore = useCallback(async (): Promise<void> => {
    if (!enablePagination || !hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const offset = accumulatedNotifications.length;
      
      const response = await loadMoreNotifications({
        doctype: 'Notification Log',
        filters: [['for_user', '=', currentUser]],
        fields: ['name', 'subject', 'email_content', 'creation', 'read', 'for_user', 'type', 'document_type', 'document_name'],
        order_by: 'creation desc',
        limit_start: offset,
        page_length: pageSize
      });

      // Handle Frappe's response format
      let notificationData = response;
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        notificationData = response.message || response.data || response.result || response;
      }

      if (notificationData && Array.isArray(notificationData) && notificationData.length > 0) {
        // Append new notifications with deduplication
        setAccumulatedNotifications(prev => {
          const existingIds = new Set(prev.map((n: FrappeNotificationLog) => n.name));
          const newNotifications = notificationData.filter((n: FrappeNotificationLog) => !existingIds.has(n.name));
          return [...prev, ...newNotifications];
        });
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error loading more notifications:", error);
      throw error;
    } finally {
      setIsLoadingMore(false);
    }
  }, [enablePagination, hasMore, isLoadingMore, currentUser, loadMoreNotifications, accumulatedNotifications.length, pageSize]);

  // Reset pagination
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setIsLoadingMore(false);
    setAccumulatedNotifications([]);
  }, []);

  // FIXED: Enhanced refresh function that ensures data is properly loaded
  const enhancedRefresh = useCallback(async () => {
    try {
      // Always reset pagination state first to ensure clean state
      setCurrentPage(1);
      setIsLoadingMore(false);
      
      if (enablePagination) {
        // Clear accumulated notifications to force fresh load
        setAccumulatedNotifications([]);
      }
      
      // Refresh all data sources
      const results = await Promise.all([
        refreshInitialNotifications(),
        refreshUnreadCount(),
        refreshTotalCount()
      ]);
      
      // Force a state update after refresh
      if (enablePagination) {
        // Wait a bit for the refresh to complete, then check if we need to set initial data
        setTimeout(() => {
          // This will trigger the useEffect to set accumulated notifications
          if (initialNotifications && Array.isArray(initialNotifications) && initialNotifications.length > 0) {
            setAccumulatedNotifications(initialNotifications);
          }
        }, 100);
      }
      
      return results;
    } catch (error) {
      console.error("Error refreshing notifications:", error);
      throw error;
    }
  }, [refreshInitialNotifications, refreshUnreadCount, refreshTotalCount, enablePagination, initialNotifications]);

  // Get notifications by status (utility function)
  const getNotificationsByStatus = useCallback((read: boolean): Notification[] => {
    return filterNotificationsByStatus(transformedNotifications, read);
  }, [transformedNotifications]);

  // Combined loading state
  const combinedLoading = isLoading || markingRead || markingAllRead;
  
  // Combined error state
  const combinedError = error || markError || markAllError;

  return {
    // Data
    notifications: transformedNotifications,
    recentNotifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    totalCount,
    
    // Pagination
    hasMore,
    isLoadingMore: isLoadingMore || loadMoreLoading,
    currentPage,
    totalPages,
    
    // Loading states
    isLoading: combinedLoading,
    isValidating,
    error: combinedError,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refreshNotifications: enhancedRefresh,
    loadMore,
    resetPagination,
    
    // Utilities
    getNotificationsByStatus
  };
};