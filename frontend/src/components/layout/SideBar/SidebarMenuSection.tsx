import React from 'react';
import { Box, Flex } from "@radix-ui/themes";
import { SidebarMenuItem, SidebarMenuItemType } from './SidebarMenuItem';
import { SidebarSeparator } from './SidebarSeparator';

export interface SidebarMenuSectionType {
  title?: string;
  items: SidebarMenuItemType[];
}

interface SidebarMenuSectionProps {
  section: SidebarMenuSectionType;
  isMobile?: boolean;
  showSeparator?: boolean;
  onItemClick?: (path: string) => void;
}

export const SidebarMenuSection: React.FC<SidebarMenuSectionProps> = ({
  section,
  isMobile = false,
  showSeparator = false,
  onItemClick
}) => {
  return (
    <Box>
      <Flex direction="column" gap="2" my="4">
        {section.items.map((item) => (
          <SidebarMenuItem
            key={item.label}
            item={item}
            isMobile={isMobile}
            onItemClick={onItemClick}
          />
        ))}
      </Flex>
      
      {showSeparator && <SidebarSeparator isMobile={isMobile} />}
    </Box>
  );
};