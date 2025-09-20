import React from 'react';
import { Flex, Heading } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";

interface AppLogoProps {
  logoSrc: string;
  appName: string;
  logoHeight?: number;
  onClick?: () => void;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  logoSrc,
  appName,
  logoHeight = 30,
  onClick,
  showText = true
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/");
    }
  };

  return (
    <Flex
      align="center"
      gap="2"
      style={{ cursor: "pointer" }}
      onClick={handleClick}
    >
      <img
        src={logoSrc}
        alt={`${appName} Logo`}
        style={{ 
          height: logoHeight, 
          width: "auto", 
          objectFit: "contain" 
        }}
      />
      {showText && (
        <Heading
          size="6"
          color="blue"
          style={{ 
            fontWeight: 600, 
            letterSpacing: "0.5px",
            display: window.innerWidth < 480 ? "none" : "block"
          }}
        >
          {appName}
        </Heading>
      )}
    </Flex>
  );
};