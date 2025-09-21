import React from 'react';
import { Box, Flex } from "@radix-ui/themes";
import { FaHistory } from "react-icons/fa";
import {
  FiSettings,
  FiFileText,
  FiGrid,
  FiTool,
  FiBell,
  FiThermometer,
} from "react-icons/fi";
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { SidebarContent } from './SidebarContent';
import { SidebarStyles } from './SidebarStyles';
import { SidebarMenuSectionType } from './SidebarMenuSection';

interface SidebarProps {
  sidebarWidth?: number;
  topMenuHeight?: number;
  isMobile: boolean;
  sidebarVisible: boolean;
  setSidebarVisible: React.Dispatch<React.SetStateAction<boolean>>;
  backgroundColor?: string;
  menuSections?: SidebarMenuSectionType[];
  showHeader?: boolean;
  showFooter?: boolean;
  headerTitle?: string;
  copyrightText?: string;
  onItemClick?: (path: string) => void;
}

const defaultMenuSections: SidebarMenuSectionType[] = [
  {
    items: [
      { label: "Dashboard", icon: <FiGrid />, path: "/" },
      { label: "Alerts", icon: <FiBell />, path: "/alerts" },
      { label: "Sensors", icon: <FiThermometer />, path: "/sensors" },
      { label: "Maintenance", icon: <FiTool />, path: "/maintenance" },
      { label: "History", icon: <FaHistory />, path: "/history" },
      { label: "Logs", icon: <FiFileText />, path: "/logs" },
    ],
  },
  {
    items: [{ label: "Settings", icon: <FiSettings />, path: "/settings" }],
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  sidebarWidth = 260,
  topMenuHeight = 64,
  isMobile,
  sidebarVisible,
  setSidebarVisible,
  backgroundColor = "#3b82f6",
  menuSections = defaultMenuSections,
  showHeader = true,
  showFooter = true,
  headerTitle = "Menu",
  copyrightText = "© 2025 Cool Track",
  onItemClick
}) => {
  // Responsive sidebar width
  const responsiveSidebarWidth = isMobile ? Math.min(280, window.innerWidth * 0.8) : sidebarWidth;

  const handleItemClick = (path: string) => {
    if (isMobile) setSidebarVisible(false);
    onItemClick?.(path);
  };

  const handleClose = () => {
    setSidebarVisible(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarVisible && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 998,
            transition: "opacity 0.3s ease",
          }}
          onClick={handleClose}
        />
      )}

      <Box
        position="fixed"
        top={`${topMenuHeight}px`}
        left="0"
        width={`${responsiveSidebarWidth}px`}
        height={`calc(100vh - ${topMenuHeight}px)`}
        p={{ initial: "3", sm: "4" }}
        className="sidebar-container"
        style={{
          backgroundColor,
          borderRight: isMobile ? "none" : "1px solid #e5e7eb",
          overflowY: "auto",
          boxShadow: isMobile 
            ? "0 10px 25px rgba(0, 0, 0, 0.2)" 
            : "0 6px 15px rgba(0, 0, 0, 0.1)",
          zIndex: 999,
          transform: sidebarVisible 
            ? "translateX(0)" 
            : `translateX(-${responsiveSidebarWidth}px)`,
          transition: "transform 0.3s ease-in-out",
          WebkitOverflowScrolling: "touch", // iOS smooth scrolling
          // Prevent initial flash
          visibility: sidebarVisible ? "visible" : "hidden",
        }}
      >
        <Flex direction="column" justify="between" height="100%">
          {/* Header section for mobile */}
          {isMobile && showHeader && (
            <SidebarHeader
              title={headerTitle}
              showCloseButton={true}
              onClose={handleClose}
            />
          )}

          {/* Menu sections */}
          <SidebarContent
            sections={menuSections}
            isMobile={isMobile}
            onItemClick={handleItemClick}
          />

          {/* Footer section for mobile */}
          {isMobile && showFooter && (
            <SidebarFooter
              copyrightText={copyrightText}
              showCopyright={true}
            />
          )}
        </Flex>
      </Box>

      <SidebarStyles />
    </>
  );
};

export default Sidebar;