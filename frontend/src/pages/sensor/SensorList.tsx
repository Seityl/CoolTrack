import React from "react";
import { Box, Flex, Text, Card, Heading, Link, Button, Tabs } from "@radix-ui/themes";
import { FaThermometerHalf, FaBatteryEmpty, FaPauseCircle, FaPlug, FaSync } from "react-icons/fa";
import { useFrappeGetDocList, useFrappeGetDoc } from "frappe-react-sdk";
import { FiRefreshCw } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

interface Sensor {
  name: string;
  sensor_id: string;
  sensor_type: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  gateway_id?: string;
}

const statusIconMap: Record<string, React.ReactNode> = {
  Active: <FaPlug size={16} color="green" />,
  Inactive: <FaBatteryEmpty size={16} color="gray" />,
  Maintenance: <FaPauseCircle size={16} color="orange" />,
  Decommissioned: <FaBatteryEmpty size={16} color="red" />,
};

const SensorList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState("Pending");

  const { data: sensors, isLoading, error, mutate } = useFrappeGetDocList<Sensor>(
    "Sensor",
    {
      fields: ["name", "sensor_id", "sensor_type", "status", "approval_status", "gateway_id"],
    }
  );

  const handleRefresh = () => {
    mutate();
  };

  const filteredSensors = sensors?.filter((sensor) => sensor.approval_status === tab);

  const renderFilteredSensorList = (): React.ReactNode => {
    if (filteredSensors?.length === 0) {
      return (
        <Card>
          <Flex direction="column" align="center" gap="3" py="4">
            <Text color="gray">No sensors found for {tab}.</Text>
          </Flex>
        </Card>
      );
    }

    return (
      <Flex wrap="wrap" gap="3" mt="4">
        {filteredSensors?.map((sensor) => (
          <Card
            key={sensor.name}
            style={{ width: "260px", transition: "all 0.2s ease-in-out" }}
            className="hover:shadow-lg hover:scale-[1.01] cursor-pointer"
          >
            <Link onClick={() => navigate(`/sensors/${sensor.name}`)}>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <FaThermometerHalf size={20} />
                  <Heading size="3">ID: {sensor.sensor_id}</Heading>
                </Flex>
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <Text size="2" color="gray">Status:</Text>
                    <Text size="2">{sensor.status}</Text>
                    {statusIconMap[sensor.status]}
                  </Flex>
                  <Flex align="center" gap="2">
                    <Text size="2" color="gray">Gateway:</Text>
                    <Text size="2">{sensor.gateway_id ?? "N/A"}</Text>
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
        <Text size="5" weight="bold">Sensors</Text>
        {sensors && sensors.length > 0 && (
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
          <FiRefreshCw className="animate-spin" /> Loading sensors…
        </Flex>
      )}

      {error && (
        <Text color="red">Failed to load sensors: {error.message}</Text>
      )}

      {!isLoading && !error && (
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List>
            <Tabs.Trigger value="Pending">Pending</Tabs.Trigger>
            <Tabs.Trigger value="Approved">Approved</Tabs.Trigger>
            <Tabs.Trigger value="Rejected">Rejected</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value={tab}>{renderFilteredSensorList()}</Tabs.Content>
        </Tabs.Root>
      )}
    </Box>
  );
};

export default SensorList;