import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Flex,
  Heading,
  Box,
  Text,
  TextField,
  Checkbox,
  Separator
} from "@radix-ui/themes";
import { FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import logo from "../../assets/logo.svg";
import { useFrappeAuth } from "frappe-react-sdk";

import { ActionButton } from "../../components/common/ActionButton";
import { LoadingState } from "../../components/common/LoadingState";
import { ToastContainer } from "../../components/common/ToastContainer";
import { useToast } from "../../hooks/useToast";
import { useMobile } from "../../hooks/useMobile";

const Login = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const { login, isLoading } = useFrappeAuth();
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, hideToast } = useToast();
  const isMobile = useMobile();

  // Load saved credentials if remember me was checked
  useEffect(() => {
    const savedUsername = localStorage.getItem("cooltrack_username");
    const savedRememberMe = localStorage.getItem("cooltrack_remember") === "true";
    
    if (savedUsername && savedRememberMe) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // Show loading state while auth is loading
  if (isLoading) {
    return <LoadingState message="Checking authentication..." />;
  }

  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      errors.username = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      errors.username = "Please enter a valid email address";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (validationErrors.username) {
      setValidationErrors(prev => ({ ...prev, username: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    if (!validateForm()) {
      showError("Please fix the form errors before continuing");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login({ username, password });
      
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem("cooltrack_username", username);
        localStorage.setItem("cooltrack_remember", "true");
      } else {
        localStorage.removeItem("cooltrack_username");
        localStorage.removeItem("cooltrack_remember");
      }
      
      showSuccess("Successfully logged in! Redirecting...", {
        duration: 2000
      });
      
      // Delay navigation slightly to show success message
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = "Login failed. Please check your credentials and try again.";
      showError(errorMessage, {
        duration: 6000,
        autoClose: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      onSubmit();
    }
  };

  return (
    <>
      <Flex
        align="center"
        justify="center"
        px="4"
        style={{ 
          overflow: "hidden",
          minHeight: "100vh",
          padding: isMobile ? "16px" : "24px"
        }}
      >
        <Card 
          size={isMobile ? "2" : "3"}
          style={{ 
            width: "100%", 
            maxWidth: isMobile ? 350 : 420
          }}
        >
          <form onSubmit={onSubmit}>
            <Flex direction="column" gap={isMobile ? "3" : "4"} align="center">
              <img
                src={logo}
                alt="Cool Track Logo"
                style={{ 
                  height: isMobile ? 50 : 60, 
                  marginBottom: isMobile ? 4 : 8 
                }}
              />
              <Heading 
                size={isMobile ? "5" : "6"} 
                align="center" 
                weight="bold"
              >
                Welcome to Cool Track
              </Heading>
              <Text 
                size={isMobile ? "2" : "3"} 
                align="center" 
                color="gray"
              >
                Sign in to your account to continue
              </Text>

              <Separator size="4" />

              <Box width="100%">
                <Text as="label" size="2" weight="medium" color="gray">
                  Email Address
                </Text>
                <TextField.Root
                  placeholder="you@cooltrack.co"
                  onChange={handleUsernameChange}
                  onKeyPress={handleKeyPress}
                  value={username}
                  size={isMobile ? "2" : "3"}
                  mt="2"
                  color={validationErrors.username ? "red" : undefined}
                  style={{ 
                    paddingLeft: "10px",
                    border: validationErrors.username ? "1px solid var(--red-8)" : undefined
                  }}
                >
                  <TextField.Slot side="left">
                    <FaUser size={14} color="var(--gray-9)" />
                  </TextField.Slot>
                </TextField.Root>
                {validationErrors.username && (
                  <Text size="1" color="red" mt="1">
                    {validationErrors.username}
                  </Text>
                )}
              </Box>

              <Box width="100%">
                <Text as="label" size="2" weight="medium" color="gray">
                  Password
                </Text>
                <TextField.Root
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  onChange={handlePasswordChange}
                  onKeyPress={handleKeyPress}
                  value={password}
                  size={isMobile ? "2" : "3"}
                  mt="2"
                  color={validationErrors.password ? "red" : undefined}
                  style={{ 
                    paddingLeft: "10px",
                    paddingRight: "10px",
                    border: validationErrors.password ? "1px solid var(--red-8)" : undefined
                  }}
                >
                  <TextField.Slot side="left">
                    <FaLock size={14} color="var(--gray-9)" />
                  </TextField.Slot>
                  <TextField.Slot side="right">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      {showPassword ? (
                        <FaEyeSlash size={14} color="var(--gray-9)" />
                      ) : (
                        <FaEye size={14} color="var(--gray-9)" />
                      )}
                    </button>
                  </TextField.Slot>
                </TextField.Root>
                {validationErrors.password && (
                  <Text size="1" color="red" mt="1">
                    {validationErrors.password}
                  </Text>
                )}
              </Box>

              <Flex 
                justify="between" 
                align="center" 
                width="100%" 
                mt="2"
                direction={isMobile ? "column" : "row"}
                gap={isMobile ? "2" : "0"}
              >
                <Flex align="center" gap="2">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    size="2"
                  />
                  <Text size="2" color="gray">
                    Remember me
                  </Text>
                </Flex>
                <Link to="/forgot-password" style={{ textDecoration: "none" }}>
                  <Text size="2" color="blue" style={{ cursor: "pointer" }}>
                    Forgot password?
                  </Text>
                </Link>
              </Flex>

              <Flex 
                justify="center" 
                width="100%" 
                mt="2"
              >
                <ActionButton
                  label="Sign In"
                  onClick={onSubmit}
                  variant="solid"
                  color="blue"
                  size={isMobile ? "2" : "3"}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                />
              </Flex>
            </Flex>
          </form>
        </Card>
      </Flex>

      {/* Toast Container for notifications */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </>
  );
};

export default Login;