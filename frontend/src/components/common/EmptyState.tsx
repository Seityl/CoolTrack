import React from 'react';
import { Flex, Text, Button, Card, Box } from "@radix-ui/themes";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action
}) => {
  return (
    <Card 
      style={{ 
        background: 'var(--gray-2)',
        border: '1px dashed var(--gray-6)',
        boxShadow: 'none'
      }}
    >
      <Flex 
        direction="column" 
        align="center" 
        gap="3" 
        p={{ initial: "4", sm: "6" }}
      >
        {icon && (
          <Box style={{ opacity: 0.6 }}>
            {icon}
          </Box>
        )}
        <Text 
          color="gray" 
          size={{ initial: "2", sm: "3" }} 
          weight="medium"
          style={{ textAlign: "center" }}
        >
          {title}
        </Text>
        {description && (
          <Text 
            size={{ initial: "1", sm: "2" }} 
            color="gray"
            style={{ 
              textAlign: 'center',
              maxWidth: "280px",
              lineHeight: 1.5
            }}
          >
            {description}
          </Text>
        )}
        {action && (
          <Button 
            variant="soft" 
            onClick={action.onClick}
            size={{ initial: "2", sm: "3" }}
            style={{ borderRadius: '8px' }}
          >
            {action.label}
          </Button>
        )}
      </Flex>
    </Card>
  );
};