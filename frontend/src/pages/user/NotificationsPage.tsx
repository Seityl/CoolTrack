import { useState, useMemo, useEffect } from "react";
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
import { useMobile } from '../../hooks/useMobile';
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

  const isMobile = useMobile();

  const {
    notifications,
    unreadCount,
    hasMore,
    isLoadingMore,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    loadMore
  } = useNotifications({
    autoRefreshInterval: 30000,
    pageSize: 20,
    enablePagination: true,
    revalidateOnFocus: true
  });

  // DEBUG: Add console logs to track what's happening
  useEffect(() => {
    console.log('🔍 NotificationsPage - Data changed:', {
      notificationsLength: notifications.length,
      notifications: notifications,
      isLoading,
      error,
      unreadCount
    });
  }, [notifications, isLoading, error, unreadCount]);

  // FIXED: Remove problematic memoization that was preventing re-renders
  // The issue was that useMemo with [notifications] dependency wasn't triggering properly
  const displayNotifications = notifications;

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

  const handleLoadMore = async () => {
    try {
      await loadMore();
    } catch (error) {
      showToast("Failed to load more notifications", "error");
    }
  };

  // DEBUG: Add a debug section to see what we have
  const debugInfo = (
    <Card style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f0f0f0' }}>
      <Text size="2" weight="bold">Debug Info:</Text>
      <Text size="1">Notifications Length: {displayNotifications.length}</Text>
      <Text size="1">Is Loading: {isLoading.toString()}</Text>
      <Text size="1">Error: {error ? error.message : 'None'}</Text>
      <Text size="1">Unread Count: {unreadCount}</Text>
      <Text size="1">Has More: {hasMore.toString()}</Text>
      {displayNotifications.length > 0 && (
        <Text size="1">First Notification: {JSON.stringify(displayNotifications[0], null, 2)}</Text>
      )}
    </Card>
  );

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <PageLayout
        title="Notifications"
        icon={<FaBell size={isMobile ? 20 : 24} />}
      >
        <LoadingState />
        {debugInfo}
      </PageLayout>
    );
  }

  // Error state
  if (error && !displayNotifications.length) {
    return (
      <PageLayout
        title="Notifications"
        icon={<FaBell size={isMobile ? 20 : 24} />}
      >
        <ErrorState
          title="Failed to load notifications"
          message={error.message}
          icon={<FaBell size={isMobile ? 24 : 32} />}
          onRetry={handleRefresh}
        />
        {debugInfo}
      </PageLayout>
    );
  }

  // Header actions
  const headerActions = (
    <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
      {unreadCount > 0 && (
        <ActionButton
          icon={<FaCheck size={isMobile ? 10 : 12} />}
          label="Mark all read"
          onClick={handleMarkAllAsRead}
          variant="soft"
          color="green"
          size={isMobile ? "1" : "2"}
          hideTextOnMobile={true}
        />
      )}
      <ActionButton
        icon={<FaSyncAlt className={isRefreshing ? "animate-spin" : ""} size={isMobile ? 12 : 14} />}
        label="Refresh"
        onClick={handleRefresh}
        loading={isRefreshing}
        variant="soft"
        size={isMobile ? "2" : "3"}
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
        icon={<FaBell size={isMobile ? 20 : 24} />}
        actions={headerActions}
      >
        {/* DEBUG INFO - Remove this in production */}
        {debugInfo}

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
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Flex direction="column" gap={{ initial: "3", sm: "4" }}>
                {displayNotifications.length > 0 ? (
                  <>
                    <AnimatePresence>
                      {displayNotifications.map((notification, index) => (
                        <motion.div
                          key={notification.name}
                          layout
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ 
                            duration: 0.2,
                            delay: Math.min(index * 0.03, 0.3),
                            ease: "easeOut",
                            layout: { duration: 0.2 }
                          }}
                        >
                          <Card
                            style={{
                              border: !notification.read 
                                ? `2px solid var(--blue-7)` 
                                : `1px solid var(--gray-6)`,
                              backgroundColor: !notification.read 
                                ? 'var(--blue-1)' 
                                : 'white',
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
                                      weight={!notification.read ? "bold" : "medium"}
                                      style={{ 
                                        color: !notification.read 
                                          ? 'var(--gray-12)' 
                                          : 'var(--gray-11)',
                                        wordWrap: "break-word",
                                        overflowWrap: "break-word",
                                        hyphens: "auto",
                                        lineHeight: 1.4,
                                        flex: 1
                                      }}
                                    >
                                      {stripHtmlTags(notification.subject)}
                                    </Text>
                                    {!notification.read && (
                                      <Box
                                        style={{
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          backgroundColor: 'var(--blue-9)',
                                          flexShrink: 0
                                        }}
                                      />
                                    )}
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
                                      fontSize: isMobile ? '11px' : '12px',
                                      lineHeight: 1.3
                                    }}
                                  >
                                    {formatDetailedDate(notification.created_on)}
                                  </Text>
                                </Flex>
                                
                                {!notification.read && (
                                  <ActionButton
                                    icon={<FaCheck size={isMobile ? 10 : 12} />}
                                    label="Mark read"
                                    onClick={() => handleMarkAsRead(notification.name)}
                                    variant="soft"
                                    color="blue"
                                    size={isMobile ? "1" : "2"}
                                    hideTextOnMobile={true}
                                  />
                                )}
                              </Flex>
                            </Box>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Load More Button */}
                    {hasMore && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card style={{ textAlign: 'center', padding: '1rem' }}>
                          <Flex direction="column" align="center" gap="3">
                            <ActionButton
                              icon={<FaSyncAlt className={isLoadingMore ? "animate-spin" : ""} size={isMobile ? 12 : 14} />}
                              label={isLoadingMore ? "Loading..." : "Load More"}
                              onClick={handleLoadMore}
                              loading={isLoadingMore}
                              variant="soft"
                              color="blue"
                              size={isMobile ? "2" : "3"}
                              disabled={isLoadingMore}
                            />
                          </Flex>
                        </Card>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    title="No notifications yet"
                    description="We'll notify you when there's something new"
                    icon={<FaBell size={isMobile ? 24 : 32} />}
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