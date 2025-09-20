import React from 'react';
import { Box } from "@radix-ui/themes";

interface SidebarSeparatorProps {
  isMobile?: boolean;
}

export const SidebarSeparator: React.FC<SidebarSeparatorProps> = ({
  isMobile = false
}) => {
  return (
    <Box 
      style={{
        height: "1px",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        margin: isMobile ? "16px -12px" : "12px -16px"
      }}
    />
  );
};