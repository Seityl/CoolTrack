import { Box, Flex, Text, Separator, Button } from "@radix-ui/themes";
import { FaHistory } from "react-icons/fa";
import {
  FiSettings,
	FiFileText,
  FiGrid,
  FiWifi,
	FiBell,
    FiThermometer,
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
      { label: "Dashboard", icon: <FiGrid />, path: "/" },
      { label: "Alerts", icon: <FiBell />, path: "/alerts" },
      { label: "Gateways", icon: <FiWifi />, path: "/gateways" },
      { label: "Sensors", icon: <FiThermometer />, path: "/sensors" },
			{ label: "History", icon: <FaHistory />, path: "/history" },
      { label: "Logs", icon: <FiFileText />, path: "/logs" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Settings", icon: <FiSettings />, path: "/settings" },
    ],
  },
];

const Sidebar = ({ sidebarWidth, topMenuHeight } : SidebarProps) => {
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
                size="3" 
                weight="bold"
                style={{ color: 'white' }}
							>
                {section.title}
              </Text>
              <Flex direction="column" gap="2" my="4">
								{section.items.map((item) => {
									const isActive = location.pathname === item.path;
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
											<Flex align="center" gap="2">
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