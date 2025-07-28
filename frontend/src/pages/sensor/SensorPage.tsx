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
  Dialog,
  TextArea,
  Grid,
  ScrollArea,
  Tabs,
  Table,
  TextField,
  Select,
  IconButton,
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
  FaCogs,
  FaCheck,
  FaTimes,
  FaClock,
  FaMapMarkerAlt,
  FaSyncAlt,
  FaClipboard,
  FaChartLine,
  FaDatabase,
  FaWifi,
  FaThermometer,
  FaEdit,
  FaSave,
  FaBalanceScale,
} from "react-icons/fa";
import { useFrappeGetDoc, useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { useNavigate, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import dayjs from "dayjs";

interface Sensor {
  name: string;
  sensor_name: string;
  sensor_id: string;
  sensor_type: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  measurement_range?: string;
  accuracy?: string;
  sampling_rate?: string;
  gateway_location?: string;
  communication_protocol?: string;
  installation_date?: string;
  last_calibration?: string;
  calibration_offset?: string;
  notes?: string;
  min_acceptable_temperature?: number;
  max_acceptable_temperature?: number;
}

interface SensorRead {
  name: string;
  sensor_id: string;
  sensor_type?: string;
  temperature: string;
  voltage?: string;
  signal_strength?: string;
  sequence_number?: string;
  gateway_id?: string;
  relay_id?: string;
  sensor_rssi?: string;
  coordinates?: string;
  timestamp: string;
}

interface MaintenanceRecord {
  name: string;
  user: string;
  owner: string;
  sensor: string;
  notes: string;
  modified: string;
  creation: string;
}

const sensorTypeIcons: Record<string, React.ReactNode> = {
  Temperature: <FaThermometerHalf className="text-blue-500" size={window.innerWidth < 768 ? 20 : 24} />,
  Motion: <FaSignal className="text-purple-500" size={window.innerWidth < 768 ? 20 : 24} />,
  Pressure: <FaThermometerHalf className="text-orange-500" size={window.innerWidth < 768 ? 20 : 24} />,
};

const sensorTypeOptions = [
  { value: "Temperature", label: "Temperature" },
  { value: "Motion", label: "Motion" },
  { value: "Pressure", label: "Pressure" },
  { value: "Humidity", label: "Humidity" },
  { value: "Light", label: "Light" },
];

const communicationProtocolOptions = [
  { value: "LoRa", label: "LoRa" },
  { value: "WiFi", label: "WiFi" },
  { value: "Bluetooth", label: "Bluetooth" },
  { value: "Zigbee", label: "Zigbee" },
  { value: "Cellular", label: "Cellular" },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: "green" | "gray" | "orange" | "red" }> = {
  Active: { icon: <FaSignal size={window.innerWidth < 768 ? 12 : 14} />, color: "green" },
  Inactive: { icon: <FaBatteryEmpty size={window.innerWidth < 768 ? 12 : 14} />, color: "gray" },
  Maintenance: { icon: <FaTools size={window.innerWidth < 768 ? 12 : 14} />, color: "orange" },
  Decommissioned: { icon: <FaBatteryEmpty size={window.innerWidth < 768 ? 12 : 14} />, color: "red" },
};

const approvalStatusConfig: Record<string, { icon: React.ReactNode; color: "blue" | "green" | "red" | "gray" }> = {
  Pending: { icon: <FaClock size={window.innerWidth < 768 ? 12 : 14} />, color: "blue" },
  Approved: { icon: <FaCheck size={window.innerWidth < 768 ? 12 : 14} />, color: "green" },
  Rejected: { icon: <FaTimes size={window.innerWidth < 768 ? 12 : 14} />, color: "red" },
  Decommissioned: { icon: <FaBatteryEmpty size={window.innerWidth < 768 ? 12 : 14} />, color: "gray" },
};

const SensorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("history");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [visibleReadings, setVisibleReadings] = useState(20);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });
  
  // Default to last 24 hours
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(24, 'hour').startOf('hour'),
    endDate: dayjs().endOf('hour')
  });

  const { data: sensor, isLoading, error, mutate } = useFrappeGetDoc<Sensor>("Sensor", id);
  
  // Fetch maintenance records for this sensor
  const { data: maintenanceRecords } = useFrappeGetDocList<MaintenanceRecord>(
    "Cool Track Maintenance",
    {
      fields: ["name", "user", "owner", "sensor", "notes", "modified", "creation"],
      filters: [["sensor", "=", id || ""]],
      orderBy: {
        field: "modified",
        order: "desc",
      },
    }
  );

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
    limit: 0
  });

  const chartData = useMemo(() => {
    if (!readings) return [];
    
    const groupedData: { [key: string]: SensorRead[] } = {};
    
    readings.forEach(reading => {
      const dayHour = dayjs(reading.timestamp).format("MMM DD HH:00");
      if (!groupedData[dayHour]) {
        groupedData[dayHour] = [];
      }
      groupedData[dayHour].push(reading);
    });
    
    return Object.entries(groupedData).map(([dayHour, hourReadings]) => {
      const avgTemp = hourReadings.reduce((sum, r) => sum + (parseFloat(r.temperature) || 0), 0) / hourReadings.length;
      const avgVoltage = hourReadings.reduce((sum, r) => sum + (parseFloat(r.voltage || "0") || 0), 0) / hourReadings.length;
      
      return {
        time: dayHour,
        temperature: parseFloat(avgTemp.toFixed(2)),
        voltage: parseFloat(avgVoltage.toFixed(2)),
        fullTime: dayjs(hourReadings[0].timestamp).format("MMM DD, YYYY HH:00"),
        readingsCount: hourReadings.length,
      };
    }).sort((a, b) => dayjs(a.fullTime).valueOf() - dayjs(b.fullTime).valueOf());
  }, [readings]);

  const { call: updateApprovalStatus, loading: isUpdating } = useFrappePostCall(
    "frappe.client.set_value"
  );

  const { call: addNote, loading: isNoting } = useFrappePostCall(
    "frappe.client.set_value"
  );

  const { call: updateField, loading: isUpdatingField } = useFrappePostCall(
    "frappe.client.set_value"
  );

  const handlePresetDateRange = (preset: '24hours' | 'week' | 'month' | '3months') => {
    let startDate = dayjs().startOf('hour');
    switch (preset) {
      case '24hours':
        startDate = dayjs().subtract(24, 'hour').startOf('hour');
        break;
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
      endDate: preset === '24hours' ? dayjs().endOf('hour') : dayjs().endOf('day')
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

  const handleEditStart = (fieldName: string, currentValue: any) => {
    setEditingField(fieldName);
    setEditValues({ [fieldName]: currentValue || "" });
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const handleEditSave = async (fieldName: string) => {
    if (!sensor) return;
    
    try {
      await updateField({
        doctype: "Sensor",
        name: sensor.name,
        fieldname: fieldName,
        value: editValues[fieldName],
      });
      
      mutate();
      setEditingField(null);
      setEditValues({});
    } catch (err) {
      console.error(`Failed to update ${fieldName}:`, err);
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newDate = dayjs(value);
    if (newDate.isValid()) {
      setDateRange(prev => ({
        ...prev,
        [type === 'start' ? 'startDate' : 'endDate']: type === 'start' 
          ? newDate.startOf('hour') 
          : newDate.endOf('hour')
      }));
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    return dayjs(dateString).format(window.innerWidth < 768 ? "MMM DD HH:mm" : "YYYY-MM-DD HH:mm:ss");
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "Not available";
    return dayjs(dateString).format("YYYY-MM-DD");
  };

  const formatNumber = (value?: string) => {
    if (!value) return "—";
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toFixed(2);
  };

  const formatTemperature = (value: number) => `${value.toFixed(1)}°C`;

  const currentTemp = readings && readings.length > 0 ? parseFloat(readings[0].temperature) : 0;
  const averageTemp = chartData.length > 0 
    ? chartData.reduce((sum, reading) => sum + reading.temperature, 0) / chartData.length
    : 0;
  const minTemp = chartData.length > 0 ? Math.min(...chartData.map(r => r.temperature)) : 0;
  const maxTemp = chartData.length > 0 ? Math.max(...chartData.map(r => r.temperature)) : 0;

  const isTemperatureInRange = (temperature: number, sensor: Sensor) => {
    if (sensor.min_acceptable_temperature === undefined || sensor.max_acceptable_temperature === undefined) {
      return true; // If no range is defined, consider it in range
    }
    return temperature <= sensor.max_acceptable_temperature;
  };

  const getTemperatureColors = (inRange: boolean) => {
    if (inRange) {
      return {
        background: 'var(--green-2)',
        border: 'var(--green-6)',
        text: 'var(--green-11)',
        chartStroke: 'var(--green-9)',
        chartFill: 'url(#temperatureGradientGreen)'
      };
    } else {
      return {
        background: 'var(--red-2)',
        border: 'var(--red-6)',
        text: 'var(--red-11)',
        chartStroke: 'var(--red-9)',
        chartFill: 'url(#temperatureGradientRed)'
      };
    }
  };

  // Determine if the overall temperature range is acceptable
  const currentTempInRange = isTemperatureInRange(currentTemp, sensor || {});
  const averageTempInRange = isTemperatureInRange(averageTemp, sensor || {});
  const minTempInRange = isTemperatureInRange(minTemp, sensor || {});
  const maxTempInRange = isTemperatureInRange(maxTemp, sensor || {});
  
  // For the chart, use red if the most recent reading is out of range
  const mostRecentReading = readings && readings.length > 0 ? readings[0] : null;
  const mostRecentTempInRange = mostRecentReading 
    ? isTemperatureInRange(parseFloat(mostRecentReading.temperature), sensor || {})
    : true; // Default to true if no readings
  const chartColors = getTemperatureColors(mostRecentTempInRange);


  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <Flex gap="3" align="center" mb="4">
      <Box 
        style={{ 
          padding: window.innerWidth < 768 ? '8px' : '10px',
          borderRadius: window.innerWidth < 768 ? '8px' : '10px',
          background: 'var(--gray-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon}
      </Box>
      <Heading 
        size={{ initial: "3", sm: "4", md: "5" }} 
        weight="medium" 
        style={{ 
          color: 'var(--gray-12)',
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        {title}
      </Heading>
    </Flex>
  );

  const DetailCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card 
      style={{ 
        borderRadius: window.innerWidth < 768 ? '12px' : '16px',
        border: '1px solid var(--gray-6)',
        background: 'var(--color-surface)',
        transition: 'all 0.2s ease',
        padding: window.innerWidth < 768 ? '16px' : '20px'
      }}
      className="hover:shadow-lg"
    >
      <SectionHeader title={title} icon={icon} />
      <Box style={{ marginTop: '12px' }}>
        {children}
      </Box>
    </Card>
  );

  const EditableDetailItem = ({ 
    label, 
    value, 
    icon, 
    fieldName, 
    type = "text",
    options 
  }: { 
    label: string; 
    value?: string | number; 
    icon?: React.ReactNode; 
    fieldName: string;
    type?: "text" | "number" | "date" | "select" | "textarea";
    options?: { value: string; label: string; }[];
  }) => {
    const isEditing = editingField === fieldName;
    const displayValue = value?.toString() || "";
    const editValue = editValues[fieldName] ?? "";
    
    const textFieldRef = React.useRef<HTMLInputElement>(null);
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
    
    React.useEffect(() => {
      if (isEditing) {
        if (type === "textarea" && textAreaRef.current) {
          textAreaRef.current.focus();
        } else if (textFieldRef.current) {
          textFieldRef.current.focus();
        }
      }
    }, [isEditing, type]);

    const handleInputChange = (newValue: string) => {
      setEditValues(prev => ({ ...prev, [fieldName]: newValue }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && type !== 'textarea') {
        e.preventDefault();
        handleEditSave(fieldName);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleEditCancel();
      }
    };

    const handleBlur = (e: React.FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (relatedTarget && (
        relatedTarget.closest('[data-save-button]') || 
        relatedTarget.closest('[data-cancel-button]')
      )) {
        return;
      }
      
      if (editValue !== (value?.toString() || "")) {
        handleEditSave(fieldName);
      } else {
        handleEditCancel();
      }
    };

    return (
      <Flex direction="column" gap="2" py="3">
        <Flex align="center" gap="2" justify="between">
          <Flex align="center" gap="2" style={{ minWidth: 0, flex: 1 }}>
            {icon && (
              <Box style={{ color: 'var(--gray-9)', flexShrink: 0 }}>
                {icon}
              </Box>
            )}
            <Text 
              size={{ initial: "1", sm: "2" }}
              weight="medium"
              style={{ 
                color: 'var(--gray-10)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: window.innerWidth < 768 ? '10px' : '12px',
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {label}
            </Text>
          </Flex>
          {!isEditing && (
            <IconButton
              size="1"
              variant="ghost"
              onClick={() => handleEditStart(fieldName, value)}
              style={{ 
                color: 'var(--gray-9)',
                minHeight: "32px",
                minWidth: "32px"
              }}
            >
              <FaEdit size={window.innerWidth < 768 ? 10 : 12} />
            </IconButton>
          )}
        </Flex>

        {isEditing ? (
          <Flex 
            gap="2" 
            align="center"
            direction={{ initial: "column", sm: "row" }}
          >
            {type === "select" && options ? (
              <Select.Root
                value={editValue}
                onValueChange={handleInputChange}
                size={{ initial: "2", sm: "3" }}
              >
                <Select.Trigger style={{ 
                  flex: 1, 
                  borderRadius: '6px',
                  width: window.innerWidth < 640 ? "100%" : "auto"
                }} />
                <Select.Content>
                  {options.map(option => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            ) : type === "textarea" ? (
              <TextArea
                ref={textAreaRef}
                value={editValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                size={{ initial: "2", sm: "3" }}
                style={{ 
                  flex: 1, 
                  borderRadius: '6px',
                  minHeight: window.innerWidth < 768 ? '60px' : '80px',
                  width: window.innerWidth < 640 ? "100%" : "auto"
                }}
                placeholder={`Enter ${label.toLowerCase()}...`}
              />
            ) : (
              <TextField.Root
                ref={textFieldRef}
                type={type === "date" ? "date" : "text"}
                value={editValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                size={{ initial: "2", sm: "3" }}
                style={{ 
                  flex: 1, 
                  borderRadius: '6px',
                  width: window.innerWidth < 640 ? "100%" : "auto"
                }}
                placeholder={`Enter ${label.toLowerCase()}...`}
              />
            )}
            <Flex gap="2" style={{ flexShrink: 0 }}>
              <IconButton
                size={{ initial: "2", sm: "1" }}
                variant="solid"
                color="green"
                onClick={() => handleEditSave(fieldName)}
                disabled={isUpdatingField}
                style={{ 
                  borderRadius: '4px',
                  minHeight: "36px",
                  minWidth: "36px"
                }}
                data-save-button
              >
                <FaSave size={window.innerWidth < 768 ? 12 : 10} />
              </IconButton>
              <IconButton
                size={{ initial: "2", sm: "1" }}
                variant="soft"
                color="gray"
                onClick={handleEditCancel}
                style={{ 
                  borderRadius: '4px',
                  minHeight: "36px",
                  minWidth: "36px"
                }}
                data-cancel-button
              >
                <FaTimes size={window.innerWidth < 768 ? 12 : 10} />
              </IconButton>
            </Flex>
          </Flex>
        ) : (
          <Text 
            size={{ initial: "2", sm: "3" }}
            weight="medium" 
            style={{ 
              color: displayValue ? 'var(--gray-12)' : 'var(--gray-9)',
              fontFamily: typeof value === 'number' ? 'var(--font-mono, monospace)' : 'inherit',
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
              lineHeight: 1.4
            }}
          >
            {type === "date" && value ? formatDateOnly(value.toString()) : (displayValue || "—")}
          </Text>
        )}
      </Flex>
    );
  };

  const DetailItem = ({ label, value, icon }: { label: string; value?: string | number; icon?: React.ReactNode }) => (
    <Flex direction="column" gap="2" py="3">
      <Flex align="center" gap="2">
        {icon && (
          <Box style={{ color: 'var(--gray-9)', flexShrink: 0 }}>
            {icon}
          </Box>
        )}
        <Text 
          size={{ initial: "1", sm: "2" }}
          weight="medium"
          style={{ 
            color: 'var(--gray-9)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            fontSize: window.innerWidth < 768 ? '10px' : '12px'
          }}
        >
          {label}
        </Text>
      </Flex>
      <Text 
        size={{ initial: "2", sm: "3" }}
        weight="medium" 
        style={{ 
          color: 'var(--gray-12)',
          fontFamily: value?.toString().includes('://') ? 'var(--font-mono)' : 'inherit',
          wordWrap: "break-word",
          overflowWrap: "break-word",
          hyphens: "auto"
        }}
      >
        {value || "—"}
      </Text>
    </Flex>
  );

  if (isLoading) {
    return (
      <Box style={{ background: 'var(--gray-1)' }}>
        <Flex justify="center" align="center" style={{ height: '80vh' }}>
          <Box style={{ textAlign: 'center' }}>
            <Spinner size="3" style={{ marginBottom: '16px' }} />
          </Box>
        </Flex>
      </Box>
    );
  }

  if (error || !sensor) {
    return (
      <Box 
        style={{ 
          background: 'var(--gray-1)', 
          padding: window.innerWidth < 768 ? '16px' : '24px'
        }}
      >
        <Box 
          style={{ 
            maxWidth: window.innerWidth < 768 ? '100%' : '600px', 
            margin: '0 auto', 
            paddingTop: window.innerWidth < 768 ? '5vh' : '10vh'
          }}
        >
          <Card 
            style={{ 
              borderRadius: window.innerWidth < 768 ? '12px' : '16px',
              border: '1px solid var(--red-6)',
              background: 'var(--red-2)',
              padding: window.innerWidth < 768 ? '24px' : '32px',
              textAlign: 'center'
            }}
          >
            <Flex direction="column" gap="4" align="center">
              <Box style={{ opacity: 0.8 }}>
                <FaBatteryEmpty 
                  size={window.innerWidth < 768 ? 24 : 32} 
                  color="var(--red-9)" 
                />
              </Box>
              <Heading 
                size={{ initial: "3", sm: "5" }} 
                style={{ color: 'var(--red-11)' }}
              >
                Error Loading Sensor
              </Heading>
              <Text 
                color="red" 
                size={{ initial: "2", sm: "3" }}
                style={{ lineHeight: 1.5 }}
              >
                {error?.message || "Sensor not found"}
              </Text>
              <Button 
                onClick={() => navigate('/sensors')} 
                variant="soft" 
                size={{ initial: "2", sm: "3" }}
                style={{ borderRadius: '12px'}}
              >
                <FaArrowLeft style={{ marginRight: '8px' }} /> 
                All Sensors
              </Button>
            </Flex>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box style={{ background: 'var(--gray-1)' }}>
      <Box 
        style={{ 
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--gray-4)',
          padding: window.innerWidth < 768 ? '12px 16px' : '12px 24px',
          top: 0,
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Flex 
          justify="between" 
          align="center"
          gap="3"
          direction={{ initial: "column", sm: "row" }}
        >
          <Button 
            onClick={() => navigate('/sensors')} 
            variant="soft" 
            size={{ initial: "2", sm: "3" }}
            style={{ 
              borderRadius: '12px',
              alignSelf: window.innerWidth < 640 ? "flex-start" : "auto"
            }}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} /> 
            All Sensors
          </Button>
          <Flex 
            gap="2" 
            align="center" 
            wrap="wrap"
            justify={window.innerWidth < 640 ? "flex-start" : "flex-end"}
            style={{ width: window.innerWidth < 640 ? "100%" : "auto" }}
          >
            <Badge 
              color={statusConfig[sensor.status].color}
              variant="soft"
              size={{ initial: "1", sm: "2" }}
              style={{ 
                borderRadius: window.innerWidth < 768 ? '16px' : '20px',
                padding: window.innerWidth < 768 ? '6px 12px' : '8px 16px',
                fontSize: window.innerWidth < 768 ? '11px' : '12px',
                fontWeight: '600',
                letterSpacing: '0.3px',
                textTransform: 'uppercase'
              }}
            >
              <Flex gap="2" align="center">
                {statusConfig[sensor.status].icon}
                <span style={{ display: window.innerWidth < 380 ? "none" : "inline" }}>
                  {sensor.status}
                </span>
              </Flex>
            </Badge>
            <Badge 
              color={approvalStatusConfig[sensor.approval_status].color}
              variant="soft"
              size={{ initial: "1", sm: "2" }}
              style={{ 
                borderRadius: window.innerWidth < 768 ? '16px' : '20px',
                padding: window.innerWidth < 768 ? '6px 12px' : '8px 16px',
                fontWeight: '600',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                fontSize: window.innerWidth < 768 ? '11px' : '12px'
              }}
            >
              <Flex gap="2" align="center">
                {approvalStatusConfig[sensor.approval_status].icon}
                <span style={{ display: window.innerWidth < 380 ? "none" : "inline" }}>
                  {sensor.approval_status}
                </span>
              </Flex>
            </Badge>
          </Flex>
        </Flex>
      </Box>

      <Box style={{ padding: window.innerWidth < 768 ? '16px' : '32px 24px' }}>
        <Card 
          style={{ 
            borderRadius: window.innerWidth < 768 ? '16px' : '20px',
            border: '1px solid var(--gray-6)',
            background: 'var(--color-surface)',
            marginBottom: window.innerWidth < 768 ? '24px' : '32px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Flex 
            gap="4" 
            align="center" 
            p={{ initial: "4", sm: "6" }}
            direction={{ initial: "column", sm: "row" }}
          >
            <Box 
              style={{ 
                padding: window.innerWidth < 768 ? '12px' : '16px',
                background: 'var(--gray-2)',
                borderRadius: window.innerWidth < 768 ? '10px' : '12px',
                border: '1px solid var(--gray-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {sensorTypeIcons[sensor.sensor_type] || <FaThermometerHalf size={window.innerWidth < 768 ? 20 : 24} />}
            </Box>
            <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1, textAlign: window.innerWidth < 640 ? "center" : "left" }}>
              <Heading 
                size={{ initial: "4", sm: "5" }} 
                weight="bold" 
                style={{ 
                  color: 'var(--gray-12)',
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
                title={sensor.sensor_name || sensor.name}
              >
                {sensor.sensor_name || sensor.name}
              </Heading>
              <Text 
                color="gray" 
                size={{ initial: "1", sm: "2" }}
                style={{ 
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.2px',
                  fontSize: window.innerWidth < 768 ? '11px' : '14px'
                }}
              >
                ID: {sensor.name}
              </Text>
            </Flex>
          </Flex>

          {sensor.approval_status === "Pending" && (
            <Box 
              style={{ 
                background: 'var(--gray-2)',
                padding: window.innerWidth < 768 ? '16px 20px' : '24px 32px',
                borderTop: '1px solid var(--gray-6)'
              }}
            >
              <Flex 
                gap="3" 
                justify="end"
                direction={{ initial: "column", sm: "row" }}
              >
                <Button 
                  variant="solid" 
                  color="green" 
                  onClick={handleApprove}
                  disabled={isUpdating}
                  size="3"
                  style={{ 
                    borderRadius: '12px', 
                    padding: window.innerWidth < 768 ? '10px 20px' : '12px 24px',
                    width: window.innerWidth < 640 ? "100%" : "auto"
                  }}
                >
                  <FaCheck style={{ marginRight: '8px' }} /> 
                  Approve Sensor
                </Button>
                <Button 
                  variant="soft" 
                  color="red" 
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isUpdating}
                  size="3"
                  style={{ 
                    borderRadius: '12px', 
                    padding: window.innerWidth < 768 ? '10px 20px' : '12px 24px',
                    width: window.innerWidth < 640 ? "100%" : "auto"
                  }}
                >
                  <FaTimes style={{ marginRight: '8px' }} /> 
                  Reject Sensor
                </Button>
              </Flex>
            </Box>
          )}
        </Card>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Box 
            style={{ 
              borderRadius: window.innerWidth < 768 ? '12px' : '16px',
              padding: window.innerWidth < 768 ? '8px' : '12px',
              border: '1px solid var(--gray-6)',
              marginBottom: window.innerWidth < 768 ? '24px' : '32px',
              background: 'var(--color-surface)'
            }}
          >
            <Tabs.List 
              style={{ 
                background: 'transparent',
                gap: window.innerWidth < 768 ? '4px' : '8px',
                flexWrap: window.innerWidth < 480 ? 'wrap' : 'nowrap'
              }}
            >
              <Tabs.Trigger 
                value="history"
                style={{
                  borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                  padding: window.innerWidth < 768 ? '8px 12px' : '12px 20px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500',
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  flex: window.innerWidth < 480 ? '1' : 'none',
                  minWidth: window.innerWidth < 480 ? '0' : 'auto'
                }}
              >
                <FaChartLine style={{ marginRight: window.innerWidth < 480 ? '4px' : '8px' }} />
                <span style={{ display: window.innerWidth < 380 ? "none" : "inline" }}>
                  History
                </span>
                <span style={{ display: window.innerWidth >= 380 ? "none" : "inline" }}>
                  History
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="maintenance"
                style={{
                  borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                  padding: window.innerWidth < 768 ? '8px 12px' : '12px 20px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500',
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  flex: window.innerWidth < 480 ? '1' : 'none',
                  minWidth: window.innerWidth < 480 ? '0' : 'auto'
                }}
              >
                <FaTools style={{ marginRight: window.innerWidth < 480 ? '4px' : '8px' }} />
                <span style={{ display: window.innerWidth < 380 ? "none" : "inline" }}>
                  Maintenance
                </span>
                <span style={{ display: window.innerWidth >= 380 ? "none" : "inline" }}>
                  Maint.
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="details"
                style={{
                  borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                  padding: window.innerWidth < 768 ? '8px 12px' : '12px 20px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500',
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  flex: window.innerWidth < 480 ? '1' : 'none',
                  minWidth: window.innerWidth < 480 ? '0' : 'auto'
                }}
              >
                <FaInfoCircle style={{ marginRight: window.innerWidth < 480 ? '4px' : '8px' }} />
                <span style={{ display: window.innerWidth < 380 ? "none" : "inline" }}>
                  Specifications
                </span>
                <span style={{ display: window.innerWidth >= 380 ? "none" : "inline" }}>
                  Specs
                </span>
              </Tabs.Trigger>
            </Tabs.List>
          </Box>

          <Box style={{ paddingRight: window.innerWidth < 768 ? '0' : '16px' }}>
            {activeTab === "details" && (
              <Grid 
                columns={{ initial: '1', md: '2', lg: '3' }} 
                gap={{ initial: "4", sm: "6" }}
              >
                <DetailCard 
                  title="Basic Information" 
                  icon={<FaInfoCircle color="var(--blue-9)" size={window.innerWidth < 768 ? 16 : 18} />}
                >
                  <DetailItem 
                    label="Sensor Type" 
                    value={sensor.sensor_type} 
                    icon={<FaMicrochip size={window.innerWidth < 768 ? 12 : 14} />} 
                  />
                  <Separator size="1" style={{ margin: window.innerWidth < 768 ? '12px 0' : '16px 0' }} />
                  <EditableDetailItem 
                    label="Sensor Name" 
                    value={sensor.sensor_name} 
                    fieldName="sensor_name"
                  />
                  <Separator size="1" style={{ margin: window.innerWidth < 768 ? '12px 0' : '16px 0' }} />
                  <EditableDetailItem 
                    label="Installation Date" 
                    value={sensor.installation_date} 
                    icon={<FaCalendarAlt size={window.innerWidth < 768 ? 12 : 14} />}
                    fieldName="installation_date"
                    type="date"
                  />
                </DetailCard>

                <DetailCard 
                  title="Specifications" 
                  icon={<FaCogs color="var(--green-9)" size={window.innerWidth < 768 ? 16 : 18} />}
                >
                  <DetailItem 
                    label="Measurement Range" 
                    value={sensor.measurement_range} 
                  />
                  <Separator size="1" style={{ margin: window.innerWidth < 768 ? '12px 0' : '16px 0' }} />
                  <DetailItem 
                    label="Accuracy" 
                    value={sensor.accuracy} 
                  />
                  <Separator size="1" style={{ margin: window.innerWidth < 768 ? '12px 0' : '16px 0' }} />
                  <DetailItem 
                    label="Sampling Rate" 
                    value={sensor.sampling_rate} 
                  />
                </DetailCard>

                <DetailCard 
                  title="Calibration" 
                  icon={<FaBalanceScale color="var(--purple-9)" size={window.innerWidth < 768 ? 16 : 18} />}
                >
                  <DetailItem 
                    label="Last Calibration" 
                    value={sensor.last_calibration} 
                    icon={<FaCalendarAlt size={window.innerWidth < 768 ? 12 : 14} />} 
                  />
                  <Separator size="1" style={{ margin: window.innerWidth < 768 ? '12px 0' : '16px 0' }} />
                  <EditableDetailItem 
                    label="Calibration Offset (°C)" 
                    value={sensor.calibration_offset} 
                    icon={<FaBalanceScale size={window.innerWidth < 768 ? 12 : 14} />}
                    fieldName="calibration_offset"
                    type="number"
                  />
                  <Separator size="1" style={{ margin: window.innerWidth < 768 ? '12px 0' : '16px 0' }} />
                  <Separator size="1" style={{ margin: window.innerWidth < 768 ? '12px 0' : '16px 0' }} />
                  <EditableDetailItem 
                    label="Max Acceptable Temperature (°C)" 
                    value={sensor.max_acceptable_temperature} 
                    icon={<FaThermometer size={window.innerWidth < 768 ? 12 : 14} />}
                    fieldName="max_acceptable_temperature"
                    type="number"
                  />
                </DetailCard>

                <DetailCard 
                  title="Connectivity" 
                  icon={<FaWifi color="var(--orange-9)" size={window.innerWidth < 768 ? 16 : 18} />}
                >
                  <DetailItem 
                    label="Gateway" 
                    value={sensor.gateway_location} 
                  />
                </DetailCard>

                {sensor.notes && (
                  <Box style={{ gridColumn: window.innerWidth < 768 ? 'span 1' : 'span 3' }}>
                    <DetailCard 
                      title="Notes & Comments" 
                      icon={<FaClipboard color="var(--amber-9)" size={window.innerWidth < 768 ? 16 : 18} />}
                    >
                      <DetailItem 
                        label="Notes" 
                        value={sensor.notes} 
                      />
                    </DetailCard>
                  </Box>
                )}
              </Grid>
            )}

            {activeTab === "history" && (
              <Tabs.Content value="history">
                <Card 
                  style={{ 
                    borderRadius: window.innerWidth < 768 ? '12px' : '16px',
                    border: '1px solid var(--gray-6)',
                    background: 'var(--color-surface)',
                    padding: window.innerWidth < 768 ? '20px' : '32px'
                  }}
                >
                  <Card 
  style={{ 
    background: 'var(--gray-2)',
    border: '1px solid var(--gray-5)',
    borderRadius: window.innerWidth < 768 ? '8px' : '12px',
    padding: window.innerWidth < 768 ? '16px' : '24px',
    marginBottom: window.innerWidth < 768 ? '24px' : '32px'
  }}
>
  <Flex 
    gap="4" 
    wrap="wrap" 
    align="end"
    direction={{ initial: "column", sm: "row" }}
  >
    <Box style={{ flex: window.innerWidth < 640 ? "1" : "none", width: window.innerWidth < 640 ? "100%" : "auto" }}>
      <Text 
        as="div" 
        size={{ initial: "1", sm: "2" }}
        weight="bold" 
        mb="2" 
        style={{ color: 'var(--gray-11)' }}
      >
        From
      </Text>
      <TextField.Root
        type="datetime-local"
        value={dateRange.startDate.format("YYYY-MM-DDTHH:mm")}
        onChange={(e) => handleDateChange('start', e.target.value)}
        size={{ initial: "2", sm: "3" }}
        style={{ 
          borderRadius: '8px',
          width: "100%"
        }}
      />
    </Box>
    <Box style={{ flex: window.innerWidth < 640 ? "1" : "none", width: window.innerWidth < 640 ? "100%" : "auto" }}>
      <Text 
        as="div" 
        size={{ initial: "1", sm: "2" }}
        weight="bold" 
        mb="2" 
        style={{ color: 'var(--gray-11)' }}
      >
        To
      </Text>
      <TextField.Root
        type="datetime-local"
        value={dateRange.endDate.format("YYYY-MM-DDTHH:mm")}
        onChange={(e) => handleDateChange('end', e.target.value)}
        size={{ initial: "2", sm: "3" }}
        style={{ 
          borderRadius: '8px',
          width: "100%"
        }}
      />
    </Box>
    <Flex 
      gap="2" 
      wrap="wrap"
      style={{ width: window.innerWidth < 640 ? "100%" : "auto" }}
    >
      <Button 
        variant="surface" 
        onClick={() => handlePresetDateRange('24hours')}
        size={{ initial: "2", sm: "3" }}
        style={{ 
          borderRadius: '8px',
          flex: window.innerWidth < 480 ? "1" : "none",
          minHeight: window.innerWidth < 768 ? '40px' : 'auto',
          padding: window.innerWidth < 480 ? '8px 6px' : undefined,
          fontSize: window.innerWidth < 380 ? '12px' : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {window.innerWidth < 768 ? "24h" : "Last 24 Hours"}
      </Button>
      <Button 
        variant="surface" 
        onClick={() => handlePresetDateRange('week')}
        size={{ initial: "2", sm: "3" }}
        style={{ 
          borderRadius: '8px',
          flex: window.innerWidth < 480 ? "1" : "none",
          minHeight: window.innerWidth < 768 ? '40px' : 'auto',
          padding: window.innerWidth < 480 ? '8px 6px' : undefined,
          fontSize: window.innerWidth < 380 ? '12px' : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {window.innerWidth < 768 ? "1w" : "Last Week"}
      </Button>
      <Button 
        variant="surface" 
        onClick={() => handlePresetDateRange('month')}
        size={{ initial: "2", sm: "3" }}
        style={{ 
          borderRadius: '8px',
          flex: window.innerWidth < 480 ? "1" : "none",
          minHeight: window.innerWidth < 768 ? '40px' : 'auto',
          padding: window.innerWidth < 480 ? '8px 6px' : undefined,
          fontSize: window.innerWidth < 380 ? '12px' : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {window.innerWidth < 768 ? "1m" : "Last Month"}
      </Button>
      <Button 
        variant="surface" 
        onClick={() => handlePresetDateRange('3months')}
        size={{ initial: "2", sm: "3" }}
        style={{ 
          borderRadius: '8px',
          flex: window.innerWidth < 480 ? "1" : "none",
          minHeight: window.innerWidth < 768 ? '40px' : 'auto',
          padding: window.innerWidth < 480 ? '8px 6px' : undefined,
          fontSize: window.innerWidth < 380 ? '12px' : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {window.innerWidth < 768 ? "3m" : "Last 3 Months"}
      </Button>
      <Button 
        variant="soft" 
        onClick={() => refreshReadings()}
        size={{ initial: "2", sm: "3" }}
        style={{ 
          borderRadius: '12px',
          flex: window.innerWidth < 480 ? "1" : "none",
          minHeight: window.innerWidth < 768 ? '40px' : 'auto',
          padding: window.innerWidth < 480 ? '8px 6px' : undefined,
          fontSize: window.innerWidth < 380 ? '12px' : undefined,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        disabled={isLoadingReadings}
      >
        <FaSyncAlt 
          className={isLoadingReadings ? "animate-spin" : ""} 
          style={{ 
            marginRight: window.innerWidth < 380 ? '4px' : '8px',
            flexShrink: 0
          }} 
          size={window.innerWidth < 768 ? 12 : 14}
        />
        <span style={{ 
          display: window.innerWidth < 768 ? "none" : "inline",
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          Refresh Data
        </span>
      </Button>
    </Flex>
  </Flex>
</Card>

                  {isLoadingReadings ? (
                    <Flex justify="center" py="8">
                      <Box style={{ textAlign: 'center' }}>
                        <Spinner size="3" style={{ marginBottom: '16px' }} />
                      </Box>
                    </Flex>
                  ) : readingsError ? (
                    <Card 
                      style={{ 
                        border: '1px solid var(--red-6)',
                        borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                        background: 'var(--red-2)',
                        padding: window.innerWidth < 768 ? '16px' : '24px',
                        textAlign: 'center'
                      }}
                    >
                      <Text 
                        color="red" 
                        size={{ initial: "3", sm: "4" }} 
                        weight="bold"
                        style={{ lineHeight: 1.5 }}
                      >
                        Error loading readings: {readingsError.message}
                      </Text>
                    </Card>
                  ) : readings?.length === 0 ? (
                    <Card 
                      style={{ 
                        border: '1px dashed var(--gray-6)',
                        borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                        background: 'var(--gray-2)',
                        padding: window.innerWidth < 768 ? '32px' : '48px',
                        textAlign: 'center'
                      }}
                    >
                      <Box style={{ opacity: 0.6, marginBottom: '16px' }}>
                        <FaDatabase 
                          size={window.innerWidth < 768 ? 24 : 32} 
                          color="var(--gray-9)" 
                        />
                      </Box>
                      <Text 
                        size={{ initial: "3", sm: "4" }} 
                        color="gray" 
                        weight="medium"
                        style={{ lineHeight: 1.5 }}
                      >
                        No readings found for the selected time period
                      </Text>
                    </Card>
                  ) : (
                    <>
                      <Grid 
                        columns={{ initial: "1", xs: "2", sm: "2", md: "4" }} 
                        gap={{ initial: "2", sm: "3" }}
                        mb="4"
                      >
                        {(() => {
                          const colors = getTemperatureColors(currentTempInRange);
                          const isMobile = window.innerWidth < 768;
                          const isSmallMobile = window.innerWidth < 480;
                          
                          return (
                            <Card style={{ 
                              background: colors.background,
                              border: `1px solid ${colors.border}`, 
                              padding: isMobile ? '12px 8px' : '12px',
                              position: 'relative',
                              minHeight: isMobile ? '90px' : '100px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}>
                              <Text 
                                size={{ initial: "1", sm: "2" }} 
                                color="gray" 
                                weight="medium" 
                                style={{ 
                                  textTransform: 'uppercase',
                                  marginBottom: isSmallMobile ? '2px' : '4px',
                                  display: 'block',
                                  fontSize: isSmallMobile ? '9px' : isMobile ? '10px' : '12px',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                Current
                              </Text>
                              <Text 
                                size={{ initial: "2", xs: "3", sm: "4" }} 
                                weight="bold" 
                                style={{ 
                                  color: colors.text,
                                  fontSize: isSmallMobile ? '16px' : isMobile ? '18px' : '20px',
                                  lineHeight: 1.1,
                                  marginBottom: 'auto'
                                }}
                              >
                                {formatTemperature(currentTemp)}
                              </Text>
                            </Card>
                          );
                        })()}

                        {(() => {
                          const colors = getTemperatureColors(averageTempInRange);
                          const isMobile = window.innerWidth < 768;
                          const isSmallMobile = window.innerWidth < 480;
                          
                          return (
                            <Card style={{ 
                              background: colors.background,
                              border: `1px solid ${colors.border}`, 
                              padding: isMobile ? '12px 8px' : '12px',
                              position: 'relative',
                              minHeight: isMobile ? '90px' : '100px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}>
                              <Text 
                                size={{ initial: "1", sm: "2" }} 
                                color="gray" 
                                weight="medium" 
                                style={{ 
                                  textTransform: 'uppercase',
                                  marginBottom: isSmallMobile ? '2px' : '4px',
                                  display: 'block',
                                  fontSize: isSmallMobile ? '9px' : isMobile ? '10px' : '12px',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                Average
                              </Text>
                              <Text 
                                size={{ initial: "2", xs: "3", sm: "4" }} 
                                weight="bold" 
                                style={{ 
                                  color: colors.text,
                                  fontSize: isSmallMobile ? '16px' : isMobile ? '18px' : '20px',
                                  lineHeight: 1.1
                                }}
                              >
                                {formatTemperature(averageTemp)}
                              </Text>
                            </Card>
                          );
                        })()}

                        {(() => {
                          const colors = getTemperatureColors(minTempInRange);
                          const isMobile = window.innerWidth < 768;
                          const isSmallMobile = window.innerWidth < 480;
                          
                          return (
                            <Card style={{ 
                              background: colors.background,
                              border: `1px solid ${colors.border}`, 
                              padding: isMobile ? '12px 8px' : '12px',
                              position: 'relative',
                              minHeight: isMobile ? '90px' : '100px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}>
                              <Text 
                                size={{ initial: "1", sm: "2" }} 
                                color="gray" 
                                weight="medium" 
                                style={{ 
                                  textTransform: 'uppercase',
                                  marginBottom: isSmallMobile ? '2px' : '4px',
                                  display: 'block',
                                  fontSize: isSmallMobile ? '9px' : isMobile ? '10px' : '12px',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                {isSmallMobile ? 'Min' : 'Minimum'}
                              </Text>
                              <Text 
                                size={{ initial: "2", xs: "3", sm: "4" }} 
                                weight="bold" 
                                style={{ 
                                  color: colors.text,
                                  fontSize: isSmallMobile ? '16px' : isMobile ? '18px' : '20px',
                                  lineHeight: 1.1
                                }}
                              >
                                {formatTemperature(minTemp)}
                              </Text>
                            </Card>
                          );
                        })()}

                        {(() => {
                          const colors = getTemperatureColors(maxTempInRange);
                          const isMobile = window.innerWidth < 768;
                          const isSmallMobile = window.innerWidth < 480;
                          
                          return (
                            <Card style={{ 
                              background: colors.background,
                              border: `1px solid ${colors.border}`, 
                              padding: isMobile ? '12px 8px' : '12px',
                              position: 'relative',
                              minHeight: isMobile ? '90px' : '100px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}>
                              <Text 
                                size={{ initial: "1", sm: "2" }} 
                                color="gray" 
                                weight="medium" 
                                style={{ 
                                  textTransform: 'uppercase',
                                  marginBottom: isSmallMobile ? '2px' : '4px',
                                  display: 'block',
                                  fontSize: isSmallMobile ? '9px' : isMobile ? '10px' : '12px',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                {isSmallMobile ? 'Max' : 'Maximum'}
                              </Text>
                              <Text 
                                size={{ initial: "2", xs: "3", sm: "4" }} 
                                weight="bold" 
                                style={{ 
                                  color: colors.text,
                                  fontSize: isSmallMobile ? '16px' : isMobile ? '18px' : '20px',
                                  lineHeight: 1.1
                                }}
                              >
                                {formatTemperature(maxTemp)}
                              </Text>
                            </Card>
                          );
                        })()}
                      </Grid>

                      <Card 
                        style={{ 
                          background: 'var(--color-surface)',
                          border: '1px solid var(--gray-6)',
                          borderRadius: window.innerWidth < 768 ? '12px' : '16px',
                          padding: window.innerWidth < 768 ? '16px' : '24px',
                          marginBottom: window.innerWidth < 768 ? '24px' : '32px'
                        }}
                      >
                        <ResponsiveContainer 
                          width="100%" 
                          height={window.innerWidth < 768 ? 300 : 400}
                        >
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="temperatureGradientGreen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--green-9)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--green-9)" stopOpacity={0.05}/>
                              </linearGradient>
                              <linearGradient id="temperatureGradientRed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--red-9)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--red-9)" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <XAxis 
                              dataKey="time" 
                              tick={{ 
                                fill: 'var(--gray-9)', 
                                fontSize: window.innerWidth < 768 ? 8 : 10 
                              }}
                              tickMargin={8}
                              axisLine={{ stroke: 'var(--gray-6)' }}
                              angle={-45}
                              textAnchor="end"
                              height={window.innerWidth < 768 ? 50 : 60}
                              interval={window.innerWidth < 768 ? Math.ceil(chartData.length / 4) : "preserveStartEnd"}
                            />
                            <YAxis 
                              domain={["auto", "auto"]} 
                              tickFormatter={formatTemperature}
                              tick={{ 
                                fill: 'var(--gray-9)', 
                                fontSize: window.innerWidth < 768 ? 9 : 11 
                              }}
                              axisLine={{ stroke: 'var(--gray-6)' }}
                              width={window.innerWidth < 768 ? 40 : 50}
                            />
                            <CartesianGrid stroke="var(--gray-5)" strokeDasharray="2 2" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--gray-6)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                fontSize: window.innerWidth < 768 ? '11px' : '12px'
                              }}
                              formatter={(value: number, name, props) => {
                                if (name === "temperature") {
                                  return [
                                    formatTemperature(value),
                                    `Temperature (${props.payload.readingsCount} readings)`
                                  ];
                                }
                                return [value, name];
                              }}
                              labelFormatter={(label, payload) => {
                                if (payload && payload[0]) {
                                  return payload[0].payload.fullTime;
                                }
                                return label;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="temperature"
                              stroke={chartColors.chartStroke}
                              strokeWidth={window.innerWidth < 768 ? 1.5 : 2}
                              fill={chartColors.chartFill}
                              dot={false}
                              activeDot={{ 
                                r: window.innerWidth < 768 ? 3 : 4, 
                                strokeWidth: 2, 
                                fill: chartColors.chartStroke,
                                stroke: 'var(--color-surface)'
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Card>

                      {window.innerWidth < 768 ? (
                        <Flex direction="column" gap="3">
                          <Heading 
                            size="3" 
                            weight="medium" 
                            mb="3"
                            style={{ color: 'var(--gray-12)' }}
                          >
                            Recent Readings
                          </Heading>
                          {readings?.slice(0, visibleReadings).map((reading) => {
                            const tempValue = parseFloat(reading.temperature);
                            const tempInRange = isTemperatureInRange(tempValue, sensor);
                            
                            return (
                              <Card 
                                key={reading.name}
                                style={{ 
                                  background: 'var(--color-surface)',
                                  border: '1px solid var(--gray-6)',
                                  borderRadius: '12px',
                                  padding: '12px'
                                }}
                              >
                                <Flex direction="column" gap="2">
                                  <Flex justify="between" align="center">
                                    <Text 
                                      size="1" 
                                      weight="medium"
                                      style={{ 
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '10px',
                                        color: 'var(--gray-11)'
                                      }}
                                    >
                                      {formatDate(reading.timestamp)}
                                    </Text>
                                  </Flex>
                                  <Grid columns="2" gap="2">
                                    <Flex align="center" gap="2">
                                      <FaThermometer size={10} color={tempInRange ? "var(--green-9)" : "var(--red-9)"} />
                                      <Badge 
                                        variant="soft" 
                                        color={tempInRange ? "green" : "red"}
                                        size="1"
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                      >
                                        {formatNumber(reading.temperature)}°C
                                      </Badge>
                                    </Flex>
                                    <Flex align="center" gap="2">
                                      <FaSignal size={10} color="var(--purple-9)" />
                                      <Badge 
                                        variant="soft" 
                                        color="purple"
                                        size="1"
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                      >
                                        {formatNumber(reading.signal_strength)}
                                      </Badge>
                                    </Flex>
                                  </Grid>
                                  {reading.voltage && (
                                    <Flex align="center" gap="2">
                                      <Text size="1" color="gray">Voltage:</Text>
                                      <Badge 
                                        variant="soft" 
                                        color="amber"
                                        size="1"
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                      >
                                        {formatNumber(reading.voltage)}V
                                      </Badge>
                                    </Flex>
                                  )}
                                  {reading.gateway_id && (
                                    <Flex align="center" gap="2">
                                      <Text size="1" color="gray">Gateway:</Text>
                                      <Text 
                                        size="1" 
                                        style={{ 
                                          fontFamily: 'var(--font-mono)',
                                          color: 'var(--gray-11)'
                                        }}
                                      >
                                        {reading.gateway_id}
                                      </Text>
                                    </Flex>
                                  )}
                                </Flex>
                              </Card>
                            );
                          })}
                          {readings && visibleReadings < readings.length && (
                            <Button
                              variant="soft"
                              onClick={() => setVisibleReadings((prev) => prev + 20)}
                              style={{ marginTop: '16px' }}
                            >
                              Load More
                            </Button>
                          )}
                        </Flex>
                      ) : (
                        <Card 
                          style={{ 
                            background: 'var(--color-surface)',
                            border: '1px solid var(--gray-6)',
                            borderRadius: '16px',
                            overflow: 'hidden'
                          }}
                        >
                          <Box style={{ padding: '24px 24px 16px' }}>
                            <Flex align="center" gap="3" mb="3">
                              <Box 
                                style={{ 
                                  padding: '8px',
                                  borderRadius: '8px',
                                  background: 'var(--gray-3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <FaDatabase size={16} color="var(--gray-11)" />
                              </Box>
                              <Heading size="4" weight="medium">
                                Raw Data
                              </Heading>
                            </Flex>
                          </Box>
                          <Box style={{ overflowX: "auto" }}>
                            <Table.Root variant="surface">
                              <Table.Header>
                                <Table.Row style={{ background: 'var(--gray-2)' }}>
                                  <Table.ColumnHeaderCell>Timestamp</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Temperature (°C)</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Voltage (V)</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Signal Strength</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Gateway ID</Table.ColumnHeaderCell>
                                </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                {readings
                                  ?.slice(
                                    pagination.pageIndex * pagination.pageSize,
                                    (pagination.pageIndex + 1) * pagination.pageSize
                                  )
                                  .map((r) => {
                                    const tempValue = parseFloat(r.temperature);
                                    const tempInRange = isTemperatureInRange(tempValue, sensor);
                                    
                                    return (
                                      <Table.Row key={r.name}>
                                        <Table.Cell>{formatDate(r.timestamp)}</Table.Cell>
                                        <Table.Cell>
                                          <Badge 
                                            variant="soft" 
                                            color={tempInRange ? "green" : "red"}
                                            style={{ fontFamily: 'var(--font-mono)' }}
                                          >
                                            {formatNumber(r.temperature)}
                                          </Badge>
                                        </Table.Cell>
                                        <Table.Cell>{formatNumber(r.voltage)}</Table.Cell>
                                        <Table.Cell>{formatNumber(r.signal_strength)}</Table.Cell>
                                        <Table.Cell>{r.gateway_id || "—"}</Table.Cell>
                                      </Table.Row>
                                    );
                                  })}
                              </Table.Body>
                            </Table.Root>
                          </Box>
                          {readings && readings.length > pagination.pageSize && (
                            <Flex justify="between" align="center" mt="4" p="4" style={{ borderTop: '1px solid var(--gray-5)' }}>
                              <Button
                                variant="soft"
                                onClick={() =>
                                  setPagination((prev) => ({
                                    ...prev,
                                    pageIndex: Math.max(0, prev.pageIndex - 1),
                                  }))
                                }
                                disabled={pagination.pageIndex === 0}
                              >
                                Previous
                              </Button>
                              
                              <Text>
                                Page {pagination.pageIndex + 1} of{" "}
                                {Math.ceil(readings.length / pagination.pageSize)}
                              </Text>
                              
                              <Button
                                variant="soft"
                                onClick={() =>
                                  setPagination((prev) => ({
                                    ...prev,
                                    pageIndex: Math.min(
                                      Math.ceil(readings.length / pagination.pageSize) - 1,
                                      prev.pageIndex + 1
                                    ),
                                  }))
                                }
                                disabled={
                                  pagination.pageIndex >=
                                  Math.ceil(readings.length / pagination.pageSize) - 1
                                }
                              >
                                Next
                              </Button>
                            </Flex>
                          )}
                        </Card>
                      )}
                    </>
                  )}
                </Card>
              </Tabs.Content>
            )}

            {activeTab === "maintenance" && (
              <Tabs.Content value="maintenance">
                <Card 
                  style={{ 
                    borderRadius: window.innerWidth < 768 ? '12px' : '16px',
                    border: '1px solid var(--gray-6)',
                    background: 'var(--color-surface)',
                    padding: window.innerWidth < 768 ? '20px' : '32px'
                  }}
                >
                  {maintenanceRecords?.length === 0 ? (
                    <Card 
                      style={{ 
                        border: '1px dashed var(--gray-6)',
                        borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                        background: 'var(--gray-2)',
                        padding: window.innerWidth < 768 ? '32px' : '48px',
                        textAlign: 'center'
                      }}
                    >
                      <Text 
                        size={{ initial: "3", sm: "4" }} 
                        color="gray" 
                        weight="medium"
                        style={{ lineHeight: 1.5 }}
                      >
                        No maintenance records found for this sensor
                      </Text>
                    </Card>
                  ) : window.innerWidth < 768 ? (
                    <Flex direction="column" gap="3">
                      {maintenanceRecords?.map((record, index) => (
                        <Card 
                          key={record.name}
                          style={{ 
                            background: 'var(--color-surface)',
                            border: '1px solid var(--gray-6)',
                            borderRadius: '12px',
                            padding: '16px'
                          }}
                        >
                          <Flex direction="column" gap="3">
                            <Flex justify="between" align="center">
                              <Badge 
                                variant="soft" 
                                color="blue"
                                size="1"
                                style={{ fontWeight: '500' }}
                              >
                                {record.owner || record.user}
                              </Badge>
                              <Text 
                                size="1" 
                                color="gray"
                                style={{ 
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '10px'
                                }}
                              >
                                {formatDate(record.modified)}
                              </Text>
                            </Flex>
                            <Box 
                              style={{ 
                                background: 'var(--gray-2)',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--gray-5)',
                                whiteSpace: 'pre-line',
                                fontSize: '13px',
                                lineHeight: '1.5',
                                color: 'var(--gray-11)',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto'
                              }}
                            >
                              {record.notes || "No notes provided"}
                            </Box>
                          </Flex>
                        </Card>
                      ))}
                    </Flex>
                  ) : (
                    <Card 
                      style={{ 
                        background: 'var(--color-surface)',
                        border: '1px solid var(--gray-6)',
                        borderRadius: '16px',
                        overflow: 'hidden'
                      }}
                    >
                      <Box style={{ overflowX: "auto" }}>
                        <Table.Root variant="surface">
                          <Table.Header>
                            <Table.Row style={{ background: 'var(--gray-2)' }}>
                              <Table.ColumnHeaderCell style={{ padding: '16px', fontWeight: '600' }}>
                                Date & Time
                              </Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell style={{ padding: '16px', fontWeight: '600' }}>
                                Technician
                              </Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell style={{ padding: '16px', fontWeight: '600' }}>
                                Maintenance Notes
                              </Table.ColumnHeaderCell>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {maintenanceRecords?.map((record, index) => (
                              <Table.Row 
                                key={record.name}
                                style={{ 
                                  borderBottom: index === maintenanceRecords.length - 1 ? 'none' : '1px solid var(--gray-5)'
                                }}
                              >
                                <Table.Cell style={{ padding: '20px', verticalAlign: 'top' }}>
                                  <Text 
                                    size="2" 
                                    weight="medium"
                                    style={{ 
                                      fontFamily: 'var(--font-mono)',
                                      color: 'var(--gray-12)'
                                    }}
                                  >
                                    {formatDate(record.modified)}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell style={{ padding: '20px', verticalAlign: 'top' }}>
                                  <Badge 
                                    variant="soft" 
                                    color="blue"
                                    style={{ fontWeight: '500' }}
                                  >
                                    {record.owner || record.user}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell style={{ padding: '20px', verticalAlign: 'top' }}>
                                  <Box 
                                    style={{ 
                                      background: 'var(--gray-2)',
                                      padding: '12px',
                                      borderRadius: '8px',
                                      border: '1px solid var(--gray-5)',
                                      whiteSpace: 'pre-line',
                                      fontSize: '14px',
                                      lineHeight: '1.5',
                                      color: 'var(--gray-11)'
                                    }}
                                  >
                                    {record.notes || "No notes provided"}
                                  </Box>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                    </Card>
                  )}
                </Card>
              </Tabs.Content>
            )}
          </Box>
        </Tabs.Root>
      </Box>

      <Dialog.Root open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <Dialog.Content 
          style={{ 
            maxWidth: window.innerWidth < 768 ? "95vw" : 500,
            margin: window.innerWidth < 768 ? "16px" : "auto",
            borderRadius: window.innerWidth < 768 ? '12px' : '16px',
            border: '1px solid var(--gray-6)',
            background: 'var(--color-surface)'
          }}
        >
          <Dialog.Title 
            style={{ 
              fontSize: window.innerWidth < 768 ? '16px' : '18px', 
              fontWeight: '600', 
              marginBottom: '8px' 
            }}
          >
            Reject Sensor
          </Dialog.Title>
          <Dialog.Description 
            size={{ initial: "2", sm: "3" }} 
            mb="6" 
            style={{ 
              color: 'var(--gray-11)',
              lineHeight: 1.5
            }}
          >
            Please provide a detailed reason for rejecting this sensor. This information will be logged for future reference.
          </Dialog.Description>

          <Flex direction="column" gap="4">
            <Box>
              <Text 
                as="div" 
                size={{ initial: "1", sm: "2" }}
                mb="2" 
                weight="bold"
                style={{ color: 'var(--gray-12)' }}
              >
                Rejection Reason *
              </Text>
              <TextArea
                placeholder="Enter detailed rejection reason (e.g., calibration issues, hardware defects, installation problems)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                size={{ initial: "2", sm: "3" }}
                style={{ 
                  minHeight: window.innerWidth < 768 ? '100px' : '120px',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-6)',
                  fontSize: window.innerWidth < 768 ? '14px' : '14px'
                }}
              />
            </Box>
          </Flex>

          <Flex 
            gap="3" 
            mt="6" 
            justify="end"
            direction={{ initial: "column", sm: "row" }}
          >
            <Dialog.Close>
              <Button 
                variant="soft" 
                color="gray"
                size={{ initial: "2", sm: "3" }}
                style={{ 
                  borderRadius: '8px', 
                  padding: '8px 16px',
                  width: window.innerWidth < 640 ? "100%" : "auto"
                }}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button 
              variant="solid" 
              color="red" 
              onClick={handleReject}
              disabled={!rejectReason.trim() || isUpdating || isNoting}
              size={{ initial: "2", sm: "3" }}
              style={{ 
                borderRadius: '8px', 
                padding: '8px 16px',
                width: window.innerWidth < 640 ? "100%" : "auto"
              }}
            >
              <FaTimes style={{ marginRight: '8px' }} /> 
              {isUpdating || isNoting ? 'Processing...' : 'Confirm Rejection'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <style>
        {`
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 767px) {
            button {
              min-height: 44px;
            }
            
            [data-radix-themes] {
              --space-3: 12px;
              --space-4: 16px;
            }

            input, textarea {
              font-size: 16px !important;
            }
          }
          
          @media (max-width: 479px) {
            [data-radix-themes] {
              --space-3: 8px;
              --space-4: 12px;
            }
          }

          @media (max-width: 768px) {
            .recharts-responsive-container {
              font-size: 10px;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default SensorPage;