import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Card,
  Heading,
  Button,
  Separator,
  Spinner,
  TextField,
  Switch,
  Grid,
  Tabs,
  Badge,
} from "@radix-ui/themes";
import {
  FaSave,
  FaTimes,
  FaBell,
  FaServer,
  FaCheck,
  FaExclamationTriangle,
  FaCog,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaEnvelope,
} from "react-icons/fa";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import GatewayList from "./gateway/GatewayList";

interface CoolTrackSettings {
  name: string;
  api_url: string;
  require_gateway_approval: boolean;
  require_sensor_approval: boolean;
  log_approval_activities: boolean;
  send_approval_notifications: boolean;
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

const SettingsPage = () => {
  const { data: settings, isLoading, error, mutate } = useFrappeGetDoc<CoolTrackSettings>(
    "Cool Track Settings",
    "Cool Track Settings"
  );
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const [formData, setFormData] = useState<Partial<CoolTrackSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  } | null>(null);

  const handleChange = <K extends keyof CoolTrackSettings>(field: K, value: CoolTrackSettings[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateDoc("Cool Track Settings", "Cool Track Settings", formData);
      mutate();
      setHasChanges(false);
      showToast("Settings saved successfully", "success");
    } catch (err) {
      console.error("Error saving settings:", err);
      showToast("Failed to save settings. Please try again.", "error");
    }
  };

  const handleCancel = () => {
    setFormData({});
    setHasChanges(false);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast(null);
  };

  const currentValue = <K extends keyof CoolTrackSettings>(field: K): CoolTrackSettings[K] =>
    (formData[field] !== undefined ? formData[field] : settings?.[field]) as CoolTrackSettings[K];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (isLoading) {
    return (
      <Flex align="center" justify="center">
        <Flex direction="column" align="center" gap="4">
          <Spinner size="3" />
        </Flex>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex align="center" justify="center">
        <Flex direction="column" align="center" gap="4">
          <FaExclamationTriangle size={32} color="var(--red-9)" />
          <Text size="3" color="red">Failed to load settings</Text>
        </Flex>
      </Flex>
    );
  }

  return (
    <Box style={{background: "var(--gray-1)" }}>
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
          borderBottom: "1px solid var(--gray-6)"
        }}
      >
        <Flex justify="between" align="center" p="6">
          <Flex align="center" gap="3">
            <FaCog size={24} color="var(--blue-9)" />
            <Heading size="6" weight="bold">Settings</Heading>
          </Flex>
        </Flex>
      </Box>

      <Box p="6">
        <Tabs.Root defaultValue="general">
          <Tabs.List size="2" style={{ marginBottom: "24px" }}>
            <Tabs.Trigger value="general">
              <Flex align="center" gap="2">
                <FaCog size={14} />
                General Settings
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="gateways">
              <Flex align="center" gap="2">
                <FaMapMarkerAlt size={14} />
                Locations
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="general">
            <Box style={{ maxWidth: "800px" }}>
              <Flex direction="column" gap="6">
                
                {/* API Configuration Card */}
                <Card size="3" style={{ border: "1px solid var(--gray-6)" }}>
                  <Flex direction="column" gap="5">
                    <SectionHeader 
                      title="API Configuration" 
                      icon={<FaServer />} 
                      description="The endpoint for sensor data reception"
                    />
                    
                    <SettingRow 
                      label="API Endpoint URL" 
                      description="The complete URL where sensor data will be sent"
                      fullWidth
                    >
                      <TextField.Root
                        value={currentValue('api_url') || ''}
                        placeholder="https://example.com/api/method/receive_sensor_data"
                        size="3"
                        readOnly
                        style={{ 
                          backgroundColor: "var(--gray-2)",
                          cursor: "not-allowed",
                          opacity: 0.7
                        }}
                      />
                    </SettingRow>
                  </Flex>
                </Card>

                {/* Security & Approval Card */}
                <Card size="3" style={{ border: "1px solid var(--gray-6)" }}>
                  <Flex direction="column" gap="5">
                    <SectionHeader 
                      title="Security & Approval" 
                      icon={<FaShieldAlt />} 
                      description="Control how new devices are approved and managed"
                    />
                    
                    <SettingRow
                      label="Location Approval Required"
                      description="New locations must be manually approved before connecting"
                      badge={currentValue('require_gateway_approval') ? "Enabled" : "Disabled"}
                      badgeColor={currentValue('require_gateway_approval') ? "green" : "gray"}
                    >
                      <Switch
                        size="2"
                        checked={currentValue('require_gateway_approval')}
                        disabled
                        style={{
                          cursor: "not-allowed",
                          opacity: 0.7
                        }}
                      />
                    </SettingRow>

                    <Separator size="4" />

                    <SettingRow
                      label="Sensor Approval Required"
                      description="New sensors must be approved before sending data"
                      badge={currentValue('require_sensor_approval') ? "Enabled" : "Disabled"}
                      badgeColor={currentValue('require_sensor_approval') ? "green" : "gray"}
                    >
                      <Switch
                        size="2"
                        checked={currentValue('require_sensor_approval')}
                        disabled
                        style={{
                          cursor: "not-allowed",
                          opacity: 0.7
                        }}
                      />
                    </SettingRow>

                    <Separator size="4" />

                    <SettingRow
                      label="Log Approval Activities"
                      description="Generate detailed audit logs for all approval activities"
                      badge={currentValue('log_approval_activities') ? "Active" : "Inactive"}
                      badgeColor={currentValue('log_approval_activities') ? "blue" : "gray"}
                    >
                      <Switch
                        size="2"
                        checked={currentValue('log_approval_activities')}
                        disabled
                        style={{
                          cursor: "not-allowed",
                          opacity: 0.7
                        }}
                      />
                    </SettingRow>
                  </Flex>
                </Card>

                {/* Notifications Card */}
                <Card size="3" style={{ border: "1px solid var(--gray-6)" }}>
                  <Flex direction="column" gap="5">
                    <SectionHeader 
                      title="Notifications" 
                      icon={<FaEnvelope />} 
                      description="Configure email notifications for system events"
                    />
                    
                    <SettingRow
                      label="Approval Notifications"
                      description="Send email notifications when devices require approval"
                      badge={currentValue('send_approval_notifications') ? "Enabled" : "Disabled"}
                      badgeColor={currentValue('send_approval_notifications') ? "green" : "gray"}
                    >
                      <Switch
                        size="2"
                        checked={currentValue('send_approval_notifications')}
                        disabled
                        style={{
                          cursor: "not-allowed",
                          opacity: 0.7
                        }}
                      />
                    </SettingRow>
                  </Flex>
                </Card>
              </Flex>
            </Box>
          </Tabs.Content>

          <Tabs.Content value="gateways">
            <Box>
              <GatewayList />
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Box>
  );
};

const SectionHeader = ({ 
  title, 
  icon, 
  description 
}: { 
  title: string; 
  icon: React.ReactNode;
  description?: string;
}) => (
  <Flex direction="column" gap="2">
    <Flex gap="3" align="center">
      <Box style={{ color: "var(--blue-9)" }}>{icon}</Box>
      <Heading size="5" weight="bold">{title}</Heading>
    </Flex>
    {description && (
      <Text size="2" color="gray">{description}</Text>
    )}
  </Flex>
);

const SettingRow = ({ 
  label, 
  description,
  children,
  fullWidth = false,
  badge,
  badgeColor = "gray"
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  badge?: string;
  badgeColor?: "gray" | "green" | "blue" | "red";
}) => (
  <Box>
    <Grid columns={fullWidth ? "1" : "2"} gap="5" align="center">
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <Text size="3" weight="medium">{label}</Text>
          {badge && (
            <Badge size="1" color={badgeColor} variant="soft">
              {badge}
            </Badge>
          )}
        </Flex>
        {description && (
          <Text size="2" color="gray" style={{ lineHeight: 1.5 }}>
            {description}
          </Text>
        )}
      </Flex>
      {!fullWidth && (
        <Flex justify="end">
          {children}
        </Flex>
      )}
    </Grid>
    {fullWidth && (
      <Box mt="3">
        {children}
      </Box>
    )}
  </Box>
);

export default SettingsPage;