import React, { useMemo, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Card,
  Heading,
  Button,
  Badge,
  Separator,
  Spinner,
  Container,
  Tabs,
  Table,
  TextField,
} from "@radix-ui/themes";
import {
  FaArrowLeft,
  FaBatteryEmpty,
  FaCalendarAlt,
  FaMicrochip,
  FaTools,
  FaInfoCircle,
  FaThermometerHalf,
  FaSignal,
  FaCodeBranch,
  FaCogs,
  FaSyncAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useFrappeGetDoc, useFrappeGetDocList } from "frappe-react-sdk";
import { useNavigate, useParams } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import dayjs from "dayjs";

interface Sensor {
  name: string;
  sensor_id: string;
  sensor_type: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  serial_number?: string;
  measurement_range?: string;
  accuracy?: string;
  sampling_rate?: string;
  gateway_id?: string;
  communication_protocol?: string;
  firmware_version?: string;
  installation_date?: string;
  notes?: string;
}

interface SensorRead {
  name: string;
  sensor_id: string;
  sensor_type?: string;
  temperature: string;
  humidity?: string;
  voltage?: string;
  signal_strength?: string;
  sequence_number?: string;
  gateway_id?: string;
  relay_id?: string;
  sensor_rssi?: string;
  coordinates?: string;
  timestamp: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  Active: { icon: <FaSignal size={14} />, color: "green" },
  Inactive: { icon: <FaBatteryEmpty size={14} />, color: "gray" },
  Maintenance: { icon: <FaTools size={14} />, color: "orange" },
  Decommissioned: { icon: <FaBatteryEmpty size={14} />, color: "red" },
};

const SensorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("details");
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'day').startOf('day').toISOString());
  const [endDate, setEndDate] = useState(dayjs().endOf('day').toISOString());

  // Fetch sensor document
  const { data: sensor, isLoading, error, mutate: refreshSensor } = useFrappeGetDoc<Sensor>("Sensor", id);

  // Fetch sensor readings with corrected date filtering
  const { 
    data: readings, 
    isLoading: isLoadingReadings, 
    error: readingsError,
    mutate: refreshReadings
  } = useFrappeGetDocList<SensorRead>("Sensor Read", {
    fields: [
      "name",
      "sensor_id",
      "sensor_type",
      "temperature",
      "humidity",
      "voltage",
      "signal_strength",
      "sequence_number",
      "gateway_id",
      "relay_id",
      "sensor_rssi",
      "coordinates",
      "timestamp"
    ],
    filters: [
      ["sensor_id", "=", id || ""],
      ["timestamp", ">=", startDate],
      ["timestamp", "<=", endDate]
    ],
    orderBy: {
      field: "timestamp",
      order: "desc"
    },
    limit: 1000,
    asDict: true
  });

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!readings) return [];
    
    return [...readings]
      .reverse() // Reverse to show oldest first in chart
      .map((r) => ({
        ...r,
        temperature: parseFloat(r.temperature) || 0,
        humidity: parseFloat(r.humidity || "0") || 0,
        voltage: parseFloat(r.voltage || "0") || 0,
        timestamp: dayjs(r.timestamp).format("HH:mm"),
      }));
  }, [readings]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" className="h-[60vh]">
        <Spinner size="3" />
      </Flex>
    );
  }

  if (error || !sensor) {
    return (
      <Container size="4" className="h-[60vh] flex items-center justify-center">
        <Card>
          <Flex direction="column" gap="4" align="center">
            <Text color="red" weight="bold">Error loading sensor details</Text>
            <Text>{error?.message || "Sensor not found"}</Text>
            <Button onClick={() => navigate('/sensors')}>
              <FaArrowLeft /> Return to Sensors
            </Button>
          </Flex>
        </Card>
      </Container>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    return dayjs(dateString).format("YYYY-MM-DD HH:mm:ss");
  };

  const formatNumber = (value?: string) => {
    if (!value) return "—";
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toFixed(2);
  };

  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <Flex gap="3" align="center" mb="2">
      <Box className="text-gray-500">{icon}</Box>
      <Heading size="4" weight="medium">{title}</Heading>
    </Flex>
  );

  const DetailRow = ({ label, value, icon }: {
    label: string;
    value?: string | number;
    icon?: React.ReactNode;
  }) => (
    <Flex gap="3" align="center" py="2">
      <Box className="w-6 text-gray-400">{icon}</Box>
      <Text weight="medium" className="w-40 text-gray-600">{label}</Text>
      <Text className="flex-1">{value || "—"}</Text>
    </Flex>
  );

  return (
    <Box width="100%" className="min-h-screen">
      <Box className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <Container size="4">
          <Flex justify="between" align="center">
            <Button variant="soft" onClick={() => navigate('/sensors')}>
              <FaArrowLeft /> All Sensors
            </Button>
            <Badge
              color={statusConfig[sensor.status].color as any}
              highContrast
              className="uppercase"
            >
              <Flex gap="2" align="center">
                {statusConfig[sensor.status].icon}
                {sensor.status}
              </Flex>
            </Badge>
          </Flex>
        </Container>
      </Box>

      <Container size="4" py="4">
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List>
            <Tabs.Trigger value="details">Details</Tabs.Trigger>
            <Tabs.Trigger value="history">History</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="details">
            <Card className="shadow-sm mt-4">
              <Flex gap="4" align="center" p="4">
                <Box className="p-3 bg-gray-50 rounded-lg">
                  <FaThermometerHalf size={24} className="text-blue-500" />
                </Box>
                <Flex direction="column">
                  <Heading size="5" weight="bold">
                    {sensor.sensor_id}
                  </Heading>
                  <Text color="gray" size="2">
                    {sensor.sensor_type} • Serial: {sensor.serial_number || "Not specified"}
                  </Text>
                </Flex>
              </Flex>

              <Separator size="4" />

              <Flex direction="column" gap="4" p="4">
                <Box>
                  <SectionHeader title="Basic Information" icon={<FaInfoCircle />} />
                  <Card variant="surface">
                    <DetailRow label="Sensor Type" value={sensor.sensor_type} icon={<FaMicrochip />} />
                    <Separator size="1" />
                    <DetailRow label="Serial Number" value={sensor.serial_number} />
                    <Separator size="1" />
                    <DetailRow label="Installed On" value={formatDate(sensor.installation_date)} icon={<FaCalendarAlt />} />
                  </Card>
                </Box>

                <Box>
                  <SectionHeader title="Specifications" icon={<FaCogs />} />
                  <Card variant="surface">
                    <DetailRow label="Measurement Range" value={sensor.measurement_range} />
                    <Separator size="1" />
                    <DetailRow label="Accuracy" value={sensor.accuracy} />
                    <Separator size="1" />
                    <DetailRow label="Sampling Rate" value={sensor.sampling_rate} />
                  </Card>
                </Box>

                <Box>
                  <SectionHeader title="Connectivity" icon={<FaCodeBranch />} />
                  <Card variant="surface">
                    <DetailRow label="Gateway ID" value={sensor.gateway_id} />
                    <Separator size="1" />
                    <DetailRow label="Protocol" value={sensor.communication_protocol} />
                    <Separator size="1" />
                    <DetailRow label="Firmware" value={sensor.firmware_version} />
                  </Card>
                </Box>

                {sensor.notes && (
                  <Box>
                    <SectionHeader title="Notes" icon={<FaInfoCircle />} />
                    <Card variant="surface">
                      <Text className="whitespace-pre-line p-3">{sensor.notes}</Text>
                    </Card>
                  </Box>
                )}
              </Flex>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="history">
            <Card className="shadow-sm mt-4 p-4">
              <Flex justify="between" align="center" mb="4">
                <SectionHeader title="Sensor Readings" icon={<FaThermometerHalf />} />
                <Button variant="soft" onClick={() => refreshReadings()}>
                  <FaSyncAlt /> Refresh
                </Button>
              </Flex>

              <Flex gap="4" mb="4">
                <TextField.Root 
                  type="datetime-local" 
                  value={dayjs(startDate).format("YYYY-MM-DDTHH:mm")} 
                  onChange={(e) => setStartDate(dayjs(e.target.value).toISOString())} 
                />
                <TextField.Root 
                  type="datetime-local" 
                  value={dayjs(endDate).format("YYYY-MM-DDTHH:mm")} 
                  onChange={(e) => setEndDate(dayjs(e.target.value).toISOString())} 
                />
              </Flex>

              {isLoadingReadings ? (
                <Flex justify="center" py="6"><Spinner /></Flex>
              ) : readingsError ? (
                <Text color="red">Error loading readings: {readingsError.message}</Text>
              ) : readings?.length === 0 ? (
                <Text>No readings found for the selected time period</Text>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="timestamp" />
                      <YAxis yAxisId="left" domain={["auto", "auto"]} tickFormatter={(val) => `${val}°C`} />
                      <YAxis yAxisId="right" orientation="right" domain={["auto", "auto"]} tickFormatter={(val) => `${val}%`} />
                      <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "Temperature") return [`${value}°C`, name];
                          if (name === "Humidity") return [`${value}%`, name];
                          return [value, name];
                        }}
                      />
                      <Line 
                        yAxisId="left"
                        name="Temperature"
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#3182CE" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        yAxisId="right"
                        name="Humidity"
                        type="monotone" 
                        dataKey="humidity" 
                        stroke="#38A169" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <Box mt="4" overflow="auto">
                    <Table.Root>
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Temp (°C)</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Humidity (%)</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Voltage (V)</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Signal</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Gateway</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Location</Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {readings?.map((r) => (
                          <Table.Row key={r.name}>
                            <Table.Cell>{formatDate(r.timestamp)}</Table.Cell>
                            <Table.Cell>{formatNumber(r.temperature)}</Table.Cell>
                            <Table.Cell>{formatNumber(r.humidity)}</Table.Cell>
                            <Table.Cell>{formatNumber(r.voltage)}</Table.Cell>
                            <Table.Cell>{formatNumber(r.signal_strength)}</Table.Cell>
                            <Table.Cell>{r.gateway_id || "—"}</Table.Cell>
                            <Table.Cell>
                              {r.coordinates ? (
                                <Flex align="center" gap="2">
                                  <FaMapMarkerAlt className="text-red-500" />
                                  {r.coordinates}
                                </Flex>
                              ) : "—"}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                </>
              )}
            </Card>
          </Tabs.Content>
        </Tabs.Root>
      </Container>
    </Box>
  );
};

export default SensorPage;