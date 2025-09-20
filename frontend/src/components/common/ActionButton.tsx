import React from 'react';
import { Button, Flex, Spinner } from "@radix-ui/themes";

interface ActionButtonProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "solid" | "soft" | "outline" | "ghost";
  color?: "blue" | "green" | "red" | "amber" | "gray";
  size?: "1" | "2" | "3";
  disabled?: boolean;
  loading?: boolean;
  hideTextOnMobile?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = "soft",
  color = "blue",
  size = "2",
  disabled = false,
  loading = false,
  hideTextOnMobile = false
}) => {
  const isMobile = window.innerWidth < 768;
  const isSmallMobile = window.innerWidth < 480;
  
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        borderRadius: '8px',
        fontSize: isMobile ? "12px" : "14px",
        minHeight: size === "1" ? "32px" : size === "2" ? "40px" : "44px",
        fontWeight: "500"
      }}
    >
      <Flex align="center" gap="2">
        {loading ? (
          <Spinner size={size === "1" ? "1" : "2"} />
        ) : (
          <>
            {icon}
            <span style={{ 
              display: hideTextOnMobile && isSmallMobile ? "none" : "inline" 
            }}>
              {label}
            </span>
          </>
        )}
      </Flex>
    </Button>
  );
};