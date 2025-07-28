import React, { useState, useEffect } from "react";
import { 
  Box, 
  Flex, 
  Text, 
  Card, 
  Heading, 
  Button, 
  TextArea, 
  Dialog,
  Select,
  Spinner,
  Separator,
  Table
} from "@radix-ui/themes";
import {
  FaUser,
  FaClipboard,
  FaSyncAlt,
  FaPlus,
  FaWrench,
  FaThermometerHalf,
  FaCheck,
  FaExclamationTriangle,
  FaCog
} from "react-icons/fa";
import { useFrappeGetDocList, useFrappeCreateDoc } from "frappe-react-sdk";
import { FiRefreshCw } from "react-icons/fi";

interface MaintenanceRecord {
  name: string;
  user: string;
  owner: string;
  sensor: string;
  notes: string;
  modified: string;
}

interface Sensor {
  name: string;
  sensor_name?: string;
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

const MobileMaintenanceCard = ({ 
  record, 
  sensors, 
  getSensorDisplayName 
}: { 
  record: MaintenanceRecord;
  sensors?: Sensor[];
  getSensorDisplayName: (sensor: Sensor) => string;
}) => {
  const sensorDetails = sensors?.find(s => s.name === record.sensor);
  const displayName = sensorDetails 
    ? getSensorDisplayName(sensorDetails)
    : record.sensor;

  return (
    <Card 
      size="2" 
      style={{ 
        border: "1px solid var(--gray-6)",
        marginBottom: "12px"
      }}
    >
      <Flex direction="column" gap="3" p="3">
        {/* Header */}
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <FaThermometerHalf size={14} color="var(--blue-9)" />
            <Text size="2" weight="bold" style={{ 
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "150px"
            }}>
              {displayName}
            </Text>
          </Flex>
          <Text size="1" color="gray">
            {new Date(record.modified).toLocaleDateString()}
          </Text>
        </Flex>
        
        {/* Technician */}
        <Flex align="center" gap="2">
          <FaUser size={12} color="var(--gray-9)" />
          <Text size="1" color="gray">Technician:</Text>
          <Text size="1" weight="medium">{record.owner || record.user}</Text>
        </Flex>
        
        {/* Notes */}
        <Box>
          <Flex align="center" gap="2" mb="2">
            <FaClipboard size={12} color="var(--gray-9)" />
            <Text size="1" color="gray" weight="medium">Notes:</Text>
          </Flex>
          <Text 
            size="1" 
            style={{ 
              lineHeight: 1.4,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto'
            }}
          >
            {record.notes || "No notes provided"}
          </Text>
        </Box>
      </Flex>
    </Card>
  );
};

const MaintenanceList: React.FC = () => {
  const [newRecord, setNewRecord] = useState({
    sensor: "",
    notes: ""
  });
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  } | null>(null);

  // Fetch maintenance records
  const { data: records, isLoading, error, mutate } = useFrappeGetDocList<MaintenanceRecord>(
    "Cool Track Maintenance",
    {
      fields: ["name", "owner", "user", "sensor", "notes", "modified"],
      orderBy: {
        field: "modified",
        order: "desc"
      }
    }
  );

  // Fetch available sensors
  const { data: sensors } = useFrappeGetDocList<Sensor>(
    "Sensor",
    {
      fields: ["name", "sensor_name"],
      limit: 200
    }
  );

  const { createDoc, loading: creating } = useFrappeCreateDoc();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleRefresh = () => {
    mutate();
    showToast("Records refreshed", "success");
  };

  const handleCreateRecord = async () => {
    try {
      await createDoc("Cool Track Maintenance", {
        sensor: newRecord.sensor,
        notes: newRecord.notes
      });
      mutate();
      setNewRecord({ sensor: "", notes: "" });
      setOpen(false);
      showToast("Maintenance record created successfully", "success");
    } catch (err) {
      console.error("Error creating maintenance record:", err);
      showToast("Failed to create maintenance record. Please try again.", "error");
    }
  };

  // Helper function to get display name for sensor
  const getSensorDisplayName = (sensor: Sensor): string => {
    return sensor.sensor_name || sensor.name;
  };

  const renderRecordList = (): React.ReactNode => {
    if (records?.length === 0) {
      return (
        <Card 
          size={{ initial: "2", sm: "3" }} 
          style={{ border: "1px solid var(--gray-6)" }}
        >
          <Flex 
            direction="column" 
            align="center" 
            gap="4" 
            p={{ initial: "6", sm: "8" }}
          >
            <FaClipboard 
              size={window.innerWidth < 768 ? 24 : 32} 
              color="var(--gray-8)" 
            />
            <Text 
              size={{ initial: "2", sm: "3" }} 
              color="gray"
              style={{ textAlign: "center" }}
            >
              No maintenance records found
            </Text>
            <Text 
              size={{ initial: "1", sm: "2" }} 
              color="gray"
              style={{ 
                textAlign: "center",
                maxWidth: "280px",
                lineHeight: 1.5
              }}
            >
              Create your first maintenance record to get started
            </Text>
            <Button 
              variant="soft" 
              onClick={() => setOpen(true)}
              size={{ initial: "2", sm: "3" }}
            >
              <Flex align="center" gap="2">
                <FaPlus size={window.innerWidth < 768 ? 12 : 14} />
                <span style={{ display: window.innerWidth < 380 ? "none" : "inline" }}>
                  Add Maintenance Record
                </span>
              </Flex>
            </Button>
          </Flex>
        </Card>
      );
    }

    // Mobile card view for small screens
    if (window.innerWidth < 768) {
      return (
        <Box>
          {records?.map((record) => (
            <MobileMaintenanceCard
              key={record.name}
              record={record}
              sensors={sensors}
              getSensorDisplayName={getSensorDisplayName}
            />
          ))}
        </Box>
      );
    }

    // Desktop table view
    return (
      <Card style={{ border: "1px solid var(--gray-6)" }}>
        <Box style={{ overflowX: "auto" }}>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>
                  <Flex align="center" gap="2">
                    <FaThermometerHalf size={14} color="var(--blue-9)" />
                    <Text size="2" weight="bold">Sensor</Text>
                  </Flex>
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>
                  <Flex align="center" gap="2">
                    <FaUser size={14} color="var(--gray-9)" />
                    <Text size="2" weight="bold">Technician</Text>
                  </Flex>
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>
                  <Flex align="center" gap="2">
                    <FaClipboard size={14} color="var(--gray-9)" />
                    <Text size="2" weight="bold">Maintenance Notes</Text>
                  </Flex>
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>
                  <Text size="2" weight="bold">Date</Text>
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            
            <Table.Body>
              {records?.map((record) => {
                const sensorDetails = sensors?.find(s => s.name === record.sensor);
                const displayName = sensorDetails 
                  ? getSensorDisplayName(sensorDetails)
                  : record.sensor;

                return (
                  <Table.Row 
                    key={record.name}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Table.Cell>
                      <Text size="2" weight="medium">{displayName}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{record.owner || record.user}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text 
                        size="2" 
                        style={{ 
                          whiteSpace: 'pre-line',
                          lineHeight: 1.4,
                          maxWidth: '400px',
                          wordWrap: 'break-word'
                        }}
                      >
                        {record.notes || "No notes provided"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">
                        {new Date(record.modified).toLocaleDateString()}
                      </Text>
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

  if (isLoading) {
    return (
      <Box style={{ background: "var(--gray-1)" }}>
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
          >
            <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
              <FaWrench 
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
                Maintenance
              </Heading>
            </Flex>
          </Flex>
        </Box>
        
        <Flex height="60vh" align="center" justify="center">
          <Flex direction="column" align="center" gap="4">
            <Spinner size="3" />
            <Text 
              size={{ initial: "2", sm: "3" }}
              style={{ textAlign: "center" }}
            >
              Loading maintenance records...
            </Text>
          </Flex>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ background: "var(--gray-1)" }}>
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
          >
            <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
              <FaWrench 
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
                Maintenance
              </Heading>
            </Flex>
          </Flex>
        </Box>
        
        <Flex height="60vh" align="center" justify="center" p="4">
          <Flex direction="column" align="center" gap="4" style={{ textAlign: "center" }}>
            <FaExclamationTriangle 
              size={window.innerWidth < 768 ? 24 : 32} 
              color="var(--red-9)" 
            />
            <Text 
              size={{ initial: "2", sm: "3" }} 
              color="red"
            >
              Failed to load maintenance records
            </Text>
            <Text 
              size={{ initial: "1", sm: "2" }} 
              color="red"
              style={{ 
                maxWidth: "280px",
                lineHeight: 1.5
              }}
            >
              {error.message}
            </Text>
            <Button 
              variant="soft" 
              color="red" 
              onClick={() => mutate()}
              size={{ initial: "2", sm: "3" }}
            >
              Retry
            </Button>
          </Flex>
        </Flex>
      </Box>
    );
  }

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
            <FaWrench 
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
              Maintenance
            </Heading>
          </Flex>
          
          <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger>
                <Button 
                  variant="soft"
                  size={{ initial: "2", sm: "3" }}
                  style={{
                    fontSize: window.innerWidth < 768 ? "12px" : "14px"
                  }}
                >
                  <Flex align="center" gap="2">
                    <FaPlus size={window.innerWidth < 768 ? 12 : 14} />
                    <span style={{ display: window.innerWidth < 480 ? "none" : "inline" }}>
                      Add Maintenance
                    </span>
                  </Flex>
                </Button>
              </Dialog.Trigger>

              <Dialog.Content 
                style={{ 
                  maxWidth: window.innerWidth < 768 ? "95vw" : 450,
                  margin: window.innerWidth < 768 ? "16px" : "auto"
                }}
              >
                <Dialog.Title 
                  size={{ initial: "4", sm: "5" }}
                >
                  Create New Maintenance Record
                </Dialog.Title>
                <Dialog.Description 
                  size={{ initial: "1", sm: "2" }} 
                  mb="4"
                  style={{ lineHeight: 1.5 }}
                >
                  Record maintenance activities and notes for sensor monitoring
                </Dialog.Description>
                
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="2">
                    <Text 
                      size={{ initial: "1", sm: "2" }} 
                      weight="bold"
                    >
                      Sensor
                    </Text>
                    <Select.Root
                      value={newRecord.sensor}
                      onValueChange={(value) => setNewRecord({...newRecord, sensor: value})}
                      size={{ initial: "2", sm: "3" }}
                    >
                      <Select.Trigger placeholder="Select a sensor" />
                      <Select.Content>
                        <Select.Group>
                          <Select.Label>Available Sensors</Select.Label>
                          {sensors?.map((sensor) => (
                            <Select.Item key={sensor.name} value={sensor.name}>
                              {getSensorDisplayName(sensor)}
                            </Select.Item>
                          ))}
                        </Select.Group>
                      </Select.Content>
                    </Select.Root>
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text 
                      size={{ initial: "1", sm: "2" }} 
                      weight="bold"
                    >
                      Maintenance Notes
                    </Text>
                    <TextArea
                      placeholder="Enter detailed maintenance notes, observations, or actions taken..."
                      value={newRecord.notes}
                      onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                      style={{ 
                        minHeight: window.innerWidth < 768 ? '100px' : '120px',
                        fontSize: window.innerWidth < 768 ? '14px' : '16px'
                      }}
                      size={{ initial: "2", sm: "3" }}
                    />
                  </Flex>
                </Flex>

                <Flex 
                  gap="3" 
                  mt="5" 
                  justify="end"
                  direction={{ initial: "column", sm: "row" }}
                >
                  <Dialog.Close>
                    <Button 
                      variant="soft" 
                      color="gray"
                      style={{ 
                        width: window.innerWidth < 640 ? "100%" : "auto"
                      }}
                      size={{ initial: "2", sm: "3" }}
                    >
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button 
                    onClick={handleCreateRecord}
                    disabled={!newRecord.sensor || !newRecord.notes || creating}
                    loading={creating}
                    style={{ 
                      width: window.innerWidth < 640 ? "100%" : "auto"
                    }}
                    size={{ initial: "2", sm: "3" }}
                  >
                    {creating ? "Creating..." : "Create Record"}
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>

                  <Button 
                      variant="soft" 
                      onClick={handleRefresh}
                      disabled={isLoading}
                      size={{ initial: "2", sm: "3" }}
                      style={{
                          flexShrink: 0,
                          fontSize: window.innerWidth < 768 ? "12px" : "14px"
                      }}
                  >
                      <FaSyncAlt 
                          className={isLoading ? "animate-spin" : ""}
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
        <Box>
          {renderRecordList()}
        </Box>
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

export default MaintenanceList;