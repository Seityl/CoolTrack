import React, { useEffect, useState } from 'react';
import { Button, Flex, Text, Card, Badge, Dialog } from '@radix-ui/themes';
import { FaDownload, FaSync, FaWifi, FaBell } from 'react-icons/fa';
import { usePWA, usePushNotifications } from '../../hooks/usePWA';

// Install App Prompt Component
export const InstallPrompt: React.FC = () => {
  const { isInstallable, showInstallPrompt } = usePWA();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Show install prompt after a delay if app is installable
    const timer = setTimeout(() => {
      if (isInstallable) {
        setShowDialog(true);
      }
    }, 30000); // Show after 30 seconds

    return () => clearTimeout(timer);
  }, [isInstallable]);

  const handleInstall = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setShowDialog(false);
    }
  };

  if (!isInstallable) return null;

  return (
    <>
      {/* Floating Install Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        <Button
          onClick={() => setShowDialog(true)}
          variant="solid"
          color="blue"
          size="3"
          style={{
            borderRadius: '50px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          }}
        >
          <FaDownload />
          Install App
        </Button>
      </div>

      {/* Install Dialog */}
      <Dialog.Root open={showDialog} onOpenChange={setShowDialog}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Title>Install Cool Track</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Install Cool Track as an app for faster access and offline capabilities.
          </Dialog.Description>

          <Flex direction="column" gap="3" mb="4">
            <Flex align="center" gap="2">
              <Badge color="green" variant="soft">✓</Badge>
              <Text size="2">Works offline</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Badge color="green" variant="soft">✓</Badge>
              <Text size="2">Faster loading</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Badge color="green" variant="soft">✓</Badge>
              <Text size="2">Push notifications</Text>
            </Flex>
            <Flex align="center" gap="2">
              <Badge color="green" variant="soft">✓</Badge>
              <Text size="2">Native app experience</Text>
            </Flex>
          </Flex>

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Not now
              </Button>
            </Dialog.Close>
            <Button onClick={handleInstall} variant="solid" color="blue">
              <FaDownload />
              Install
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

// Update Available Component
export const UpdatePrompt: React.FC = () => {
  const { isUpdateAvailable, showUpdatePrompt } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      <Card style={{ maxWidth: 300 }}>
        <Flex direction="column" gap="3" p="3">
          <Text weight="bold" size="2">
            Update Available
          </Text>
          <Text size="1" color="gray">
            A new version of Cool Track is available. Update now to get the latest features.
          </Text>
          <Flex gap="2" justify="end">
            <Button
              variant="solid"
              color="blue"
              size="1"
              onClick={showUpdatePrompt}
            >
              <FaSync />
              Update
            </Button>
          </Flex>
        </Flex>
      </Card>
    </div>
  );
};

// Network Status Component
export const NetworkStatus: React.FC = () => {
  const { isOnline } = usePWA();
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
      const timer = setTimeout(() => setShowOffline(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showOffline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '70px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      <Card
        style={{
          backgroundColor: isOnline ? 'var(--green-9)' : 'var(--red-9)',
          color: 'white',
        }}
      >
        <Flex align="center" gap="2" p="2">
          {isOnline ? <FaWifi /> : <FaWifi />}
          <Text size="2" weight="bold">
            {isOnline ? 'Back Online' : 'You are offline'}
          </Text>
        </Flex>
      </Card>
    </div>
  );
};

// Notification Permission Component
export const NotificationPermission: React.FC = () => {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();
  const { registerSW } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we should show notification permission prompt
    const checkPermission = () => {
      if (
        isSupported &&
        !isSubscribed &&
        Notification.permission === 'default'
      ) {
        // Delay showing the prompt
        setTimeout(() => setShowPrompt(true), 10000); // Show after 10 seconds
      }
    };

    checkPermission();
  }, [isSupported, isSubscribed]);

  const handleEnableNotifications = async () => {
    const registration = await registerSW();
    if (registration) {
      await subscribe(registration);
      setShowPrompt(false);
    }
  };

  if (!showPrompt || !isSupported) return null;

  return (
    <Dialog.Root open={showPrompt} onOpenChange={setShowPrompt}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>Enable Notifications</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Stay updated with real-time alerts from your sensors and system notifications.
        </Dialog.Description>

        <Flex direction="column" gap="3" mb="4">
          <Flex align="center" gap="2">
            <Badge color="blue" variant="soft">📱</Badge>
            <Text size="2">Sensor alerts</Text>
          </Flex>
          <Flex align="center" gap="2">
            <Badge color="blue" variant="soft">⚠️</Badge>
            <Text size="2">System notifications</Text>
          </Flex>
          <Flex align="center" gap="2">
            <Badge color="blue" variant="soft">🔔</Badge>
            <Text size="2">Gateway status updates</Text>
          </Flex>
        </Flex>

        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Maybe later
            </Button>
          </Dialog.Close>
          <Button onClick={handleEnableNotifications} variant="solid" color="blue">
            <FaBell />
            Enable Notifications
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

// PWA Status Bar (for development/debugging)
export const PWAStatus: React.FC = () => {
  const { isInstalled, isOnline, isUpdateAvailable } = usePWA();
  const { isSupported, isSubscribed } = usePushNotifications();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        zIndex: 1000,
        fontSize: '12px',
      }}
    >
      <Card variant="surface" style={{ opacity: 0.8 }}>
        <Flex direction="column" gap="1" p="2">
          <Text size="1">PWA Status:</Text>
          <Flex gap="2" wrap="wrap">
            <Badge color={isInstalled ? 'green' : 'gray'} variant="soft">
              {isInstalled ? '✓' : '✗'} Installed
            </Badge>
            <Badge color={isOnline ? 'green' : 'red'} variant="soft">
              {isOnline ? '✓' : '✗'} Online
            </Badge>
            <Badge color={isUpdateAvailable ? 'orange' : 'gray'} variant="soft">
              {isUpdateAvailable ? '!' : '✓'} Updated
            </Badge>
            <Badge color={isSupported && isSubscribed ? 'green' : 'gray'} variant="soft">
              {isSupported && isSubscribed ? '✓' : '✗'} Notifications
            </Badge>
          </Flex>
        </Flex>
      </Card>
    </div>
  );
};

// Offline Indicator Component
export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: 'var(--red-9)',
        color: 'white',
        padding: '8px',
        textAlign: 'center',
        zIndex: 1000,
      }}
    >
      <Flex align="center" justify="center" gap="2">
        <FaWifi />
        <Text size="2" weight="bold">
          You are currently offline. Some features may be limited.
        </Text>
      </Flex>
    </div>
  );
};