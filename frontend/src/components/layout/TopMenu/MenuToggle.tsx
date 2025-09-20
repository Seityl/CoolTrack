import React from 'react';
import { Button } from "@radix-ui/themes";
import { RxHamburgerMenu } from "react-icons/rx";

interface MenuToggleProps {
  onToggle: () => void;
  size?: "1" | "2" | "3";
  variant?: "solid" | "soft" | "outline" | "ghost";
}

export const MenuToggle: React.FC<MenuToggleProps> = ({
  onToggle,
  size = "2",
  variant = "ghost"
}) => {
  return (
    <Button
      variant={variant}
      color="gray"
      highContrast
      size={size}
      onClick={onToggle}
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
  );
};