import React, { useEffect } from 'react';
import { Flex, Text, IconButton } from "@radix-ui/themes";
import { FaCheck, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showCloseButton?: boolean;
  autoClose?: boolean;
}

const getToastIcon = (type: ToastProps['type']) => {
  switch (type) {
    case 'success':
      return <FaCheck size={16} />;
    case 'error':
      return <FaExclamationTriangle size={16} />;
    case 'warning':
      return <FaExclamationTriangle size={16} />;
    case 'info':
    default:
      return <FaInfoCircle size={16} />;
  }
};

const getToastColors = (type: ToastProps['type']) => {
  switch (type) {
    case 'success':
      return {
        background: 'var(--green-9)',
        border: 'var(--green-7)'
      };
    case 'error':
      return {
        background: 'var(--red-9)',
        border: 'var(--red-7)'
      };
    case 'warning':
      return {
        background: 'var(--amber-9)',
        border: 'var(--amber-7)'
      };
    case 'info':
    default:
      return {
        background: 'var(--blue-9)',
        border: 'var(--blue-7)'
      };
  }
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 5000,
  position = 'bottom-right',
  showCloseButton = true,
  autoClose = true
}) => {
  const colors = getToastColors(type);

  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration, autoClose]);

  return (
    <>
      <style>
        {`
          @keyframes toastSlideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes toastSlideInLeft {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes toastSlideInTop {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes toastSlideInBottom {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        style={{
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          maxWidth: window.innerWidth < 768 ? '90vw' : '400px',
          minWidth: '200px',
          width: '100%',
          animation: position.includes('left') 
            ? 'toastSlideInLeft 0.3s ease-out'
            : position.includes('top')
            ? 'toastSlideInTop 0.3s ease-out'
            : position.includes('bottom')
            ? 'toastSlideInBottom 0.3s ease-out'
            : 'toastSlideIn 0.3s ease-out',
        }}
      >
        <Flex align="center" gap="3" justify="between">
          <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
            {getToastIcon(type)}
            <Text 
              size="2" 
              style={{ 
                wordWrap: "break-word",
                overflowWrap: "break-word",
                flex: 1
              }}
            >
              {message}
            </Text>
          </Flex>
          {showCloseButton && (
            <IconButton
              size="1"
              variant="ghost"
              onClick={onClose}
              style={{ 
                color: 'white',
                minHeight: "24px",
                minWidth: "24px",
                flexShrink: 0
              }}
            >
              <FaTimes size={12} />
            </IconButton>
          )}
        </Flex>
      </div>
    </>
  );
};