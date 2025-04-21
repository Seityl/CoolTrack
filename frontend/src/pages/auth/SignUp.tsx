import { useState, useContext } from "react";
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
  Callout,
} from "@radix-ui/themes";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { isEmailValid } from "../../utils/validations";

export type SignUpInputs = {
  email: string;
  full_name: string;
};

const SignUp = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInputs>();

  const { call } = useContext(FrappeContext) as FrappeConfig;

  const [signupError, setSignupError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = async (values: SignUpInputs) => {
    setSignupError(null);
    setSuccessMessage(null);

    try {
      const res = await call.post("frappe.core.doctype.user.user.sign_up", {
        email: values.email,
        full_name: values.full_name,
        redirect_to: "/",
      });

      const message = Array.isArray(res?.message)
        ? res.message[1] || "Signup successful!"
        : "Signup successful!";

      setSuccessMessage(message);
    } catch (err: any) {
      setSignupError(err?.message || "Something went wrong.");
    }
  };

  return (
    <Flex align="center" justify="center" height="100vh" px="4">
      <Card size="4" style={{ width: "100%", maxWidth: 400 }}>
        <Flex direction="column" gap="5">
          <Heading size="6" align="center">
            Join Cool Track
          </Heading>
          <Heading size="4" align="center" color="gray">
            Create your account
          </Heading>

          {signupError && (
            <Callout.Root color="red" size="2">
              <Callout.Text>{signupError}</Callout.Text>
            </Callout.Root>
          )}

          {successMessage && (
            <Callout.Root color="green" size="2">
              <Callout.Text>{successMessage}</Callout.Text>
            </Callout.Root>
          )}

          <Box>
            <Text as="label" size="2" weight="medium">
              Full Name
            </Text>
            <TextField.Root
              placeholder="John Brown"
              {...register("full_name", { required: "Full name is required" })}
              mt="2"
            />
            {errors?.full_name && (
              <Text color="red" size="1" mt="1">
                {errors.full_name.message}
              </Text>
            )}
          </Box>

          <Box>
            <Text as="label" size="2" weight="medium">
              Email
            </Text>
            <TextField.Root
              type="email"
              placeholder="you@cooltrack.com"
              {...register("email", {
                required: "Email is required",
                validate: (email) =>
                  isEmailValid(email) || "Please enter a valid email address.",
              })}
              mt="2"
            />
            {errors?.email && (
              <Text color="red" size="1" mt="1">
                {errors.email.message}
              </Text>
            )}
          </Box>

          <Flex gap="3" justify="center" mt="2">
            <Button
              variant="solid"
              color="blue"
              type="submit"
              disabled={isSubmitting}
              style={{ width: "100%" }}
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting ? "Signing up..." : "Sign Up"}
            </Button>
          </Flex>

          <Flex justify="center" gap="2" mt="2">
            <Text size="2" color="gray">
              Already have an account?
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

export default SignUp;