import { Button, Flex, Heading, Badge } from "@radix-ui/themes";
import { FiBell, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";
import { useFrappeAuth, useFrappeGetCall } from "frappe-react-sdk";

interface TopMenuProps {
  topMenuHeight?: number;
}

const TopMenu = ({topMenuHeight}: TopMenuProps) => {
  const navigate = useNavigate();
  const { currentUser } = useFrappeAuth();

  // Fetch unread notifications count
  const { data } = useFrappeGetCall<{ message: { name: string; seen: boolean }[] }>(
    "cooltrack.api.v1.get_notifications",
    { user_email: currentUser }
  );

  const unreadCount = data?.message.filter((notification) => !notification.seen).length || 0;

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
      <Flex
        align="center"
        gap="2"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        <img
          src={logo}
          alt="Cool Track Logo"
          style={{ height: 40, width: "auto" }}
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
            position: "relative",
          }}
          onClick={() => navigate("/user/notifications")}
          aria-label="Notifications"
        >
          <FiBell size={18} />
          {/* Unread notifications indicator */}
          {unreadCount > 0 && (
            <Badge
              color="red"
              variant="solid"
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                padding: "0.2rem 0.4rem",
                fontSize: "10px",
                fontWeight: "bold",
                borderRadius: "50%",
              }}
            >
              {unreadCount}
            </Badge>
          )}
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