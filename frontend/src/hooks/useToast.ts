import { useState, useCallback } from 'react';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showCloseButton?: boolean;
  autoClose?: boolean;
}

interface ToastOptions {
  duration?: number;
  position?: ToastState['position'];
  showCloseButton?: boolean;
  autoClose?: boolean;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((
    message: string, 
    type: ToastState['type'] = 'info',
    options?: ToastOptions
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastState = {
      id,
      message,
      type,
      duration: options?.duration ?? 5000,
      position: options?.position ?? 'bottom-right',
      showCloseButton: options?.showCloseButton ?? true,
      autoClose: options?.autoClose ?? true,
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different toast types
  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'error', options);
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  return {
    toasts,
    showToast,
    hideToast,
    hideAllToasts,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};