import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Card,
  TextField,
  Heading,
  Separator,
} from "@radix-ui/themes";
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import { useFrappePostCall } from "frappe-react-sdk";
import logo from "../../assets/logo.svg";

import { ActionButton } from "../../components/common/ActionButton";
import { ToastContainer } from "../../components/common/ToastContainer";
import { ErrorState } from "../../components/common/ErrorState";
import { useToast } from "../../hooks/useToast";
import { useMobile } from "../../hooks/useMobile";

const UpdatePassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const key = searchParams.get("key");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { call: updatePassword } = useFrappePostCall("frappe.core.doctype.user.user.update_password");
  const { toasts, showSuccess, showError, hideToast } = useToast();
  const isMobile = useMobile();

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
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Clear validation error as user types
    if (validationError) {
      setValidationError("");
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) return;

    if (!key) {
      showError("Invalid or missing reset key.");
      return;
    }

    if (!validateForm()) {
      showError("Please fix the form errors before continuing");
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword({
        key,
        new_password: password,
      });

      showSuccess("Password updated successfully! Redirecting...", {
        duration: 3000
      });
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
      
      showError(errorMessage, {
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting && password && confirmPassword) {
      handleSubmit();
    }
  };

  const handleRetryNewReset = () => {
    navigate("/forgot-password");
  };

  // If no key is provided, show error state
  if (!key) {
    return (
      <Flex
        align="center"
        justify="center"
        px="4"
        style={{ 
          overflow: "hidden",
          minHeight: "100vh",
          maxHeight: "100vh",
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
          <Flex direction="column" gap={isMobile ? "3" : "4"} align="center">
            <img
              src={logo}
              alt="Cool Track Logo"
              style={{ 
                height: isMobile ? 50 : 60, 
                marginBottom: isMobile ? 4 : 8 
              }}
            />
            
            <ErrorState
              title="Invalid Reset Link"
              message="This password reset link is invalid or has expired. Please request a new password reset."
              icon={<FaExclamationTriangle size={24} />}
              onRetry={handleRetryNewReset}
              retryLabel="Request New Reset"
            />

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
          <Flex direction="column" gap={isMobile ? "3" : "4"} align="center">
            <img
              src={logo}
              alt="Cool Track Logo"
              style={{ 
                height: isMobile ? 50 : 60, 
                marginBottom: isMobile ? 4 : 8 
              }}
            />
            
            {!passwordUpdated ? (
              <>
                <Heading 
                  size={isMobile ? "5" : "6"} 
                  align="center" 
                  weight="bold"
                >
                  Update your password
                </Heading>
                <Text 
                  size={isMobile ? "2" : "3"} 
                  align="center" 
                  color="gray" 
                  style={{ maxWidth: isMobile ? "280px" : "320px" }}
                >
                  Enter your new password below.
                </Text>

                <Separator size="4" />

                {/* New Password Field */}
                <Box width="100%">
                  <Text as="label" size="2" weight="medium" color="gray">
                    New Password
                  </Text>
                  <TextField.Root
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyPress={handleKeyPress}
                    size={isMobile ? "2" : "3"}
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

                {/* Confirm Password Field */}
                <Box width="100%">
                  <Text as="label" size="2" weight="medium" color="gray">
                    Confirm Password
                  </Text>
                  <TextField.Root
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onKeyPress={handleKeyPress}
                    size={isMobile ? "2" : "3"}
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
                    padding: isMobile ? "10px" : "12px",
                    borderRadius: "6px",
                    backgroundColor: "var(--gray-2)",
                    border: "1px solid var(--gray-4)",
                  }}
                >
                  <Text 
                    size={isMobile ? "1" : "2"} 
                    weight="medium" 
                    style={{ marginBottom: "8px", display: "block" }}
                  >
                    Password Requirements:
                  </Text>
                  <Flex direction="column" gap="1">
                    <Text size="1" color="gray">• At least 8 characters long</Text>
                    <Text size="1" color="gray">• Contains uppercase and lowercase letters</Text>
                    <Text size="1" color="gray">• Contains at least one number</Text>
                  </Flex>
                </Box>

                <Flex 
                  justify="center" 
                  width="100%" 
                  mt="2"
                >
                  <ActionButton
                    label="Update Password"
                    onClick={handleSubmit}
                    variant="solid"
                    color="blue"
                    size={isMobile ? "2" : "3"}
                    disabled={isSubmitting || !password || !confirmPassword}
                    loading={isSubmitting}
                  />
                </Flex>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: isMobile ? "50px" : "60px",
                    height: isMobile ? "50px" : "60px",
                    borderRadius: "50%",
                    backgroundColor: "var(--green-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "8px"
                  }}
                >
                  <FaCheck size={isMobile ? 20 : 24} color="var(--green-9)" />
                </div>
                
                <Heading 
                  size={isMobile ? "5" : "6"} 
                  align="center" 
                  weight="bold"
                >
                  Password Updated!
                </Heading>
                <Text 
                  size={isMobile ? "2" : "3"} 
                  align="center" 
                  color="gray" 
                  style={{ maxWidth: isMobile ? "280px" : "320px" }}
                >
                  Your password has been successfully updated. You will be redirected shortly.
                </Text>

                <Separator size="4" />

                <Text 
                  size="2" 
                  align="center" 
                  color="gray" 
                  style={{ maxWidth: isMobile ? "260px" : "300px" }}
                >
                  Redirecting in a few seconds...
                </Text>

                <Flex 
                  justify="center" 
                  width="100%" 
                  mt="2"
                >
                  <ActionButton
                    label="Redirect Now"
                    onClick={() => navigate("/login")}
                    variant="outline"
                    color="blue"
                    size={isMobile ? "2" : "3"}
                  />
                </Flex>
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

      {/* Toast Container for notifications */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </>
  );
};

export default UpdatePassword;