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
  Container,
  Dialog,
  TextArea,
  Grid,
  ScrollArea,
  Tabs,
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
} from "react-icons/fa";
import { useFrappeGetDoc, useFrappePostCall } from "frappe-react-sdk";
import { useNavigate, useParams } from "react-router-dom";

interface SensorGateway {
  name: string;
  gateway_type: string;
  model_number?: string;
  serial_number?: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
  approval_status: "Pending" | "Approved" | "Rejected" | "Decommissioned";
  last_heartbeat?: string;
  ip_address?: string;
  sim_card_number?: string;
  mac_address?: string;
  network_provider?: string;
  location?: string;
  installation_date?: string;
  firmware_version?: string;
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
    <Flex gap="3" align="center" mb="2">
      <Box className="text-gray-500">{icon}</Box>
      <Heading size="4" weight="medium">{title}</Heading>
    </Flex>
  );

  const DetailCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card variant="surface" className="hover:shadow-md transition-shadow">
      <SectionHeader title={title} icon={icon} />
      {children}
    </Card>
  );

  const DetailItem = ({ label, value, icon }: { label: string; value?: string | number; icon?: React.ReactNode }) => (
    <Flex direction="column" gap="1" py="2">
      <Flex align="center" gap="2">
        {icon && <Box className="text-gray-400">{icon}</Box>}
        <Text size="1" className="text-gray-500 uppercase tracking-wider">
          {label}
        </Text>
      </Flex>
      <Text size="2" weight="medium" className="text-gray-900">
        {value || "—"}
      </Text>
    </Flex>
  );

  if (isLoading) {
    return (
      <Flex justify="center" align="center" className="h-[80vh]">
        <Spinner size="3" />
      </Flex>
    );
  }

  if (error || !gateway) {
    return (
      <Container size="4" className="h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <Flex direction="column" gap="4" align="center" p="4">
            <Text color="red" weight="bold" size="4">Error loading gateway</Text>
            <Text color="gray">{error?.message || "Gateway not found"}</Text>
            <Button onClick={() => navigate('/gateways')} variant="soft" className="mt-4">
              <FaArrowLeft /> Return to Gateways
            </Button>
          </Flex>
        </Card>
      </Container>
    );
  }

  return (
    <Box p="4">
      {/* Header */}
      <Box className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
        <Container size="4">
          <Flex justify="between" align="center">
            <Button variant="soft" onClick={() => navigate('/gateways')} size="2">
              <FaArrowLeft /> All Gateways
            </Button>
            <Flex gap="3" align="center">
              <Badge 
                color={statusConfig[gateway.status].color}
                highContrast 
                className="uppercase"
              >
                <Flex gap="2" align="center">
                  {statusConfig[gateway.status].icon}
                  {gateway.status}
                </Flex>
              </Badge>
              <Badge 
                color={approvalStatusConfig[gateway.approval_status].color}
                highContrast 
                className="uppercase"
              >
                <Flex gap="2" align="center">
                  {approvalStatusConfig[gateway.approval_status].icon}
                  {gateway.approval_status}
                </Flex>
              </Badge>
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="4" py="6">
        {/* Gateway Header */}
        <Card className="shadow-sm mb-6">
          <Flex gap="4" align="center" p="4">
            <Box className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {gatewayTypeIcons[gateway.gateway_type] || <FaPlug size={24} />}
            </Box>
            <Flex direction="column">
              <Heading size="5" weight="bold" className="text-gray-900">
                {gateway.model_number || gateway.name}
              </Heading>
              <Text color="gray" size="2">
                Serial: {gateway.serial_number || "Not specified"} • ID: {gateway.name}
              </Text>
            </Flex>
          </Flex>

          {/* Approval Actions for Pending gateways */}
          {gateway.approval_status === "Pending" && (
            <Flex gap="3" p="4" justify="end" className="bg-gray-50 rounded-b-lg">
              <Button 
                variant="solid" 
                color="green" 
                onClick={handleApprove}
                disabled={isUpdating}
                size="2"
              >
                <FaCheck /> Approve
              </Button>
              <Button 
                variant="soft" 
                color="red" 
                onClick={() => setShowRejectDialog(true)}
                disabled={isUpdating}
                size="2"
              >
                <FaTimes /> Reject
              </Button>
            </Flex>
          )}
        </Card>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="mb-4">
            <Tabs.Trigger value="details">Details</Tabs.Trigger>
            <Tabs.Trigger value="connectivity">Connectivity</Tabs.Trigger>
            <Tabs.Trigger value="history">History</Tabs.Trigger>
          </Tabs.List>

          <ScrollArea type="auto" scrollbars="vertical" style={{ height: 'calc(100vh - 250px)' }}>
            <Box pr="4">
              {activeTab === "details" && (
                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                  <DetailCard title="Basic Information" icon={<FaInfoCircle />}>
                    <DetailItem label="Gateway Type" value={gateway.gateway_type} icon={<FaPlug />} />
                    <Separator size="1" />
                    <DetailItem label="Model Number" value={gateway.model_number} icon={<FaMicrochip />} />
                    <Separator size="1" />
                    <DetailItem label="Serial Number" value={gateway.serial_number} icon={<FaMicrochip />} />
                    <Separator size="1" />
                    <DetailItem label="Firmware Version" value={gateway.firmware_version} icon={<FaMicrochip />} />
                  </DetailCard>

                  <DetailCard title="Location" icon={<FaMapMarkerAlt />}>
                    <DetailItem label="Site Location" value={gateway.location} />
                    <Separator size="1" />
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
                    <Separator size="1" />
                    <DetailItem 
                      label="Transmissions" 
                      value={gateway.number_of_transmissions?.toLocaleString()}
                    />
                    <Separator size="1" />
                    <DetailItem 
                      label="Last Maintenance" 
                      value={formatDate(gateway.last_maintenance)}
                      icon={<FaTools />}
                    />
                  </DetailCard>

                  {gateway.notes && (
                    <DetailCard title="Notes" icon={<FaInfoCircle />}>
                      <Text className="whitespace-pre-line p-2 bg-gray-50 rounded text-gray-700">
                        {gateway.notes}
                      </Text>
                    </DetailCard>
                  )}
                </Grid>
              )}

              {activeTab === "connectivity" && (
                <Grid columns={{ initial: '1', md: '2' }} gap="4">
                  <DetailCard title="Network" icon={<FaNetworkWired />}>
                    <DetailItem label="IP Address" value={gateway.ip_address} icon={<FaWifi />} />
                    <Separator size="1" />
                    <DetailItem label="MAC Address" value={gateway.mac_address} icon={<FaNetworkWired />} />
                  </DetailCard>

                  <DetailCard title="Mobile" icon={<FaMobileAlt />}>
                    <DetailItem label="Network Provider" value={gateway.network_provider} icon={<FaSignal />} />
                    <Separator size="1" />
                    <DetailItem label="SIM Card Number" value={gateway.sim_card_number} icon={<FaMobileAlt />} />
                  </DetailCard>

                  <DetailCard title="Ports" icon={<FaUsb />}>
                    <DetailItem label="USB Port" value={gateway.usb_port} icon={<FaUsb />} />
                  </DetailCard>
                </Grid>
              )}

              {activeTab === "history" && (
                <Card>
                  <Text color="gray">History data will appear here</Text>
                </Card>
              )}
            </Box>
          </ScrollArea>
        </Tabs.Root>
      </Container>

      {/* Reject Dialog */}
      <Dialog.Root open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Reject Gateway</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Please provide a reason for rejecting this gateway.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="bold">
                Reason
              </Text>
              <TextArea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button 
              variant="solid" 
              color="red" 
              onClick={handleReject}
              disabled={!rejectReason || isUpdating || isNoting}
            >
              <FaTimes /> Confirm Reject
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default GatewayPage;