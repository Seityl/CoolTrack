// src/pages/gateways/GatewayPage.tsx
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
  Container
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
  FaCalendarAlt,
  FaInfoCircle,
  FaArrowLeft,
  FaHistory
} from "react-icons/fa";
import { useFrappeGetDoc } from "frappe-react-sdk";
import { useNavigate, useParams } from "react-router-dom";

interface SensorGateway {
  name: string;
  gateway_type: string;
  model_number?: string;
  serial_number?: string;
  status: "Active" | "Inactive" | "Maintenance" | "Decommissioned";
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

const statusConfig: Record<string, { icon: React.ReactNode, color: string }> = {
  Active: { icon: <FaPlug size={14} />, color: "green" },
  Inactive: { icon: <FaBatteryEmpty size={14} />, color: "gray" },
  Maintenance: { icon: <FaTools size={14} />, color: "orange" },
  Decommissioned: { icon: <FaBatteryEmpty size={14} />, color: "red" },
};

const GatewayPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: gateway, isLoading, error } = useFrappeGetDoc<SensorGateway>(
    "Sensor Gateway",
    id
  );

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

  const DetailRow = ({ label, value, icon }: { 
    label: string; 
    value?: string | number; 
    icon?: React.ReactNode 
  }) => (
    <Flex gap="3" align="center" py="2">
      <Box className="w-6 text-gray-400">{icon}</Box>
      <Text weight="medium" className="w-40 text-gray-600">{label}</Text>
      <Text className="flex-1">{value || "—"}</Text>
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
                    icon={gatewayTypeIcons[gateway.gateway_type] || <FaPlug size={14} />}
                  />
                  <Separator size="1" />
                  <DetailRow label="Model" value={gateway.model_number} />
                  <Separator size="1" />
                  <DetailRow label="Serial Number" value={gateway.serial_number} />
                  <Separator size="1" />
                  <DetailRow 
                    label="Installed On" 
                    value={formatDate(gateway.installation_date)}
                    icon={<FaCalendarAlt size={14} />}
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
                    icon={<FaMapMarkerAlt size={14} />}
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
                    icon={<FaTools size={14} />}
                  />
                  <Separator size="1" />
                  <DetailRow 
                    label="Last Heartbeat" 
                    value={formatDate(gateway.last_heartbeat)}
                    icon={<FaHistory size={14} />}
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
    </Box>
  );
};

export default GatewayPage;