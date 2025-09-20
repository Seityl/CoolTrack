import React from 'react';

export const SidebarStyles: React.FC = () => {
  return (
    <style>
      {`
        /* Custom scrollbar for sidebar */
        .sidebar-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .sidebar-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .sidebar-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        
        .sidebar-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Mobile touch improvements */
        @media (max-width: 767px) {
          /* Better touch targets */
          .sidebar-button {
            min-height: 48px !important;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Smooth scrolling */
          .sidebar-container {
            -webkit-overflow-scrolling: touch;
          }

          /* Prevent zoom on double tap */
          .sidebar-button {
            touch-action: manipulation;
          }
        }

        /* Prevent horizontal scroll on very small screens */
        @media (max-width: 320px) {
          .sidebar-text {
            font-size: 14px !important;
          }
        }

        /* Focus styles for accessibility */
        .sidebar-button:focus {
          outline: 2px solid rgba(255, 255, 255, 0.5);
          outline-offset: 2px;
        }

        /* Active state for better feedback */
        .sidebar-button:active {
          transform: translateY(0) !important;
          transition: transform 0.1s ease !important;
        }
      `}
    </style>
  );
};