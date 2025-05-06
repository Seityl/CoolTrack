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
  Dialog,
  TextArea,
  Grid,
  ScrollArea,
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
  FaCheck,
  FaTimes,
  FaClock,
  FaMapMarkerAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { useFrappeGetDoc, useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { useNavigate, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import dayjs from "dayjs";

interface Sensor {
  name: string;
  sensor_id: string;
  sensor_type: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
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

const sensorTypeIcons: Record<string, React.ReactNode> = {
  Temperature: <FaThermometerHalf className="text-blue-500" size={20} />,
  Humidity: <FaThermometerHalf className="text-green-500" size={20} />,
  Motion: <FaSignal className="text-purple-500" size={20} />,
  Pressure: <FaThermometerHalf className="text-orange-500" size={20} />,
};

const statusConfig: Record<string, { icon: React.ReactNode; color: "green" | "gray" | "orange" | "red" }> = {
  Active: { icon: <FaSignal size={14} />, color: "green" },
  Inactive: { icon: <FaBatteryEmpty size={14} />, color: "gray" },
  Maintenance: { icon: <FaTools size={14} />, color: "orange" },
  Decommissioned: { icon: <FaBatteryEmpty size={14} />, color: "red" },
};

const approvalStatusConfig: Record<string, { icon: React.ReactNode; color: "blue" | "green" | "red" | "gray" }> = {
  Pending: { icon: <FaClock size={14} />, color: "blue" },
  Approved: { icon: <FaCheck size={14} />, color: "green" },
  Rejected: { icon: <FaTimes size={14} />, color: "red" },
  Decommissioned: { icon: <FaBatteryEmpty size={14} />, color: "gray" },
};

const SensorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("history");
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(7, 'day').startOf('day'),
    endDate: dayjs().endOf('day')
  });

  const { data: sensor, isLoading, error, mutate } = useFrappeGetDoc<Sensor>("Sensor", id);
  
  const apiFormattedDates = {
    startDate: dateRange.startDate.format('YYYY-MM-DD HH:mm:ss').replace('T', ' '),
    endDate: dateRange.endDate.format('YYYY-MM-DD HH:mm:ss').replace('T', ' ')
  };

  const {
    data: readings,
    isLoading: isLoadingReadings,
    error: readingsError,
    mutate: refreshReadings,
  } = useFrappeGetDocList<SensorRead>("Sensor Read", {
    fields: [
      "name",
      "sensor_id",
      "sensor_type",
      "temperature",
      "humidity",
      "voltage",
      "signal_strength",
      "gateway_id",
      "coordinates",
      "timestamp",
    ],
    filters: [
      ["sensor_id", "=", id || ""],
      ["timestamp", ">=", apiFormattedDates.startDate],
      ["timestamp", "<=", apiFormattedDates.endDate]
    ],
    orderBy: {
      field: "timestamp",
      order: "desc",
    },
    limit: 1000,
  });

  const chartData = useMemo(() => {
    if (!readings) return [];
    return readings.map(r => ({
      ...r,
      temperature: parseFloat(r.temperature) || 0,
      humidity: parseFloat(r.humidity || "0") || 0,
      voltage: parseFloat(r.voltage || "0") || 0,
      timestamp: dayjs(r.timestamp).format("HH:mm"),
    }));
  }, [readings]);

  const { call: updateApprovalStatus, loading: isUpdating } = useFrappePostCall(
    "frappe.client.set_value"
  );

  const { call: addNote, loading: isNoting } = useFrappePostCall(
    "frappe.client.set_value"
  );
  const handlePresetDateRange = (preset: 'week' | 'month' | '3months') => {
    let startDate = dayjs().startOf('day');
    switch (preset) {
      case 'week':
        startDate = dayjs().subtract(1, 'week').startOf('day');
        break;
      case 'month':
        startDate = dayjs().subtract(1, 'month').startOf('day');
        break;
      case '3months':
        startDate = dayjs().subtract(3, 'month').startOf('day');
        break;
    }
    setDateRange({
      startDate,
      endDate: dayjs().endOf('day')
    });
  };
  const handleApprove = async () => {
    try {
      await updateApprovalStatus({
        doctype: "Sensor",
        name: sensor?.name,
        fieldname: "approval_status",
        value: "Approved",
      });
      mutate();
    } catch (err) {
      console.error("Failed to approve sensor:", err);
    }
  };

  const handleReject = async () => {
    try {
      await updateApprovalStatus({
        doctype: "Sensor",
        name: sensor?.name,
        fieldname: "approval_status",
        value: "Rejected",
      });

      if (rejectReason) {
        await addNote({
          doctype: "Sensor",
          name: sensor?.name,
          fieldname: "notes",
          value: `Sensor rejected. Reason: ${rejectReason}`,
        });
      }

      mutate();
      setShowRejectDialog(false);
      setRejectReason("");
    } catch (err) {
      console.error("Failed to reject sensor:", err);
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newDate = dayjs(value);
    if (newDate.isValid()) {
      setDateRange(prev => ({
        ...prev,
        [type === 'start' ? 'startDate' : 'endDate']: type === 'start' 
          ? newDate.startOf('day') 
          : newDate.endOf('day')
      }));
    }
  };

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

  const DetailCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card variant="surface" className="hover:shadow-md transition-shadow">
      <SectionHeader title={title} icon={icon} />
      {children}
    </Card>
  );

  const DetailItem = ({ label, value, icon }: { label: string; value?: string | number; icon?: React.ReactNode }) => (
    <Flex direction="column" gap="1" py="2">
      <Flex align="center" gap="2">
        {icon && <Box className="text-gray-400">{icon}</Box>}
        <Text size="1" className="text-gray-500 uppercase tracking-wider">
          {label}
        </Text>
      </Flex>
      <Text size="2" weight="medium" className="text-gray-900">
        {value || "—"}
      </Text>
    </Flex>
  );

  if (isLoading) {
    return (
      <Flex justify="center" align="center" className="h-[80vh]">
        <Spinner size="3" />
      </Flex>
    );
  }

  if (error || !sensor) {
    return (
      <Container size="4" className="h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <Flex direction="column" gap="4" align="center" p="4">
            <Text color="red" weight="bold" size="4">Error loading sensor</Text>
            <Text color="gray">{error?.message || "Sensor not found"}</Text>
            <Button onClick={() => navigate('/sensors')} variant="soft" className="mt-4">
              <FaArrowLeft /> Return to Sensors
            </Button>
          </Flex>
        </Card>
      </Container>
    );
  }

  return (
    <Box p="4">
      {/* Header */}
      <Box className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
        <Container size="4">
          <Flex justify="between" align="center">
            <Button variant="soft" onClick={() => navigate('/sensors')} size="2">
              <FaArrowLeft /> All Sensors
            </Button>
            <Flex gap="3" align="center">
              <Badge 
                color={statusConfig[sensor.status].color}
                highContrast 
                className="uppercase"
              >
                <Flex gap="2" align="center">
                  {statusConfig[sensor.status].icon}
                  {sensor.status}
                </Flex>
              </Badge>
              <Badge 
                color={approvalStatusConfig[sensor.approval_status].color}
                highContrast 
                className="uppercase"
              >
                <Flex gap="2" align="center">
                  {approvalStatusConfig[sensor.approval_status].icon}
                  {sensor.approval_status}
                </Flex>
              </Badge>
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="4" py="6">
        {/* Sensor Header */}
        <Card className="shadow-sm mb-6">
          <Flex gap="4" align="center" p="4">
            <Box className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {sensorTypeIcons[sensor.sensor_type] || <FaThermometerHalf className="text-blue-500" size={24} />}
            </Box>
            <Flex direction="column">
              <Heading size="5" weight="bold" className="text-gray-900">
                {sensor.sensor_id}
              </Heading>
              <Text color="gray" size="2">
                {sensor.sensor_type} • Serial: {sensor.serial_number || "Not specified"}
              </Text>
            </Flex>
          </Flex>

          {/* Approval Actions for Pending sensors */}
          {sensor.approval_status === "Pending" && (
            <Flex gap="3" p="4" justify="end" className="bg-gray-50 rounded-b-lg">
              <Button 
                variant="solid" 
                color="green" 
                onClick={handleApprove}
                disabled={isUpdating}
                size="2"
              >
                <FaCheck /> Approve
              </Button>
              <Button 
                variant="soft" 
                color="red" 
                onClick={() => setShowRejectDialog(true)}
                disabled={isUpdating}
                size="2"
              >
                <FaTimes /> Reject
              </Button>
            </Flex>
          )}
        </Card>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="mb-4">
            <Tabs.Trigger value="history">History</Tabs.Trigger>
            <Tabs.Trigger value="details">Details</Tabs.Trigger>
          </Tabs.List>

          <ScrollArea type="auto" scrollbars="vertical" style={{ height: 'calc(100vh - 250px)' }}>
            <Box pr="4">
              {activeTab === "details" && (
                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                  <DetailCard title="Basic Information" icon={<FaInfoCircle />}>
                    <DetailItem label="Sensor Type" value={sensor.sensor_type} icon={<FaMicrochip />} />
                    <Separator size="1" />
                    <DetailItem label="Serial Number" value={sensor.serial_number} />
                    <Separator size="1" />
                    <DetailItem 
                      label="Installed On" 
                      value={formatDate(sensor.installation_date)} 
                      icon={<FaCalendarAlt />} 
                    />
                  </DetailCard>

                  <DetailCard title="Specifications" icon={<FaCogs />}>
                    <DetailItem label="Measurement Range" value={sensor.measurement_range} />
                    <Separator size="1" />
                    <DetailItem label="Accuracy" value={sensor.accuracy} />
                    <Separator size="1" />
                    <DetailItem label="Sampling Rate" value={sensor.sampling_rate} />
                  </DetailCard>

                  <DetailCard title="Connectivity" icon={<FaCodeBranch />}>
                    <DetailItem label="Gateway ID" value={sensor.gateway_id} />
                    <Separator size="1" />
                    <DetailItem label="Protocol" value={sensor.communication_protocol} />
                    <Separator size="1" />
                    <DetailItem label="Firmware" value={sensor.firmware_version} />
                  </DetailCard>

                  {sensor.notes && (
                    <DetailCard title="Notes" icon={<FaMapMarkerAlt />}>
                      <Text className="whitespace-pre-line p-2 bg-gray-50 rounded text-gray-700">
                        {sensor.notes}
                      </Text>
                    </DetailCard>
                  )}
                </Grid>
              )}

{activeTab === "history" && (
    <Tabs.Content value="history">
      <Card className="shadow-sm p-4">
        <Flex justify="between" align="center" mb="4">
          <SectionHeader title="Sensor Readings" icon={<FaThermometerHalf className="text-blue-500" />} />
          <Flex gap="3" align="center">
            <Button 
              variant="soft" 
              onClick={() => refreshReadings()}
              size="2"
            >
              <FaSyncAlt /> Refresh
            </Button>
          </Flex>
        </Flex>

        <Flex gap="4" mb="4" wrap="wrap" align="end">
          <Box className="min-w-[200px]">
            <Text as="div" size="1" weight="bold" mb="1" color="gray">
              From
            </Text>
            <TextField.Root
              type="datetime-local"
              value={dateRange.startDate.format("YYYY-MM-DDTHH:mm")}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
          </Box>
          <Box className="min-w-[200px]">
            <Text as="div" size="1" weight="bold" mb="1" color="gray">
              To
            </Text>
            <TextField.Root
              type="datetime-local"
              value={dateRange.endDate.format("YYYY-MM-DDTHH:mm")}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </Box>
          <Box>
            <Flex gap="3">
              <Button 
                variant="surface" 
                onClick={() => handlePresetDateRange('week')}
                size="2"
              >
                1 Week
              </Button>
              <Button 
                variant="surface" 
                onClick={() => handlePresetDateRange('month')}
                size="2"
              >
                1 Month
              </Button>
              <Button 
                variant="surface" 
                onClick={() => handlePresetDateRange('3months')}
                size="2"
              >
                3 Months
              </Button>
            </Flex>
          </Box>
        </Flex>


                    {isLoadingReadings ? (
                      <Flex justify="center" py="6"><Spinner /></Flex>
                    ) : readingsError ? (
                      <Text color="red">Error loading readings: {readingsError.message}</Text>
                    ) : readings?.length === 0 ? (
                      <Text>No readings found for the selected time period</Text>
                    ) : (
                      <>
                        <Box className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                              <XAxis 
                                dataKey="timestamp" 
                                tick={{ fill: '#6b7280' }}
                                tickMargin={10}
                              />
                              <YAxis 
                                yAxisId="left" 
                                domain={["auto", "auto"]} 
                                tickFormatter={(val) => `${val}°C`}
                                tick={{ fill: '#6b7280' }}
                              />
                              <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                domain={["auto", "auto"]} 
                                tickFormatter={(val) => `${val}%`}
                                tick={{ fill: '#6b7280' }}
                              />
                              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.375rem',
                                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                                }}
                                formatter={(value, name) => {
                                  if (name === "Temperature") return [`${value}°C`, name];
                                  if (name === "Humidity") return [`${value}%`, name];
                                  return [value, name];
                                }}
                              />
                              <Legend />
                              <Line
                                yAxisId="left"
                                name="Temperature"
                                type="monotone"
                                dataKey="temperature"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 2 }}
                              />
                              <Line
                                yAxisId="right"
                                name="Humidity"
                                type="monotone"
                                dataKey="humidity"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>

                        <Box className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <Table.Root variant="surface">
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
              )}
            </Box>
          </ScrollArea>
        </Tabs.Root>
      </Container>

      {/* Reject Dialog */}
      <Dialog.Root open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Reject Sensor</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Please provide a reason for rejecting this sensor.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Reason
              </Text>
              <TextArea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button 
              variant="solid" 
              color="red" 
              onClick={handleReject}
              disabled={!rejectReason || isUpdating || isNoting}
            >
              <FaTimes /> Confirm Reject
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default SensorPage;