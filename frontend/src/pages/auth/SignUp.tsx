import { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Card,
  Flex,
  Heading,
  Box,
  Text,
  TextField,
  Button,
  Spinner,
  Separator
} from "@radix-ui/themes";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { isEmailValid } from "../../utils/validations";
import logo from "../../assets/logo.svg";
import { FaCheck, FaExclamationTriangle, FaUser, FaEnvelope, FaArrowLeft } from "react-icons/fa";

export type SignUpInputs = {
  email: string;
  full_name: string;
};

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

const SignUp = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    clearErrors,
  } = useForm<SignUpInputs>();

  const { call } = useContext(FrappeContext) as FrappeConfig;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [signupSuccess, setSignupSuccess] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");

  // Watch form values for real-time validation feedback
  const watchedEmail = watch("email");
  const watchedFullName = watch("full_name");

  useEffect(() => {
    // Clear errors when user starts typing
    if (errors.email && watchedEmail) {
      clearErrors("email");
    }
    if (errors.full_name && watchedFullName) {
      clearErrors("full_name");
    }
  }, [watchedEmail, watchedFullName, errors, clearErrors]);

  const onSubmit = async (values: SignUpInputs) => {
    setToastMessage(null);

    try {
      const res = await call.post("frappe.core.doctype.user.user.sign_up", {
        email: values.email,
        full_name: values.full_name,
        redirect_to: "/",
      });

      const message = Array.isArray(res?.message)
        ? res.message[1] || "Account created successfully!"
        : "Account created successfully!";

      setUserEmail(values.email);
      setSignupSuccess(true);
      setToastMessage(message);
      setToastType("success");
    } catch (err: any) {
      let errorMessage = "Something went wrong. Please try again.";
      
      if (err?.message) {
        if (err.message.includes("User already exists")) {
          errorMessage = "An account with this email already exists. Please try logging in instead.";
        } else if (err.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setToastMessage(errorMessage);
      setToastType("error");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleSubmit(onSubmit)();
    }
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <Flex direction="column" gap="4" align="center">
              <img
                src={logo}
                alt="Cool Track Logo"
                style={{ height: 60, marginBottom: 8 }}
              />
              
              {!signupSuccess ? (
                <>
                  <Heading size="6" align="center" weight="bold">
                    Join Cool Track
                  </Heading>
                  <Text size="3" align="center" color="gray">
                    Create your account to get started
                  </Text>

                  <Separator size="4" />

                  <Box width="100%">
                    <Text as="label" size="2" weight="medium" color="gray">
                      Full Name
                    </Text>
                    <TextField.Root
                      placeholder="John Doe"
                      {...register("full_name", { 
                        required: "Full name is required",
                        minLength: {
                          value: 2,
                          message: "Name must be at least 2 characters"
                        }
                      })}
                      onKeyPress={handleKeyPress}
                      size="3"
                      mt="2"
                      color={errors?.full_name ? "red" : undefined}
                      style={{ 
                        paddingLeft: "10px",
                        border: errors?.full_name ? "1px solid var(--red-8)" : undefined
                      }}
                    >
                      <TextField.Slot side="left">
                        <FaUser size={14} color="var(--gray-9)" />
                      </TextField.Slot>
                    </TextField.Root>
                    {errors?.full_name && (
                      <Text color="red" size="1" mt="1">
                        {errors.full_name.message}
                      </Text>
                    )}
                  </Box>

                  <Box width="100%">
                    <Text as="label" size="2" weight="medium" color="gray">
                      Email Address
                    </Text>
                    <TextField.Root
                      type="email"
                      placeholder="you@cooltrack.com"
                      {...register("email", {
                        required: "Email is required",
                        validate: (email) =>
                          isEmailValid(email) || "Please enter a valid email address",
                      })}
                      onKeyPress={handleKeyPress}
                      size="3"
                      mt="2"
                      color={errors?.email ? "red" : undefined}
                      style={{ 
                        paddingLeft: "10px",
                        border: errors?.email ? "1px solid var(--red-8)" : undefined
                      }}
                    >
                      <TextField.Slot side="left">
                        <FaEnvelope size={14} color="var(--gray-9)" />
                      </TextField.Slot>
                    </TextField.Root>
                    {errors?.email && (
                      <Text color="red" size="1" mt="1">
                        {errors.email.message}
                      </Text>
                    )}
                  </Box>

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
                        <Text>Creating Account...</Text>
                      </Flex>
                    ) : (
                      "Create Account"
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
                    Account Created!
                  </Heading>
                  <Text size="3" align="center" color="gray" style={{ maxWidth: "320px" }}>
                    We've sent a verification email to <strong>{userEmail}</strong>. Please check your inbox and click the verification link to activate your account.
                  </Text>

                  <Separator size="4" />

                  <Text size="2" align="center" color="gray" style={{ maxWidth: "300px" }}>
                    Didn't receive the email? Check your spam folder or contact support if you need help.
                  </Text>

                  <Button
                    variant="outline"
                    color="blue"
                    size="3"
                    onClick={() => {
                      setSignupSuccess(false);
                      setToastMessage(null);
                    }}
                    style={{ 
                      width: "100%",
                      height: "44px",
                      fontWeight: "500"
                    }}
                  >
                    Create Another Account
                  </Button>
                </>
              )}

              <Separator size="4" />

              <Flex direction="column" align="center" justify="center" gap="3" width="100%">
                <Text size="2" color="gray">
                  Already have an account?
                </Text>
                <Flex align="center" justify="center" gap="2">
                  <FaArrowLeft size={12} color="var(--gray-9)" />
                  <Link to="/login" style={{ textDecoration: "none" }}>
                    <Text size="2" color="blue" weight="medium" style={{ cursor: "pointer" }}>
                      Back to Login
                    </Text>
                  </Link>
                </Flex>
              </Flex>
            </Flex>
          </form>
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

export default SignUp;