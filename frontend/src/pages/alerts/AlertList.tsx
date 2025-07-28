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
  Tabs,
  ScrollArea,
  Table,
  Separator
} from "@radix-ui/themes";
import {
  FaEnvelope,
  FaMobile,
  FaBell as FaSystemNotification,
  FaBell,
  FaSync,
  FaCheck,
  FaExclamationTriangle
} from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { useState, useEffect } from "react";

interface Alert {
  name: string;
  subject: string;
  enabled: boolean;
  channel: 'Email' | 'SMS' | 'System Notification';
  condition: string;
  [key: string]: any;
}

const channelIconMap: Record<string, React.ReactNode> = {
  'Email': <FaEnvelope size={window.innerWidth < 768 ? 14 : 16} color="#10B981" />,
  'SMS': <FaMobile size={window.innerWidth < 768 ? 14 : 16} color="#3B82F6" />,
  'System Notification': <FaSystemNotification size={window.innerWidth < 768 ? 14 : 16} color="#F59E0B" />,
};

const channelColorMap: Record<string, "green" | "blue" | "amber"> = {
  'Email': "green",
  'SMS': "blue", 
  'System Notification': "amber",
};

const MobileAlertCard = ({ alert, parseConditions }: { 
  alert: Alert; 
  parseConditions: (conditionString: string) => string[];
}) => {
  const conditions = parseConditions(alert.condition);
  
  return (
    <Card 
      size="2" 
      style={{ 
        border: "1px solid var(--gray-6)",
        marginBottom: "12px",
        borderLeft: `4px solid var(--${alert.enabled ? 'green' : 'gray'}-9)`
      }}
    >
      <Flex direction="column" gap="3" p="3">
        {/* Header */}
        <Flex justify="between" align="center" gap="2">
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text 
              size="2" 
              weight="bold" 
              style={{ 
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: "2px"
              }}
              title={alert.subject}
            >
              {alert.subject}
            </Text>
            <Text 
              size="1" 
              color="gray" 
              style={{ 
                fontFamily: 'monospace',
                fontSize: '10px',
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              title={alert.name}
            >
              {alert.name}
            </Text>
          </Box>
          <Badge 
            color={alert.enabled ? "green" : "gray"} 
            variant="soft"
            size="1"
            style={{ 
              borderRadius: '16px',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: '500',
              flexShrink: 0
            }}
          >
            {alert.enabled ? "Active" : "Inactive"}
          </Badge>
        </Flex>
        
        {/* Channel */}
        <Flex align="center" gap="2">
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            {channelIconMap[alert.channel]}
          </Box>
          <Text 
            size="1" 
            weight="medium"
            style={{ 
              color: `var(--${channelColorMap[alert.channel]}-11)`,
              textTransform: 'capitalize'
            }}
          >
            {alert.channel}
          </Text>
        </Flex>
        
        {/* Conditions */}
        <Box>
          <Text size="1" color="gray" weight="medium" style={{ marginBottom: "8px" }}>
            Trigger Conditions:
          </Text>
          <Flex direction="column" gap="2">
            {conditions.length > 0 ? (
              conditions.map((condition, index) => (
                <Box 
                  key={index}
                  style={{ 
                    background: 'var(--amber-2)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--amber-6)'
                  }}
                >
                  <Text 
                    size="1" 
                    style={{ 
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '10px',
                      color: 'var(--amber-11)',
                      wordBreak: 'break-all',
                      lineHeight: '1.3'
                    }}
                  >
                    {condition}
                  </Text>
                </Box>
              ))
            ) : (
              <Box 
                style={{ 
                  background: 'var(--gray-2)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px dashed var(--gray-6)'
                }}
              >
                <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
                  No conditions set
                </Text>
              </Box>
            )}
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
};

const AlertDashboard = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  } | null>(null);

  const Toast = ({ message, type, onClose }: { 
    message: string; 
    type: 'success' | 'error' | 'info';
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
          backgroundColor: type === 'success' ? 'var(--green-9)' : 
                          type === 'error' ? 'var(--red-9)' : 'var(--blue-9)',
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
          {type === 'success' && <FaCheck size={16} />}
          {type === 'error' && <FaExclamationTriangle size={16} />}
          <Text size="2">{message}</Text>
        </div>
      </>
    );
  };

  // Fetch alerts data
  const { data: alerts, isLoading, error, mutate } = useFrappeGetDocList<Alert>('Notification', {
    fields: ['name', 'subject', 'enabled', 'channel', 'condition'],
    filters: [
      ['is_standard', '=', 0]
    ]
  });

  const handleRefresh = () => {
    mutate();
    showToast('Alerts refreshed successfully', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast(null);
  };

  const filteredAlerts = (alerts ?? []).filter((alert) => 
    activeTab === 'active' ? alert.enabled : !alert.enabled
  );

  const parseConditions = (conditionString: string): string[] => {
    if (!conditionString) return [];
    
    // Split conditions by 'and' and clean them up
    return conditionString
      .split(' and ')
      .map(cond => cond.trim())
      .filter(Boolean);
  };

  const renderAlertContent = (): React.ReactNode => {
    if (filteredAlerts?.length === 0) {
      return (
        <Card 
          mt="4" 
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
              <FaBell 
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
              No {activeTab} alerts found
            </Text>
            <Button 
              variant="soft" 
              onClick={handleRefresh}
              size={{ initial: "2", sm: "3" }}
              style={{ 
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Flex align="center" gap="2">
                <FiRefreshCw 
                  className={isLoading ? "animate-spin" : ""}
                  size={window.innerWidth < 768 ? 12 : 14}
                />
                Refresh
              </Flex>
            </Button>
          </Flex>
        </Card>
      );
    }

    // Mobile card view for small screens
    if (window.innerWidth < 768) {
      return (
        <Box mt="4">
          {filteredAlerts.map(alert => (
            <MobileAlertCard
              key={alert.name}
              alert={alert}
              parseConditions={parseConditions}
            />
          ))}
        </Box>
      );
    }

    // Desktop table view
    return (
      <Card 
        mt="4" 
        style={{ 
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <Box style={{ overflowX: "auto" }}>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Alert Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Channel</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Trigger Conditions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            
            <Table.Body>
              {filteredAlerts.map(alert => {
                const conditions = parseConditions(alert.condition);
                
                return (
                  <Table.Row key={alert.name}>
                    <Table.Cell>
                      <Flex direction="column" gap="1">
                        <Text weight="medium" size="3">
                          {alert.subject}
                        </Text>
                        <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
                          {alert.name}
                        </Text>
                      </Flex>
                    </Table.Cell>
                    
                    <Table.Cell>
                      <Badge 
                        color={alert.enabled ? "green" : "gray"} 
                        variant="soft"
                        style={{ 
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: '500',
                          letterSpacing: '0.3px'
                        }}
                      >
                        {alert.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <Box style={{ display: 'flex', alignItems: 'center' }}>
                          {channelIconMap[alert.channel]}
                        </Box>
                        <Text 
                          size="2" 
                          weight="medium"
                          style={{ 
                            color: `var(--${channelColorMap[alert.channel]}-11)`,
                            textTransform: 'capitalize'
                          }}
                        >
                          {alert.channel}
                        </Text>
                      </Flex>
                    </Table.Cell>
                    
                    <Table.Cell>
                      <Flex direction="column" gap="2" style={{ maxWidth: '400px' }}>
                        {conditions.length > 0 ? (
                          conditions.map((condition, index) => (
                            <Box 
                              key={index}
                              style={{ 
                                background: 'var(--amber-2)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--amber-6)'
                              }}
                            >
                              <Text 
                                size="2" 
                                style={{ 
                                  fontFamily: 'var(--font-mono, monospace)',
                                  fontSize: '11px',
                                  color: 'var(--amber-11)',
                                  wordBreak: 'break-all',
                                  lineHeight: '1.4'
                                }}
                              >
                                {condition}
                              </Text>
                            </Box>
                          ))
                        ) : (
                          <Box 
                            style={{ 
                              background: 'var(--gray-2)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px dashed var(--gray-6)'
                            }}
                          >
                            <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
                              No conditions set
                            </Text>
                          </Box>
                        )}
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      </Card>
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
            <FaBell 
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
              Alerts
            </Heading>
          </Flex>
          <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
            <Button
              variant="soft"
              onClick={handleRefresh}
              disabled={isLoading}
              size={{ initial: "1", sm: "2" }}
              style={{ 
                borderRadius: '8px',
                fontSize: window.innerWidth < 768 ? "11px" : "14px"
              }}
            >
              <Flex align="center" gap="2">
                <FiRefreshCw 
                  className={isLoading ? "animate-spin" : ""}
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
            <FiRefreshCw 
              className="animate-spin" 
              size={window.innerWidth < 768 ? 16 : 20} 
              color="var(--blue-9)"
            />
            <Text 
              size={{ initial: "2", sm: "3" }} 
              weight="medium" 
              color="gray"
              style={{ display: window.innerWidth < 480 ? "none" : "block" }}
            >
              Loading alerts...
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
              <FaBell 
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
              Failed to load alerts
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
              size={{ initial: "2", sm: "3" }}
              style={{ borderRadius: '8px' }}
            >
              <Flex align="center" gap="2">
                <FiRefreshCw 
                  className={isLoading ? "animate-spin" : ""}
                  size={window.innerWidth < 768 ? 12 : 14}
                />
                Retry
              </Flex>
            </Button>
          </Flex>
        </Card>
      )}

      {!isLoading && !error && (
        <Box>
          <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'inactive')}>
            <Box 
              style={{ 
                borderRadius: window.innerWidth < 768 ? '8px' : '12px',
                padding: window.innerWidth < 768 ? '6px' : '8px',
                border: '1px solid var(--gray-6)',
                marginBottom: window.innerWidth < 768 ? '16px' : '20px',
                background: 'white'
              }}
            >
              <Tabs.List 
                style={{ 
                  background: 'transparent',
                  gap: window.innerWidth < 768 ? '2px' : '4px'
                }}
              >
                <Tabs.Trigger 
                  value="active"
                  style={{
                    borderRadius: window.innerWidth < 768 ? '6px' : '8px',
                    padding: window.innerWidth < 768 ? '6px 12px' : '8px 16px',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    fontSize: window.innerWidth < 768 ? '12px' : '14px',
                    flex: window.innerWidth < 480 ? '1' : 'none'
                  }}
                >
                  Active
                  {alerts && (
                    <Badge 
                      variant="soft" 
                      color="green"
                      size="1"
                      style={{ 
                        marginLeft: window.innerWidth < 768 ? '6px' : '8px', 
                        fontSize: window.innerWidth < 768 ? '9px' : '10px'
                      }}
                    >
                      {alerts.filter(a => a.enabled).length}
                    </Badge>
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="inactive"
                  style={{
                    borderRadius: window.innerWidth < 768 ? '6px' : '8px',
                    padding: window.innerWidth < 768 ? '6px 12px' : '8px 16px',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    fontSize: window.innerWidth < 768 ? '12px' : '14px',
                    flex: window.innerWidth < 480 ? '1' : 'none'
                  }}
                >
                  Inactive
                  {alerts && (
                    <Badge 
                      variant="soft" 
                      color="gray"
                      size="1"
                      style={{ 
                        marginLeft: window.innerWidth < 768 ? '6px' : '8px', 
                        fontSize: window.innerWidth < 768 ? '9px' : '10px'
                      }}
                    >
                      {alerts.filter(a => !a.enabled).length}
                    </Badge>
                  )}
                </Tabs.Trigger>
              </Tabs.List>
            </Box>

            <Tabs.Content value={activeTab}>
              {renderAlertContent()}
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      )}

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
          }
          
          @media (max-width: 479px) {
            /* Extra small screens */
            [data-radix-themes] {
              --space-3: 8px;
              --space-4: 12px;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default AlertDashboard;