importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let firebaseConfig = null;
let messaging = null;

const getFirebaseConfig = async () => {
  try {
    console.log('Fetching Firebase config from /get_config');
    const response = await fetch('/get_config');
    console.log('Config fetch response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Config data received:', data);
      return data.config;
    } else {
      console.error('Failed to fetch config, status:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Failed to fetch Firebase config:', error);
  }
  return null;
};

const initializeFirebase = async () => {
  console.log('Initializing Firebase...');
  
  if (!firebaseConfig) {
    firebaseConfig = await getFirebaseConfig();
  }
  
  if (!firebaseConfig) {
    console.error('No Firebase config available, cannot initialize');
    return null;
  }
  
  console.log('Firebase config:', firebaseConfig);
  
  try {
    if (!firebase.apps.length) {
      console.log('Initializing Firebase app...');
      firebase.initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
    }
    
    const messagingInstance = firebase.messaging();
    console.log('Firebase messaging instance created');
    return messagingInstance;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

// Handle messages from main thread
self.addEventListener('message', async event => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    console.log('Firebase config received in service worker:', firebaseConfig);
    
    // Try to initialize Firebase with the received config
    try {
      messaging = await initializeFirebase();
      if (messaging) {
        console.log('Firebase messaging initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing Firebase with received config:', error);
    }
  }
});

// Initialize messaging when service worker loads
self.addEventListener('install', event => {
  console.log('Service worker installing...');
  event.waitUntil(
    initializeFirebase().then(msg => {
      messaging = msg;
      if (messaging) {
        console.log('Firebase messaging initialized in service worker install');
      } else {
        console.warn('Firebase messaging could not be initialized during install');
      }
    }).catch(error => {
      console.error('Error during service worker install:', error);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle background messages when app is not in focus
self.addEventListener('push', event => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Push payload:', payload);

    const notificationTitle = payload.notification?.title;
    const notificationOptions = {
      body: payload.notification?.body,
      icon: payload.notification?.icon,
      badge: payload.notification?.badge,
      tag: payload.notification?.tag,
      data: payload.data,
      actions: payload.notification?.actions,
      silent: false,
      requireInteraction: false,
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();

  const clickAction = event.notification.data?.click_action;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url === clickAction && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window/tab, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(clickAction);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event.notification);
});

// Set up background message handler when messaging is available
const setupBackgroundMessageHandler = () => {
  if (messaging && typeof messaging.onBackgroundMessage === 'function') {
    messaging.onBackgroundMessage((payload) => {
      console.log('Background message received:', payload);
      
      const notificationTitle = payload.notification?.title;
      const notificationOptions = {
        body: payload.notification?.body,
        icon: payload.notification?.icon,
        badge: payload.notification?.badge,
        data: payload.data,
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
    console.log('Background message handler set up');
  } else {
    console.warn('Cannot set up background message handler - messaging not available');
  }
};

// Try to set up background handler periodically if messaging isn't ready
let setupAttempts = 0;
const maxSetupAttempts = 10;

const trySetupBackgroundHandler = () => {
  if (messaging) {
    setupBackgroundMessageHandler();
  } else if (setupAttempts < maxSetupAttempts) {
    setupAttempts++;
    console.log(`Retrying background handler setup, attempt ${setupAttempts}/${maxSetupAttempts}`);
    setTimeout(trySetupBackgroundHandler, 1000);
  } else {
    console.error('Failed to set up background message handler after maximum attempts');
  }
};

// Start trying to set up the background handler
setTimeout(trySetupBackgroundHandler, 1000);

console.log('Firebase messaging service worker loaded');