import {
    Box,
    Flex,
    Text,
    Card,
    Spinner,
    Button,
    Heading,
    Badge
  } from "@radix-ui/themes";
  import { FaBell, FaCheck, FaSync } from "react-icons/fa";
  import { useFrappeAuth, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
  import { motion } from "framer-motion";
  
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
  
  const NotificationsPage = () => {
    const { currentUser } = useFrappeAuth();
  
    const { data, isValidating, mutate } = useFrappeGetCall<NotificationResponse>(
      "cooltrack.api.v1.get_notifications",
      { user_email: currentUser }
    );
  
    const { call: markAsRead } = useFrappePostCall('cooltrack.api.v1.update_notification');
  
    const notifications = data?.message ?? [];
  
    const handleMarkAsRead = async (notificationName: string) => {
      try {
        await markAsRead({ notification: notificationName });
        mutate(); // Refresh the notifications list
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    };
  
    const handleMarkAllAsRead = async () => {
      const unreadNotifications = notifications.filter(n => !n.seen);
      try {
        await Promise.all(unreadNotifications.map(n =>
          markAsRead({ notification: n.name })
        ));
        mutate();
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
      }
    };
  
    const handleRefresh = () => {
      mutate();
    };
  
    if (isValidating) {
      return (
        <Flex justify="center" align="center" className="h-[60vh]">
          <Spinner size="3" />
        </Flex>
      );
    }
  
    return (
      <Box className=" bg-gray-50 px-4 py-6">
        <Box
          className=" px-4 w-full bg-white/90 backdrop-blur-sm"
          style={{ position: 'sticky', top: 0, zIndex: 100 }}
        >
          <Flex gap="3" justify="end" align="center">
            <Badge color="indigo" variant="soft">
              {notifications.filter(n => !n.seen).length} unread
            </Badge>
            <Button variant="soft" onClick={handleRefresh}>
              <FaSync /> Refresh
            </Button>
            {notifications.some(n => !n.seen) && (
              <Button variant="soft" color="green" onClick={handleMarkAllAsRead}>
                <FaCheck /> Mark all as read
              </Button>
            )}
          </Flex>
        </Box>
  
        <Box className="px-4 py-6">
          <Flex direction="column" gap="6" className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-sm w-full border-indigo-100 bg-white">
                <Flex gap="4" align="center" p="6">
                  <div className="p-3 rounded-full bg-indigo-50">
                    <FaBell size="24" className="text-indigo-600" />
                  </div>
                  <Flex direction="column">
                    <Heading size="5" weight="bold" className="text-gray-900">
                      Your Notifications
                    </Heading>
                    <Text size="2" color="gray">
                      {notifications.length} unread notification{notifications.length !== 1 ? 's' : ''}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            </motion.div>
  
            <Flex direction="column" gap="3" className="w-full">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className={`shadow-sm w-full transition-all duration-200 hover:shadow-md ${!notification.seen ? 'border-l-4 border-indigo-500 bg-indigo-50/50' : 'bg-white'}`}
                    >
                      <Box p="5">
                        <Flex justify="between" align="start" gap="3">
                          <div className="flex-1">
                            <div
                              className={`text-md font-semibold mb-1 ${!notification.seen ? 'text-gray-900' : 'text-gray-700'}`}
                              dangerouslySetInnerHTML={{ __html: notification.subject }}
                            />
                            {notification.message ? (
                              <div
                                className="text-sm text-gray-600"
                                dangerouslySetInnerHTML={{ __html: notification.message }}
                              />
                            ) : (
                              <Text size="2" color="gray">No message content.</Text>
                            )}
                            <Text size="1" color="gray" mt="2" className="italic">
                              {new Intl.DateTimeFormat('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              }).format(new Date(notification.created_on.replace(' ', 'T')))}
                            </Text>
                          </div>
                          {!notification.seen && (
                            <Button
                              size="1"
                              variant="soft"
                              color="indigo"
                              onClick={() => handleMarkAsRead(notification.name)}
                              className="shrink-0"
                            >
                              <FaCheck /> Mark read
                            </Button>
                          )}
                        </Flex>
                      </Box>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="shadow-sm w-full bg-white">
                    <Box p="6" className="text-center">
                      <FaBell size="24" className="mx-auto text-gray-300 mb-3" />
                      <Heading size="4" color="gray" mb="2">
                        No notifications yet
                      </Heading>
                      <Text size="2" color="gray">
                        We'll notify you when there's something new.
                      </Text>
                    </Box>
                  </Card>
                </motion.div>
              )}
            </Flex>
          </Flex>
        </Box>
      </Box>
    );
  };
  
  export default NotificationsPage;  