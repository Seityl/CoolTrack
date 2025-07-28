import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  TextField,
  Text,
  Card,
  Spinner,
  Separator
} from "@radix-ui/themes";
import { useFrappePostCall } from "frappe-react-sdk";
import { FaCheck, FaExclamationTriangle, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { isEmailValid } from "../../utils/validations";
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
    }, 5000); // Increased duration for better UX
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

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");

  const { call } = useFrappePostCall(
    "frappe.core.doctype.user.user.reset_password"
  );

  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue.trim()) {
      setValidationError("Email is required");
      return false;
    }
    
    if (!isEmailValid(emailValue)) {
      setValidationError("Please enter a valid email address");
      return false;
    }
    
    setValidationError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear validation error as user types
    if (validationError) {
      setValidationError("");
    }
    
    // Clear previous toast messages
    if (toastMessage) {
      setToastMessage(null);
    }
  };

  const handleReset = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setToastMessage(null);
    setIsSubmitting(true);

    try {
      await call({ user: email });
      setToastMessage("Password reset instructions have been sent to your email.");
      setToastType("success");
      setEmailSent(true);
    } catch (err: any) {
      let errorMessage = "There was an error resetting your password. Please try again.";
      
      if (err?.message) {
        if (err.message.includes("User not found")) {
          errorMessage = "No account found with this email address.";
        } else if (err.message.includes("User disabled")) {
          errorMessage = "This account has been disabled. Please contact support.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setToastMessage(errorMessage);
      setToastType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting && email) {
      handleReset();
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setToastMessage(null);
    handleReset();
  };

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
            
            {!emailSent ? (
              <>
                <Heading size="6" align="center" weight="bold">
                  Forgot your password?
                </Heading>
                <Text size="3" align="center" color="gray" style={{ maxWidth: "320px" }}>
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </Text>

                <Separator size="4" />

                <Box width="100%">
                  <Text as="label" size="2" weight="medium" color="gray">
                    Email Address
                  </Text>
                  <TextField.Root
                    type="email"
                    placeholder="you@cooltrack.co"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyPress={handleKeyPress}
                    size="3"
                    mt="2"
                    color={validationError ? "red" : undefined}
                    style={{ 
                      paddingLeft: "10px",
                      border: validationError ? "1px solid var(--red-8)" : undefined
                    }}
                  >
                    <TextField.Slot side="left">
                      <FaEnvelope size={14} color="var(--gray-9)" />
                    </TextField.Slot>
                  </TextField.Root>
                  {validationError && (
                    <Text size="1" color="red" mt="1">
                      {validationError}
                    </Text>
                  )}
                </Box>

                <Button
                  variant="solid"
                  color="blue"
                  size="3"
                  onClick={handleReset}
                  disabled={isSubmitting || !email}
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
                    "Send Reset Link"
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
                  Check your email
                </Heading>
                <Text size="3" align="center" color="gray" style={{ maxWidth: "320px" }}>
                  We've sent a password reset link to <strong>{email}</strong>
                </Text>

                <Separator size="4" />

                <Text size="2" align="center" color="gray" style={{ maxWidth: "300px" }}>
                  Didn't receive the email? Check your spam folder or try again.
                </Text>

                <Button
                  variant="outline"
                  color="blue"
                  size="3"
                  onClick={handleResendEmail}
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
                    "Resend Email"
                  )}
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

export default ForgotPassword;