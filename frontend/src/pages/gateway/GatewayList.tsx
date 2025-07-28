import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Card, Heading, Button, Badge, Grid } from "@radix-ui/themes";
import {
  FaProjectDiagram,
  FaBatteryEmpty,
  FaPauseCircle,
  FaPlug,
  FaSync,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface SensorGateway {
  name: string;
  location: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  last_heartbeat?: string;
  number_of_transmissions?: number;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  } | null>(null);

  const { data: gateways, isLoading, error, mutate } = useFrappeGetDocList<SensorGateway>(
    "Sensor Gateway",
    {
      fields: ["name", "location", "status", "number_of_transmissions", "last_heartbeat", "approval_status"],
    }
  );

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
      showToast("Gateways refreshed successfully", "success");
    } catch (error) {
      console.error("Error refreshing gateways:", error);
      showToast("Failed to refresh gateways", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderGatewayList = (): React.ReactNode => {
    if (!gateways || gateways.length === 0) {
      return (
        <Card 
          mt="4" 
          style={{ 
            background: 'var(--gray-2)',
            border: '1px dashed var(--gray-6)',
            boxShadow: 'none'
          }}
        >
          <Flex direction="column" align="center" gap="3" py="6">
            <Box style={{ opacity: 0.6 }}>
              <FaProjectDiagram size={32} color="var(--gray-9)" />
            </Box>
            <Text color="gray" size="3" weight="medium">
              No gateways found
            </Text>
            <Button 
              variant="soft" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ 
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Flex align="center" gap="2">
                <FaSync size={14} className={isRefreshing ? "animate-spin" : ""} />
                Refresh
              </Flex>
            </Button>
          </Flex>
        </Card>
      );
    }

    return (
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4" mt="4">
        {gateways.map((gateway) => (
          <Card 
            key={gateway.name}
            style={{ 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              borderLeft: `4px solid var(--${statusColorMap[gateway.status]}-9)`,
              borderRadius: '12px',
              background: 'var(--color-surface)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="hover:shadow-lg hover:translate-y-[-4px] hover:border-opacity-80"
            onClick={() => navigate(`/settings/gateways/${gateway.name}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Subtle gradient overlay */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                opacity: 0.8
              }}
            />
            
            <Flex direction="column" gap="3" p="1">
              <Flex justify="between" align="center">
                <Flex align="center" gap="3">
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
                     <FaProjectDiagram size={18} color="var(--gray-11)" />
                  </Box>
                  <Box>
                    <Text size="1" color="gray" weight="medium" style={{ letterSpacing: '0.5px' }}>
                      GATEWAY
                    </Text>
                    <Heading size="3" style={{ marginTop: '2px' }}>
                      {gateway.location}
                    </Heading>
                  </Box>
                </Flex>
                <Badge 
                  color={approvalColorMap[gateway.approval_status]} 
                  variant="soft"
                  style={{ 
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '500',
                    letterSpacing: '0.3px'
                  }}
                >
                  {gateway.approval_status}
                </Badge>
              </Flex>

              <Box 
                style={{ 
                  height: '1px',
                  background: 'var(--gray-5)',
                  margin: '4px 0'
                }}
              />

              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Text size="2" color="gray" weight="medium">Status</Text>
                  <Flex align="center" gap="2">
                    <Text 
                      size="2" 
                      weight="medium"
                      style={{ 
                        color: `var(--${statusColorMap[gateway.status]}-11)`,
                        textTransform: 'capitalize'
                      }}
                    >
                      {gateway.status}
                    </Text>
                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                      {statusIconMap[gateway.status]}
                    </Box>
                  </Flex>
                </Flex>

                <Flex align="center" justify="between">
                  <Text size="2" color="gray" weight="medium">Transmissions</Text>
                  <Box 
                    style={{ 
                      background: 'var(--gray-3)',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}
                  >
                    <Text size="2" weight="bold">
                      {gateway.number_of_transmissions?.toLocaleString() ?? "N/A"}
                    </Text>
                  </Box>
                </Flex>

                <Flex direction="column" gap="1">
                  <Text size="2" color="gray" weight="medium">Last Heartbeat</Text>
                  <Text 
                    size="2" 
                    weight="medium"
                    style={{ 
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '11px',
                      background: gateway.last_heartbeat ? 'var(--green-2)' : 'var(--gray-3)',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      color: gateway.last_heartbeat ? 'var(--green-11)' : 'var(--gray-11)'
                    }}
                  >
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
    <Box 
      p={{ initial: "3", sm: "4", md: "6" }} 
      style={{ 
        background: 'var(--gray-1)',
      }}
    >
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
          zIndex: 10,
          margin: window.innerWidth < 768 ? "-12px -12px 16px" : "-24px -24px 20px",
          padding: window.innerWidth < 768 ? "16px" : "24px",
          borderRadius: window.innerWidth < 768 ? "0" : "0 0 12px 12px"
        }}
      >
        <Flex 
          justify="between" 
          align="center"
          gap="3"
        >
          <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
            <FaProjectDiagram 
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
              Gateways
            </Heading>
            {/* Show total count */}
            {gateways && gateways.length > 0 && (
              <Badge 
                variant="soft" 
                color="blue"
                size="2"
                style={{ 
                  fontSize: window.innerWidth < 768 ? '11px' : '12px'
                }}
              >
                {gateways.length} Total
              </Badge>
            )}
          </Flex>
          <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
            <Button
              variant="soft"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              size={{ initial: "1", sm: "2" }}
              style={{ 
                borderRadius: '8px',
                fontSize: window.innerWidth < 768 ? "11px" : "14px"
              }}
            >
              <Flex align="center" gap="2">
                <FaSync 
                  className={(isLoading || isRefreshing) ? "animate-spin" : ""}
                  size={window.innerWidth < 768 ? 10 : 12}
                />
                <span style={{ display: window.innerWidth < 380 ? "none" : "inline" }}>
                  Refresh
                </span>
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </Box>

      {isLoading && (
        <Card style={{ border: '1px solid var(--gray-6)', borderRadius: '12px' }}>
          <Flex justify="center" align="center" py="8" gap="3">
            <FiRefreshCw 
              className="animate-spin" 
              size={20} 
              color="var(--blue-9)"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <Text size="3" weight="medium" color="gray">
              Loading gateways...
            </Text>
          </Flex>
        </Card>
      )}

      {error && (
        <Card 
          variant="surface" 
          mt="4"
          style={{ 
            border: '1px solid var(--red-6)',
            borderRadius: '12px',
            background: 'var(--red-2)'
          }}
        >
          <Flex direction="column" align="center" gap="3" py="6">
            <Box style={{ opacity: 0.8 }}>
              <FaBatteryEmpty size={24} color="var(--red-9)" />
            </Box>
            <Text color="red" weight="bold" size="3">Failed to load gateways</Text>
            <Text color="red" size="2" style={{ textAlign: 'center', maxWidth: '400px' }}>
              {error.message}
            </Text>
            <Button 
              variant="soft" 
              color="red" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ borderRadius: '8px' }}
            >
              <Flex align="center" gap="2">
                <FaSync size={14} className={isRefreshing ? "animate-spin" : ""} />
                Retry
              </Flex>
            </Button>
          </Flex>
        </Card>
      )}

      {!isLoading && !error && renderGatewayList()}

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
            .gateway-card {
              padding: 8px !important;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default GatewayList;