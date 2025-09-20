import React from 'react';
import { Flex } from "@radix-ui/themes";

interface TopMenuActionsProps {
  children: React.ReactNode;
  gap?: "1" | "2" | "3" | "4" | "5" | "6";
}

export const TopMenuActions: React.FC<TopMenuActionsProps> = ({
  children,
  gap = "3"
}) => {
  return (
    <Flex align="center" gap={gap}>
      {children}
    </Flex>
  );
};