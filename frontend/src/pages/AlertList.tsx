import React from "react";
import { Box, Flex, Text, Heading, Card } from "@radix-ui/themes";
import { FaTools } from "react-icons/fa";

const AlertList: React.FC = () => {
  return (
    <Box p="6" height="100vh">
      <Flex direction="column" align="center" justify="center" height="100%">
        <Card style={{ maxWidth: 400, textAlign: "center", padding: "2rem" }}>
          <Flex direction="column" align="center" gap="4">
            <FaTools size={48} color="#888" />
            <Heading size="5">Under Construction</Heading>
            <Text size="3" color="gray">
              This page is currently under construction. Please check back later.
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
};

export default AlertList;
