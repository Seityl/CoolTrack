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
  Spinner
} from "@radix-ui/themes";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { isEmailValid } from "../../utils/validations";
import logo from "../../assets/logo.svg";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";

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

const SignUp = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInputs>();

  const { call } = useContext(FrappeContext) as FrappeConfig;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const onSubmit = async (values: SignUpInputs) => {
    setToastMessage(null);

    try {
      const res = await call.post("frappe.core.doctype.user.user.sign_up", {
        email: values.email,
        full_name: values.full_name,
        redirect_to: "/",
      });

      const message = Array.isArray(res?.message)
        ? res.message[1] || "Signup successful!"
        : "Signup successful!";

      setToastMessage(message);
      setToastType("success");
    } catch (err: any) {
      setToastMessage(err?.message || "Something went wrong.");
      setToastType("error");
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
              Join Cool Track
            </Heading>
            <Heading size="4" align="center" color="gray">
              Create your account
            </Heading>

            <Box width="100%">
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

            <Box width="100%">
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

            <Flex gap="3" justify="center" mt="2" width="100%">
              <Button
                variant="solid"
                color="blue"
                type="submit"
                disabled={isSubmitting}
                style={{ width: "100%" }}
                onClick={handleSubmit(onSubmit)}
              >
                {isSubmitting ? <Spinner size="3" /> : "Sign Up"}
              </Button>
            </Flex>

            <Flex align="center" justify="center" gap="2" mt="2">
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