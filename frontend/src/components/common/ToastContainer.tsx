import React from 'react';
import { Toast } from './Toast';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showCloseButton?: boolean;
  autoClose?: boolean;
}

interface ToastContainerProps {
  toasts: ToastState[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose
}) => {
  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.position || 'bottom-right';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {} as Record<string, ToastState[]>);

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          style={{
            position: 'fixed',
            zIndex: 1000,
            display: 'flex',
            flexDirection: position.includes('top') ? 'column' : 'column-reverse',
            gap: '12px',
            pointerEvents: 'none',
            maxWidth: '100vw',
            ...getContainerPositionStyles(position as ToastState['position'])
          }}
        >
          {positionToasts.map((toast) => (
            <div 
              key={toast.id} 
              style={{ 
                pointerEvents: 'auto',
                width: position.includes('center') ? 'auto' : undefined,
                minWidth: position.includes('center') ? '300px' : undefined,
              }}
            >
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => onClose(toast.id)}
                duration={toast.duration}
                position={toast.position}
                showCloseButton={toast.showCloseButton}
                autoClose={toast.autoClose}
              />
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

const getContainerPositionStyles = (position: ToastState['position']) => {
  switch (position) {
    case 'top-right':
      return { top: '20px', right: '20px' };
    case 'top-left':
      return { top: '20px', left: '20px' };
    case 'bottom-left':
      return { bottom: '20px', left: '20px' };
    case 'top-center':
      return { top: '20px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-center':
      return { bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-right':
    default:
      return { bottom: '20px', right: '20px' };
  }
};