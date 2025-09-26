import { useCallback, useMemo } from 'react';
import { 
  useFrappeAuth, 
  useFrappeGetDocList, 
  useFrappePostCall
} from "frappe-react-sdk";
import { 
  NotificationResponse, 
  Notification,
  countUnreadNotifications,
  getRecentNotifications,
  filterNotificationsByStatus
} from "../utils/notificationUtils";

interface UseNotificationsOptions {
  autoRefreshInterval?: number; // in milliseconds, default 30000 (30s)
  recentCount?: number; // number of recent notifications to return, default 5
  revalidateOnFocus?: boolean; // default true
  limit?: number; // number of notifications to fetch, default 50
  enableAutoRefresh?: boolean; // default true
}

interface UseNotificationsReturn {
  // Data
  notifications: Notification[];
  recentNotifications: Notification[];
  unreadNotifications: Notification[];
  readNotifications: Notification[];
  unreadCount: number;  
  
  // Loading states
  isLoading: boolean;
  isValidating: boolean;
  error: any;
  
  // Actions
  markAsRead: (notificationName: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => void;
  
  // Utilities
  getNotificationsByStatus: (read: boolean) => Notification[];
}

export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const {
    autoRefreshInterval = 30000,
    recentCount = 5,
    revalidateOnFocus = true,
    limit = 50,
    enableAutoRefresh = true
  } = options;

  const { currentUser } = useFrappeAuth();

  // Fetch notifications using the correct frappe-react-sdk API
  const {
    data: notifications = [],
    error,
    isLoading,
    isValidating,
    mutate: refreshNotifications
  } = useFrappeGetDocList<Notification>(
    'Notification Log',
    {
      filters: currentUser ? [['for_user', '=', currentUser]] : [],
      fields: ['name', 'subject', 'email_content', 'creation', 'read', 'for_user'],
      orderBy: {
        field: 'creation',
        order: 'desc'
      },
      limit: limit
    },
    // SWR configuration options
    {
      refreshInterval: enableAutoRefresh && autoRefreshInterval > 0 ? autoRefreshInterval : undefined,
      revalidateOnFocus,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 1000
    }
  );

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
    return notifications.map(notification => ({
      ...notification,
      // Ensure consistent field names
      message: notification.email_content || notification.message || '',
      created_on: notification.creation || notification.created_on || '',
      read: notification.read === 1 || notification.read === true
    }));
  }, [notifications]);

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

  const unreadCount = useMemo(() => 
    countUnreadNotifications(transformedNotifications), 
    [transformedNotifications]
  );

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationName: string): Promise<void> => {
    if (!notificationName) {
      throw new Error('Notification name is required');
    }

    try {
      await markSingleRead({
        notification_name: notificationName
      });
      
      // Refresh the notifications list after update
      refreshNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }, [markSingleRead, refreshNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      await markAllRead({});
      
      // Refresh the notifications list after update
      refreshNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }, [currentUser, markAllRead, refreshNotifications]);

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
    
    // Loading states
    isLoading: combinedLoading,
    isValidating,
    error: combinedError,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    
    // Utilities
    getNotificationsByStatus
  };
};