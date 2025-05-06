import { Box, Flex, Text, Button } from "@radix-ui/themes";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHistory } from "react-icons/fa";
import {
  FiSettings,
  FiFileText,
  FiGrid,
  FiWifi,
  FiBell,
  FiThermometer,
} from "react-icons/fi";

interface SidebarProps {
  sidebarWidth?: number;
  topMenuHeight?: number;
  isMobile: boolean;
  sidebarVisible: boolean;
  setSidebarVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const menuSections = [
  {
    items: [
      { label: "Dashboard", icon: <FiGrid />, path: "/" },
      { label: "Alerts", icon: <FiBell />, path: "/alerts" },
    //   { label: "Gateways", icon: <FiWifi />, path: "/gateways" },
      { label: "Sensors", icon: <FiThermometer />, path: "/sensors" },
      { label: "History", icon: <FaHistory />, path: "/history" },
      { label: "Logs", icon: <FiFileText />, path: "/logs" },
    ],
  },
  {
    items: [{ label: "Settings", icon: <FiSettings />, path: "/settings" }],
  },
];

const Sidebar = ({
  sidebarWidth = 260,
  topMenuHeight = 64,
  isMobile,
  sidebarVisible,
  setSidebarVisible,
}: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      position="fixed"
      top={`${topMenuHeight}px`}
      left="0"
      width={`${sidebarWidth}px`}
      height={`calc(100vh - ${topMenuHeight}px)`}
      p="4"
      style={{
        backgroundColor: "#3b82f6",
        borderRight: "1px solid #e5e7eb",
        overflowY: "auto",
        boxShadow: "0 6px 15px rgba(0, 0, 0, 0.1)",
        zIndex: 999,
        transform: sidebarVisible ? "translateX(0)" : `translateX(-${sidebarWidth}px)`,
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <Flex direction="column" justify="between" height="100%">
        {menuSections.map((section) => (
          <Box>
            <Flex direction="column" gap="3" my="4">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.label}
                    variant="soft"
                    color={isActive ? "blue" : "gray"}
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      padding: "0.8rem 1rem",
                      borderRadius: "1.2rem",
                      backgroundColor: isActive ? "#4A90E2" : undefined,
                      color: "white",
                      boxShadow: isActive
                        ? "0 0 10px rgba(74, 144, 226, 0.5)"
                        : "none",
                      transition: "background-color 0.3s ease, transform 0.2s ease",
                    }}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setSidebarVisible(false);
                    }}
                  >
                    <Flex align="center" gap="2">
                      {item.icon}
                      <Text as="span" style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                        {item.label}
                      </Text>
                    </Flex>
                  </Button>
                );
              })}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

export default Sidebar;