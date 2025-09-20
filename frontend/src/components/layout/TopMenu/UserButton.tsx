import React from 'react';
import { DropdownMenu, Button } from "@radix-ui/themes";
import { FiUser, FiLogOut, FiUserCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useFrappeAuth } from "frappe-react-sdk";

interface UserButtonProps {
  size?: "1" | "2" | "3";
  variant?: "solid" | "soft" | "outline" | "ghost";
  onUserClick?: () => void;
  onLogout?: () => void;
}

export const UserButton: React.FC<UserButtonProps> = ({
  size = "2",
  variant = "soft",
  onUserClick,
  onLogout
}) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useFrappeAuth();

  const handleProfileClick = () => {
    navigate("/profile");
    onUserClick?.();
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      onLogout?.();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button
          variant={variant}
          color="gray"
          highContrast
          size={size}
          style={{
            padding: "0.6rem 0.8rem",
            borderRadius: "50%",
            transition: "background-color 0.3s ease, transform 0.2s ease",
            cursor: "pointer",
            outline: "none",
            border: "none",
            boxShadow: "none"
          }}
          aria-label="User Menu"
          className="hover:bg-gray-100 active:scale-95"
          onFocus={(e) => e.target.blur()}
        >
          <FiUser size={20} />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        size="2"
        style={{
          minWidth: "200px",
          backgroundColor: "var(--color-panel-solid)",
          border: "1px solid var(--gray-6)",
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
          padding: "0.5rem",
        }}
      >
        {/* User Info Header */}
        <DropdownMenu.Item
          disabled
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--gray-4)",
            marginBottom: "0.5rem",
            color: "var(--gray-11)",
            fontSize: "0.875rem",
            fontWeight: "500"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FiUserCheck size={16} />
            {currentUser || "User"}
          </div>
        </DropdownMenu.Item>

        {/* Profile Option */}
        <DropdownMenu.Item
          onSelect={handleProfileClick}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
          className="hover:bg-gray-100"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FiUser size={16} />
            Profile
          </div>
        </DropdownMenu.Item>

        {/* Separator */}
        <DropdownMenu.Separator style={{ margin: "0.5rem 0", backgroundColor: "var(--gray-4)" }} />

        {/* Logout Option */}
        <DropdownMenu.Item
          onSelect={handleLogoutClick}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            color: "var(--red-11)",
          }}
          className="hover:bg-red-50"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FiLogOut size={16} />
            Logout
          </div>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};