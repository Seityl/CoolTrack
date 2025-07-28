import {
  Box,
  Flex,
  Text,
  Card,
  Spinner,
  Button,
  Heading,
} from "@radix-ui/themes";
import { FaBell, FaCheck, FaSync, FaSyncAlt } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import { useFrappeAuth, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface Notification {
  name: string;
  subject: string;
  message: string | null;
  created_on: string;
  seen: boolean;
}

interface NotificationResponse {
  message: Notification[];
}

const Toast = ({ message, type, onClose }: { 
  message: string; 
  type: 'success' | 'error';
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: type === 'success' ? 'var(--green-9)' : 'var(--red-9)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '300px',
        animation: 'slideIn 0.3s ease-out',
      }}>
        {type === 'success' ? (
          <FaCheck size={16} />
        ) : (
          <FaBell size={16} />
        )}
        <Text size="2" style={{ flex: 1 }}>{message}</Text>
      </div>
    </>
  );
};

const NotificationsPage = () => {
  const { currentUser } = useFrappeAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  } | null>(null);

  const { data, isValidating, mutate, error } = useFrappeGetCall<NotificationResponse>(
    "cooltrack.api.v1.get_notifications",
    { user_email: currentUser }
  );

  const { call: markAsRead } = useFrappePostCall('cooltrack.api.v1.update_notification');

  const notifications = data?.message ?? [];
  const unreadCount = notifications.filter(n => !n.seen).length;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleMarkAsRead = async (notificationName: string) => {
    try {
      await markAsRead({ notification: notificationName });
      mutate();
      showToast("Notification marked as read", "success");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      showToast("Failed to mark notification as read", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.seen);
    if (unreadNotifications.length === 0) return;
    
    try {
      await Promise.all(unreadNotifications.map(n =>
        markAsRead({ notification: n.name })
      ));
      mutate();
      showToast(`${unreadNotifications.length} notifications marked as read`, "success");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      showToast("Failed to mark all notifications as read", "error");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
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

  if (isValidating && !isRefreshing) {
    return (
      <Box style={{ background: "var(--gray-1)" }}>
        <Box 
          style={{ 
            background: "white", 
            borderBottom: "1px solid var(--gray-6)",
            top: 0,
            zIndex: 10
          }}
        >
          <Flex 
            justify="between" 
            align="center" 
            p={{ initial: "4", sm: "6" }}
          >
            <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
              <FaBell 
                size={window.innerWidth < 768 ? 20 : 24} 
                color="var(--blue-9)" 
              />
              <Heading 
                size={{ initial: "4", sm: "6" }} 
                weight="bold"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                Notifications
              </Heading>
            </Flex>
          </Flex>
        </Box>
        
        <Flex height="60vh" align="center" justify="center">
          <Flex direction="column" align="center" gap="4">
            <Spinner size="3" />
          </Flex>
        </Flex>
      </Box>
    );
  }

  if (error && !data) {
    return (
      <Box style={{ background: "var(--gray-1)" }}>
        <Box 
          style={{ 
            background: "white", 
            borderBottom: "1px solid var(--gray-6)",
            top: 0,
            zIndex: 10
          }}
        >
          <Flex 
            justify="between" 
            align="center" 
            p={{ initial: "4", sm: "6" }}
          >
            <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
              <FaBell 
                size={window.innerWidth < 768 ? 20 : 24} 
                color="var(--blue-9)" 
              />
              <Heading 
                size={{ initial: "4", sm: "6" }} 
                weight="bold"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                Notifications
              </Heading>
            </Flex>
          </Flex>
        </Box>
        
        <Flex height="60vh" align="center" justify="center" p="4">
          <Flex direction="column" align="center" gap="4" style={{ textAlign: "center" }}>
            <FaBell 
              size={window.innerWidth < 768 ? 24 : 32} 
              color="var(--red-9)" 
            />
            <Text 
              size={{ initial: "2", sm: "3" }} 
              color="red"
            >
              Failed to load notifications
            </Text>
            <Text 
              size={{ initial: "1", sm: "2" }} 
              color="red"
              style={{ maxWidth: "280px", lineHeight: 1.5 }}
            >
              {error.message}
            </Text>
            <Button 
              variant="soft" 
              color="red" 
              onClick={handleRefresh}
              size={{ initial: "2", sm: "3" }}
            >
              Retry
            </Button>
          </Flex>
        </Flex>
      </Box>
    );
  }

  return (
    <Box style={{ background: "var(--gray-1)" }}>
      {toast?.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}

      {/* Header */}
      <Box 
        style={{ 
          background: "white", 
          borderBottom: "1px solid var(--gray-6)",
          top: 0,
          zIndex: 10
        }}
      >
        <Flex 
          justify="between" 
          align="center" 
          p={{ initial: "4", sm: "6" }}
          gap="3"
        >
          <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
            <FaBell 
              size={window.innerWidth < 768 ? 20 : 24} 
              color="var(--blue-9)" 
            />
            <Heading 
              size={{ initial: "4", sm: "6" }} 
              weight="bold"
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              Notifications
            </Heading>
          </Flex>
          
          <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
            {unreadCount > 0 && (
              <Button 
                variant="soft" 
                color="green" 
                onClick={handleMarkAllAsRead}
                size={{ initial: "1", sm: "2" }}
                style={{
                  fontSize: window.innerWidth < 768 ? "11px" : "14px"
                }}
              >
                <Flex align="center" gap="2">
                  <FaCheck size={window.innerWidth < 768 ? 10 : 12} />
                  <span style={{ display: window.innerWidth < 380 ? "none" : "inline" }}>
                    Mark all read
                  </span>
                </Flex>
              </Button>
            )}
                  <Button 
                      variant="soft" 
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      size={{ initial: "2", sm: "3" }}
                      style={{
                          flexShrink: 0,
                          fontSize: window.innerWidth < 768 ? "12px" : "14px"
                      }}
                  >
                      <FaSyncAlt 
                          className={isRefreshing ? "animate-spin" : ""}
                          size={window.innerWidth < 768 ? 12 : 14}
                      />
                      <span style={{ display: window.innerWidth < 480 ? "none" : "inline" }}>
                          Refresh
                      </span>
                  </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Content */}
      <Box p={{ initial: "3", sm: "4", md: "6" }}>
        <AnimatePresence mode="wait">
          {isRefreshing ? (
            <motion.div
              key="refreshing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Flex direction="column" align="center" gap="4" py="8">
                <Spinner size="3" />
              </Flex>
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
                          borderLeft: !notification.seen 
                            ? `4px solid var(--blue-9)` 
                            : `1px solid var(--gray-6)`,
                          backgroundColor: !notification.seen 
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
                              <Text 
                                size={{ initial: "2", sm: "3" }}
                                weight={!notification.seen ? "bold" : "medium"}
                                style={{ 
                                  color: !notification.seen ? 'var(--gray-12)' : 'var(--gray-11)',
                                  marginBottom: '8px',
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                  hyphens: "auto",
                                  lineHeight: 1.4
                                }}
                                dangerouslySetInnerHTML={{ __html: notification.subject }}
                              />
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
                                  dangerouslySetInnerHTML={{ __html: notification.message }}
                                />
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
                                {new Intl.DateTimeFormat('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                }).format(new Date(notification.created_on.replace(' ', 'T')))}
                              </Text>
                            </Flex>
                            {!notification.seen && (
                              <Button
                                size={{ initial: "1", sm: "2" }}
                                variant="soft"
                                color="blue"
                                onClick={() => handleMarkAsRead(notification.name)}
                                style={{ 
                                  flexShrink: 0,
                                  alignSelf: window.innerWidth < 640 ? "flex-start" : "auto",
                                  marginTop: window.innerWidth < 640 ? "8px" : "0"
                                }}
                              >
                                <Flex align="center" gap="1">
                                  <FaCheck size={window.innerWidth < 768 ? 10 : 12} />
                                  <span style={{ 
                                    display: window.innerWidth < 380 ? "none" : "inline",
                                    fontSize: window.innerWidth < 768 ? "11px" : "12px"
                                  }}>
                                    Mark read
                                  </span>
                                </Flex>
                              </Button>
                            )}
                          </Flex>
                        </Box>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card style={{ border: "1px solid var(--gray-6)" }}>
                    <Flex 
                      direction="column" 
                      align="center" 
                      gap="4" 
                      p={{ initial: "6", sm: "8" }}
                    >
                      <FaBell 
                        size={window.innerWidth < 768 ? 24 : 32} 
                        color="var(--gray-8)" 
                      />
                      <Text 
                        size={{ initial: "2", sm: "3" }} 
                        color="gray"
                        style={{ textAlign: "center" }}
                      >
                        No notifications yet
                      </Text>
                      <Text 
                        size={{ initial: "1", sm: "2" }} 
                        color="gray" 
                        style={{ 
                          textAlign: 'center',
                          maxWidth: "280px",
                          lineHeight: 1.5
                        }}
                      >
                        We'll notify you when there's something new
                      </Text>
                    </Flex>
                  </Card>
                )}
              </Flex>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

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
    </Box>
  );
};

export default NotificationsPage;