import React from "react";
import { Box, Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { useFrappeAuth } from "frappe-react-sdk";

const UserProfile = () => {
  // Get current user, login, and logout functions from Frappe Auth.
  const { currentUser, login, logout } = useFrappeAuth();

  // If no currentUser is available, show a login prompt.
  if (!currentUser) {
    return (
      <Card p="4" m="4">
        <Heading size="5" mb="3">
          User Profile
        </Heading>
        <Text mb="3">No user information available. Please log in.</Text>
        <Button variant="solid" color="blue" onClick={login}>
          Login
        </Button>
      </Card>
    );
  }

  // Destructure the current user object.
  const { name, email, first_name, last_name, roles } = currentUser;

  return (
    <Card p="4" m="4">
      <Heading size="5" mb="3">
        User Profile
      </Heading>
      <Flex direction="column" gap="2" mb="3">
        <Text>
          <strong>Username:</strong> {name}
        </Text>
        <Text>
          <strong>Name:</strong> {first_name} {last_name}
        </Text>
        <Text>
          <strong>Email:</strong> {email}
        </Text>
        <Text>
          <strong>Roles:</strong>{" "}
          {roles && Array.isArray(roles) ? roles.join(", ") : roles || "N/A"}
        </Text>
      </Flex>
      <Button variant="solid" color="red" onClick={logout}>
        Logout
      </Button>
    </Card>
  );
};

export default UserProfile;
