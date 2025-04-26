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
} from "@radix-ui/themes";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
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

const Login = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login } = useFrappeAuth();
  const navigate = useNavigate();

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ username, password });
      setLoginError(undefined);
      navigate("/");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setLoginError(errorMessage);
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
          <form onSubmit={onSubmit}>
            <Flex direction="column" gap="5" align="center">
              <img
                src={logo}
                alt="Cool Track Logo"
                style={{ height: 60, marginBottom: 10 }}
              />
              <Heading size="6" align="center">
              	Welcome to Cool Track
              </Heading>
              <Heading size="4" align="center" color="gray">
                Sign in to continue
              </Heading>

              <Box width="100%">
                <Text as="label" size="2" weight="medium">
                  Email
                </Text>
                <TextField.Root
                  placeholder="you@cooltrack.com"
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                  mt="2"
                />
              </Box>

              <Box width="100%">
                <Text as="label" size="2" weight="medium">
                  Password
                </Text>
                <TextField.Root
                  type="password"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  mt="2"
                />
              </Box>

              <Flex gap="3" justify="center" mt="2" width="100%">
                <Button
                  variant="solid"
                  color="blue"
                  type="submit"
                  disabled={isSubmitting}
                  style={{ width: "100%" }}
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </Flex>

              <Flex justify="center" gap="2" mt="2">
                <Text size="2" color="gray">
                  Don’t have an account?
                </Text>
                <Link to="/signup" style={{ textDecoration: "none" }}>
                  <Text size="2" color="blue">
                    Sign Up
                  </Text>
                </Link>
              </Flex>

              <Flex justify="center" gap="2" mt="1">
                <Text size="2" color="gray">
                  Forgot password?
                </Text>
                <Link to="/forgot-password" style={{ textDecoration: "none" }}>
                  <Text size="2" color="blue">
                    Reset it
                  </Text>
                </Link>
              </Flex>
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