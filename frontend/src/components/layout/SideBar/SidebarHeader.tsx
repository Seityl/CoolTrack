import React from 'react';
import { Box, Flex, Text, Button } from "@radix-ui/themes";
import { FiX } from "react-icons/fi";

interface SidebarHeaderProps {
  title?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title = "Menu",
  showCloseButton = true,
  onClose
}) => {
  return (
    <Box mb="4">
      <Flex justify="between" align="center" mb="3">
        <Text 
          size="4" 
          weight="bold" 
          style={{ color: "white" }}
        >
          {title}
        </Text>
        {showCloseButton && onClose && (
          <Button
            variant="ghost"
            size="2"
            onClick={onClose}
            style={{
              color: "white",
              padding: "8px",
              minHeight: "44px",
              minWidth: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "all 0.2s ease"
            }}
          >
            <FiX size={20} />
          </Button>
        )}
      </Flex>
      <Box 
        style={{
          height: "1px",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          margin: "0 -12px"
        }}
      />
    </Box>
  );
};