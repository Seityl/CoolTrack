// hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { useFrappeAuth } from 'frappe-react-sdk';

// Firebase imports (you'll need to install firebase: npm install firebase)
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload, Messaging } from 'firebase/messaging';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface PushNotificationConfig {
  vapid_public_key: string;
  config: FirebaseConfig;
  badge_icon?: string;
  error?: string;
}

export const usePushNotifications = () => {
  const { currentUser, isLoading: authLoading } = useFrappeAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushConfig, setPushConfig] = useState<PushNotificationConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoPermissionRequested, setAutoPermissionRequested] = useState(false);
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [messaging, setMessaging] = useState<Messaging | null>(null);

  // Get Flask server URL - always call Flask directly, not through Frappe
  const getFlaskServerURL = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:5000';
    }
    
    // For production, use the correct push endpoint without port
    return `${window.location.protocol}//${window.location.hostname}/push`;
  }, []);

  // Get alternative Flask server URLs
  const getAlternativeFlaskURLs = useCallback(() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    return [
      `${protocol}//${hostname}/push`, // Primary: proxied through nginx
      // `${protocol}//push.${hostname}`, // Subdomain
      // `${protocol}//${hostname}/api/push`, // API path
      // `${protocol}//${hostname}:5000`, // Direct port access (for development)
    ];
  }, []);

  // Check current permission status
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Get Frappe authentication headers with improved session handling
  const getFrappeAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Method 1: Get session cookie (most reliable)
    const sidCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('sid='))
      ?.split('=')[1];

    if (sidCookie) {
      headers['Authorization'] = `Bearer ${sidCookie}`;
    }

    // Method 2: Use API key if available from frappe.boot
    if (typeof window !== 'undefined' && (window as any).frappe?.boot) {
      const boot = (window as any).frappe.boot;
      if (boot.api_key && boot.api_secret) {
        headers['Authorization'] = `token ${boot.api_key}:${boot.api_secret}`;
      }
    }

    return headers;
  }, []);

  // Auto-request notification permission when user is available
  useEffect(() => {
    const autoRequestPermission = async () => {
      // Only auto-request once per session and when user is logged in
      if (autoPermissionRequested || authLoading || !currentUser) {
        return;
      }

      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('Browser does not support notifications');
        return;
      }

      const currentPermission = Notification.permission;
      console.log('Current notification permission:', currentPermission);

      // If permission is default (not asked yet), auto-request it
      if (currentPermission === 'default') {
        console.log('Auto-requesting notification permission for user:', currentUser);
        setAutoPermissionRequested(true);
        
        try {
          const permission = await Notification.requestPermission();
          console.log('Auto-request permission result:', permission);
          setNotificationPermission(permission);
          
          if (permission === 'granted') {
            console.log('Notification permission granted automatically');
          } else {
            console.log('Notification permission denied by user');
          }
        } catch (err) {
          console.error('Error auto-requesting permission:', err);
        }
      } else {
        // Update the permission state with current value
        setNotificationPermission(currentPermission);
        setAutoPermissionRequested(true);
      }
    };

    autoRequestPermission();
  }, [currentUser, authLoading, autoPermissionRequested]);

  // Fetch config from Flask server directly (not through Frappe)
  const fetchPushConfig = useCallback(async () => {
    // Only fetch config if user is logged in
    if (authLoading || !currentUser) {
      return;
    }

    setIsLoading(true);
    setConfigError(null);
    
    // Try multiple Flask server URLs
    const urls = [
      getFlaskServerURL(),
      ...getAlternativeFlaskURLs()
    ];
    
    for (let i = 0; i < urls.length; i++) {
      const baseURL = urls[i];
      
      try {
        console.log(`Attempt ${i + 1}: Fetching config directly from Flask: ${baseURL}/api/method/notification_relay.api.get_config`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Get Frappe auth headers
        const headers = getFrappeAuthHeaders();
        
        // Call Flask server directly, not through Frappe
        const response = await fetch(`${baseURL}/get_config`, {
          method: 'GET',
          headers,
          mode: 'cors',
          credentials: 'include', // Include cookies for session auth
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log(`Attempt ${i + 1}: Config response status:`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Attempt ${i + 1}: Config data received:`, data);
        
        // Check for server error response
        if (data.error) {
          throw new Error(`Server error: ${data.error}`);
        }
        
        // Validate the config
        if (!data.config || !data.vapid_public_key) {
          throw new Error('Invalid config received: missing config or VAPID key');
        }

        // Additional validation for Firebase config
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'];
        for (const field of requiredFields) {
          if (!data.config[field]) {
            throw new Error(`Invalid Firebase config: missing ${field}`);
          }
        }
        
        setPushConfig(data);
        setConfigError(null);
        setIsLoading(false);
        return; // Success, exit the loop
        
      } catch (error) {
        console.error(`Attempt ${i + 1}: Error fetching push config:`, error);
        
        // If this is the last attempt, set the error
        if (i === urls.length - 1) {
          let errorMessage = 'Failed to fetch push config from all Flask endpoints';
          
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              errorMessage = 'Request timed out - Flask server may be unreachable';
            } else if (error.message.includes('Failed to fetch')) {
              errorMessage = 'Network error - cannot reach Flask server. Ensure Flask server is running on port 5000';
            } else {
              errorMessage = error.message;
            }
          }
          
          setConfigError(errorMessage);
          setError(errorMessage);
        }
      }
    }
    
    setIsLoading(false);
  }, [currentUser, authLoading, getFlaskServerURL, getAlternativeFlaskURLs, getFrappeAuthHeaders]);

  // Fetch config when user logs in
  useEffect(() => {
    fetchPushConfig();
  }, [fetchPushConfig]);

  // Register token with Flask server directly using Frappe auth
  const registerTokenWithServer = useCallback(async (token: string) => {
    if (!currentUser) {
      console.log('No user logged in, skipping token registration');
      return false;
    }

    const urls = [
      getFlaskServerURL(),
      ...getAlternativeFlaskURLs()
    ];

    for (let i = 0; i < urls.length; i++) {
      const baseURL = urls[i];
      
      try {
        console.log(`Attempt ${i + 1}: Registering token directly with Flask: ${baseURL} for user: ${currentUser}`);

        const tokenData = {
          project_name: 'cooltrack',
          site_name: window.location.hostname,
          user_id: currentUser,
          fcm_token: token
        };

        const params = new URLSearchParams(tokenData);
        const url = `${baseURL}/token/add?${params}`;

        // Get Frappe auth headers
        const headers = getFrappeAuthHeaders();

        const response = await fetch(url, {
          method: 'POST',
          headers,
          mode: 'cors',
          credentials: 'include', // Include cookies for session auth
        });

        console.log(`Attempt ${i + 1}: Token registration response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Attempt ${i + 1}: Token registration error response:`, errorText);
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }

        const result = await response.json();
        console.log('Token registered successfully:', result);
        return true; // Success, exit the loop
        
      } catch (err) {
        console.error(`Attempt ${i + 1}: Error registering token:`, err);
        
        // If this is the last attempt, set the error
        if (i === urls.length - 1) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to register token with Flask server';
          setError(errorMessage);
          return false;
        }
      }
    }
    
    return false;
  }, [currentUser, getFlaskServerURL, getAlternativeFlaskURLs, getFrappeAuthHeaders]);

  // Send test notification directly to Flask using Frappe auth
  const sendTestNotification = useCallback(async (title = "Test Notification", body = "This is a test notification") => {
    if (!currentUser) {
      setError('User not logged in');
      return false;
    }

    const urls = [
      getFlaskServerURL(),
      ...getAlternativeFlaskURLs()
    ];

    for (let i = 0; i < urls.length; i++) {
      const baseURL = urls[i];
      
      try {
        console.log(`Attempt ${i + 1}: Sending test notification directly to Flask: ${baseURL}`);

        const notificationData = {
          project_name: 'cooltrack',
          site_name: window.location.hostname,
          user_id: currentUser,
          title: title,
          body: body,
          data: JSON.stringify({
            notification_icon: pushConfig?.badge_icon || '',
            click_action: window.location.origin
          })
        };

        const params = new URLSearchParams(notificationData);
        const url = `${baseURL}/api/method/notification_relay.api.send_notification.user?${params}`;

        // Get Frappe auth headers
        const headers = getFrappeAuthHeaders();

        const response = await fetch(url, {
          method: 'POST',
          headers,
          mode: 'cors',
          credentials: 'include',
        });

        console.log(`Attempt ${i + 1}: Test notification response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Attempt ${i + 1}: Test notification error response:`, errorText);
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }

        const result = await response.json();
        console.log('Test notification sent successfully:', result);
        return true; // Success, exit the loop
        
      } catch (err) {
        console.error(`Attempt ${i + 1}: Error sending test notification:`, err);
        
        // If this is the last attempt, set the error
        if (i === urls.length - 1) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to send test notification to Flask server';
          setError(errorMessage);
          return false;
        }
      }
    }
    
    return false;
  }, [currentUser, pushConfig, getFlaskServerURL, getAlternativeFlaskURLs, getFrappeAuthHeaders]);

  // Initialize Firebase and get FCM token
  const initializeFirebase = useCallback(async () => {
    if (!pushConfig?.config || !pushConfig?.vapid_public_key || notificationPermission !== 'granted') {
      return;
    }

    try {
      setError(null);
      
      console.log('Initializing Firebase with config for user:', currentUser);

      // Initialize Firebase
      const app = initializeApp(pushConfig.config);
      setFirebaseApp(app);
      
      // Check for service worker
      if ('serviceWorker' in navigator) {
        try {
          // Try to register the service worker
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope'
          });
          console.log('Service Worker registered successfully:', registration);
        } catch (swError) {
          console.warn('Service Worker registration failed:', swError);
          // Continue anyway, Firebase might handle it
        }
      }
      
      const messagingInstance = getMessaging(app);
      setMessaging(messagingInstance);

      console.log('Firebase messaging initialized');

      try {
        // Get FCM token
        const token = await getToken(messagingInstance, {
          vapidKey: pushConfig.vapid_public_key
        });

        if (token) {
          console.log('FCM Token received (first 20 chars):', token.substring(0, 20) + '...');
          setFcmToken(token);

          // Auto-register token since user is logged in
          console.log('Auto-registering token for user:', currentUser);
          await registerTokenWithServer(token);
        } else {
          console.warn('No FCM token received');
          setError('Failed to get FCM token - check your Firebase configuration and service worker');
        }
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError);
        setError(`Failed to get FCM token: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
        return;
      }

      // Handle foreground messages
      onMessage(messagingInstance, (payload: MessagePayload) => {
        console.log('Received foreground message:', payload);
        
        // Show notification if app is in foreground
        if (payload.notification) {
          new Notification(payload.notification.title || 'New Message', {
            body: payload.notification.body,
            icon: payload.notification.icon || pushConfig.badge_icon,
            badge: payload.notification.badge || pushConfig.badge_icon,
          });
        }
      });

      setIsInitialized(true);
    } catch (err) {
      console.error('Error initializing Firebase:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Firebase';
      setError(errorMessage);
    }
  }, [pushConfig, notificationPermission, currentUser, registerTokenWithServer]);

  // Initialize Firebase when conditions are met
  useEffect(() => {
    if (!authLoading && currentUser && pushConfig && !configError && notificationPermission === 'granted') {
      initializeFirebase();
    }
  }, [pushConfig, currentUser, configError, authLoading, notificationPermission, initializeFirebase]);

  // Request permission manually
  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      console.log('Manually requesting notification permission...');
      
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        setError('This browser does not support notifications');
        return false;
      }

      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        console.log('Permission granted, will initialize Firebase...');
        return true;
      } else {
        setError('Notification permission was denied');
        return false;
      }
    } catch (err) {
      console.error('Error requesting permission:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to request notification permission';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Test server connection directly to Flask
  const testServerConnection = useCallback(async () => {
    const urls = [
      getFlaskServerURL(),
      ...getAlternativeFlaskURLs()
    ];
    
    for (let i = 0; i < urls.length; i++) {
      const baseURL = urls[i];
      
      try {
        console.log(`Attempt ${i + 1}: Testing Flask server connection: ${baseURL}/health`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${baseURL}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log(`Attempt ${i + 1}: Health check response status:`, response.status);
        
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Attempt ${i + 1}: Health check data:`, data);
        return data; // Success, return the data
        
      } catch (err) {
        console.error(`Attempt ${i + 1}: Flask server connection test failed:`, err);
        
        // If this is the last attempt, throw the error
        if (i === urls.length - 1) {
          throw err;
        }
      }
    }
  }, [getFlaskServerURL, getAlternativeFlaskURLs]);

  // Test authentication directly with Flask
  const testAuthentication = useCallback(async () => {
    if (!currentUser) {
      setError('User not logged in');
      return false;
    }

    const urls = [
      getFlaskServerURL(),
      ...getAlternativeFlaskURLs()
    ];
    
    for (let i = 0; i < urls.length; i++) {
      const baseURL = urls[i];
      
      try {
        console.log(`Attempt ${i + 1}: Testing authentication with Flask: ${baseURL}/api/debug/auth`);
        
        const params = new URLSearchParams({
          site_name: window.location.hostname
        });

        const headers = getFrappeAuthHeaders();

        const response = await fetch(`${baseURL}/api/debug/auth?${params}`, {
          method: 'GET',
          headers,
          mode: 'cors',
          credentials: 'include',
        });
        
        console.log(`Attempt ${i + 1}: Auth test response status:`, response.status);
        
        if (!response.ok) {
          throw new Error(`Auth test failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Attempt ${i + 1}: Auth test data:`, data);
        return data; // Success, return the data
        
      } catch (err) {
        console.error(`Attempt ${i + 1}: Authentication test failed:`, err);
        
        // If this is the last attempt, throw the error
        if (i === urls.length - 1) {
          throw err;
        }
      }
    }
  }, [currentUser, getFlaskServerURL, getAlternativeFlaskURLs, getFrappeAuthHeaders]);

  // Test Frappe connection
  const testFrappeConnection = useCallback(async () => {
    const urls = [
      getFlaskServerURL(),
      ...getAlternativeFlaskURLs()
    ];
    
    for (let i = 0; i < urls.length; i++) {
      const baseURL = urls[i];
      
      try {
        console.log(`Attempt ${i + 1}: Testing Frappe connection: ${baseURL}/api/debug/frappe`);
        
        const response = await fetch(`${baseURL}/api/debug/frappe`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
        });
        
        console.log(`Attempt ${i + 1}: Frappe test response status:`, response.status);
        
        if (!response.ok) {
          throw new Error(`Frappe test failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Attempt ${i + 1}: Frappe test data:`, data);
        return data; // Success, return the data
        
      } catch (err) {
        console.error(`Attempt ${i + 1}: Frappe connection test failed:`, err);
        
        // If this is the last attempt, throw the error
        if (i === urls.length - 1) {
          throw err;
        }
      }
    }
  }, [getFlaskServerURL, getAlternativeFlaskURLs]);

  // Retry config fetch
  const retryConfigFetch = useCallback(async () => {
    console.log('Retrying config fetch...');
    setConfigError(null);
    setError(null);
    setIsLoading(true);
    
    // Clear existing config and re-fetch
    setPushConfig(null);
    await fetchPushConfig();
  }, [fetchPushConfig]);

  // Register token function for external use
  const registerTokenWithServerFn = useCallback(() => 
    fcmToken ? registerTokenWithServer(fcmToken) : Promise.resolve(false), 
    [fcmToken, registerTokenWithServer]
  );

  return {
    fcmToken,
    notificationPermission,
    isInitialized,
    error,
    configError,
    isLoading: isLoading || authLoading,
    currentUser,
    requestPermission,
    registerTokenWithServer: registerTokenWithServerFn,
    testServerConnection,
    testAuthentication,
    testFrappeConnection,
    sendTestNotification,
    retryConfigFetch,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator && (window.isSecureContext || window.location.protocol === 'http:'),
    hasPermission: notificationPermission === 'granted',
    hasConfig: !!pushConfig?.config,
    serverUrl: getFlaskServerURL(),
    vapidKey: pushConfig?.vapid_public_key,
    autoPermissionRequested,
    firebaseApp,
    messaging,
    getFrappeAuthHeaders, // Expose for debugging
  };
};