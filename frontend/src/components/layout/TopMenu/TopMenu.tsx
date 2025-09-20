import React from 'react';
import { Flex } from "@radix-ui/themes";
import { AppLogo } from './AppLogo';
import { MenuToggle } from './MenuToggle';
import { TopMenuActions } from './TopMenuActions';
import { NotificationButton } from './NotificationButton';
import { UserButton } from './UserButton';
import logo from "../../../assets/logo.svg";

interface TopMenuProps {
  topMenuHeight?: number;
  isMobile: boolean;
  sidebarVisible: boolean;
  setSidebarVisible: React.Dispatch<React.SetStateAction<boolean>>;
  showNotifications?: boolean;
  showUserButton?: boolean;
  customActions?: React.ReactNode;
  onLogoClick?: () => void;
  appName?: string;
}

const TopMenu: React.FC<TopMenuProps> = ({
  topMenuHeight = 64,
  isMobile,
  setSidebarVisible,
  showNotifications = true,
  showUserButton = true,
  customActions,
  onLogoClick,
  appName = "Cool Track"
}) => {
  const handleMenuToggle = () => {
    setSidebarVisible((prev) => !prev);
  };

  return (
    <Flex
      justify="between"
      align="center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: `${topMenuHeight}px`,
        padding: "0 1.5rem",
        backgroundColor: "var(--color-panel-solid)",
        borderBottom: "1px solid var(--gray-5)",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <Flex align="center" gap="3">
        {isMobile && (
          <MenuToggle onToggle={handleMenuToggle} />
        )}
        
        <AppLogo
          logoSrc={logo}
          appName={appName}
          onClick={onLogoClick}
        />
      </Flex>

      <TopMenuActions>
        {customActions}
        {showNotifications && <NotificationButton />}
        {showUserButton && <UserButton />}
      </TopMenuActions>
    </Flex>
  );
};

export default TopMenu;