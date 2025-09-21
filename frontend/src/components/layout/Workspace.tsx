import { useState, useEffect } from "react";
import { Flex, Box } from "@radix-ui/themes";
import { Outlet } from "react-router-dom";
import TopMenu from "./TopMenu/TopMenu";
import Sidebar from "./SideBar/Sidebar";

const Workspace = () => {
  const sidebarWidth = 200;
  const topMenuHeight = 50;

  // Initialize states properly to avoid flash
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize with actual window width if available
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false; // Default to desktop
  });
  
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    // Initialize sidebar visibility based on mobile state
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true; // Default to visible for desktop
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarVisible(!mobile);
    };

    // Set initialized flag after first render
    setIsInitialized(true);
    
    // Set initial state based on current window size
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Add a brief loading state to prevent flash
  if (!isInitialized) {
    return (
      <Flex direction="column" height="100vh" style={{ backgroundColor: "var(--color-background)" }}>
        <Box
          style={{
            height: `${topMenuHeight}px`,
            backgroundColor: "var(--color-panel-solid)",
            borderBottom: "1px solid var(--gray-5)",
          }}
        />
        <Box style={{ flex: 1, backgroundColor: "var(--color-background)" }} />
      </Flex>
    );
  }

  return (
    <Flex direction="column" height="100vh" style={{ backgroundColor: "var(--color-background)" }}>
      <TopMenu
        topMenuHeight={topMenuHeight}
        isMobile={isMobile}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
      />

      <Sidebar
        sidebarWidth={sidebarWidth}
        topMenuHeight={topMenuHeight}
        isMobile={isMobile}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
      />

      <Box
        style={{
          marginLeft: !isMobile && sidebarVisible ? `${sidebarWidth}px` : 0,
          marginTop: `${topMenuHeight}px`,
          transition: "margin-left 0.3s ease",
          minHeight: `calc(100vh - ${topMenuHeight}px)`,
          backgroundColor: "var(--color-background)",
        }}
      >
        <Outlet />
      </Box>
    </Flex>
  );
};

export default Workspace;