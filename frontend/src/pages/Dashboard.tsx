import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Grid,
  Card,
  Text,
  Heading,
  Badge,
  Spinner,
  Button,
  IconButton,
} from "@radix-ui/themes";
import {
  FaBell,
  FaExclamationTriangle,
  FaServer,
  FaRegDotCircle as FaSensor,
  FaArrowRight,
  FaThermometerHalf,
  FaChartLine,
  FaDatabase,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaWrench,
  FaExpand,
  FaCompress,
  FaTh,
} from "react-icons/fa";
import { useFrappeAuth, useFrappeGetDocList } from "frappe-react-sdk";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

dayjs.extend(relativeTime);

interface DashboardSensor {
  name: string;
  sensor_name: string;
  sensor_id: string;
  sensor_type: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  gateway_location?: string;
  installation_date?: string;
  last_calibration?: string;
  // Add temperature range fields
  min_acceptable_temperature?: number;
  max_acceptable_temperature?: number;
  modified: string;
}

interface DashboardGateway {
  name: string;
  gateway_type: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  last_heartbeat?: string;
  location?: string;
  number_of_transmissions?: number;
  modified: string;
}

interface DashboardAlert {
  name: string;
  subject: string;
  creation: string;
  read: number;
  type: string;
  for_user: string;
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

interface DashboardStats {
  totalSensors: number;
  activeSensors: number;
  pendingSensors: number;
  maintenanceSensors: number;
  totalGateways: number;
  activeGateways: number;
  unreadAlerts: number;
}

// Helper function to determine temperature status
const getTemperatureStatus = (temperature: number, sensor: DashboardSensor) => {
  if (!sensor.max_acceptable_temperature) {
    return 'normal'; // No limits defined, show as normal
  }
  
  const maxTemp = sensor.max_acceptable_temperature ?? Infinity;
  
  if (temperature > maxTemp) {
    return 'danger'; // Outside acceptable range
  }
  
  return 'safe'; // Within acceptable range
};

// Helper function to get temperature colors based on status
const getTemperatureColors = (status: 'normal' | 'safe' | 'danger') => {
  switch (status) {
    case 'danger':
      return {
        background: 'var(--red-2)',
        border: 'var(--red-6)',
        text: '#dc2626', // Consistent red color
        icon: 'var(--red-9)',
        gradientId: 'dangerGradient'
      };
    case 'safe':
      return {
        background: 'var(--green-2)',
        border: 'var(--green-6)',
        text: '#16a34a', // Consistent green color
        icon: 'var(--green-9)',
        gradientId: 'safeGradient'
      };
    default: // normal
      return {
        background: 'var(--green-2)',
        border: 'var(--green-6)',
        text: '#16a34a',
        icon: 'var(--green-9)',
        gradientId: 'normalGradient'
      };
  }
};

const QuickActionsBar = ({ stats }: { stats: DashboardStats }) => {
  return (
    <Card 
      style={{ 
        borderRadius: '16px',
        border: '1px solid var(--gray-6)',
        background: 'var(--color-surface)',
        marginBottom: '24px',
        padding: '20px'
      }}
    >
      <Flex justify="between" align="center" mb="4">
        <Heading size="4" weight="medium">Quick Actions</Heading>
      </Flex>
      
      <Grid columns={{ initial: '2', sm: '4' }} gap="3">
        <motion.div whileHover={{ scale: 1.02 }}>
          <Button
            variant="soft"
            asChild
            style={{
              height: '72px', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '12px', 
              borderRadius: '12px',
              gap: '6px',
              width: '100%'
            }}
          >
            <Link to="/notifications">
              <FaBell size={18} />
              <Text size="2" weight="medium">View Alerts</Text>
            </Link>
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02 }}>
          <Button
            variant="soft"
            asChild
            style={{
              height: '72px', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '12px', 
              borderRadius: '12px',
              gap: '6px',
              width: '100%'
            }}
          >
            <Link to="/sensors">
              <FaThermometerHalf size={18} />
              <Text size="2" weight="medium">Manage Sensors</Text>
              {stats.pendingSensors > 0 && (
                <Badge color="blue" size="1">{stats.pendingSensors} pending</Badge>
              )}
            </Link>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }}>
          <Button
            variant="soft"
            asChild
            style={{
              height: '72px', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '12px', 
              borderRadius: '12px',
              gap: '6px',
              width: '100%'
            }}
          >
            <Link to="/history">
              <FaChartLine size={18} />
              <Text size="2" weight="medium">Data History</Text>
            </Link>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }}>
          <Button
            variant="soft"
            asChild
            style={{
              height: '72px', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '12px', 
              borderRadius: '12px',
              gap: '6px',
              width: '100%'
            }}
          >
            <Link to="/maintenance">
              <FaWrench size={18} />
              <Text size="2" weight="medium">Add Maintenance</Text>
              {stats.maintenanceSensors > 0 && (
                <Badge color="orange" size="1">{stats.maintenanceSensors} active</Badge>
              )}
            </Link>
          </Button>
        </motion.div>
      </Grid>
    </Card>
  );
};

const SensorCard = ({ 
  sensor, 
  onExpand,
  isCompact = false,
  isExpanded = false,
  refreshKey
}: { 
  sensor: DashboardSensor;
  onExpand: () => void;
  isCompact?: boolean;
  isExpanded?: boolean;
  refreshKey?: number;
}) => {
  // Get exactly 24 hours back from current time (not rounded to hour)
  const now = dayjs();
  const exactly24HoursAgo = now.subtract(24, 'hours');
  
  const apiFormattedDates = useMemo(() => ({
    startDate: exactly24HoursAgo.format('YYYY-MM-DD HH:mm:ss'),
    endDate: now.format('YYYY-MM-DD HH:mm:ss')
  }), [exactly24HoursAgo, now]);

  const { data: readings, isLoading: isLoadingReadings } = useFrappeGetDocList<SensorRead>(
    "Sensor Read",
    {
      fields: [
        "name",
        "sensor_id",
        "sensor_type",
        "temperature",
        "voltage",
        "signal_strength",
        "gateway_id",
        "timestamp",
      ],
      filters: [
        ["sensor_id", "=", sensor.sensor_id],
        ["timestamp", ">=", apiFormattedDates.startDate],
        ["timestamp", "<=", apiFormattedDates.endDate]
      ],
      orderBy: {
        field: "timestamp",
        order: "asc",
      },
      limit: 500,
    },
    `${sensor.sensor_id}-${isCompact ? 'compact' : 'detailed'}-24h-${refreshKey || 0}`,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const chartData = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    
    if (isCompact) {
      // For compact view: Group into 15-minute averages
      const grouped = new Map();
      
      readings.forEach(reading => {
        const timestamp = dayjs(reading.timestamp);
        // Round down to nearest 15-minute interval
        const roundedMinutes = Math.floor(timestamp.minute() / 15) * 15;
        const intervalStart = timestamp.minute(roundedMinutes).second(0).millisecond(0);
        const intervalKey = intervalStart.valueOf();
        
        if (!grouped.has(intervalKey)) {
          grouped.set(intervalKey, {
            readings: [],
            intervalStart: intervalStart
          });
        }
        
        grouped.get(intervalKey).readings.push(reading);
      });
      
      // Calculate averages for each 15-minute interval
      const averagedData = Array.from(grouped.values()).map(group => {
        const avgTemp = group.readings.reduce((sum, r) => sum + parseFloat(r.temperature), 0) / group.readings.length;
        const avgVoltage = group.readings.reduce((sum, r) => sum + parseFloat(r.voltage || "0"), 0) / group.readings.length;
        
        return {
          time: group.intervalStart.format('HH:mm'),
          temperature: avgTemp,
          voltage: avgVoltage,
          fullTime: group.intervalStart.format("MMM DD, YYYY HH:mm"),
          timestamp: group.intervalStart.toISOString(),
          readingCount: group.readings.length
        };
      }).sort((a, b) => {
        return dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf();
      });
      
      return averagedData;
    } else {
      // For detail view: Show all individual readings
      return readings.map(reading => {
        const timestamp = dayjs(reading.timestamp);
        
        return {
          time: timestamp.format('HH:mm'),
          temperature: parseFloat(reading.temperature),
          voltage: parseFloat(reading.voltage || "0"),
          fullTime: timestamp.format("MMM DD, YYYY HH:mm:ss"),
          timestamp: reading.timestamp,
          originalReading: reading
        };
      }).sort((a, b) => {
        return dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf();
      });
    }
  }, [readings, isCompact]);

  // Get the most recent temperature reading
  const mostRecentTemperature = useMemo(() => {
    if (!readings || readings.length === 0) return null;
    const sortedReadings = [...readings].sort((a, b) => 
      dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
    );
    return parseFloat(sortedReadings[0].temperature);
  }, [readings]);

  // Determine temperature status for most recent reading
  const tempStatus = mostRecentTemperature !== null ? getTemperatureStatus(mostRecentTemperature, sensor) : 'normal';
  // Use the latest temperature status for all chart colors (green if in range, red if out of range)
  const chartColorStatus = tempStatus === 'danger' ? 'danger' : 'safe';
  const tempColors = getTemperatureColors(chartColorStatus);

  const formatTemperature = (value: number) => `${value.toFixed(1)}°C`;
  
  const averageTemp = chartData.length > 0 
    ? chartData.reduce((sum, reading) => sum + reading.temperature, 0) / chartData.length
    : 0;

  const minTemp = chartData.length > 0 ? Math.min(...chartData.map(r => r.temperature)) : 0;
  const maxTemp = chartData.length > 0 ? Math.max(...chartData.map(r => r.temperature)) : 0;

  // Determine status for statistics
  const avgStatus = getTemperatureStatus(averageTemp, sensor);
  const minStatus = getTemperatureStatus(minTemp, sensor);
  const maxStatus = getTemperatureStatus(maxTemp, sensor);

  const chartHeight = isCompact ? 180 : 350;

  return (
    <Card 
      style={{ 
        borderRadius: '16px',
        border: tempStatus === 'danger' ? `2px solid ${tempColors.border}` : '1px solid var(--gray-6)',
        background: 'var(--color-surface)',
        overflow: 'hidden',
        height: '100%',
        cursor: !isExpanded ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onClick={!isExpanded ? onExpand : undefined}
    >
      {/* Temperature Alert Badge */}
      {tempStatus === 'danger' && mostRecentTemperature !== null && (
        <Box style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          padding: '4px 8px',
          background: 'var(--red-9)',
          color: 'white',
          borderRadius: '6px',
          fontSize: isCompact ? '10px' : '11px',
          fontWeight: 'bold',
          zIndex: 2,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          ALERT
        </Box>
      )}

      {/* Card Header */}
      <Box style={{ padding: isCompact ? '16px 16px 12px' : '24px 24px 16px' }}>
        <Flex justify="between" align="center" mb={isCompact ? "3" : "4"}>
          <Flex align="center" gap="3">
            <Box 
              style={{ 
                padding: '8px',
                borderRadius: '8px',
                background: tempColors.background,
                border: `1px solid ${tempColors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaThermometerHalf size={16} color={tempColors.icon} />
            </Box>
            <Box>
              <Text weight="bold" mr="2" size={isCompact ? "2" : "3"}>
                {sensor.sensor_name || sensor.sensor_id}
              </Text>
              <Text size="1" color="gray">
                {sensor.sensor_type} • Last 24 hours
              </Text>
            </Box>
          </Flex>
          
          {!isExpanded && isCompact && (
            <Box style={{ opacity: 0.6 }}>
              <FaExpand size={10} color="var(--gray-9)" />
            </Box>
          )}
        </Flex>

        {/* Enhanced Temperature Status Display - Mobile Responsive */}
        {!isCompact && (
          <Box style={{ marginBottom: '16px' }}>
            {/* Current Temperature - Mobile First Design */}
            <Card 
              style={{ 
                background: tempColors.background,
                border: `2px solid ${tempColors.border}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px'
              }}
            >
              <Flex justify="center" align="center">
                <Box style={{ textAlign: 'center' }}>
                  <Text size="2" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Current Temperature
                  </Text>
                  <Flex align="center" justify="center" gap="2" mt="1">
                    <Text size="6" weight="bold" style={{ color: tempColors.text }}>
                      {mostRecentTemperature !== null ? formatTemperature(mostRecentTemperature) : '--°C'}
                    </Text>
                    {tempStatus === 'danger' && (
                      <Badge color="red" size="2">
                        ALERT
                      </Badge>
                    )}
                    {tempStatus === 'safe' && (
                      <Badge color="green" size="2">
                        NORMAL
                      </Badge>
                    )}
                  </Flex>
                </Box>
              </Flex>
            </Card>

            {/* 24-Hour Summary Cards - Mobile Responsive Grid */}
            <Grid columns={{ initial: '1', xs: '3' }} gap="2">
              {/* Average Temperature */}
              <Card style={{ 
                background: getTemperatureColors(avgStatus === 'danger' ? 'danger' : 'safe').background, 
                border: `1px solid ${getTemperatureColors(avgStatus === 'danger' ? 'danger' : 'safe').border}`, 
                padding: '12px',
                position: 'relative',
                textAlign: 'center'
              }}>
                {avgStatus === 'danger' && (
                  <Box style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    padding: '2px 4px',
                    background: 'var(--red-9)',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    OUT
                  </Box>
                )}
                <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                  24h Avg
                </Text>
                <Text size="4" weight="bold" style={{ color: getTemperatureColors(avgStatus === 'danger' ? 'danger' : 'safe').text }}>
                  {formatTemperature(averageTemp)}
                </Text>
              </Card>

              {/* Minimum Temperature */}
              <Card style={{ 
                background: getTemperatureColors(minStatus === 'danger' ? 'danger' : 'safe').background, 
                border: `1px solid ${getTemperatureColors(minStatus === 'danger' ? 'danger' : 'safe').border}`, 
                padding: '12px',
                position: 'relative',
                textAlign: 'center'
              }}>
                {minStatus === 'danger' && (
                  <Box style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    padding: '2px 4px',
                    background: 'var(--red-9)',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    OUT
                  </Box>
                )}
                <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                  24h Min
                </Text>
                <Text size="4" weight="bold" style={{ color: getTemperatureColors(minStatus === 'danger' ? 'danger' : 'safe').text }}>
                  {formatTemperature(minTemp)}
                </Text>
              </Card>

              {/* Maximum Temperature */}
              <Card style={{ 
                background: getTemperatureColors(maxStatus === 'danger' ? 'danger' : 'safe').background, 
                border: `1px solid ${getTemperatureColors(maxStatus === 'danger' ? 'danger' : 'safe').border}`, 
                padding: '12px',
                position: 'relative',
                textAlign: 'center'
              }}>
                {maxStatus === 'danger' && (
                  <Box style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    padding: '2px 4px',
                    background: 'var(--red-9)',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    OUT
                  </Box>
                )}
                <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                  24h Max
                </Text>
                <Text size="4" weight="bold" style={{ color: getTemperatureColors(maxStatus === 'danger' ? 'danger' : 'safe').text }}>
                  {formatTemperature(maxTemp)}
                </Text>
              </Card>
            </Grid>
          </Box>
        )}
      </Box>

      {/* Chart Section */}
      <Box style={{ padding: isCompact ? '0 16px 16px' : '0 24px 24px' }}>
        {isLoadingReadings ? (
          <Flex justify="center" align="center" py="6">
            <Box style={{ textAlign: 'center' }}>
              <Spinner size="2" style={{ marginBottom: '8px' }} />
            </Box>
          </Flex>
        ) : chartData.length === 0 ? (
          <Card 
            style={{ 
              border: '1px dashed var(--gray-6)',
              borderRadius: '8px',
              background: 'var(--gray-2)',
              padding: isCompact ? '24px' : '48px',
              textAlign: 'center'
            }}
          >
            <Box style={{ opacity: 0.6, marginBottom: '8px' }}>
              <FaDatabase size={20} color="var(--gray-9)" />
            </Box>
            <Text size="2" color="gray" weight="medium">
              No data available in last 24 hours
            </Text>
          </Card>
        ) : (
          <>
            {/* Chart */}
            <Card 
              style={{ 
                background: 'var(--color-surface)',
                border: `1px solid ${tempColors.border}`,
                borderRadius: '8px',
                padding: isCompact ? '8px' : '16px'
              }}
            >
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`${tempColors.gradientId}-${sensor.sensor_id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tempColors.icon} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={tempColors.icon} stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: 'var(--gray-9)', fontSize: isCompact ? 8 : 10 }}
                    tickMargin={4}
                    axisLine={{ stroke: 'var(--gray-6)' }}
                    angle={isCompact ? -45 : -45}
                    textAnchor="end"
                    height={isCompact ? 35 : 60}
                    interval={isCompact ? Math.floor(chartData.length / 8) : Math.floor(chartData.length / 12)}
                  />
                  <YAxis 
                    domain={["dataMin - 1", "dataMax + 1"]} 
                    tickFormatter={isCompact ? (value) => `${value.toFixed(0)}°` : formatTemperature}
                    tick={{ fill: 'var(--gray-9)', fontSize: isCompact ? 8 : 11 }}
                    axisLine={{ stroke: 'var(--gray-6)' }}
                    width={isCompact ? 35 : 50}
                  />
                  <CartesianGrid stroke="var(--gray-5)" strokeDasharray="2 2" opacity={isCompact ? 0.3 : 1} />
                  {!isCompact && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--gray-6)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name) => {
                        if (name === "temperature") {
                          return [formatTemperature(value), "Temperature"];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const dataPoint = chartData.find(d => d.time === label);
                        return dataPoint ? dataPoint.fullTime : `Time: ${label}`;
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    stroke={tempColors.icon}
                    strokeWidth={isCompact ? 1.5 : 2}
                    fill={`url(#${tempColors.gradientId}-${sensor.sensor_id})`}
                    dot={false}
                    activeDot={!isCompact ? { 
                      r: 4, 
                      strokeWidth: 2, 
                      fill: tempColors.icon,
                      stroke: 'var(--color-surface)'
                    } : false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Compact stats for grid view with temperature validation */}
            {isCompact && (
              <Flex justify="between" align="center" mt="2">
                <Text size="1" color="gray">
                  <span>{formatTemperature(averageTemp)} avg</span>
                </Text>
                <Flex align="center" gap="2">
                  {mostRecentTemperature !== null && (
                    <Text size="2" weight="bold" style={{ color: getTemperatureColors(tempStatus).text }}>
                      Latest: {formatTemperature(mostRecentTemperature)}
                    </Text>
                  )}
                  {tempStatus === 'danger' && (
                    <Badge color="red" size="1" style={{ fontSize: '9px' }}>
                      ALERT
                    </Badge>
                  )}
                </Flex>
              </Flex>
            )}

            {/* Data Summary for full view */}
            {!isCompact && (
              <Flex justify="between" align="center" mt="3" pt="3">
                <Button variant="ghost" size="2" asChild>
                  <Link to={`/sensors/${sensor.name}`}>
                    <FaEye style={{ marginRight: '6px' }} />
                    View Details
                  </Link>
                </Button>
              </Flex>
            )}
          </>
        )}
      </Box>
    </Card>
  );
};

const SensorsGrid = ({ 
  sensors,
  onSensorExpand,
  refreshKey
}: { 
  sensors: DashboardSensor[];
  onSensorExpand: (sensor: DashboardSensor) => void;
  refreshKey: number;
}) => {
  if (!sensors.length) {
    return (
      <Card>
        <Flex justify="center" align="center" py="8">
          <Text color="gray">No sensors available</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Heading size="4" weight="medium">Recent Sensor Data</Heading>
      </Flex>
      
      <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
        {sensors.map((sensor, index) => (
          <motion.div
            key={sensor.sensor_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <SensorCard
              sensor={sensor}
              onExpand={() => onSensorExpand(sensor)}
              isCompact={true}
              refreshKey={refreshKey}
            />
          </motion.div>
        ))}
      </Grid>
    </Box>
  );
};

const SensorDetailView = ({ 
  sensor,
  onBack,
  refreshKey
}: { 
  sensor: DashboardSensor;
  onBack: () => void;
  refreshKey: number;
}) => {
  return (
    <Box>
      {/* Enhanced Back Button */}
      <Button 
        variant="solid" 
        size="3"
        onClick={onBack}
        style={{
          marginBottom: '24px',
          background: 'var(--blue-9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: 'none'
        }}
      >
        <FaChevronLeft style={{ marginRight: '8px' }} />
        Back to Grid View
      </Button>
      
      <SensorCard
        sensor={sensor}
        onExpand={() => {}} // No expand action in detail view
        isCompact={false}
        isExpanded={true}
        refreshKey={refreshKey}
      />
    </Box>
  );
};

const Dashboard = () => {
  const { currentUser } = useFrappeAuth();
  const [expandedSensor, setExpandedSensor] = useState<DashboardSensor | null>(null);
  
  // Auto-refresh state and logic (enabled by default)
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to trigger refresh
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Auto-refresh effect (always enabled)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      triggerRefresh();
    }, 180000); // 3 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [triggerRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const { data: sensors, isLoading: isLoadingSensors } = useFrappeGetDocList<DashboardSensor>(
    "Sensor",
    {
      fields: [
        "name", 
        "sensor_name", 
        "sensor_id", 
        "sensor_type", 
        "status", 
        "approval_status",
        "gateway_location",
        "installation_date",
        "last_calibration",
        "max_acceptable_temperature",
        "min_acceptable_temperature",
        "modified"
      ],
      limit: 50,
      orderBy: {
        field: "modified",
        order: "desc"
      }
    },
    `sensors-${refreshKey}`,
    {
      revalidateOnFocus: false,
    }
  );

  const { data: gateways, isLoading: isLoadingGateways } = useFrappeGetDocList<DashboardGateway>(
    "Sensor Gateway",
    {
      fields: [
        "name", 
        "gateway_type", 
        "status", 
        "approval_status",
        "last_heartbeat",
        "location",
        "number_of_transmissions",
        "modified"
      ],
      limit: 50,
      orderBy: {
        field: "modified",
        order: "desc"
      }
    },
    `gateways-${refreshKey}`,
    {
      revalidateOnFocus: false,
    }
  );

  const { data: alerts, isLoading: isLoadingAlerts } = useFrappeGetDocList<DashboardAlert>(
    "Notification Log",
    {
      fields: ["name", "subject", "creation", "read", "type", "for_user"],
      filters: [
        ["for_user", "=", currentUser],
        ["type", "=", "Alert"]
      ],
      limit: 10000,
      orderBy: {
        field: "creation",
        order: "desc"
      }
    },
    currentUser ? `alerts-${currentUser}-${refreshKey}` : null, // Only fetch when currentUser exists
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Add effect to trigger refresh when currentUser becomes available
  useEffect(() => {
    // When currentUser becomes available, trigger a refresh
    if (currentUser && !alerts) {
      triggerRefresh();
    }
  }, [currentUser, alerts, triggerRefresh]);

  const actualSensors = sensors || [];
  const actualGateways = gateways || [];
  const actualAlerts = alerts || [];

  // Get the 6 most recent sensors for the grid
  const recentSensors = useMemo(() => {
    return actualSensors.slice(0, 6);
  }, [actualSensors]);

  // Get the 5 most recent alerts for display
  const recentAlertsForDisplay = useMemo(() => {
    return actualAlerts.slice(0, 5);
  }, [actualAlerts]);

  // Calculate statistics from available data
  const stats = useMemo((): DashboardStats => {
    const activeSensors = actualSensors.filter(s => s.status === "Active").length;
    const pendingSensors = actualSensors.filter(s => s.approval_status === "Pending").length;
    const maintenanceSensors = actualSensors.filter(s => s.status === "Maintenance").length;
    const activeGateways = actualGateways.filter(g => g.status === "Active").length;
    const unreadAlerts = actualAlerts.filter(a => !a.read).length;

    return {
      totalSensors: actualSensors.length,
      activeSensors,
      pendingSensors,
      maintenanceSensors,
      totalGateways: actualGateways.length,
      activeGateways,
      unreadAlerts,
    };
  }, [actualSensors, actualGateways, actualAlerts]);

  const handleSensorExpand = useCallback((sensor: DashboardSensor) => {
    setExpandedSensor(sensor);
  }, []);

  const handleBackToGrid = useCallback(() => {
    setExpandedSensor(null);
  }, []);

  const isLoading = isLoadingSensors || isLoadingGateways || (isLoadingAlerts && currentUser);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" className="h-[80vh]">
        <Box style={{ textAlign: 'center' }}>
          <Spinner size="3" style={{ marginBottom: '16px' }} />
        </Box>
      </Flex>
    );
  }

  return (
    <Box className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Enhanced Status Overview Cards */}
      <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4" mb="6">
        {/* Sensors Overview */}
        <motion.div whileHover={{ y: -2 }}>
          <Card size="3" style={{ height: '120px' }}>
            <Flex gap="4" align="center" height="100%">
              <div className="p-3 rounded-full bg-blue-100">
                <FaSensor className="text-blue-600 text-xl" />
              </div>
              <Flex direction="column" gap="1">
                <Text size="2" color="gray">Active Sensors</Text>
                <Heading size="6">{stats.activeSensors}/{stats.totalSensors}</Heading>
                <Flex gap="2" align="center">
                  {stats.pendingSensors > 0 && (
                    <Badge color="blue" size="1">{stats.pendingSensors} pending</Badge>
                  )}
                  {stats.maintenanceSensors > 0 && (
                    <Badge color="orange" size="1">{stats.maintenanceSensors} maintenance</Badge>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Card>
        </motion.div>

        {/* Gateways Overview */}
        <motion.div whileHover={{ y: -2 }}>
          <Card size="3" style={{ height: '120px' }}>
            <Flex gap="4" align="center" height="100%">
              <div className="p-3 rounded-full bg-green-100">
                <FaServer className="text-green-600 text-xl" />
              </div>
              <Flex direction="column" gap="1">
                <Text size="2" color="gray">Online Gateways</Text>
                <Heading size="6">{stats.activeGateways}/{stats.totalGateways}</Heading>
              </Flex>
            </Flex>
          </Card>
        </motion.div>

        {/* Alerts Overview */}
        <motion.div whileHover={{ y: -2 }}>
          <Card size="3" style={{ height: '120px' }}>
            <Flex gap="4" align="center" height="100%">
              <div className="p-3 rounded-full bg-red-100">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
              <Flex direction="column" gap="1">
                <Text size="2" color="gray">Unread Alerts</Text>
                <Heading size="6">{stats.unreadAlerts}</Heading>
              </Flex>
            </Flex>
          </Card>
        </motion.div>
      </Grid>

      {/* Quick Actions Bar */}
      <QuickActionsBar stats={stats} />

      {/* Sensor Data - Grid or Detail View */}
      <Box mb="6">
        <AnimatePresence mode="wait">
          {expandedSensor ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <SensorDetailView
                sensor={expandedSensor}
                onBack={handleBackToGrid}
                refreshKey={refreshKey}
              />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <SensorsGrid
                sensors={recentSensors}
                onSensorExpand={handleSensorExpand}
                refreshKey={refreshKey}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Recent Alerts - Only show in grid view */}
      {!expandedSensor && (
        <Card>
          <Flex justify="between" align="center" mb="4">
            <Flex align="center" gap="2">
              <Heading size="5">Recent Alerts</Heading>
              {stats.unreadAlerts > 0 && (
                <Badge color="red" size="2">
                  {stats.unreadAlerts} unread
                </Badge>
              )}
            </Flex>
            {actualAlerts.length > 5 ? (
              <Button variant="ghost" asChild>
                <Link to="/notifications">
                  View All ({actualAlerts.length}) <FaArrowRight className="ml-2" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" asChild>
                <Link to="/notifications">
                  View All <FaArrowRight className="ml-2" />
                </Link>
              </Button>
            )}
          </Flex>

          <Flex direction="column" gap="3">
            {recentAlertsForDisplay?.length ? (
              recentAlertsForDisplay.map(alert => (
                <motion.div key={alert.name} whileHover={{ x: 2 }}>
                  <Card className={`${!alert.read ? 'border-l-4 border-red-500' : ''}`}>
                    <Flex direction="column" gap="2">
                      <Flex justify="between" align="start">
                        <Text weight="bold" style={{ flex: 1 }}>
                          {alert.subject}
                        </Text>
                        {!alert.read && <Badge color="red" size="1">New</Badge>}
                      </Flex>
                      <Flex justify="between" align="center">
                        <Text size="2" color="gray">
                          {dayjs(alert.creation).format("MMM D, YYYY HH:mm")}
                        </Text>
                        <Text size="1" color="gray">
                          {dayjs(alert.creation).fromNow()}
                        </Text>
                      </Flex>
                    </Flex>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <Flex justify="center" align="center" py="4">
                  <Text color="gray">No recent alerts</Text>
                </Flex>
              </Card>
            )}
            
            {/* Show "more alerts" indicator if there are more than 5 */}
            {actualAlerts.length > 5 && (
              <Card style={{ border: '1px dashed var(--gray-6)', background: 'var(--gray-2)' }}>
                <Flex justify="center" align="center" py="3">
                  <Button variant="ghost" asChild>
                    <Link to="/notifications">
                      <Text size="2" color="gray">
                        + {actualAlerts.length - 5} more alerts
                      </Text>
                    </Link>
                  </Button>
                </Flex>
              </Card>
            )}
          </Flex>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard;