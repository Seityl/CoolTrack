import { Flex, Box } from "@radix-ui/themes";
import { Outlet } from "react-router-dom";
import TopMenu from "../navigation/TopMenu";
import Sidebar from "../navigation/SideBar";

const Workspace = () => {
  const sidebarWidth = 200;
  const topMenuHeight = 50;

  return (
    <Flex direction="column" height="100vh">
      <TopMenu topMenuHeight={topMenuHeight} />
      <Sidebar sidebarWidth={sidebarWidth} topMenuHeight={topMenuHeight} />
      <Box
        style={{
          marginLeft: `${sidebarWidth}px`,
          marginTop: `${topMenuHeight}px`
        }}
      >
        <Outlet />
      </Box>
    </Flex>
  );
};

export default Workspace;