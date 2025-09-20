import React from 'react';
import { Box, Text } from "@radix-ui/themes";

interface SidebarFooterProps {
  copyrightText?: string;
  showCopyright?: boolean;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  copyrightText = "© 2025 Cool Track",
  showCopyright = true
}) => {
  if (!showCopyright) return null;

  return (
    <Box mt="4" pt="3">
      <Box 
        style={{
          height: "1px",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          margin: "0 -12px 16px"
        }}
      />
      <Text 
        size="1" 
        style={{ 
          color: "rgba(255, 255, 255, 0.7)",
          textAlign: "center",
          display: "block",
          fontSize: "12px"
        }}
      >
        {copyrightText}
      </Text>
    </Box>
  );
};