import React from 'react';
import { Button, Flex, Box, Text } from "@radix-ui/themes";
import { useLocation, useNavigate } from "react-router-dom";

export interface SidebarMenuItemType {
  label: string;
  icon: React.ReactNode;
  path: string;
  disabled?: boolean;
}

interface SidebarMenuItemProps {
  item: SidebarMenuItemType;
  isMobile?: boolean;
  onItemClick?: (path: string) => void;
}

export const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  isMobile = false,
  onItemClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === item.path;

  const handleClick = () => {
    if (item.disabled) return;
    navigate(item.path);
    onItemClick?.(item.path);
  };

  return (
    <Button
      variant="soft"
      color={isActive ? "blue" : "gray"}
      size={isMobile ? "3" : "2"}
      disabled={item.disabled}
      className="sidebar-button"
      style={{
        width: "100%",
        justifyContent: "flex-start",
        padding: isMobile ? "1rem 1.2rem" : "0.8rem 1rem",
        borderRadius: isMobile ? "1rem" : "1.2rem",
        backgroundColor: isActive ? "#4A90E2" : "rgba(255, 255, 255, 0.1)",
        color: item.disabled ? "rgba(255, 255, 255, 0.5)" : "white",
        boxShadow: isActive ? "0 0 10px rgba(74, 144, 226, 0.5)" : "none",
        transition: "all 0.3s ease",
        minHeight: isMobile ? "48px" : "auto",
        border: "1px solid transparent",
        fontSize: isMobile ? "16px" : "14px",
        fontWeight: "600",
        cursor: item.disabled ? "not-allowed" : "pointer",
        outline: "none",
        textAlign: "left"
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isMobile && !item.disabled) {
          e.currentTarget.style.backgroundColor = isActive 
            ? "#4A90E2" 
            : "rgba(255, 255, 255, 0.15)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile && !item.disabled) {
          e.currentTarget.style.backgroundColor = isActive 
            ? "#4A90E2" 
            : "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
      onTouchStart={(e) => {
        if (!item.disabled) {
          e.currentTarget.style.backgroundColor = isActive 
            ? "#4A90E2" 
            : "rgba(255, 255, 255, 0.2)";
        }
      }}
      onTouchEnd={(e) => {
        if (!item.disabled) {
          setTimeout(() => {
            e.currentTarget.style.backgroundColor = isActive 
              ? "#4A90E2" 
              : "rgba(255, 255, 255, 0.1)";
          }, 150);
        }
      }}
    >
      <Flex align="center" gap={isMobile ? "3" : "2"}>
        <Box 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: isMobile ? '18px' : '16px',
            flexShrink: 0,
            opacity: item.disabled ? 0.5 : 1
          }}
        >
          {item.icon}
        </Box>
        <Text 
          as="span" 
          className="sidebar-text"
          style={{ 
            fontSize: isMobile ? "16px" : "14px", 
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            opacity: item.disabled ? 0.5 : 1
          }}
        >
          {item.label}
        </Text>
      </Flex>
    </Button>
  );
};