import React from 'react';
import { Box, Flex, Text, Heading, Badge } from "@radix-ui/themes";

interface PageLayoutProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  badges?: Array<{ text: string; color?: string; variant?: string }>;
  description?: string;
  loading?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  icon,
  children,
  actions,
  badges,
  description,
}) => {
  return (
    <Box style={{ background: "var(--gray-1)" }}>
      {/* Header */}
      <Box 
        style={{ 
          background: "white", 
          borderBottom: "1px solid var(--gray-6)",
          top: 0,
          zIndex: 10
        }}
      >
        <Flex 
          justify="between" 
          align="center" 
          p={{ initial: "4", sm: "6" }}
          gap="3"
          wrap="wrap"
        >
          <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
            {icon && (
              <Box style={{ color: "var(--blue-9)", flexShrink: 0 }}>
                {icon}
              </Box>
            )}
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Heading 
                size={{ initial: "4", sm: "6" }} 
                weight="bold"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {title}
              </Heading>
              {description && (
                <Text size="2" color="gray" style={{ marginTop: "4px" }}>
                  {description}
                </Text>
              )}
            </Box>
            {badges && (
              <Flex gap="2" wrap="wrap">
                {badges.map((badge, index) => (
                  <Badge 
                    key={index}
                    variant={badge.variant as any || "soft"}
                    color={badge.color as any || "blue"}
                    size="2"
                  >
                    {badge.text}
                  </Badge>
                ))}
              </Flex>
            )}
          </Flex>
          
          {actions && (
            <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
              {actions}
            </Flex>
          )}
        </Flex>
      </Box>

      {/* Content */}
      <Box p={{ initial: "3", sm: "4", md: "6" }}>
        {children}
      </Box>
    </Box>
  );
};