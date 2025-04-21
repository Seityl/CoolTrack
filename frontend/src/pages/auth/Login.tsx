import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  Flex,
  Heading,
  Box,
  Text,
  TextField,
  Button,
  Callout,
} from "@radix-ui/themes";
import { useFrappeAuth } from "frappe-react-sdk";

const Login = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login } = useFrappeAuth();
  const navigate = useNavigate();

  const onSubmit = async () => {
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
    <Flex align="center" justify="center" height="100vh" px="4">
      <Card size="4" style={{ width: "100%", maxWidth: 400 }}>
        <Flex direction="column" gap="5">
          <Heading size="6" align="center">
            Welcome to Cool Track
          </Heading>
          <Heading size="4" align="center" color="gray">
            Sign in to continue
          </Heading>

          {loginError && (
            <Callout.Root color="red" size="2">
              <Callout.Text>{loginError}</Callout.Text>
            </Callout.Root>
          )}

          <Box>
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

          <Box>
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

          <Flex gap="3" justify="center" mt="2">
            <Button
              variant="solid"
              color="blue"
              onClick={onSubmit}
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
      </Card>
    </Flex>
  );
};

export default Login;