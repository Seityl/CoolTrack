import { Box, Flex, Text, Button } from "@radix-ui/themes";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHistory } from "react-icons/fa";
import {
  FiSettings,
  FiFileText,
  FiGrid,
  FiWifi,
  FiTool,
  FiBell,
  FiThermometer,
  FiX,
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
      { label: "Sensors", icon: <FiThermometer />, path: "/sensors" },
      { label: "Maintenance", icon: <FiTool />, path: "/maintenance" },
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

  // Responsive sidebar width
  const responsiveSidebarWidth = isMobile ? Math.min(280, window.innerWidth * 0.8) : sidebarWidth;

  return (
    <>
      <Box
        position="fixed"
        top={`${topMenuHeight}px`}
        left="0"
        width={`${responsiveSidebarWidth}px`}
        height={`calc(100vh - ${topMenuHeight}px)`}
        p={{ initial: "3", sm: "4" }}
        className="sidebar-container"
        style={{
          backgroundColor: "#3b82f6",
          borderRight: isMobile ? "none" : "1px solid #e5e7eb",
          overflowY: "auto",
          boxShadow: isMobile 
            ? "0 10px 25px rgba(0, 0, 0, 0.2)" 
            : "0 6px 15px rgba(0, 0, 0, 0.1)",
          zIndex: 999,
          transform: sidebarVisible 
            ? "translateX(0)" 
            : `translateX(-${responsiveSidebarWidth}px)`,
          transition: "transform 0.3s ease-in-out",
          WebkitOverflowScrolling: "touch", // iOS smooth scrolling
        }}
      >
        <Flex direction="column" justify="between" height="100%">
          {/* Header section for mobile */}
          {isMobile && (
            <Box mb="4">
              <Flex justify="between" align="center" mb="3">
                <Text 
                  size="4" 
                  weight="bold" 
                  style={{ color: "white" }}
                >
                  Menu
                </Text>
                <Button
                  variant="ghost"
                  size="2"
                  onClick={() => setSidebarVisible(false)}
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
              </Flex>
              <Box 
                style={{
                  height: "1px",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  margin: "0 -12px"
                }}
              />
            </Box>
          )}

          {/* Menu sections */}
          <Box style={{ flex: 1 }}>
            {menuSections.map((section, sectionIndex) => (
              <Box key={sectionIndex}>
                <Flex direction="column" gap="2" my="4">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Button
                        key={item.label}
                        variant="soft"
                        color={isActive ? "blue" : "gray"}
                        size={isMobile ? "3" : "2"}
                        className="sidebar-button"
                        style={{
                          width: "100%",
                          justifyContent: "flex-start",
                          padding: isMobile ? "1rem 1.2rem" : "0.8rem 1rem",
                          borderRadius: isMobile ? "1rem" : "1.2rem",
                          backgroundColor: isActive ? "#4A90E2" : "rgba(255, 255, 255, 0.1)",
                          color: "white",
                          boxShadow: isActive
                            ? "0 0 10px rgba(74, 144, 226, 0.5)"
                            : "none",
                          transition: "all 0.3s ease",
                          minHeight: isMobile ? "48px" : "auto",
                          border: "1px solid transparent",
                          fontSize: isMobile ? "16px" : "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          outline: "none",
                          textAlign: "left"
                        }}
                        onClick={() => {
                          navigate(item.path);
                          if (isMobile) setSidebarVisible(false);
                        }}
                        onMouseEnter={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.backgroundColor = isActive 
                              ? "#4A90E2" 
                              : "rgba(255, 255, 255, 0.15)";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.backgroundColor = isActive 
                              ? "#4A90E2" 
                              : "rgba(255, 255, 255, 0.1)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                        onTouchStart={(e) => {
                          e.currentTarget.style.backgroundColor = isActive 
                            ? "#4A90E2" 
                            : "rgba(255, 255, 255, 0.2)";
                        }}
                        onTouchEnd={(e) => {
                          setTimeout(() => {
                            e.currentTarget.style.backgroundColor = isActive 
                              ? "#4A90E2" 
                              : "rgba(255, 255, 255, 0.1)";
                          }, 150);
                        }}
                      >
                        <Flex align="center" gap={isMobile ? "3" : "2"}>
                          <Box 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              fontSize: isMobile ? '18px' : '16px',
                              flexShrink: 0
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Text 
                            as="span" 
                            className="sidebar-text"
                            style={{ 
                              fontSize: isMobile ? "16px" : "14px", 
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            {item.label}
                          </Text>
                        </Flex>
                      </Button>
                    );
                  })}
                </Flex>
                
                {/* Section separator (not for last section) */}
                {sectionIndex < menuSections.length - 1 && (
                  <Box 
                    style={{
                      height: "1px",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      margin: isMobile ? "16px -12px" : "12px -16px"
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>

          {/* Footer section for mobile */}
          {isMobile && (
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
                © 2025 Cool Track
              </Text>
            </Box>
          )}
        </Flex>
      </Box>

      <style>
        {`
          /* Custom scrollbar for sidebar */
          .sidebar-container::-webkit-scrollbar {
            width: 6px;
          }
          
          .sidebar-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          
          .sidebar-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          
          .sidebar-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }

          /* Mobile touch improvements */
          @media (max-width: 767px) {
            /* Better touch targets */
            .sidebar-button {
              min-height: 48px !important;
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Smooth scrolling */
            .sidebar-container {
              -webkit-overflow-scrolling: touch;
            }

            /* Prevent zoom on double tap */
            .sidebar-button {
              touch-action: manipulation;
            }
          }

          /* Prevent horizontal scroll on very small screens */
          @media (max-width: 320px) {
            .sidebar-text {
              font-size: 14px !important;
            }
          }

          /* Focus styles for accessibility */
          .sidebar-button:focus {
            outline: 2px solid rgba(255, 255, 255, 0.5);
            outline-offset: 2px;
          }

          /* Active state for better feedback */
          .sidebar-button:active {
            transform: translateY(0) !important;
            transition: transform 0.1s ease !important;
          }
        `}
      </style>
    </>
  );
};

export default Sidebar;