import React from "react";
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
  TextField,
  Select,
  IconButton,
} from "@radix-ui/themes";
import {
  FaEthernet,
  FaPlug,
  FaSignal,
  FaUsb,
  FaBatteryEmpty,
  FaTools,
  FaMapMarkerAlt,
  FaNetworkWired,
  FaMicrochip,
  FaInfoCircle,
  FaArrowLeft,
  FaHistory,
  FaCheck,
  FaTimes,
  FaClock,
  FaWifi,
  FaMobileAlt,
  FaEdit,
  FaSave,
} from "react-icons/fa";
import { useFrappeGetDoc, useFrappePostCall } from "frappe-react-sdk";
import { useNavigate, useParams } from "react-router-dom";

interface SensorGateway {
  name: string;
  gateway_type: string;
  model_number?: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  last_heartbeat?: string;
  ip_address?: string;
  sim_card_number?: string;
  network_provider?: string;
  location?: string;
  installation_date?: string;
  number_of_transmissions?: number;
  last_maintenance?: string;
  notes?: string;
  usb_port?: string;
}

const gatewayTypeIcons: Record<string, React.ReactNode> = {
  LTE: <FaSignal className="text-blue-500" size={20} />,
  Ethernet: <FaEthernet className="text-purple-500" size={20} />,
  USB: <FaUsb className="text-green-500" size={20} />,
  IoT: <FaPlug className="text-orange-500" size={20} />,
  SS: <FaEthernet className="text-purple-500" size={20} />,
  WSA: <FaUsb className="text-green-500" size={20} />,
};

const statusConfig: Record<string, { icon: React.ReactNode; color: "green" | "gray" | "orange" | "red" }> = {
  Active: { icon: <FaPlug size={14} />, color: "green" },
  Inactive: { icon: <FaBatteryEmpty size={14} />, color: "gray" },
  Maintenance: { icon: <FaTools size={14} />, color: "orange" },
  Decommissioned: { icon: <FaBatteryEmpty size={14} />, color: "red" },
};

const approvalStatusConfig: Record<string, { icon: React.ReactNode; color: "blue" | "green" | "red" | "gray" }> = {
  Pending: { icon: <FaHistory size={14} />, color: "blue" },
  Approved: { icon: <FaCheck size={14} />, color: "green" },
  Rejected: { icon: <FaTimes size={14} />, color: "red" },
  Decommissioned: { icon: <FaBatteryEmpty size={14} />, color: "gray" },
};

const GatewayPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("details");

  const { data: gateway, isLoading, error, mutate } = useFrappeGetDoc<SensorGateway>(
    "Sensor Gateway",
    id
  );

  const { call: updateApprovalStatus, loading: isUpdating } = useFrappePostCall(
    "frappe.client.set_value"
  );

  const { call: addNote, loading: isNoting } = useFrappePostCall(
    "frappe.client.set_value"
  );

  const handleApprove = async () => {
    try {
      await updateApprovalStatus({
        doctype: "Sensor Gateway",
        name: gateway?.name,
        fieldname: "approval_status",
        value: "Approved",
      });
      mutate();
    } catch (err) {
      console.error("Failed to approve gateway:", err);
    }
  };

  const handleReject = async () => {
    try {
      await updateApprovalStatus({
        doctype: "Sensor Gateway",
        name: gateway?.name,
        fieldname: "approval_status",
        value: "Rejected",
      });

      if (rejectReason) {
        await addNote({
          doctype: "Sensor Gateway",
          name: gateway?.name,
          fieldname: "notes",
          value: `Gateway rejected. Reason: ${rejectReason}`,
        });
      }

      mutate();
      setShowRejectDialog(false);
      setRejectReason("");
    } catch (err) {
      console.error("Failed to reject gateway:", err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleString();
  };

  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <Flex gap="3" align="center" mb="3">
      <Box 
        style={{ 
          padding: '6px',
          borderRadius: '6px',
          background: 'var(--gray-3)',
          color: 'var(--gray-11)'
        }}
      >
        {icon}
      </Box>
      <Heading size="4" weight="medium" style={{ color: 'var(--gray-12)' }}>
        {title}
      </Heading>
    </Flex>
  );

  const DetailCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card 
      variant="surface" 
      style={{ 
        borderRadius: '12px',
        border: '1px solid var(--gray-4)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease',
        background: 'var(--color-surface)'
      }}
    >
      <Box p="4">
        <SectionHeader title={title} icon={icon} />
        <Box style={{ marginTop: '12px' }}>
          {children}
        </Box>
      </Box>
    </Card>
  );

  const DetailItem = ({ label, value, icon }: { label: string; value?: string | number; icon?: React.ReactNode }) => (
    <Flex direction="column" gap="2" py="3">
      <Flex align="center" gap="2">
        {icon && (
          <Box style={{ color: 'var(--gray-9)' }}>
            {icon}
          </Box>
        )}
        <Text 
          size="1" 
          weight="medium"
          style={{ 
            color: 'var(--gray-10)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {label}
        </Text>
      </Flex>
      <Text 
        size="2" 
        weight="medium" 
        style={{ 
          color: value ? 'var(--gray-12)' : 'var(--gray-9)',
          fontFamily: typeof value === 'number' ? 'var(--font-mono, monospace)' : 'inherit'
        }}
      >
        {value?.toLocaleString() || "—"}
      </Text>
    </Flex>
  );

  if (isLoading) {
    return (
      <Box style={{ background: 'var(--gray-1)' }}>
        <Flex justify="center" align="center" style={{ height: '80vh' }}>
          <Flex direction="column" gap="3" align="center">
            <Spinner size="3" />
          </Flex>
        </Flex>
      </Box>
    );
  }

  if (error || !gateway) {
    return (
      <Box style={{ background: 'var(--gray-1)' }} p="4">
        <Box style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card 
            style={{ 
              maxWidth: '400px',
              width: '100%',
              borderRadius: '16px',
              border: '1px solid var(--red-6)',
              background: 'var(--red-2)'
            }}
          >
            <Flex direction="column" gap="4" align="center" p="6">
              <Box style={{ opacity: 0.8 }}>
                <FaBatteryEmpty size={32} color="var(--red-9)" />
              </Box>
              <Text color="red" weight="bold" size="4">Error loading gateway</Text>
              <Text color="red" size="2" style={{ textAlign: 'center' }}>
                {error?.message || "Gateway not found"}
              </Text>
              <Button 
                onClick={() => navigate('/settings')} 
                variant="soft" 
                style={{ marginTop: '8px', borderRadius: '8px' }}
              >
                <FaArrowLeft size={14} style={{ marginRight: '8px' }} />
                Back to Settings
              </Button>
            </Flex>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box style={{ background: 'var(--gray-1)'}}>
      {/* Header */}
      <Box 
        style={{ 
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--gray-4)',
          padding: '12px 24px',
          top: 0,
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Flex justify="between" align="center">
          <Button 
            variant="soft" 
            onClick={() => navigate('/settings')} 
            size="1"
            style={{ 
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              fontSize: '13px'
            }}
          >
            <FaArrowLeft size={12} style={{ marginRight: '6px' }} />
            Back to Settings
          </Button>
          <Flex gap="2" align="center">
            <Badge 
              color={statusConfig[gateway.status].color}
              variant="soft"
              size="1"
              style={{ 
                borderRadius: '16px',
                padding: '4px 8px',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.3px'
              }}
            >
              <Flex gap="1" align="center">
                {React.cloneElement(statusConfig[gateway.status].icon as React.ReactElement)}
                {gateway.status}
              </Flex>
            </Badge>
            <Badge 
              color={approvalStatusConfig[gateway.approval_status].color}
              variant="soft"
              size="1"
              style={{ 
                borderRadius: '16px',
                padding: '4px 8px',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.3px'
              }}
            >
              <Flex gap="1" align="center">
                {React.cloneElement(approvalStatusConfig[gateway.approval_status].icon as React.ReactElement)}
                {gateway.approval_status}
              </Flex>
            </Badge>
          </Flex>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box px="6" py="4" style={{ width: '100%' }}>
        {/* Gateway Header */}
        <Card 
          style={{ 
            borderRadius: '16px',
            border: '1px solid var(--gray-4)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            marginBottom: '24px',
            background: 'var(--color-surface)'
          }}
        >
          <Flex gap="4" align="center" p="6">
            <Box 
              style={{ 
                padding: '16px',
                background: 'var(--gray-2)',
                borderRadius: '12px',
                border: '1px solid var(--gray-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {gatewayTypeIcons[gateway.gateway_type] || <FaPlug size={24} />}
            </Box>
            <Flex direction="column" gap="1">
              <Heading size="5" weight="bold" style={{ color: 'var(--gray-12)' }}>
                {gateway.location || gateway.name}
              </Heading>
              <Text 
                color="gray" 
                size="2"
                style={{ 
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.2px'
                }}
              >
                ID: {gateway.name}
              </Text>
            </Flex>
          </Flex>

          {/* Approval Actions for Pending gateways */}
          {gateway.approval_status === "Pending" && (
            <Box 
              style={{ 
                background: 'var(--gray-2)',
                borderTop: '1px solid var(--gray-4)',
                borderRadius: '0 0 16px 16px'
              }}
            >
              <Flex gap="3" p="4" justify="end">
                <Button 
                  variant="solid" 
                  color="green" 
                  onClick={handleApprove}
                  disabled={isUpdating}
                  size="2"
                  style={{ 
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaCheck size={14} style={{ marginRight: '6px' }} />
                  Approve
                </Button>
                <Button 
                  variant="soft" 
                  color="red" 
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isUpdating}
                  size="2"
                  style={{ 
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaTimes size={14} style={{ marginRight: '6px' }} />
                  Reject
                </Button>
              </Flex>
            </Box>
          )}
        </Card>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Box 
            style={{ 
              background: 'var(--color-surface)',
              borderRadius: '12px',
              padding: '8px',
              border: '1px solid var(--gray-4)',
              marginBottom: '20px'
            }}
          >
            <Tabs.List 
              style={{ 
                background: 'transparent',
                gap: '4px'
              }}
            >
              <Tabs.Trigger 
                value="details"
                style={{
                  borderRadius: '8px',
                  padding: '8px 16px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500'
                }}
              >
                Details
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="connectivity"
                style={{
                  borderRadius: '8px',
                  padding: '8px 16px',
                  transition: 'all 0.2s ease',
                  fontWeight: '500'
                }}
              >
                Connectivity
              </Tabs.Trigger>
            </Tabs.List>
          </Box>

          <Box style={{ width: '100%' }}>
            {activeTab === "details" && (
              <Grid columns={{ initial: '1', sm: '2', lg: '3', xl: '4' }} gap="4">
                <DetailCard title="Basic Information" icon={<FaInfoCircle />}>
                  <DetailItem 
                    label="Gateway Type" 
                    value={gateway.gateway_type} 
                    icon={<FaPlug />} 
                  />
                  <Separator size="1" style={{ background: 'var(--gray-4)' }} />
                  <DetailItem 
                    label="Model Number" 
                    value={gateway.model_number} 
                    icon={<FaMicrochip />} 
                  />
                </DetailCard>

                <DetailCard title="Location" icon={<FaMapMarkerAlt />}>
                  <DetailItem 
                    label="Site Location" 
                    value={gateway.location} 
                  />
                  <Separator size="1" style={{ background: 'var(--gray-4)' }} />
                  <DetailItem 
                    label="Installed On" 
                    value={formatDate(gateway.installation_date)}
                    icon={<FaClock />}
                  />
                </DetailCard>

                <DetailCard title="Activity" icon={<FaHistory />}>
                  <DetailItem 
                    label="Last Heartbeat" 
                    value={formatDate(gateway.last_heartbeat)}
                    icon={<FaClock />}
                  />
                  <Separator size="1" style={{ background: 'var(--gray-4)' }} />
                  <DetailItem 
                    label="Transmissions" 
                    value={gateway.number_of_transmissions}
                    icon={<FaWifi />}
                  />
                  <Separator size="1" style={{ background: 'var(--gray-4)' }} />
                </DetailCard>

                <DetailCard title="Notes" icon={<FaInfoCircle />}>
                  <DetailItem 
                    label="Notes" 
                    value={gateway.notes} 
                  />
                </DetailCard>
              </Grid>
            )}

            {activeTab === "connectivity" && (
              <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
                <DetailCard title="Network" icon={<FaNetworkWired />}>
                  <DetailItem label="IP Address" value={gateway.ip_address} icon={<FaWifi />} />
                </DetailCard>
              </Grid>
            )}
          </Box>
        </Tabs.Root>
      </Box>

      {/* Reject Dialog */}
      <Dialog.Root open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <Dialog.Content 
          style={{ 
            maxWidth: 450,
            borderRadius: '16px',
            border: '1px solid var(--gray-4)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Dialog.Title style={{ marginBottom: '8px' }}>
            Reject Gateway
          </Dialog.Title>
          <Dialog.Description size="2" mb="4" style={{ color: 'var(--gray-11)' }}>
            Please provide a reason for rejecting this gateway.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                Reason
              </Text>
              <TextArea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ 
                  minHeight: '100px',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-6)',
                  resize: 'vertical'
                }}
              />
            </label>
          </Flex>

          <Flex gap="3" mt="5" justify="end">
            <Dialog.Close>
              <Button 
                variant="soft" 
                color="gray"
                style={{ borderRadius: '8px' }}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button 
              variant="solid" 
              color="red" 
              onClick={handleReject}
              disabled={!rejectReason || isUpdating || isNoting}
              style={{ borderRadius: '8px' }}
            >
              <FaTimes size={14} style={{ marginRight: '6px' }} />
              Confirm Reject
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default GatewayPage;