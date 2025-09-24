export interface Notification {
  name: string;
  subject: string;
  message: string | null;
  created_on: string;
  read: boolean;
}

export interface NotificationResponse {
  message: Notification[];
}

/**
 * Formats a date string to a human-readable relative time
 * @param dateString - The date string to format
 * @returns Formatted relative time string (e.g., "5m ago", "2h ago", "3d ago")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString.replace(' ', 'T'));
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text - The text to truncate
 * @param maxLength - The maximum length before truncation
 * @returns Truncated text with ellipsis if applicable
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Strips HTML tags from a string
 * @param html - The HTML string to clean
 * @returns Plain text without HTML tags
 */
export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Formats a date string to a detailed format for the notifications page
 * @param dateString - The date string to format
 * @returns Formatted date string (e.g., "Dec 19, 2024, 2:30 PM")
 */
export const formatDetailedDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString.replace(' ', 'T')));
};

/**
 * Counts unread notifications
 * @param notifications - Array of notifications
 * @returns Number of unread notifications
 */
export const countUnreadNotifications = (notifications: Notification[]): number => {
  return notifications.filter(n => !n.read).length; // Changed from 'seen' to 'read'
};

/**
 * Gets the most recent notifications
 * @param notifications - Array of notifications
 * @param count - Number of recent notifications to return
 * @returns Array of recent notifications
 */
export const getRecentNotifications = (notifications: Notification[], count: number = 5): Notification[] => {
  return notifications.slice(0, count);
};

/**
 * Filters notifications by read status
 * @param notifications - Array of notifications
 * @param read - Whether to filter for read (true) or unread (false) notifications
 * @returns Filtered array of notifications
 */
export const filterNotificationsByStatus = (notifications: Notification[], read: boolean): Notification[] => {
  return notifications.filter(n => n.read === read); // Changed from 'seen' to 'read'
};