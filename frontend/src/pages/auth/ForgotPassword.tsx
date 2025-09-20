import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  TextField,
  Text,
  Card,
  Separator
} from "@radix-ui/themes";
import { useFrappePostCall } from "frappe-react-sdk";
import { FaCheck, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { isEmailValid } from "../../utils/validations";
import logo from "../../assets/logo.svg";

// Import reusable components and hooks
import { ActionButton } from "../../components/common/ActionButton";
import { ToastContainer } from "../../components/common/ToastContainer";
import { useToast } from "../../hooks/useToast";
import { useMobile } from "../../hooks/useMobile";

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");

  const { call } = useFrappePostCall(
    "frappe.core.doctype.user.user.reset_password"
  );

  const { toasts, showSuccess, showError, hideToast } = useToast();
  const isMobile = useMobile();

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
  };

  const handleReset = async () => {
    // Prevent double submission
    if (isSubmitting) return;

    if (!validateEmail(email)) {
      showError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await call({ user: email });
      showSuccess("Password reset instructions have been sent to your email.", {
        duration: 6000
      });
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
      
      showError(errorMessage, {
        duration: 8000
      });
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
    handleReset();
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
          <Flex direction="column" gap={isMobile ? "3" : "4"} align="center">
            <img
              src={logo}
              alt="Cool Track Logo"
              style={{ 
                height: isMobile ? 50 : 60, 
                marginBottom: isMobile ? 4 : 8 
              }}
            />
            
            {!emailSent ? (
              <>
                <Heading 
                  size={isMobile ? "5" : "6"} 
                  align="center" 
                  weight="bold"
                >
                  Forgot your password?
                </Heading>
                <Text 
                  size={isMobile ? "2" : "3"} 
                  align="center" 
                  color="gray" 
                  style={{ maxWidth: isMobile ? "280px" : "320px" }}
                >
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
                    size={isMobile ? "2" : "3"}
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

                <Flex 
                  justify="center" 
                  width="100%" 
                  mt="2"
                >
                  <ActionButton
                    label="Send Reset Link"
                    onClick={handleReset}
                    variant="solid"
                    color="blue"
                    size={isMobile ? "2" : "3"}
                    disabled={isSubmitting || !email}
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
                  Check your email
                </Heading>
                <Text 
                  size={isMobile ? "2" : "3"} 
                  align="center" 
                  color="gray" 
                  style={{ maxWidth: isMobile ? "280px" : "320px" }}
                >
                  We've sent a password reset link to <strong>{email}</strong>
                </Text>

                <Separator size="4" />

                <Text 
                  size="2" 
                  align="center" 
                  color="gray" 
                  style={{ maxWidth: isMobile ? "260px" : "300px" }}
                >
                  Didn't receive the email? Check your spam folder or try again.
                </Text>

                <Flex 
                  justify="center" 
                  width="100%" 
                  mt="2"
                >
                  <ActionButton
                    label="Resend Email"
                    onClick={handleResendEmail}
                    variant="outline"
                    color="blue"
                    size={isMobile ? "2" : "3"}
                    disabled={isSubmitting}
                    loading={isSubmitting}
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

export default ForgotPassword;