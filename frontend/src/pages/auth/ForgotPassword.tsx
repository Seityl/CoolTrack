import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  TextField,
  Text,
  Callout,
  Card,
} from "@radix-ui/themes";
import { useFrappePostCall } from "frappe-react-sdk";

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const { call } = useFrappePostCall(
    "frappe.core.doctype.user.user.reset_password"
  );

  const handleReset = async () => {
    setResetError(null);
    setResetSuccess(null);
    setIsSubmitting(true);
    try {
      await call({ user: email });
      setResetSuccess("Password reset instructions have been sent to your email.");
    } catch (err: any) {
      setResetError(
        err?.message || "There was an error resetting your password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex align="center" justify="center" height="100vh" px="4">
      <Card size="4" style={{ width: "100%", maxWidth: 400 }}>
        <Flex direction="column" gap="5">
          <Heading size="6" align="center">
            Cool Track
          </Heading>
          <Heading size="4" align="center" color="gray">
            Forgot your password?
          </Heading>

          {resetError && (
            <Callout.Root color="red" size="2">
              <Callout.Text>{resetError}</Callout.Text>
            </Callout.Root>
          )}

          {resetSuccess && (
            <Callout.Root color="green" size="2">
              <Callout.Text>{resetSuccess}</Callout.Text>
            </Callout.Root>
          )}

          <Box>
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

          <Flex justify="center" mt="2">
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
  );
};

export default ForgotPassword;