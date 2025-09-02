// components/notifications/PushNotificationSetup.tsx
import React from 'react';
import { Button, Callout, Card, Flex, Text, Badge } from '@radix-ui/themes';
import { FiBell, FiCheck, FiX } from 'react-icons/fi';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const PushNotificationSetup: React.FC = () => {
  const {
    fcmToken,
    notificationPermission,
    isInitialized,
    error,
    requestPermission,
    registerTokenWithServer,
    isSupported,
    hasPermission
  } = usePushNotifications();

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case 'granted':
        return { color: 'green' as const, text: 'Enabled' };
      case 'denied':
        return { color: 'red' as const, text: 'Denied' };
      default:
        return { color: 'yellow' as const, text: 'Not requested' };
    }
  };

  const permissionStatus = getPermissionStatus();

  if (!isSupported) {
    return (
      <Callout.Root color="red">
        <Callout.Icon>
          <FiX />
        </Callout.Icon>
        <Callout.Text>
          Push notifications are not supported in this browser.
        </Callout.Text>
      </Callout.Root>
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Flex align="center" justify="between">
          <Flex align="center" gap="2">
            <FiBell />
            <Text weight="bold">Push Notifications</Text>
          </Flex>
          <Badge color={permissionStatus.color}>
            {permissionStatus.text}
          </Badge>
        </Flex>

        {error && (
          <Callout.Root color="red">
            <Callout.Icon>
              <FiX />
            </Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {!hasPermission && (
          <Callout.Root color="blue">
            <Callout.Icon>
              <FiBell />
            </Callout.Icon>
            <Callout.Text>
              Enable push notifications to receive real-time alerts and updates.
            </Callout.Text>
          </Callout.Root>
        )}

        {hasPermission && isInitialized && (
          <Callout.Root color="green">
            <Callout.Icon>
              <FiCheck />
            </Callout.Icon>
            <Callout.Text>
              Push notifications are enabled and configured.
            </Callout.Text>
          </Callout.Root>
        )}

        <Flex gap="2">
          {!hasPermission && (
            <Button onClick={requestPermission} variant="solid">
              Enable Notifications
            </Button>
          )}

          {hasPermission && fcmToken && (
            <Button onClick={registerTokenWithServer} variant="outline">
              Re-register Token
            </Button>
          )}
        </Flex>

        {fcmToken && (
          <Card variant="surface">
            <Text size="1" color="gray">
              <strong>FCM Token:</strong> {fcmToken.substring(0, 50)}...
            </Text>
          </Card>
        )}
      </Flex>
    </Card>
  );
};

export default PushNotificationSetup;