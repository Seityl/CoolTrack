import { useEffect, useState } from 'react';
import { useFrappeAuth, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
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
  error: any;
  
  // Actions
  markAsRead: (notificationName: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => void;
  
  // Utilities
  getNotificationsByStatus: (seen: boolean) => Notification[];
}

export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const {
    autoRefreshInterval = 30000,
    recentCount = 5,
    revalidateOnFocus = true
  } = options;

  const { currentUser } = useFrappeAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const { 
    data, 
    mutate, 
    isLoading, 
    error 
  } = useFrappeGetCall<NotificationResponse>(
    "cooltrack.api.v1.get_notifications",
    { user_email: currentUser },
    undefined,
    {
      revalidateOnFocus
    }
  );

  // Mark single notification as read
  const { call: markAsReadCall } = useFrappePostCall('cooltrack.api.v1.update_notification');
  
  // Mark all notifications as read
  const { call: markAllAsReadCall } = useFrappePostCall('cooltrack.api.v1.mark_all_notifications_read');

  const notifications = data?.message ?? [];
  const recentNotifications = getRecentNotifications(notifications, recentCount);
  const unreadNotifications = filterNotificationsByStatus(notifications, false);
  const readNotifications = filterNotificationsByStatus(notifications, true);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = countUnreadNotifications(notifications);
    setUnreadCount(unread);
  }, [notifications]);

  // Auto-refresh notifications
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      mutate();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [mutate, autoRefreshInterval]);

  // Mark single notification as read
  const markAsRead = async (notificationName: string): Promise<void> => {
    try {
      await markAsReadCall({ notification: notificationName });
      mutate(); // Refresh data after marking as read
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<void> => {
    try {
      await markAllAsReadCall({ user_email: currentUser });
      mutate(); // Refresh data after marking all as read
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  };

  // Refresh notifications manually
  const refreshNotifications = (): void => {
    mutate();
  };

  // Get notifications by status (utility function)
  const getNotificationsByStatus = (seen: boolean): Notification[] => {
    return filterNotificationsByStatus(notifications, seen);
  };

  return {
    // Data
    notifications,
    recentNotifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    
    // Loading states
    isLoading,
    error,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    
    // Utilities
    getNotificationsByStatus
  };
};