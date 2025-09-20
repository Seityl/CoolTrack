import React from 'react';
import { Flex, Spinner, Text } from "@radix-ui/themes";

interface LoadingStateProps {
  message?: string;
  size?: "1" | "2" | "3";
  height?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "",
  size = "3",
  height = "60vh"
}) => {
  return (
    <Flex 
      height={height} 
      align="center" 
      justify="center"
    >
      <Flex direction="column" align="center" gap="4">
        <Spinner size={size} />
        {message && (
          <Text 
            size={{ initial: "2", sm: "3" }}
            color="gray"
            style={{ textAlign: "center" }}
          >
            {message}
          </Text>
        )}
      </Flex>
    </Flex>
  );
};