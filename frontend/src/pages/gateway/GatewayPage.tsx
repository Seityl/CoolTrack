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

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  Active: { icon: <FaPlug size={14} />, color: "green" },
  Inactive: { icon: <FaBatteryEmpty size={14} />, color: "gray" },
  Maintenance: { icon: <FaTools size={14} />, color: "orange" },
  Decommissioned: { icon: <FaBatteryEmpty size={14} />, color: "red" },
};

const approvalStatusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
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
      // First update the approval status
      await updateApprovalStatus({
        doctype: "Sensor Gateway",
        name: gateway?.name,
        fieldname: "approval_status",
        value: "Rejected",
      });

      // Add a comment with the rejection reason
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

  if (isLoading) {
    return (
      <Flex justify="center" align="center" className="h-[60vh]">
        <Spinner size="3" />
      </Flex>
    );
  }

  if (error || !gateway) {
    return (
      <Container size="4" className="h-[60vh] flex items-center justify-center">
        <Card>
          <Flex direction="column" gap="4" align="center">
            <Text color="red" weight="bold">Error loading gateway details</Text>
            <Text>{error?.message || "Gateway not found"}</Text>
            <Button onClick={() => navigate('/gateways')}>
              <FaArrowLeft /> Return to Gateways
            </Button>
          </Flex>
        </Card>
      </Container>
    );
  }

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

  const DetailRow = ({
    label,
    value,
    vertical = false,
  }: {
    label: string;
    value?: string | number;
    vertical?: boolean;
  }) => (
    <Flex
      direction={vertical ? "column" : "row"}
      align={vertical ? "start" : "center"}
      gap={vertical ? "1" : "3"}
      py="2"
    >
      {vertical ? (
        <>
          <Text size="1" className="text-gray-500">
            {label}
          </Text>
          <Text size="2">{value || "—"}</Text>
        </>
      ) : (
        <>
          <Text weight="medium" className="w-40 text-gray-600">
            {label}
          </Text>
          <Text className="flex-1">{value || "—"}</Text>
        </>
      )}
    </Flex>
  );

  return (
    <Box width="100%" className="min-h-screen">
      {/* Header with back button */}
      <Box className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <Container size="4">
          <Flex justify="between" align="center">
            <Button variant="soft" onClick={() => navigate('/gateways')}>
              <FaArrowLeft /> All Gateways
            </Button>
            <Flex gap="3" align="center">
              <Badge 
                color={statusConfig[gateway.status].color as any}
                highContrast 
                className="uppercase"
              >
                <Flex gap="2" align="center">
                  {statusConfig[gateway.status].icon}
                  {gateway.status}
                </Flex>
              </Badge>
              <Badge 
                color={approvalStatusConfig[gateway.approval_status].color as any}
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
      <Container size="4" py="4">
        <Flex direction="column" gap="4">
          {/* Gateway Header */}
          <Card className="shadow-sm">
            <Flex gap="4" align="center" p="4">
              <Box className="p-3 bg-gray-50 rounded-lg">
                {gatewayTypeIcons[gateway.gateway_type] || <FaPlug size={24} />}
              </Box>
              <Flex direction="column">
                <Heading size="5" weight="bold">
                  {gateway.model_number || gateway.name}
                </Heading>
                <Text color="gray" size="2">
                  Serial: {gateway.serial_number || "Not specified"}
                </Text>
              </Flex>
            </Flex>

            {/* Approval Actions for Pending gateways */}
            {gateway.approval_status === "Pending" && (
              <Flex gap="3" p="4" justify="end">
                <Button 
                  variant="solid" 
                  color="green" 
                  onClick={handleApprove}
                  disabled={isUpdating}
                >
                  <FaCheck /> Approve
                </Button>
                <Button 
                  variant="soft" 
                  color="red" 
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isUpdating}
                >
                  <FaTimes /> Reject
                </Button>
              </Flex>
            )}

            <Separator size="4" />

            {/* Single Column Layout */}
            <Flex direction="column" gap="4" p="4">
              {/* Basic Information */}
              <Box>
                <SectionHeader title="Basic Information" icon={<FaInfoCircle />} />
                <Card variant="surface">
                  <DetailRow 
                    label="Gateway Type" 
                    value={gateway.gateway_type} 
                  />
                  <Separator size="1" />
                  <DetailRow label="Model" value={gateway.model_number} />
                  <Separator size="1" />
                  <DetailRow label="Serial Number" value={gateway.serial_number} />
                  <Separator size="1" />
                  <DetailRow 
                    label="Installed On" 
                    value={formatDate(gateway.installation_date)}
                  />
                </Card>
              </Box>

              {/* Location */}
              <Box>
                <SectionHeader title="Location" icon={<FaMapMarkerAlt />} />
                <Card variant="surface">
                  <DetailRow 
                    label="Site Location" 
                    value={gateway.location} 
                  />
                </Card>
              </Box>

              {/* Connectivity */}
              <Box>
                <SectionHeader title="Connectivity" icon={<FaNetworkWired />} />
                <Card variant="surface">
                  <DetailRow label="IP Address" value={gateway.ip_address} />
                  <Separator size="1" />
                  <DetailRow label="MAC Address" value={gateway.mac_address} />
                  <Separator size="1" />
                  <DetailRow label="Network Provider" value={gateway.network_provider} />
                  <Separator size="1" />
                  <DetailRow label="SIM Card" value={gateway.sim_card_number} />
                  <Separator size="1" />
                  <DetailRow label="USB Port" value={gateway.usb_port} />
                </Card>
              </Box>

              {/* Metadata */}
              <Box>
                <SectionHeader title="Metadata" icon={<FaMicrochip />} />
                <Card variant="surface">
                  <DetailRow label="Firmware Version" value={gateway.firmware_version} />
                  <Separator size="1" />
                  <DetailRow 
                    label="Transmissions" 
                    value={gateway.number_of_transmissions?.toLocaleString()} 
                  />
                  <Separator size="1" />
                  <DetailRow 
                    label="Last Maintenance" 
                    value={formatDate(gateway.last_maintenance)}
                  />
                  <Separator size="1" />
                  <DetailRow 
                    label="Last Heartbeat" 
                    value={formatDate(gateway.last_heartbeat)}
                    vertical
                  />
                </Card>
              </Box>

              {/* Notes Section */}
              {gateway.notes && (
                <Box>
                  <SectionHeader title="Notes" icon={<FaInfoCircle />} />
                  <Card variant="surface">
                    <Text className="whitespace-pre-line p-3">{gateway.notes}</Text>
                  </Card>
                </Box>
              )}
            </Flex>
          </Card>
        </Flex>
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