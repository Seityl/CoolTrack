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
} from "@radix-ui/themes";
import {
  FaSave,
  FaTimes,
  FaBell,
  FaCheckCircle,
  FaServer,
  FaCheck,
  FaExclamationTriangle,
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
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: type === 'success' ? 'var(--green-9)' : 'var(--red-9)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      {type === 'success' ? (
        <FaCheck size={16} />
      ) : (
        <FaExclamationTriangle size={16} />
      )}
      <Text size="2">{message}</Text>
    </div>
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
  const [apiUrlError, setApiUrlError] = useState<string | null>(null);
  const [debouncedApiUrl, setDebouncedApiUrl] = useState<string>("");
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  } | null>(null);

  useEffect(() => {
    if (settings?.api_url) {
      setDebouncedApiUrl(settings.api_url);
    }
  }, [settings?.api_url]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedApiUrl !== settings?.api_url) {
        validateApiUrl(debouncedApiUrl);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [debouncedApiUrl, settings?.api_url]);

  const validateApiUrl = (url: string): boolean => {
    if (!url) {
      setApiUrlError("API URL is required");
      return false;
    }

    try {
      new URL(url);
      setApiUrlError(null);
      return true;
    } catch (e) {
      setApiUrlError("Please enter a valid URL (e.g., https://example.com/api)");
      return false;
    }
  };

  const handleChange = <K extends keyof CoolTrackSettings>(field: K, value: CoolTrackSettings[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'api_url') {
      setDebouncedApiUrl(value as string);
    }

    setHasChanges(true);
  };

  const handleSave = async () => {
    const apiUrl = formData.api_url || settings?.api_url;
    if (!validateApiUrl(apiUrl as string)) {
      return;
    }

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
    setApiUrlError(null);
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

  return (
    <Box className="px-4 py-3 w-full">
      {toast?.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}

      {hasChanges && (
        <Box className="bg-white p-4 sticky top-[50px] z-50 border-b border-gray-200 shadow-md">
          <Flex justify="end" align="end">
            <Flex gap="2">
              <Button variant="soft" color="gray" onClick={handleCancel}>
                {updating ? "" : <FaTimes />} 
                {updating ? "" : "Cancel"} 
              </Button>
              <Button onClick={handleSave} disabled={updating || !!apiUrlError}>
                {updating ? <Spinner /> : <FaSave />} 
                {updating ? "" : "Save Changes"} 
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}

      <Tabs.Root defaultValue="general">
        <Tabs.List>
          <Tabs.Trigger value="general">General Settings</Tabs.Trigger>
          <Tabs.Trigger value="gateways">Locations</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="general">
          <Box className="mx-auto py-4">
            <Card className="shadow-sm w-full">
              <Flex direction="column" gap="4" p="6">
                <Heading size="6" mb="4">Settings</Heading>

                {/* API Section */}
                <SectionHeader title="API Configuration" icon={<FaServer />} />
                <SettingRow 
                  label="API URL" 
                  description="The endpoint URL for sensor data reception"
                  fullWidth
                >
                  <TextField.Root
                    value={currentValue('api_url') || ''}
                    onChange={(e) => handleChange('api_url', e.target.value)}
                    placeholder="https://example.com/api/method/receive_sensor_data"
                    className={`w-full p-2 border rounded-md ${apiUrlError ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {apiUrlError && (
                    <Text size="1" color="red" mt="1">
                      {apiUrlError}
                    </Text>
                  )}
                </SettingRow>

                <Separator size="4" />

                {/* Approval Section */}
                <SectionHeader title="Approval Settings" icon={<FaCheckCircle />} />
                <SettingRow
                  label="Require Location Approval"
                  description="When enabled, all new locations must be manually approved before they can connect to the server."
                >
                  <Switch
                    checked={currentValue('require_gateway_approval')}
                    onCheckedChange={(checked) => handleChange('require_gateway_approval', checked)}
                  />
                </SettingRow>

                <SettingRow
                  label="Require Sensor Approval"
                  description="When enabled, all new sensors must be approved before they can send data to the server."
                >
                  <Switch
                    checked={currentValue('require_sensor_approval')}
                    onCheckedChange={(checked) => handleChange('require_sensor_approval', checked)}
                  />
                </SettingRow>

                <SettingRow
                  label="Log Approval Activities"
                  description="When enabled, detailed audit logs of all approval/rejection activities are generated."
                >
                  <Switch
                    checked={currentValue('log_approval_activities')}
                    onCheckedChange={(checked) => handleChange('log_approval_activities', checked)}
                  />
                </SettingRow>

                <Separator size="4" />

                {/* Notification Section */}
                <SectionHeader title="Notification Settings" icon={<FaBell />} />
                <SettingRow
                  label="Send Approval Notifications"
                  description="When enabled, email notifications are sent to system managers when a new gateway or sensor requires approval."
                >
                  <Switch
                    checked={currentValue('send_approval_notifications')}
                    onCheckedChange={(checked) => handleChange('send_approval_notifications', checked)}
                  />
                </SettingRow>
              </Flex>
            </Card>
          </Box>
        </Tabs.Content>

        <Tabs.Content value="gateways">
          <Box className="mx-auto py-4">
            <GatewayList />
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <Flex gap="3" align="center" mb="4">
    <Box className="text-gray-500">{icon}</Box>
    <Heading size="4" weight="medium">{title}</Heading>
  </Flex>
);

const SettingRow = ({ 
  label, 
  description,
  children,
  fullWidth = false
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) => (
  <Grid columns={fullWidth ? "1" : "2"} gap="5" mb="4">
    <Flex direction="column">
      <Text weight="medium">{label}</Text>
      {description && (
        <Text size="2" color="gray" mt="1">
          {description}
        </Text>
      )}
    </Flex>
    {!fullWidth && (
      <Box>
        {children}
      </Box>
    )}
    {fullWidth && children}
  </Grid>
);

export default SettingsPage;