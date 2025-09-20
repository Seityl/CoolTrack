import React from 'react';
import { Box } from "@radix-ui/themes";
import { SidebarMenuSection, SidebarMenuSectionType } from './SidebarMenuSection';

interface SidebarContentProps {
  sections: SidebarMenuSectionType[];
  isMobile?: boolean;
  onItemClick?: (path: string) => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  sections,
  isMobile = false,
  onItemClick
}) => {
  return (
    <Box style={{ flex: 1 }}>
      {sections.map((section, sectionIndex) => (
        <SidebarMenuSection
          key={sectionIndex}
          section={section}
          isMobile={isMobile}
          showSeparator={sectionIndex < sections.length - 1}
          onItemClick={onItemClick}
        />
      ))}
    </Box>
  );
};