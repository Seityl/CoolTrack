import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Flex,
  Heading,
  Box,
  Text,
  TextField,
  Button,
  Spinner,
  Checkbox,
  Separator
} from "@radix-ui/themes";
import { FaCheck, FaExclamationTriangle, FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import logo from "../../assets/logo.svg";
import { useFrappeAuth } from "frappe-react-sdk";

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Increased to 5 seconds for better UX
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          backgroundColor: type === "success" ? "var(--green-9)" : "var(--red-9)",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          maxWidth: "300px",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        {type === "success" ? (
          <FaCheck size={16} />
        ) : (
          <FaExclamationTriangle size={16} />
        )}
        <Text size="2">{message}</Text>
      </div>
    </>
  );
};

const Login = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const { login } = useFrappeAuth();
  const navigate = useNavigate();

  // Load saved credentials if remember me was checked
  useEffect(() => {
    const savedUsername = localStorage.getItem("cooltrack_username");
    const savedRememberMe = localStorage.getItem("cooltrack_remember") === "true";
    
    if (savedUsername && savedRememberMe) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

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
    if (loginError) setLoginError(undefined);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
    if (loginError) setLoginError(undefined);
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setLoginError(undefined);
    
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
      
      navigate("/");
    } catch (err: unknown) {
      let errorMessage = "Login failed. Please try again.";
      setLoginError(errorMessage);
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
          minHeight: "100vh"
        }}
      >
        <Card 
          size="3" 
          style={{ 
            width: "100%", 
            maxWidth: 420
          }}
        >
          <form onSubmit={onSubmit}>
            <Flex direction="column" gap="4" align="center">
              <img
                src={logo}
                alt="Cool Track Logo"
                style={{ height: 60, marginBottom: 8 }}
              />
              <Heading size="6" align="center" weight="bold">
                Welcome to Cool Track
              </Heading>
              <Text size="3" align="center" color="gray">
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
                  size="3"
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
                  size="3"
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

              <Flex justify="between" align="center" width="100%" mt="2">
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

              <Button
                variant="solid"
                color="blue"
                size="3"
                type="submit"
                disabled={isSubmitting}
                style={{ 
                  width: "100%",
                  height: "44px",
                  fontWeight: "500"
                }}
              >
                {isSubmitting ? (
                  <Flex align="center" gap="2">
                    <Spinner size="2" />
                  </Flex>
                ) : (
                  "Sign In"
                )}
              </Button>

            </Flex>
          </form>
        </Card>
      </Flex>

      {loginError && (
        <Toast
          message={loginError}
          type="error"
          onClose={() => setLoginError(undefined)}
        />
      )}
    </>
  );
};

export default Login;