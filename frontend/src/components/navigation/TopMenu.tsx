import { Button, Flex, Heading, Badge } from "@radix-ui/themes";
import { FiBell, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";
import { useFrappeAuth, useFrappeGetCall } from "frappe-react-sdk";
import { RxHamburgerMenu } from "react-icons/rx";
import { useEffect, useState } from "react";

interface TopMenuProps {
  topMenuHeight?: number;
  isMobile: boolean;
  sidebarVisible: boolean;
  setSidebarVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const TopMenu = ({
  topMenuHeight,
  isMobile,
  setSidebarVisible,
}: TopMenuProps) => {
  const navigate = useNavigate();
  const { currentUser } = useFrappeAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notification count using the get_notification_count function
  const { data, error, mutate } = useFrappeGetCall<{ message: number }>(
    "frappe.client.get_count",
    {
      doctype: "Notification Log",
      filters: JSON.stringify({
        for_user: currentUser,
        read: 0
      })
    },
    undefined,
    {
      revalidateOnFocus: true
    }
  );

  useEffect(() => {
    if (data) {
      setUnreadCount(data.message);
    }
  }, [data]);

  // Refresh notification count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      mutate();
    }, 30000);

    return () => clearInterval(interval);
  }, [mutate]);

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
          <Button
            variant="ghost"
            color="gray"
            highContrast
            size="2"
            onClick={() => setSidebarVisible((prev) => !prev)}
            aria-label="Toggle Sidebar"
            style={{
              borderRadius: "0.75rem",
              padding: "0.5rem",
              marginRight: "1rem",
              transition: "background-color 0.2s ease, transform 0.2s ease",
            }}
            className="hover:bg-gray-100 active:scale-95"
          >
            <RxHamburgerMenu size={22} />
          </Button>
        )}

        <Flex
          align="center"
          gap="2"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <img
            src={logo}
            alt="Cool Track Logo"
            style={{ height: 30, width: "auto", objectFit: "contain" }}
          />
          <Heading
            size="6"
            color="blue"
            style={{ fontWeight: 600, letterSpacing: "0.5px" }}
          >
            Cool Track
          </Heading>
        </Flex>
      </Flex>

      <Flex align="center" gap="3">
        <Button
          variant="ghost"
          color="gray"
          highContrast
          size="2"
          style={{
            padding: "0.6rem 0.8rem",
            borderRadius: "50%",
            position: "relative",
            transition: "background-color 0.3s ease, transform 0.2s ease",
          }}
          onClick={() => {
            navigate("/notifications");
            mutate(); // Refresh count when navigating to notifications
          }}
          aria-label="Notifications"
          className="hover:bg-gray-100 active:scale-95"
        >
          <FiBell size={20} />
          {unreadCount > 0 && (
            <Badge
              color="red"
              variant="solid"
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                padding: "0.2rem 0.4rem",
                fontSize: "12px",
                fontWeight: "bold",
                borderRadius: "50%",
                boxShadow: "0 0 12px rgba(255, 0, 0, 0.7)",
                animation: "pulse 1s infinite",
                transition: "box-shadow 0.3s ease-in-out",
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
            padding: "0.6rem 0.8rem",
            borderRadius: "50%",
            transition: "background-color 0.3s ease, transform 0.2s ease",
          }}
          onClick={() => navigate("/profile")}
          aria-label="User Profile"
          className="hover:bg-gray-100 active:scale-95"
        >
          <FiUser size={20} />
        </Button>
      </Flex>
    </Flex>
  );
};

export default TopMenu;