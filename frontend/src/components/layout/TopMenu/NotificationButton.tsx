import React from 'react';
import { Button, Badge, DropdownMenu, Text, Box, Flex, Separator } from "@radix-ui/themes";
import { FiBell, FiCheck, FiExternalLink } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useNotifications } from '../../../hooks/useNotifications';
import { 
  formatDate, 
  truncateText, 
  stripHtmlTags
} from "../../../utils/notificationUtils";

interface NotificationButtonProps {
  size?: "1" | "2" | "3";
  variant?: "solid" | "soft" | "outline" | "ghost";
  onNotificationClick?: () => void;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({
  size = "2",
  variant = "ghost",
  onNotificationClick
}) => {
  const navigate = useNavigate();
  
  const {
    unreadNotifications,
    unreadCount,
    markAsRead,
    refreshNotifications
  } = useNotifications({
    autoRefreshInterval: 30000, // 30 seconds
    recentCount: 5,
    revalidateOnFocus: true
  });

  const handleViewAllClick = () => {
    navigate("/notifications");
    refreshNotifications(); // Refresh count when navigating to notifications
    onNotificationClick?.();
  };

  const handleMarkAsRead = async (notificationName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await markAsRead(notificationName);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button
          variant={variant}
          color="gray"
          highContrast
          size={size}
          style={{
            padding: "0.6rem 0.8rem",
            borderRadius: "50%",
            position: "relative",
            transition: "background-color 0.3s ease, transform 0.2s ease",
            cursor: "pointer",
            outline: "none",
            border: "none",
            boxShadow: "none"
          }}
          aria-label="Notifications"
          className="hover:bg-gray-100 active:scale-95"
          onFocus={(e) => e.target.blur()}
        >
          <FiBell size={20} />
          {unreadCount > 0 && (
            <Badge
              color="red"
              variant="solid"
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                padding: "0.2rem 0.4rem",
                fontSize: "12px",
                fontWeight: "bold",
                borderRadius: "50%",
                boxShadow: "0 0 12px rgba(255, 0, 0, 0.7)",
                animation: "pulse 1s infinite",
                transition: "box-shadow 0.3s ease-in-out",
              }}
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        size="2"
        style={{
          minWidth: "320px",
          maxWidth: "400px",
          backgroundColor: "var(--color-panel-solid)",
          border: "1px solid var(--gray-6)",
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
          padding: "0"
        }}
      >
        {/* Header */}
        <Box style={{ padding: "1rem 1rem 0.5rem 1rem", borderBottom: "1px solid var(--gray-4)" }}>
          <Flex justify="start" align="center">
            <Text size="3" weight="bold" style={{ color: "var(--gray-12)" }}>
              Notifications
            </Text>
          </Flex>
        </Box>

        {/* Notifications List */}
        <Box style={{ padding: "0.5rem 0" }}>
          {unreadNotifications.length > 0 ? (
            unreadNotifications.slice(0, 5).map((notification) => (
              <React.Fragment key={notification.name}>
                <DropdownMenu.Item
                  style={{
                    padding: "1rem",
                    cursor: "pointer",
                    backgroundColor: !notification.read ? "var(--blue-1)" : "transparent",
                    borderLeft: !notification.read ? "3px solid var(--blue-9)" : "3px solid transparent",
                    transition: "background-color 0.2s ease",
                    margin: "0.25rem 0",
                    borderRadius: "4px"
                  }}
                  className="hover:bg-gray-50"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Flex justify="between" align="center" gap="2" style={{ width: "100%" }}>
                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                      <Text 
                        size="2" 
                        weight={!notification.read ? "bold" : "medium"}
                        style={{ 
                          lineHeight: "1.4",
                          color: !notification.read ? "var(--gray-12)" : "var(--gray-11)",
                          paddingTop: "0.25rem"
                        }}
                      >
                        {truncateText(stripHtmlTags(notification.subject), 60)}
                      </Text>
                      
                      <Text 
                        size="1" 
                        color="gray" 
                        style={{ 
                          fontStyle: "italic",
                          fontSize: "11px",
                          paddingBottom: "0.25rem"
                        }}
                      >
                        {formatDate(notification.created_on)}
                      </Text>
                    </Flex>
                    
                    {!notification.read && (
                      <Button
                        size="1"
                        variant="ghost"
                        color="blue"
                        onClick={(e) => handleMarkAsRead(notification.name, e)}
                        style={{ 
                          minWidth: "auto",
                          padding: "0.25rem",
                          flexShrink: 0
                        }}
                        aria-label="Mark as read"
                      >
                        <FiCheck size={12} />
                      </Button>
                    )}
                  </Flex>
                </DropdownMenu.Item>
              </React.Fragment>
            ))
          ) : (
            <Box style={{ padding: "2rem 1rem", textAlign: "center" }}>
              <Flex direction="column" align="center" gap="2">
                <FiBell size={24} color="var(--gray-8)" />
                <Text size="2" color="gray">
                  No notifications yet
                </Text>
                <Text size="1" color="gray">
                  We'll notify you when there's something new
                </Text>
              </Flex>
            </Box>
          )}
        </Box>

        {/* Footer */}
        {unreadNotifications.length > 0 && (
          <>
            <Separator style={{ margin: "0", backgroundColor: "var(--gray-4)" }} />
            <Box style={{ padding: "0.5rem" }}>
              <DropdownMenu.Item
                onSelect={handleViewAllClick}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                  textAlign: "center",
                  justifyContent: "center"
                }}
                className="hover:bg-gray-100"
              >
                <Flex align="center" justify="center" gap="2">
                  <FiExternalLink size={14} />
                  <Text size="2" weight="medium">
                    View all notifications
                  </Text>
                </Flex>
              </DropdownMenu.Item>
            </Box>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};