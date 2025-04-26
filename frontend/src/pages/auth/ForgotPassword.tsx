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
} from "@radix-ui/themes";
import { useFrappePostCall } from "frappe-react-sdk";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
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
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        backgroundColor: type === "success" ? "var(--green-9)" : "var(--red-9)",
        color: "white",
        padding: "12px 16px",
        borderRadius: "4px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {type === "success" ? (
        <FaCheck size={16} />
      ) : (
        <FaExclamationTriangle size={16} />
      )}
      <Text size="2">{message}</Text>
    </div>
  );
};

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const { call } = useFrappePostCall(
    "frappe.core.doctype.user.user.reset_password"
  );

  const handleReset = async () => {
    setToastMessage(null);
    setIsSubmitting(true);

    try {
      await call({ user: email });
      setToastMessage("Password reset instructions have been sent to your email.");
      setToastType("success");
    } catch (err: any) {
      setToastMessage(
        err?.message || "There was an error resetting your password. Please try again."
      );
      setToastType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Flex
        align="center"
        justify="center"
        height="100vh"
        px="4"
        style={{ overflow: "hidden" }}
      >
        <Card size="1" style={{ width: "100%", maxWidth: 400 }}>
          <Flex direction="column" gap="5" align="center">
            <img
              src={logo}
              alt="Cool Track Logo"
              style={{ height: 60, marginBottom: 10 }}
            />
            <Heading size="6" align="center">
              Forgot your password?
            </Heading>
            <Heading size="4" align="center" color="gray">
              We'll send you a reset link
            </Heading>

            <Box width="100%">
              <Text as="label" size="2" weight="medium">
                Email
              </Text>
              <TextField.Root
                type="email"
                placeholder="you@cooltrack.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mt="2"
              />
            </Box>

            <Flex justify="center" mt="2" width="100%">
              <Button
                variant="solid"
                color="blue"
                onClick={handleReset}
                disabled={isSubmitting || !email}
                style={{ width: "100%" }}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </Flex>

            <Flex justify="center" gap="2" mt="2">
              <Text size="2" color="gray">
                Remember your password?
              </Text>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Text size="2" color="blue">
                  Log In
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