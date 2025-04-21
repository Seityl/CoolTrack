import { Box, Flex, Text, Separator, Button } from "@radix-ui/themes";
import {
  FiGrid,
  FiActivity,
  FiWifi,
  FiMap,
  FiBarChart2,
  FiBookOpen,
  FiSettings,
  FiLogOut,
  FiDownload,
  FiSliders,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  sidebarWidth?: number;
  topMenuHeight?: number;
}

const menuSections = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: <FiGrid />, path: "/dashboard" }, // Changed from Home to Dashboard
      { label: "Sensors", icon: <FiActivity />, path: "/sensors" },
      { label: "Gateways", icon: <FiWifi />, path: "/gateways" },
      { label: "Rules", icon: <FiSliders />, path: "/rules" },
      { label: "Maps", icon: <FiMap />, path: "/maps" },
      { label: "Charts", icon: <FiBarChart2 />, path: "/charts" },
      { label: "Reports", icon: <FiBookOpen />, path: "/reports" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Locations", icon: <FiMap />, path: "/locations" },
      { label: "Settings", icon: <FiSettings />, path: "/settings" },
    ],
  },
];

const Sidebar = ({ sidebarWidth = 200, topMenuHeight = 50 }: SidebarProps) => {
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
        backgroundColor: '#3b82f6',
        borderRight: '1px solid #e5e7eb',
        overflowY: 'auto',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        zIndex: 999,
      }}
    >
      <Flex direction="column" justify="between" height="100%">
        {/* Menu Sections */}
        <Flex direction="column" gap="4">
          {menuSections.map((section) => (
            <Box key={section.title}>
              <Text 
                size="2" 
                weight="bold" 
                mb="2" 
                pl="2"
                style={{ color: 'white' }}
              >
                {section.title}
              </Text>
              <Flex direction="column" gap="2">
                {section.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Button
                      key={item.label}
                      variant="soft"
                      color={isActive ? "blue" : "gray"}
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        transition: 'background-color 0.2s',
                        backgroundColor: isActive ? '#2563eb' : undefined,
                        color: 'white',
                      }}
                      onClick={() => navigate(item.path)}
                    >
                      <Flex align="center" gap="1">
                        {item.icon}
                        <Text as="span" style={{ fontSize: '1rem' }}>
                          {item.label}
                        </Text>
                      </Flex>
                    </Button>
                  );
                })}
              </Flex>
              <Separator 
                size="4" 
                my="4" 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }} 
              />
            </Box>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Sidebar;