import React from 'react';
import { Card, Flex, Box, Heading, Badge } from "@radix-ui/themes";

interface DataCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  status?: {
    label: string;
    color: "green" | "red" | "amber" | "blue" | "gray";
    variant?: "solid" | "soft";
  };
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  headerActions?: React.ReactNode;
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  icon,
  children,
  status,
  onClick,
  className,
  style,
  headerActions
}) => {
  const baseStyle = {
    borderRadius: window.innerWidth < 768 ? '12px' : '16px',
    border: '1px solid var(--gray-6)',
    background: 'var(--color-surface)',
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  return (
    <Card 
      style={baseStyle}
      className={className}
      onClick={onClick}
    >
      <Box p={{ initial: "3", sm: "4" }}>
        {/* Header */}
        <Flex justify="between" align="center" mb="3">
          <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
            {icon && (
              <Box 
                style={{ 
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'var(--gray-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {icon}
              </Box>
            )}
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Heading 
                size={{ initial: "3", sm: "4" }} 
                weight="medium"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {title}
              </Heading>
            </Box>
          </Flex>
          
          <Flex align="center" gap="2" style={{ flexShrink: 0 }}>
            {status && (
              <Badge 
                color={status.color}
                variant={status.variant || "soft"}
                size="1"
              >
                {status.label}
              </Badge>
            )}
            {headerActions}
          </Flex>
        </Flex>

        {/* Content */}
        <Box>
          {children}
        </Box>
      </Box>
    </Card>
  );
};