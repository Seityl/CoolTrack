import React from "react";
import { Box, Flex, Text, Card, Heading, Link, Button, Tabs, Badge, Grid } from "@radix-ui/themes";
import {
  FaThermometerHalf,
  FaBatteryEmpty,
  FaPauseCircle,
  FaPlug,
  FaSync,
} from "react-icons/fa";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface SensorGateway {
  name: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  last_heartbeat?: string;
  number_of_transmissions?: number;
}

const statusIconMap: Record<string, React.ReactNode> = {
  Active: <FaPlug size={16} color="#10B981" />,
  Inactive: <FaBatteryEmpty size={16} color="#6B7280" />,
  Maintenance: <FaPauseCircle size={16} color="#F59E0B" />,
  Decommissioned: <FaBatteryEmpty size={16} color="#EF4444" />,
};

const statusColorMap: Record<string, "green" | "gray" | "amber" | "red"> = {
  Active: "green",
  Inactive: "gray",
  Maintenance: "amber",
  Decommissioned: "red",
};

const approvalColorMap: Record<string, "green" | "gray" | "amber" | "red"> = {
  Pending: "amber",
  Approved: "green",
  Rejected: "red",
  Decommissioned: "gray",
};

const GatewayList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState("Approved");

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
        <Card mt="4" style={{ background: 'var(--gray-2)' }}>
          <Flex direction="column" align="center" gap="3" py="6">
            <Text color="gray" size="3">No {tab.toLowerCase()} locations found</Text>
            <Button variant="soft" onClick={() => mutate()}>
              Refresh
            </Button>
          </Flex>
        </Card>
      );
    }

    return (
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4" mt="4">
        {filteredGateways?.map((gateway) => (
          <Card 
            key={gateway.name}
            style={{ 
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              borderLeft: `4px solid var(--${statusColorMap[gateway.status]}-9)`
            }}
            className="hover:shadow-md hover:translate-y-[-2px]"
            onClick={() => navigate(`/gateways/${gateway.name}`)}
          >
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  <FaThermometerHalf size={20} className="text-gray-600" />
                  <Heading size="4">ID: {gateway.name}</Heading>
                </Flex>
                <Badge color={approvalColorMap[gateway.approval_status]} variant="soft">
                  {gateway.approval_status}
                </Badge>
              </Flex>

              <Flex direction="column" gap="2">
                <Flex align="center" justify="between">
                  <Text size="2" color="gray">Status</Text>
                  <Flex align="center" gap="1">
                    <Text size="2" weight="medium">{gateway.status}</Text>
                    {statusIconMap[gateway.status]}
                  </Flex>
                </Flex>

                <Flex align="center" justify="between">
                  <Text size="2" color="gray">Transmissions</Text>
                  <Text size="2" weight="medium">
                    {gateway.number_of_transmissions ?? "N/A"}
                  </Text>
                </Flex>

                <Flex direction="column" gap="1">
                  <Text size="2" color="gray">Last Heartbeat</Text>
                  <Text size="2" weight="medium">
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
          </Card>
        ))}
      </Grid>
    );
  };

  return (
    <Box p="4">
      <Flex justify="between" align="center" mb="5">
        <Heading size="6">Locations</Heading>
        <Flex gap="3" align="center">
          <Text size="2" color="gray">
            {new Date().toLocaleString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <Button 
            variant="soft" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <Flex align="center" gap="2">
              {isLoading ? <FiRefreshCw className="animate-spin" /> : <FaSync />}
              Refresh
            </Flex>
          </Button>
        </Flex>
      </Flex>

      {isLoading && (
        <Flex justify="center" align="center" py="8" gap="3">
          <FiRefreshCw className="animate-spin" size={18} />
          <Text size="3">Loading locations...</Text>
        </Flex>
      )}

      {error && (
        <Card variant="surface" mt="4">
          <Flex direction="column" align="center" gap="3" py="4">
            <Text color="red" weight="bold">Failed to load locations</Text>
            <Text color="red" size="2">{error.message}</Text>
            <Button variant="soft" color="red" onClick={() => mutate()}>
              Retry
            </Button>
          </Flex>
        </Card>
      )}

      {!isLoading && !error && (
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List style={{ background: 'transparent' }}>
            <Tabs.Trigger value="Approved">Approved</Tabs.Trigger>
            <Tabs.Trigger value="Pending">Pending</Tabs.Trigger>
            <Tabs.Trigger value="Rejected">Rejected</Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            <Tabs.Content value={tab}>
              {renderFilteredGatewayList()}
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      )}
    </Box>
  );
};

export default GatewayList;