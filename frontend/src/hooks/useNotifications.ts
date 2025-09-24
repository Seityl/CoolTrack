import { useEffect, useState } from 'react';
import { useFrappeAuth, useFrappeGetCall } from "frappe-react-sdk";
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
  getNotificationsByStatus: (read: boolean) => Notification[];
}

export const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const {
    autoRefreshInterval = 30000,
    recentCount = 5,
    revalidateOnFocus = true
  } = options;

  const { currentUser } = useFrappeAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<any>(null);

  // Fetch notifications using Frappe React SDK
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

  // Helper function to make authenticated GET requests like the SDK does
  const makeFrappeGetRequest = async (method: string, args: Record<string, any> = {}) => {
    const url = new URL(`/api/method/${method}`, window.location.origin);
    
    // Add parameters to URL
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    console.log('Making Frappe GET request to:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.exception || errorMessage;
      } catch (e) {
        // If we can't parse error JSON, use the default message
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Frappe GET request successful:', result);
    return result;
  };

  // Mark single notification as read
  const markAsRead = async (notificationName: string): Promise<void> => {
    setActionLoading(true);
    setActionError(null);
    
    try {
      await makeFrappeGetRequest('cooltrack.api.v1.update_notification', {
        notification: notificationName
      });
      
      console.log('Mark as read completed for:', notificationName);
      mutate(); // Refresh notifications
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setActionError(error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    setActionLoading(true);
    setActionError(null);
    
    try {
      await makeFrappeGetRequest('cooltrack.api.v1.mark_all_notifications_read', {
        user_email: currentUser
      });
      
      console.log('Mark all as read completed for:', currentUser);
      mutate(); // Refresh notifications
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      setActionError(error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // Refresh notifications manually
  const refreshNotifications = (): void => {
    mutate();
  };

  // Get notifications by status (utility function)
  const getNotificationsByStatus = (read: boolean): Notification[] => {
    return filterNotificationsByStatus(notifications, read);
  };

  return {
    // Data
    notifications,
    recentNotifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    
    // Loading states
    isLoading: isLoading || actionLoading,
    error: error || actionError,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    
    // Utilities
    getNotificationsByStatus
  };
};