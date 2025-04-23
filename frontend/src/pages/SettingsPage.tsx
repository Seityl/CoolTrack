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
  Container,
  TextField,
  Switch,
  Grid,
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

interface CoolTrackSettings {
  name: string;
  api_url: string;
  require_gateway_approval: boolean;
  require_sensor_approval: boolean;
  log_approval_activities: boolean;
  send_approval_notifications: boolean;
}

// Custom Toast component
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
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  } | null>(null);
  const [apiUrlError, setApiUrlError] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast(null);
  };

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

  if (isLoading) {
    return (
      <Flex justify="center" align="center" className="h-[60vh]">
        <Spinner size="3" />
      </Flex>
    );
  }

  if (error || !settings) {
    return (
      <Container size="4" className="h-[60vh] flex items-center justify-center">
        <Card>
          <Flex direction="column" gap="4" align="center">
            <Text color="red" weight="bold">Error loading settings</Text>
            <Text>{error?.message || "Settings not found"}</Text>
          </Flex>
        </Card>
      </Container>
    );
  }

  const handleChange = <K extends keyof CoolTrackSettings>(field: K, value: CoolTrackSettings[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'api_url') {
      validateApiUrl(value as string);
    }
    
    setHasChanges(true);
  };

  const handleSave = async () => {
    const apiUrl = currentValue('api_url');
    if (!validateApiUrl(apiUrl)) {
      return;
    }

    try {
      await updateDoc("Cool Track Settings", "Cool Track Settings", formData);
      mutate();
      setHasChanges(false);
      showToast("Settings saved successfully!", "success");
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

  const currentValue = <K extends keyof CoolTrackSettings>(field: K): CoolTrackSettings[K] => 
    (formData[field] !== undefined ? formData[field] : settings[field]) as CoolTrackSettings[K];

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

  return (
    <Box className="px-4 py-6 w-full">
      {/* Custom Toast Notification */}
      {toast?.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}

      {/* Conditional Sticky Header - Only shows when hasChanges is true */}
      {hasChanges && (
        <Box 
          className="bg-white border-b border-gray-200 p-4"
          style={{
            position: 'sticky',
            top: 50,
            zIndex: 100,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          <Container size="4">
            <Flex justify="end" align="end">
              <Flex gap="2">
                <Button variant="soft" color="gray" onClick={handleCancel}>
                  <FaTimes /> Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={updating || !!apiUrlError}
                >
                  {updating ? <Spinner /> : <FaSave />} Save Changes
                </Button>
              </Flex>
            </Flex>
          </Container>
        </Box>
      )}

      <Container size="4" py="4">
        <Card className="shadow-sm">
          <Flex direction="column" gap="4" p="4">
						<Heading size="6" mb="4">
							Settings
						</Heading>
            {/* API Settings Section */}
            <SectionHeader title="API Configuration" icon={<FaServer />} />
            <SettingRow 
              label="API URL" 
              description="The endpoint URL for sensor data reception"
              fullWidth
            >
							<TextField.Root
							value={currentValue('api_url')}
							onChange={(e) => handleChange('api_url', e.target.value)}
							placeholder="https://example.com/api/method/receive_sensor_data"
							>
							</TextField.Root>
              {apiUrlError && (
                <Text size="1" color="red" mt="1">
                  {apiUrlError}
                </Text>
              )}
            </SettingRow>

            {/* Rest of the component remains the same */}
            <Separator size="4" />

            <SectionHeader title="Approval Settings" icon={<FaCheckCircle />} />
            <SettingRow
              label="Require Gateway Approval"
              description="When enabled, all new gateways must be manually approved by an administrator before they can connect to the server."
            >
              <Switch
                checked={currentValue('require_gateway_approval')}
                onCheckedChange={(checked) => handleChange('require_gateway_approval', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Require Sensor Approval"
              description="When checked, all new sensors must be reviewed and approved by an administrator before they can transmit data to the server."
            >
              <Switch
                checked={currentValue('require_sensor_approval')}
                onCheckedChange={(checked) => handleChange('require_sensor_approval', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Log Approval Activities"
              description="Maintain detailed audit logs of all approval/rejection activities."
            >
              <Switch
                checked={currentValue('log_approval_activities')}
                onCheckedChange={(checked) => handleChange('log_approval_activities', checked)}
              />
            </SettingRow>

            <Separator size="4" />

            {/* Notification Settings Section */}
            <SectionHeader title="Notification Settings" icon={<FaBell />} />
            <SettingRow
              label="Send Approval Notifications"
              description="Enable to send email notifications to administrators when new gateways or sensors require approval."
            >
              <Switch
                checked={currentValue('send_approval_notifications')}
                onCheckedChange={(checked) => handleChange('send_approval_notifications', checked)}
              />
            </SettingRow>
          </Flex>
        </Card>
      </Container>
    </Box>
  );
};

export default SettingsPage;