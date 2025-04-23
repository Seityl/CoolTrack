import React from "react";
import { Box, Flex, Text, Card, Heading, Link, Grid } from "@radix-ui/themes";
import {
  FaEthernet,
  FaPlug,
  FaSignal,
  FaUsb,
  FaBatteryEmpty,
  FaPauseCircle,
  FaMapMarkerAlt,
  FaNetworkWired,
  FaMicrochip,
  FaInfoCircle,
} from "react-icons/fa";
import { useFrappeGetDocList, useFrappeGetDoc } from "frappe-react-sdk";
import { FiRefreshCw } from "react-icons/fi";
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

const iconMap: Record<string, React.ReactNode> = {
  LTE: <FaSignal size={20} />,
  Ethernet: <FaEthernet size={20} />,
  USB: <FaUsb size={20} />,
  IoT: <FaPlug size={20} />,
  SS: <FaEthernet size={20} />,
  WSA: <FaUsb size={20} />,
};

const statusIconMap: Record<string, React.ReactNode> = {
  Active: <FaPlug size={16} color="green" />,
  Inactive: <FaBatteryEmpty size={16} color="gray" />,
  Maintenance: <FaPauseCircle size={16} color="orange" />,
  Decommissioned: <FaBatteryEmpty size={16} color="red" />,
};

const GatewayList: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Fetch all gateways for the list view
  const { data: gateways, isLoading, error } = useFrappeGetDocList<SensorGateway>(
    "Sensor Gateway",
    {
      fields: [
        "name",
        "gateway_type",
        "model_number",
        "serial_number",
        "status",
        "last_heartbeat",
        "location",
      ],
    }
  );

  // Fetch single gateway details when ID is present
  const { data: gatewayDetails } = useFrappeGetDoc<SensorGateway>(
    "Sensor Gateway",
    id
  );

  const formatLabel = (gateway: SensorGateway): string => {
    const label = gateway.model_number || gateway.name;
    return `${label} - ${gateway.serial_number ?? "No SN"}`;
  };

  const renderGatewayList = (): React.ReactNode => {
    return (
      <Flex wrap="wrap" gap="3">
        {gateways?.map((gateway) => (
          <Card key={gateway.name} style={{ width: "280px" }}>
            <Link onClick={() => navigate(`/gateways/${gateway.name}`)}>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  {iconMap[gateway.gateway_type] || <FaPlug size={20} />}
                  <Heading size="3">{formatLabel(gateway)}</Heading>
                </Flex>

                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <Text size="2" color="gray">
                      Status:
                    </Text>
                    <Text size="2">{gateway.status}</Text>
                    {statusIconMap[gateway.status]}
                  </Flex>
                  <Flex align="center" gap="2">
                    <Text size="2" color="gray">
                      Heartbeat:
                    </Text>
                    <Text size="2">
                      {gateway.last_heartbeat
                        ? new Date(gateway.last_heartbeat).toLocaleString()
                        : "Unavailable"}
                    </Text>
                  </Flex>
                  {gateway.location && (
                    <Flex align="center" gap="2">
                      <FaMapMarkerAlt size={12} />
                      <Text size="2" color="gray">
                        {gateway.location}
                      </Text>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </Link>
          </Card>
        ))}
      </Flex>
    );
  };

  const renderGatewayDetails = (): React.ReactNode => {
    if (!gatewayDetails) return null;

    return (
      <Card>
        <Flex direction="column" gap="4">
          <Flex align="center" gap="3">
            {iconMap[gatewayDetails.gateway_type] || <FaPlug size={24} />}
            <Heading size="5">{formatLabel(gatewayDetails)}</Heading>
            <Flex align="center" gap="2" ml="auto">
              <Text>{gatewayDetails.status}</Text>
              {statusIconMap[gatewayDetails.status]}
            </Flex>
          </Flex>

          <Grid columns="2" gap="4">
            {/* Basic Information */}
            <Flex direction="column" gap="2">
              <Heading size="3" mb="2">
                <FaInfoCircle /> Basic Information
              </Heading>
              <DetailItem label="Gateway Type" value={gatewayDetails.gateway_type} />
              <DetailItem label="Model Number" value={gatewayDetails.model_number} />
              <DetailItem label="Serial Number" value={gatewayDetails.serial_number} />
              <DetailItem 
                label="Installation Date" 
                value={gatewayDetails.installation_date 
                  ? new Date(gatewayDetails.installation_date).toLocaleDateString() 
                  : undefined} 
              />
            </Flex>

            {/* Connectivity */}
            <Flex direction="column" gap="2">
              <Heading size="3" mb="2">
                <FaNetworkWired /> Connectivity
              </Heading>
              <DetailItem label="IP Address" value={gatewayDetails.ip_address} />
              <DetailItem label="MAC Address" value={gatewayDetails.mac_address} />
              <DetailItem label="Network Provider" value={gatewayDetails.network_provider} />
              <DetailItem label="SIM Card" value={gatewayDetails.sim_card_number} />
              <DetailItem label="USB Port" value={gatewayDetails.usb_port} />
            </Flex>

            {/* Location */}
            <Flex direction="column" gap="2">
              <Heading size="3" mb="2">
                <FaMapMarkerAlt /> Location
              </Heading>
              <DetailItem label="Location" value={gatewayDetails.location} />
            </Flex>

            {/* Metadata */}
            <Flex direction="column" gap="2">
              <Heading size="3" mb="2">
                <FaMicrochip /> Metadata
              </Heading>
              <DetailItem label="Firmware Version" value={gatewayDetails.firmware_version} />
              <DetailItem 
                label="Transmissions" 
                value={gatewayDetails.number_of_transmissions?.toString()} 
              />
              <DetailItem 
                label="Last Maintenance" 
                value={gatewayDetails.last_maintenance 
                  ? new Date(gatewayDetails.last_maintenance).toLocaleDateString() 
                  : undefined} 
              />
              <DetailItem 
                label="Last Heartbeat" 
                value={gatewayDetails.last_heartbeat 
                  ? new Date(gatewayDetails.last_heartbeat).toLocaleString() 
                  : undefined} 
              />
            </Flex>
          </Grid>

          {/* Notes */}
          {gatewayDetails.notes && (
            <Flex direction="column" gap="2">
              <Heading size="3">Notes</Heading>
              <Text>{gatewayDetails.notes}</Text>
            </Flex>
          )}
        </Flex>
      </Card>
    );
  };

  const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
    if (!value) return null;
    return (
      <Flex gap="2">
        <Text weight="bold" size="2" style={{ minWidth: '120px' }}>{label}:</Text>
        <Text size="2">{value}</Text>
      </Flex>
    );
  };

  return (
    <Box p="4">
      <Flex justify="between" align="center" mb="4">
        <Text size="5" weight="bold">
          Sensor Gateways
        </Text>
        <Text size="2">Local Time: {new Date().toLocaleTimeString()}</Text>
      </Flex>

      {isLoading && (
        <Flex justify="center" align="center" py="6">
          <FiRefreshCw className="animate-spin" /> Loading gateways…
        </Flex>
      )}

      {error && (
        <Text color="red">Failed to load gateways: {error.message}</Text>
      )}

      {id ? (
        <Flex direction="column" gap="4">
          <Link onClick={() => navigate('/gateways')}>← Back to Gateways</Link>
          {renderGatewayDetails()}
        </Flex>
      ) : (
        renderGatewayList()
      )}
    </Box>
  );
};

export default GatewayList;