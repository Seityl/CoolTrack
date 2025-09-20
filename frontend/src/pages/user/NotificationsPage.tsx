import { useState } from "react";
import { Box, Flex, Text, Card } from "@radix-ui/themes";
import { FaBell, FaCheck, FaSyncAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from '../../hooks/useNotifications';
import { PageLayout } from '../../components/common/PageLayout';
import { ActionButton } from '../../components/common/ActionButton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { Toast } from '../../components/common/Toast';
import { 
  formatDetailedDate, 
  stripHtmlTags
} from "../../utils/notificationUtils";

const NotificationsPage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  } | null>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications({
    autoRefreshInterval: 30000,
    recentCount: 100, // Show all notifications on the page
    revalidateOnFocus: true
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleMarkAsRead = async (notificationName: string) => {
    try {
      await markAsRead(notificationName);
      showToast("Notification marked as read", "success");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      showToast("Failed to mark notification as read", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      await markAllAsRead();
      showToast(`${unreadCount} notifications marked as read`, "success");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      showToast("Failed to mark all notifications as read", "error");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refreshNotifications();
      showToast("Notifications refreshed", "success");
    } catch (error) {
      showToast("Failed to refresh notifications", "error");
    } finally {
      // Add a small delay to show the animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <PageLayout
        title="Notifications"
        icon={<FaBell size={window.innerWidth < 768 ? 20 : 24} />}
      >
        <LoadingState />
      </PageLayout>
    );
  }

  // Error state
  if (error && !notifications.length) {
    return (
      <PageLayout
        title="Notifications"
        icon={<FaBell size={window.innerWidth < 768 ? 20 : 24} />}
      >
        <ErrorState
          title="Failed to load notifications"
          message={error.message}
          icon={<FaBell size={window.innerWidth < 768 ? 24 : 32} />}
          onRetry={handleRefresh}
        />
      </PageLayout>
    );
  }

  // Header actions
  const headerActions = (
    <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
      {unreadCount > 0 && (
        <ActionButton
          icon={<FaCheck size={window.innerWidth < 768 ? 10 : 12} />}
          label="Mark all read"
          onClick={handleMarkAllAsRead}
          variant="soft"
          color="green"
          size={window.innerWidth < 768 ? "1" : "2"}
          hideTextOnMobile={true}
        />
      )}
      <ActionButton
        icon={<FaSyncAlt className={isRefreshing ? "animate-spin" : ""} size={window.innerWidth < 768 ? 12 : 14} />}
        label="Refresh"
        onClick={handleRefresh}
        loading={isRefreshing}
        variant="soft"
        size={window.innerWidth < 768 ? "2" : "3"}
        hideTextOnMobile={true}
      />
    </Flex>
  );

  return (
    <>
      {toast?.show && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={closeToast} 
          />
        </div>
      )}

      <PageLayout
        title="Notifications"
        icon={<FaBell size={window.innerWidth < 768 ? 20 : 24} />}
        actions={headerActions}
      >

        <AnimatePresence mode="wait">
          {isRefreshing ? (
            <motion.div
              key="refreshing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingState height="40vh" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Flex direction="column" gap={{ initial: "3", sm: "4" }}>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <motion.div
                      key={notification.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <Card
                        style={{
                          border: `1px solid var(--gray-6)`,
                          backgroundColor: 'white',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          overflow: 'hidden'
                        }}
                      >
                        <Box p={{ initial: "3", sm: "4", md: "5" }}>
                          <Flex 
                            justify="between" 
                            align="start" 
                            gap="3"
                            direction={{ initial: "column", sm: "row" }}
                          >
                            <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                              <Flex align="center" gap="2" mb="2">
                                <Text 
                                  size={{ initial: "2", sm: "3" }}
                                  weight="medium"
                                  style={{ 
                                    color: 'var(--gray-12)',
                                    wordWrap: "break-word",
                                    overflowWrap: "break-word",
                                    hyphens: "auto",
                                    lineHeight: 1.4,
                                    flex: 1
                                  }}
                                >
                                  {stripHtmlTags(notification.subject)}
                                </Text>
                              </Flex>
                              
                              {notification.message ? (
                                <Text 
                                  size={{ initial: "1", sm: "2" }}
                                  color="gray"
                                  style={{ 
                                    lineHeight: 1.5,
                                    marginBottom: '12px',
                                    wordWrap: "break-word",
                                    overflowWrap: "break-word",
                                    hyphens: "auto"
                                  }}
                                >
                                  {stripHtmlTags(notification.message)}
                                </Text>
                              ) : (
                                <Text 
                                  size={{ initial: "1", sm: "2" }} 
                                  color="gray" 
                                  style={{ marginBottom: '12px' }}
                                >
                                  No message content.
                                </Text>
                              )}
                              
                              <Text 
                                size="1" 
                                color="gray" 
                                style={{ 
                                  fontStyle: 'italic',
                                  fontSize: window.innerWidth < 768 ? '11px' : '12px',
                                  lineHeight: 1.3
                                }}
                              >
                                {formatDetailedDate(notification.created_on)}
                              </Text>
                            </Flex>
                            
                            {!notification.seen && (
                              <ActionButton
                                icon={<FaCheck size={window.innerWidth < 768 ? 10 : 12} />}
                                label="Mark read"
                                onClick={() => handleMarkAsRead(notification.name)}
                                variant="soft"
                                color="blue"
                                size={window.innerWidth < 768 ? "1" : "2"}
                                hideTextOnMobile={true}
                              />
                            )}
                          </Flex>
                        </Box>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState
                    title="No notifications yet"
                    description="We'll notify you when there's something new"
                    icon={<FaBell size={window.innerWidth < 768 ? 24 : 32} />}
                  />
                )}
              </Flex>
            </motion.div>
          )}
        </AnimatePresence>

        <style>
          {`
            .animate-spin {
              animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }

            /* Mobile-specific optimizations */
            @media (max-width: 767px) {
              /* Ensure proper touch targets */
              button {
                min-height: 44px;
              }
              
              /* Optimize spacing for mobile */
              [data-radix-themes] {
                --space-3: 12px;
                --space-4: 16px;
              }
            }
            
            @media (max-width: 479px) {
              /* Extra small screens */
              [data-radix-themes] {
                --space-3: 8px;
                --space-4: 12px;
              }
            }

            @media (max-width: 380px) {
              /* Very small screens - stack buttons vertically */
              .header-actions {
                flex-direction: column;
                width: 100%;
                gap: 8px;
              }
            }
          `}
        </style>
      </PageLayout>
    </>
  );
};

export default NotificationsPage;