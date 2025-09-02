import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Card,
  Button,
  TextField,
  Heading,
  Spinner,
  Separator,
} from "@radix-ui/themes";
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import { useFrappePostCall } from "frappe-react-sdk";
import logo from "../../assets/logo.svg";

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
    }, 5000);
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

const UpdatePassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const key = searchParams.get("key");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { call: updatePassword } = useFrappePostCall("frappe.core.doctype.user.user.update_password");

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Password must be at least 8 characters long");
    if (!/[A-Z]/.test(pwd)) errors.push("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("Password must contain at least one lowercase letter");
    if (!/\d/.test(pwd)) errors.push("Password must contain at least one number");
    return errors;
  };

  const validateForm = (): boolean => {
    if (!password.trim()) {
      setValidationError("Password is required");
      return false;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setValidationError(passwordErrors[0]);
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear validation error as user types
    if (validationError) {
      setValidationError("");
    }
    
    // Clear previous toast messages
    if (toastMessage) {
      setToastMessage(null);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Clear validation error as user types
    if (validationError) {
      setValidationError("");
    }
    
    // Clear previous toast messages
    if (toastMessage) {
      setToastMessage(null);
    }
  };

  const handleSubmit = async () => {
    if (!key) {
      setToastMessage("Invalid or missing reset key.");
      setToastType("error");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setToastMessage(null);
    setIsSubmitting(true);

    try {
      await updatePassword({
        key,
        new_password: password,
      });

      setToastMessage("Password updated successfully!");
      setToastType("success");
      setPasswordUpdated(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error: any) {
      console.error("Password update error:", error);
      let errorMessage = "Failed to update password. Please try again.";
      
      if (error?.message) {
        if (error.message.includes("expired")) {
          errorMessage = "The reset link has expired. Please request a new password reset.";
        } else if (error.message.includes("invalid")) {
          errorMessage = "Invalid reset link. Please request a new password reset.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setToastMessage(errorMessage);
      setToastType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting && password && confirmPassword) {
      handleSubmit();
    }
  };

  // If no key is provided, show error state
  if (!key) {
    return (
      <Flex
        align="center"
        justify="center"
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
          <Flex direction="column" gap="4" align="center">
            <img
              src={logo}
              alt="Cool Track Logo"
              style={{ height: 60, marginBottom: 8 }}
            />
            
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "var(--red-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "8px"
              }}
            >
              <FaExclamationTriangle size={24} color="var(--red-9)" />
            </div>
            
            <Heading size="6" align="center" weight="bold">
              Invalid Reset Link
            </Heading>
            <Text size="3" align="center" color="gray" style={{ maxWidth: "320px" }}>
              This password reset link is invalid or has expired. Please request a new password reset.
            </Text>

            <Separator size="4" />

            <Link to="/forgot-password" style={{ textDecoration: "none", width: "100%" }}>
              <Button
                variant="solid"
                color="blue"
                size="3"
                style={{ 
                  width: "100%",
                  height: "44px",
                  fontWeight: "500"
                }}
              >
                Request New Reset
              </Button>
            </Link>

            <Separator size="4" />

            <Flex align="center" justify="center" gap="2">
              <FaArrowLeft size={12} color="var(--gray-9)" />
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Text size="2" color="blue" weight="medium" style={{ cursor: "pointer" }}>
                  Back to Login
                </Text>
              </Link>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    );
  }

  return (
    <>
      <Flex
        align="center"
        justify="center"
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
          <Flex direction="column" gap="4" align="center">
            <img
              src={logo}
              alt="Cool Track Logo"
              style={{ height: 60, marginBottom: 8 }}
            />
            
            {!passwordUpdated ? (
              <>
                <Heading size="6" align="center" weight="bold">
                  Update your password
                </Heading>
                <Text size="3" align="center" color="gray" style={{ maxWidth: "320px" }}>
                  Enter your new password below. Make sure it's strong and secure.
                </Text>

                <Separator size="4" />

                {/* New Password Field */}
                <Box width="100%">
                  <Text as="label" size="2" weight="medium" color="gray">
                    New Password
                  </Text>
                  <Box style={{ position: "relative" }}>
                    <TextField.Root
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={handlePasswordChange}
                      onKeyPress={handleKeyPress}
                      size="3"
                      mt="2"
                      color={validationError ? "red" : undefined}
                      style={{ 
                        paddingLeft: "10px",
                        paddingRight: "10px",
                        border: validationError ? "1px solid var(--red-8)" : undefined
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
                  </Box>
                </Box>

                {/* Confirm Password Field */}
                <Box width="100%">
                  <Text as="label" size="2" weight="medium" color="gray">
                    Confirm Password
                  </Text>
                  <Box style={{ position: "relative" }}>
                    <TextField.Root
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      onKeyPress={handleKeyPress}
                      size="3"
                      mt="2"
                      color={validationError ? "red" : undefined}
                      style={{ 
                        paddingLeft: "10px",
                        paddingRight: "10px",
                        border: validationError ? "1px solid var(--red-8)" : undefined
                      }}
                    >
                      <TextField.Slot side="left">
                        <FaLock size={14} color="var(--gray-9)" />
                      </TextField.Slot>
                                        <TextField.Slot side="right">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash size={14} color="var(--gray-9)" />
                      ) : (
                        <FaEye size={14} color="var(--gray-9)" />
                      )}
                    </button>
                  </TextField.Slot>
                    </TextField.Root>
                  </Box>
                  {validationError && (
                    <Text size="1" color="red" mt="1">
                      {validationError}
                    </Text>
                  )}
                </Box>

                {/* Password Requirements */}
                <Box
                  width="100%"
                  style={{
                    padding: "12px",
                    borderRadius: "6px",
                    backgroundColor: "var(--gray-2)",
                    border: "1px solid var(--gray-4)",
                  }}
                >
                  <Text size="2" weight="medium" style={{ marginBottom: "8px", display: "block" }}>
                    Password Requirements:
                  </Text>
                  <Flex direction="column" gap="1">
                    <Text size="1" color="gray">• At least 8 characters long</Text>
                    <Text size="1" color="gray">• Contains uppercase and lowercase letters</Text>
                    <Text size="1" color="gray">• Contains at least one number</Text>
                  </Flex>
                </Box>

                <Button
                  variant="solid"
                  color="blue"
                  size="3"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !password || !confirmPassword}
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
                    "Update Password"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "var(--green-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "8px"
                  }}
                >
                  <FaCheck size={24} color="var(--green-9)" />
                </div>
                
                <Heading size="6" align="center" weight="bold">
                  Password Updated!
                </Heading>
                <Text size="3" align="center" color="gray" style={{ maxWidth: "320px" }}>
                  Your password has been successfully updated. You will be redirected to the login page shortly.
                </Text>

                <Separator size="4" />

                <Text size="2" align="center" color="gray" style={{ maxWidth: "300px" }}>
                  Redirecting to login in a few seconds...
                </Text>

                <Button
                  variant="outline"
                  color="blue"
                  size="3"
                  onClick={() => navigate("/login")}
                  style={{ 
                    width: "100%",
                    height: "44px",
                    fontWeight: "500"
                  }}
                >
                  Go to Login Now
                </Button>
              </>
            )}

            <Separator size="4" />

            <Flex align="center" justify="center" gap="2">
              <FaArrowLeft size={12} color="var(--gray-9)" />
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Text size="2" color="blue" weight="medium" style={{ cursor: "pointer" }}>
                  Back to Login
                </Text>
              </Link>
            </Flex>
          </Flex>
        </Card>
      </Flex>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
};

export default UpdatePassword;