import React from 'react';
import { Card, Flex, Box, Text, Badge, Separator } from "@radix-ui/themes";

interface MobileCardProps {
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    color: "green" | "red" | "amber" | "blue" | "gray";
  };
  fields: Array<{
    label: string;
    value: string;
    icon?: React.ReactNode;
  }>;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  status,
  fields,
  onClick,
  actions
}) => {
  return (
    <Card 
      size="2" 
      style={{ 
        border: "1px solid var(--gray-6)",
        marginBottom: "12px",
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <Flex direction="column" gap="3" p="3">
        {/* Header */}
        <Flex justify="between" align="center" gap="2">
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text 
              size="2" 
              weight="bold" 
              style={{ 
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: "2px"
              }}
              title={title}
            >
              {title}
            </Text>
            {subtitle && (
              <Text 
                size="1" 
                color="gray" 
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
                title={subtitle}
              >
                {subtitle}
              </Text>
            )}
          </Box>
          {status && (
            <Badge 
              color={status.color} 
              variant="soft"
              size="1"
              style={{ 
                borderRadius: '16px',
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: '500',
                flexShrink: 0
              }}
            >
              {status.label}
            </Badge>
          )}
        </Flex>
        
        {/* Fields */}
        <Flex direction="column" gap="2">
          {fields.map((field, index) => (
            <Flex key={index} align="center" gap="2">
              {field.icon && (
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                  {field.icon}
                </Box>
              )}
              <Text size="1" color="gray" style={{ minWidth: "60px" }}>
                {field.label}:
              </Text>
              <Text size="1" weight="medium" style={{ flex: 1 }}>
                {field.value}
              </Text>
            </Flex>
          ))}
        </Flex>
        
        {actions && (
          <>
            <Separator size="1" />
            <Box>
              {actions}
            </Box>
          </>
        )}
      </Flex>
    </Card>
  );
};