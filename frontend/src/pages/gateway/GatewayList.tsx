import React from "react";
import { Box, Flex, Text, Card, Heading, Link, Button, Tabs } from "@radix-ui/themes";
import {
  FaThermometerHalf,
  FaBatteryEmpty,
  FaPauseCircle,
  FaPlug,
  FaSync,
} from "react-icons/fa";
import { useFrappeGetDocList, useFrappeGetDoc } from "frappe-react-sdk";
import { FiRefreshCw } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

interface SensorGateway {
  name: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  last_heartbeat?: string;
  number_of_transmissions?: number;
}

const statusIconMap: Record<string, React.ReactNode> = {
  Active: <FaPlug size={16} color="green" />,
  Inactive: <FaBatteryEmpty size={16} color="gray" />,
  Maintenance: <FaPauseCircle size={16} color="orange" />,
  Decommissioned: <FaBatteryEmpty size={16} color="red" />,
};

const GatewayList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState("Pending");

  const { data: gateways, isLoading, error, mutate } = useFrappeGetDocList<SensorGateway>(
    "Sensor Gateway",
    {
      fields: ["name", "status", "number_of_transmissions", "last_heartbeat", "approval_status"],
    }
  );

  const handleRefresh = () => {
    mutate();
  };

  const filteredGateways = gateways?.filter((g) => g.approval_status === tab);

  const renderFilteredGatewayList = (): React.ReactNode => {
    if (filteredGateways?.length === 0) {
      return (
        <Card>
          <Flex direction="column" align="center" gap="3" py="4">
            <Text color="gray">No gateways found for {tab}.</Text>
          </Flex>
        </Card>
      );
    }

    return (
        <Flex wrap="wrap" gap="3" mt="4">
          {filteredGateways?.map((gateway) => (
            <Card
              key={gateway.name}
              style={{ width: "260px", transition: "all 0.2s ease-in-out" }}
              className="hover:shadow-lg hover:scale-[1.01] cursor-pointer"
            >
              <Link onClick={() => navigate(`/gateways/${gateway.name}`)}>
                <Flex direction="column" gap="3">
                  <Flex align="center" gap="2">
                    <FaThermometerHalf size={20} />
                    <Heading size="3">ID: {gateway.name}</Heading>
                  </Flex>
                  <Flex direction="column" gap="2">
                    <Flex align="center" gap="2">
                      <Text size="2" color="gray">Status:</Text>
                      <Text size="2">{gateway.status}</Text>
                      {statusIconMap[gateway.status]}
                    </Flex>
                    <Flex align="center" gap="2">
                      <Text size="2" color="gray">Transmissions:</Text>
                      <Text size="2">{gateway.number_of_transmissions ?? "N/A"}</Text>
                    </Flex>
                    <Flex direction="column" gap="1">
  <Text size="2" color="gray">Last Heartbeat</Text>
  <Text size="2">
    {gateway.last_heartbeat
      ? new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date(gateway.last_heartbeat))
      : "Unavailable"}
  </Text>
</Flex>
                  </Flex>
                </Flex>
              </Link>
            </Card>
          ))}
        </Flex>
      );
      
  };

  return (
    <Box p="4">
      <Flex justify="between" align="center" mb="4">
        <Text size="5" weight="bold">Gateways</Text>
        {gateways && gateways.length > 0 && (
          <Flex gap="3" align="center">
            <Text size="2">Local Time: {new Date().toLocaleTimeString()}</Text>
            <Button variant="soft" onClick={handleRefresh}>
              <FaSync /> Refresh
            </Button>
          </Flex>
        )}
      </Flex>

      {isLoading && (
        <Flex justify="center" align="center" py="6">
          <FiRefreshCw className="animate-spin" /> Loading gateways…
        </Flex>
      )}

      {error && (
        <Text color="red">Failed to load gateways: {error.message}</Text>
      )}

      {!isLoading && !error && (
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List>
            <Tabs.Trigger value="Pending">Pending</Tabs.Trigger>
            <Tabs.Trigger value="Approved">Approved</Tabs.Trigger>
            <Tabs.Trigger value="Rejected">Rejected</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value={tab}>{renderFilteredGatewayList()}</Tabs.Content>
        </Tabs.Root>
      )}
    </Box>
  );
};

export default GatewayList;