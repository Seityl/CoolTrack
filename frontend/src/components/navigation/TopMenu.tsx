import { Button, Flex, Heading } from "@radix-ui/themes";
import { FiBell, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";

interface TopMenuProps {
  topMenuHeight?: number;
}

const TopMenu = ({ topMenuHeight = 64 }: TopMenuProps) => {
  const navigate = useNavigate();

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
        boxShadow: "0 1px 2px var(--black-a4)",
        zIndex: 1000,
      }}
    >
      {/* Logo and Brand */}
      <Flex
        align="center"
        gap="3"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        <img
          src={logo}
          alt="Cool Track Logo"
          style={{ height: 36, width: "auto" }}
        />
        <Heading size="6" color="blue">
          Cool Track
        </Heading>
      </Flex>

      {/* Action Buttons */}
      <Flex align="center" gap="3">
        <Button
          variant="ghost"
          color="gray"
          highContrast
          size="2"
          style={{
            padding: "0.4rem 0.5rem",
            borderRadius: "var(--radius-3)",
          }}
          aria-label="Notifications"
        >
          <FiBell size={18} />
        </Button>
        <Button
          variant="soft"
          color="gray"
          highContrast
          size="2"
          style={{
            padding: "0.4rem 0.5rem",
            borderRadius: "var(--radius-3)",
          }}
          onClick={() => navigate("/user/profile")}
          aria-label="User Profile"
        >
          <FiUser size={18} />
        </Button>
      </Flex>
    </Flex>
  );
};

export default TopMenu;