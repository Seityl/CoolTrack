// Simple event emitter for notification updates
class NotificationEventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(...args));
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Global instance
export const notificationEvents = new NotificationEventEmitter();

// Event types
export const NOTIFICATION_EVENTS = {
  MARKED_AS_READ: 'notification:marked_as_read',
  MARKED_ALL_AS_READ: 'notification:marked_all_as_read',
  REFRESHED: 'notification:refreshed',
  COUNT_UPDATED: 'notification:count_updated'
} as const;