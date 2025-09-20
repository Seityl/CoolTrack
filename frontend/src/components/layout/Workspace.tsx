import { useState, useEffect } from "react";
import { Flex, Box } from "@radix-ui/themes";
import { Outlet } from "react-router-dom";
import TopMenu from "./TopMenu/TopMenu";
import Sidebar from "./SideBar/Sidebar";

const Workspace = () => {
  const sidebarWidth = 200;
  const topMenuHeight = 50;

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarVisible(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Flex direction="column" height="100vh">
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
        }}
      >
        <Outlet />
      </Box>
    </Flex>
  );
};

export default Workspace;
