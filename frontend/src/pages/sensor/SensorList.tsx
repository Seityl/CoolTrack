import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Flex, Text, Card, Heading, Button, Badge, Grid, Spinner } from "@radix-ui/themes";
import {
  FaThermometerHalf,
  FaBatteryEmpty,
  FaPauseCircle,
  FaPlug,
  FaSyncAlt,
  FaCheck,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

interface Sensor {
  name: string;
  sensor_name: string;
  sensor_id: string;
  sensor_type: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  gateway_id?: string;
  gateway_location?: string;
  // Add temperature range fields
  min_acceptable_temperature?: number;
  max_acceptable_temperature?: number;
}

interface SensorRead {
  name: string;
  sensor_id: string;
  temperature: string;
  voltage?: string;
  signal_strength?: string;
  timestamp: string;
}

const Toast = ({ message, type, onClose }: { 
  message: string; 
  type: 'success' | 'error';
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: type === 'success' ? 'var(--green-9)' : 'var(--red-9)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '300px',
        animation: 'slideIn 0.3s ease-out',
      }}>
        {type === 'success' ? (
          <FaCheck size={16} />
        ) : (
          <FaExclamationTriangle size={16} />
        )}
        <Text size="2">{message}</Text>
      </div>
    </>
  );
};

// Helper function to determine temperature status
const getTemperatureStatus = (temperature: number, sensor: Sensor) => {
  if (!sensor.min_acceptable_temperature && !sensor.max_acceptable_temperature) {
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
        text: 'var(--red-11)',
        icon: 'var(--red-9)',
        tempText: 'var(--red-11)',
        tempBg: 'var(--red-3)'
      };
    case 'safe':
      return {
        background: 'var(--green-2)',
        border: 'var(--green-6)',
        text: 'var(--green-11)',
        icon: 'var(--green-9)',
        tempText: 'var(--green-11)',
        tempBg: 'var(--green-3)'
      };
    default: // normal
      return {
        background: 'var(--blue-2)',
        border: 'var(--blue-6)',
        text: 'var(--blue-11)',
        icon: 'var(--blue-9)',
        tempText: 'var(--blue-11)',
        tempBg: 'var(--blue-3)'
      };
  }
};

const statusIconMap: Record<string, React.ReactNode> = {
  Active: <FaPlug size={window.innerWidth < 768 ? 12 : 14} color="#10B981" />,
  Inactive: <FaBatteryEmpty size={window.innerWidth < 768 ? 12 : 14} color="#6B7280" />,
  Maintenance: <FaPauseCircle size={window.innerWidth < 768 ? 12 : 14} color="#F59E0B" />,
  Decommissioned: <FaBatteryEmpty size={window.innerWidth < 768 ? 12 : 14} color="#EF4444" />,
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

const SensorList: React.FC = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  } | null>(null);

  // Auto-refresh state and logic
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to trigger refresh
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Auto-refresh effect (3 minutes)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      triggerRefresh();
    }, 60000); // 3 minutes

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

  const { data: sensors, isLoading, error, mutate } = useFrappeGetDocList<Sensor>(
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
        "gateway_id",
        "min_acceptable_temperature",
        "max_acceptable_temperature"
      ],
    },
    `sensors-list-${refreshKey}`, // Include refreshKey in cache key
    {
      revalidateOnFocus: false,
    }
  );

  // Fetch last readings for all sensors
  const { data: lastReadings } = useFrappeGetDocList<SensorRead>(
    "Sensor Read",
    {
      fields: ["name", "sensor_id", "temperature", "voltage", "signal_strength", "timestamp"],
      orderBy: {
        field: "timestamp",
        order: "desc",
      },
      limit: 1000, // Get more readings to ensure we have the latest for each sensor
    },
    `sensor-readings-${refreshKey}`, // Include refreshKey in cache key
    {
      revalidateOnFocus: false,
    }
  );

  // Create a map of sensor_id to last reading
  const lastReadingMap = React.useMemo(() => {
    if (!lastReadings) return {};
    
    const map: Record<string, SensorRead> = {};
    lastReadings.forEach(reading => {
      if (!map[reading.sensor_id] || dayjs(reading.timestamp).isAfter(dayjs(map[reading.sensor_id].timestamp))) {
        map[reading.sensor_id] = reading;
      }
    });
    return map;
  }, [lastReadings]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
      triggerRefresh(); // Also trigger auto-refresh
      showToast("Sensors refreshed successfully", "success");
    } catch (error) {
      console.error("Error refreshing sensors:", error);
      showToast("Failed to refresh sensors", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No data";
    return dayjs(dateString).format(window.innerWidth < 768 ? "MMM DD HH:mm" : "MMM DD, HH:mm");
  };

  const formatTemperature = (temp?: string) => {
    if (!temp) return "—";
    const num = parseFloat(temp);
    return isNaN(num) ? "—" : `${num.toFixed(1)}°C`;
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "No data";
    const now = dayjs();
    const readingTime = dayjs(dateString);
    const diffMinutes = now.diff(readingTime, 'minute');
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = now.diff(readingTime, 'hour');
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = now.diff(readingTime, 'day');
    return `${diffDays}d ago`;
  };

  const renderSensorList = (): React.ReactNode => {
    if (!sensors || sensors.length === 0) {
      return (
        <Card 
          style={{ 
            background: 'var(--gray-2)',
            border: '1px dashed var(--gray-6)',
            boxShadow: 'none',
            borderRadius: window.innerWidth < 768 ? '8px' : '12px'
          }}
        >
          <Flex 
            direction="column" 
            align="center" 
            gap="3" 
            p={{ initial: "4", sm: "6" }}
          >
            <Box style={{ opacity: 0.6 }}>
              <FaThermometerHalf 
                size={window.innerWidth < 768 ? 24 : 32} 
                color="var(--gray-9)" 
              />
            </Box>
            <Text 
              color="gray" 
              size={{ initial: "2", sm: "3" }} 
              weight="medium"
              style={{ textAlign: "center" }}
            >
              No sensors found
            </Text>
            <Button 
              variant="soft" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              size={{ initial: "2", sm: "3" }}
              style={{ 
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Flex align="center" gap="2">
                <FaSyncAlt 
                  size={window.innerWidth < 768 ? 12 : 14} 
                  className={isRefreshing ? "animate-spin" : ""} 
                />
                {window.innerWidth >= 768 && "Refresh"}
              </Flex>
            </Button>
          </Flex>
        </Card>
      );
    }

    return (
      <Grid 
        columns={{ initial: '1', sm: '2', md: '3', lg: '4' }} 
        gap={{ initial: "3", sm: "4" }} 
      >
        {sensors.map(sensor => {
          const lastReading = lastReadingMap[sensor.name];
          const temperature = lastReading ? parseFloat(lastReading.temperature) : null;
          const tempStatus = temperature !== null ? getTemperatureStatus(temperature, sensor) : 'normal';
          const tempColors = getTemperatureColors(tempStatus);
          
          return (
            <Card
              key={sensor.name}
              style={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                borderLeft: `4px solid var(--${statusColorMap[sensor.status]}-9)`,
                borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                background: 'var(--color-surface)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="hover:shadow-lg hover:translate-y-[-2px] hover:border-opacity-80"
              onClick={() => navigate(`/sensors/${sensor.name}`)}
              onMouseEnter={(e) => {
                if (window.innerWidth >= 768) {
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (window.innerWidth >= 768) {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              <Flex 
                direction="column" 
                gap="3" 
                p={{ initial: "3", sm: "4" }}
              >
                {/* Header */}
                <Flex justify="between" align="start" gap="2">
                  <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1 }}>
                    <Heading 
                      size={{ initial: "2", sm: "3" }} 
                      style={{ 
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: window.innerWidth < 768 ? '14px' : '16px',
                        lineHeight: 1.2
                      }}
                      title={sensor.sensor_name || `ID: ${sensor.sensor_id}`}
                    >
                      {sensor.sensor_name || `ID: ${sensor.sensor_id}`}
                    </Heading>
                    <Text 
                      size="1" 
                      color="gray" 
                      style={{ 
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: window.innerWidth < 768 ? '10px' : '11px'
                      }}
                    >
                      ID: {sensor.name}
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="1" align="end">
                    <Badge 
                      color={statusColorMap[sensor.status]}
                      variant="soft"
                      size="1"
                      style={{ 
                        fontSize: window.innerWidth < 768 ? '9px' : '10px',
                        padding: '2px 6px'
                      }}
                    >
                      <Flex gap="1" align="center">
                        {statusIconMap[sensor.status]}
                        {sensor.status}
                      </Flex>
                    </Badge>
                  </Flex>
                </Flex>

                {/* PROMINENT TEMPERATURE DISPLAY */}
                <Box 
                  style={{ 
                    background: tempColors.background,
                    padding: window.innerWidth < 768 ? '16px 12px' : '20px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${tempColors.border}`,
                    position: 'relative',
                    textAlign: 'center'
                  }}
                >
                  {/* Temperature out of range indicator */}
                  {tempStatus === 'danger' && lastReading && (
                    <Box style={{
                      position: 'absolute',
                      top: '-1px',
                      right: '-1px',
                      padding: '2px 6px',
                      background: 'var(--red-9)',
                      color: 'white',
                      borderRadius: '0 6px 0 6px',
                      fontSize: window.innerWidth < 768 ? '8px' : '9px',
                      fontWeight: 'bold',
                      lineHeight: 1,
                      zIndex: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      ALERT
                    </Box>
                  )}
                  
                  <Flex direction="column" align="center" gap="2">
                    {/* Large Temperature Display */}
                    <Flex align="center" justify="center" gap="2">
                      <FaThermometerHalf 
                        size={window.innerWidth < 768 ? 16 : 20} 
                        color={tempColors.icon}
                      />
                      <Text 
                        size={{ initial: "6", sm: "7" }}
                        weight="bold"
                        style={{ 
                          color: tempColors.tempText,
                          fontSize: window.innerWidth < 768 ? '24px' : '32px',
                          lineHeight: 1,
                          fontFamily: 'var(--font-mono, monospace)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                      >
                        {formatTemperature(lastReading?.temperature)}
                      </Text>
                    </Flex>
                    
                    {/* Time indicator */}
                    <Flex align="center" justify="center" gap="1">
                      <FaClock 
                        size={window.innerWidth < 768 ? 10 : 12} 
                        color={lastReading ? tempColors.icon : 'var(--gray-8)'}
                      />
                      <Text 
                        size="2" 
                        weight="medium"
                        style={{ 
                          color: tempColors.text,
                          fontSize: window.innerWidth < 768 ? '11px' : '13px',
                          fontFamily: 'var(--font-mono, monospace)'
                        }}
                      >
                        {getTimeAgo(lastReading?.timestamp)}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              </Flex>
            </Card>
          );
        })}
      </Grid>
    );
  };

  return (
    <Box style={{ background: "var(--gray-1)" }}>
      {toast?.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}

      {/* Header */}
      <Box 
        style={{ 
          background: "white", 
          borderBottom: "1px solid var(--gray-6)",
          top: 0,
          zIndex: 10
        }}
      >
        <Flex 
          justify="between" 
          align="center" 
          p={{ initial: "4", sm: "6" }}
          gap="3"
        >
          <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
            <FaThermometerHalf 
              size={window.innerWidth < 768 ? 20 : 24} 
              color="var(--blue-9)" 
            />
            <Heading 
              size={{ initial: "4", sm: "6" }} 
              weight="bold"
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              Sensors
            </Heading>
            {/* Show total count */}
            {sensors && sensors.length > 0 && (
              <Badge 
                variant="soft" 
                color="blue"
                size="2"
                style={{ 
                  fontSize: window.innerWidth < 768 ? '11px' : '12px'
                }}
              >
                {sensors.length} Total
              </Badge>
            )}
          </Flex>
          <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
                  <Button 
                      variant="soft" 
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      size={{ initial: "2", sm: "3" }}
                      style={{
                          flexShrink: 0,
                          fontSize: window.innerWidth < 768 ? "12px" : "14px"
                      }}
                  >
                      <FaSyncAlt 
                          className={isRefreshing ? "animate-spin" : ""}
                          size={window.innerWidth < 768 ? 12 : 14}
                      />
                      <span style={{ display: window.innerWidth < 480 ? "none" : "inline" }}>
                          Refresh
                      </span>
                  </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Content */}
      <Box p={{ initial: "3", sm: "4", md: "6" }}>
        {isLoading && (
        <Card 
          style={{ 
            border: '1px solid var(--gray-6)', 
            borderRadius: window.innerWidth < 768 ? '8px' : '12px'
          }}
        >
          <Flex 
            justify="center" 
            align="center" 
            p={{ initial: "6", sm: "8" }} 
            gap="3"
          >
            <Spinner size="3" />
          </Flex>
        </Card>
      )}

      {error && (
        <Card 
          variant="surface" 
          mt="4"
          style={{ 
            border: '1px solid var(--red-6)',
            borderRadius: window.innerWidth < 768 ? '8px' : '12px',
            background: 'var(--red-2)'
          }}
        >
          <Flex 
            direction="column" 
            align="center" 
            gap="3" 
            p={{ initial: "4", sm: "6" }}
          >
            <Box style={{ opacity: 0.8 }}>
              <FaBatteryEmpty 
                size={window.innerWidth < 768 ? 20 : 24} 
                color="var(--red-9)" 
              />
            </Box>
            <Text 
              color="red" 
              weight="bold" 
              size={{ initial: "2", sm: "3" }}
              style={{ textAlign: "center" }}
            >
              Failed to load sensors
            </Text>
            <Text 
              color="red" 
              size={{ initial: "1", sm: "2" }} 
              style={{ 
                textAlign: 'center', 
                maxWidth: '300px',
                lineHeight: 1.5
              }}
            >
              {error.message}
            </Text>
            <Button 
              variant="soft" 
              color="red" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              size={{ initial: "2", sm: "3" }}
              style={{ borderRadius: '8px' }}
            >
              <Flex align="center" gap="2">
                <FaSyncAlt 
                  size={window.innerWidth < 768 ? 12 : 14} 
                  className={isRefreshing ? "animate-spin" : ""} 
                />
                {window.innerWidth >= 768 && "Retry"}
              </Flex>
            </Button>
          </Flex>
        </Card>
      )}

              {!isLoading && !error && renderSensorList()}
      </Box>

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

          /* Mobile-specific optimizations */
          @media (max-width: 767px) {
            /* Ensure proper touch targets */
            button {
              min-height: 44px;
            }
            
            /* Optimize spacing for mobile */
            [data-radix-themes] {
              --space-3: 12px;
              --space-4: 16px;
            }

            /* Card hover effects only on desktop */
            .hover\\:shadow-lg:hover {
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1) !important;
              transform: none !important;
            }
          }
          
          @media (max-width: 479px) {
            /* Extra small screens */
            [data-radix-themes] {
              --space-3: 8px;
              --space-4: 12px;
            }
          }

          @media (max-width: 380px) {
            /* Very small screens - additional optimizations */
            .sensor-card {
              padding: 8px !important;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default SensorList;