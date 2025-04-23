import React from "react";
import { Box, Flex, Text, Card, Heading, Link, Grid } from "@radix-ui/themes";
import { useFrappeGetDocList, useFrappeGetDoc } from "frappe-react-sdk";
import { FiRefreshCw } from "react-icons/fi";
import { FaPlug, FaBatteryEmpty, FaPauseCircle, FaMapMarkerAlt, FaMicrochip, FaInfoCircle, FaNetworkWired } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

interface Sensor {
  name: string;
  sensor_id: string;
  sensor_type: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  serial_number?: string;
  measurement_range?: string;
  accuracy?: string;
  resolution?: string;
  sampling_rate?: string;
  operating_temperature?: string;
  power_consumption?: string;
  gateway_id?: string;
  relay_id?: string;
  communication_protocol?: string;
  sensor_rssi?: string;
  firmware_version?: string;
  hardware_version?: string;
  installation_date?: string;
  last_calibration?: string;
  notes?: string;
}

const statusIconMap: Record<string, React.ReactNode> = {
  Active: <FaPlug size={16} color="green" />,
  Inactive: <FaBatteryEmpty size={16} color="gray" />,
  Maintenance: <FaPauseCircle size={16} color="orange" />,
  Decommissioned: <FaBatteryEmpty size={16} color="red" />,
};

const SensorList: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: sensors, isLoading, error } = useFrappeGetDocList<Sensor>("Sensor", {
    fields: ["name", "sensor_id", "sensor_type", "status", "serial_number", "gateway_id"],
  });

  const { data: sensorDetails } = useFrappeGetDoc<Sensor>("Sensor", id);

  const formatLabel = (sensor: Sensor) => `${sensor.sensor_id} - ${sensor.serial_number || "No SN"}`;

  const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
    if (!value) return null;
    return (
      <Flex gap="2">
        <Text weight="bold" size="2" style={{ minWidth: "140px" }}>{label}:</Text>
        <Text size="2">{value}</Text>
      </Flex>
    );
  };

  const renderSensorList = () => (
    <Flex wrap="wrap" gap="3">
      {sensors?.map(sensor => (
        <Card key={sensor.name} style={{ width: "280px" }}>
          <Link onClick={() => navigate(`/sensors/${sensor.name}`)}>
            <Flex direction="column" gap="3">
              <Heading size="3">{formatLabel(sensor)}</Heading>
              <Flex align="center" gap="2">
                <Text size="2" color="gray">Status:</Text>
                <Text size="2">{sensor.status}</Text>
                {statusIconMap[sensor.status]}
              </Flex>
              {sensor.gateway_id && (
                <Flex align="center" gap="2">
                  <FaNetworkWired size={12} />
                  <Text size="2" color="gray">{sensor.gateway_id}</Text>
                </Flex>
              )}
            </Flex>
          </Link>
        </Card>
      ))}
    </Flex>
  );

  const renderSensorDetails = () => {
    if (!sensorDetails) return null;

    return (
      <Card>
        <Flex direction="column" gap="4">
          <Flex align="center" gap="3">
            <FaMicrochip size={24} />
            <Heading size="5">{formatLabel(sensorDetails)}</Heading>
            <Flex align="center" gap="2" ml="auto">
              <Text>{sensorDetails.status}</Text>
              {statusIconMap[sensorDetails.status]}
            </Flex>
          </Flex>

          <Grid columns="2" gap="4">
            {/* Basic Info */}
            <Flex direction="column" gap="2">
              <Heading size="3" mb="2"><FaInfoCircle /> Basic Information</Heading>
              <DetailItem label="Sensor Type" value={sensorDetails.sensor_type} />
              <DetailItem label="Serial Number" value={sensorDetails.serial_number} />
              <DetailItem label="Gateway" value={sensorDetails.gateway_id} />
              <DetailItem label="Relay ID" value={sensorDetails.relay_id} />
              <DetailItem label="Status" value={sensorDetails.status} />
            </Flex>

            {/* Technical Specs */}
            <Flex direction="column" gap="2">
              <Heading size="3" mb="2"><FaMicrochip /> Technical Specs</Heading>
              <DetailItem label="Measurement Range" value={sensorDetails.measurement_range} />
              <DetailItem label="Accuracy" value={sensorDetails.accuracy} />
              <DetailItem label="Resolution" value={sensorDetails.resolution} />
              <DetailItem label="Sampling Rate" value={sensorDetails.sampling_rate} />
              <DetailItem label="Operating Temperature" value={sensorDetails.operating_temperature} />
              <DetailItem label="Power Consumption" value={sensorDetails.power_consumption} />
            </Flex>

            {/* Connectivity */}
            <Flex direction="column" gap="2">
              <Heading size="3" mb="2"><FaNetworkWired /> Connectivity</Heading>
              <DetailItem label="Protocol" value={sensorDetails.communication_protocol} />
              <DetailItem label="RSSI" value={sensorDetails.sensor_rssi} />
            </Flex>

            {/* Metadata */}
            <Flex direction="column" gap="2">
              <Heading size="3" mb="2"><FaMicrochip /> Metadata</Heading>
              <DetailItem label="Firmware Version" value={sensorDetails.firmware_version} />
              <DetailItem label="Hardware Version" value={sensorDetails.hardware_version} />
              <DetailItem 
                label="Installation Date" 
                value={sensorDetails.installation_date 
                  ? new Date(sensorDetails.installation_date).toLocaleDateString() 
                  : undefined} 
              />
              <DetailItem 
                label="Last Calibration" 
                value={sensorDetails.last_calibration 
                  ? new Date(sensorDetails.last_calibration).toLocaleDateString() 
                  : undefined} 
              />
            </Flex>
          </Grid>

          {sensorDetails.notes && (
            <Flex direction="column" gap="2">
              <Heading size="3">Notes</Heading>
              <Text>{sensorDetails.notes}</Text>
            </Flex>
          )}
        </Flex>
      </Card>
    );
  };

  return (
    <Box p="4">
      <Flex justify="between" align="center" mb="4">
        <Text size="5" weight="bold">Sensors</Text>
        <Text size="2">Local Time: {new Date().toLocaleTimeString()}</Text>
      </Flex>

      {isLoading && (
        <Flex justify="center" align="center" py="6">
          <FiRefreshCw className="animate-spin" /> Loading sensors…
        </Flex>
      )}

      {error && <Text color="red">Failed to load sensors: {error.message}</Text>}

      {id ? (
        <Flex direction="column" gap="4">
          <Link onClick={() => navigate('/sensors')}>← Back to Sensors</Link>
          {renderSensorDetails()}
        </Flex>
      ) : (
        renderSensorList()
      )}
    </Box>
  );
};

export default SensorList;