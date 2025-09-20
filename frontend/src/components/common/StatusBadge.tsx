import React from 'react';
import { Badge, Flex } from "@radix-ui/themes";

interface StatusConfig {
  icon?: React.ReactNode;
  color: "green" | "red" | "amber" | "blue" | "gray";
  variant?: "solid" | "soft";
}

interface StatusBadgeProps {
  status: string;
  statusConfig: Record<string, StatusConfig>;
  size?: "1" | "2" | "3";
  showIcon?: boolean;
  showText?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  statusConfig,
  size = "2",
  showIcon = true,
  showText = true
}) => {
  const config = statusConfig[status] || { color: "gray" as const };
  
  return (
    <Badge 
      color={config.color}
      variant={config.variant || "soft"}
      size={size}
      style={{ 
        borderRadius: '20px',
        padding: size === "1" ? '4px 8px' : '6px 12px',
        fontWeight: '500',
        textTransform: 'uppercase',
        fontSize: size === "1" ? '10px' : '12px'
      }}
    >
      <Flex gap="1" align="center">
        {showIcon && config.icon}
        {showText && <span>{status}</span>}
      </Flex>
    </Badge>
  );
};