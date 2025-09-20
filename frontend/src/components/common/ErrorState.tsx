import React from 'react';
import { Flex, Text, Button, Card, Box } from "@radix-ui/themes";

interface ErrorStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  icon,
  onRetry,
  retryLabel = "Try Again"
}) => {
  return (
    <Card 
      variant="surface" 
      style={{ 
        border: '1px solid var(--red-6)',
        borderRadius: '12px',
        background: 'var(--red-2)'
      }}
    >
      <Flex 
        direction="column" 
        align="center" 
        gap="3" 
        p={{ initial: "4", sm: "6" }}
      >
        {icon && (
          <Box style={{ opacity: 0.8 }}>
            {icon}
          </Box>
        )}
        <Text 
          color="red" 
          weight="bold" 
          size={{ initial: "2", sm: "3" }}
          style={{ textAlign: "center" }}
        >
          {title}
        </Text>
        <Text 
          color="red" 
          size={{ initial: "1", sm: "2" }} 
          style={{ 
            textAlign: 'center', 
            maxWidth: '400px',
            lineHeight: 1.5
          }}
        >
          {message}
        </Text>
        {onRetry && (
          <Button 
            variant="soft" 
            color="red" 
            onClick={onRetry}
            size={{ initial: "2", sm: "3" }}
            style={{ borderRadius: '8px' }}
          >
            {retryLabel}
          </Button>
        )}
      </Flex>
    </Card>
  );
};