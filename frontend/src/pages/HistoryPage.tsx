import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Table,
  Spinner,
  Flex,
  Card,
  TextField,
  Select,
  Button,
} from '@radix-ui/themes';
import { useFrappeGetCall } from 'frappe-react-sdk';

interface SensorRead {
  sensor_id: string | null;
  sensor_type: string;
  temperature: string;
  humidity: string;
  voltage: string;
  signal_strength: string;
  sequence_number: string;
  gateway_id: string | null;
  relay_id: string;
  sensor_rssi: string;
  coordinates: string;
  timestamp: string;
}

const HistoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'sensor_id'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageLength, setPageLength] = useState(100);

  const {
    data,
    error,
    isLoading,
    mutate,
    isValidating,
  } = useFrappeGetCall<{ message: SensorRead[] }>('frappe.client.get_list', {
    doctype: 'Sensor Read',
    fields: [
      'sensor_id',
      'sensor_type',
      'temperature',
      'humidity',
      'voltage',
      'signal_strength',
      'sequence_number',
      'gateway_id',
      'relay_id',
      'sensor_rssi',
      'coordinates',
      'timestamp',
    ],
    order_by: `${sortBy} ${sortOrder}`,
    limit_page_length: pageLength,
  });

  const filteredReads = useMemo(() => {
    return (data?.message || []).filter((read) => {
      const sensorId = read.sensor_id?.toLowerCase() || '';
      const gatewayId = read.gateway_id?.toLowerCase() || '';
      return sensorId.includes(search.toLowerCase()) || gatewayId.includes(search.toLowerCase());
    });
  }, [data, search]);

  const handleLoadMore = () => {
    setPageLength((prev) => prev + 100);
  };

  useEffect(() => {
    mutate();
  }, [sortBy, sortOrder, pageLength]);

  if (isLoading && !data) {
    return (
      <Flex align="center" justify="center" height="100vh">
        <Spinner size="3" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex align="center" justify="center" height="100vh">
        <Text color="red">Error loading sensor reads: {error.message}</Text>
      </Flex>
    );
  }

  return (
    <Box p="4">
      <Heading size="6" mb="4">
        History
      </Heading>

      <Flex gap="3" mb="4" wrap="wrap">
        <Box style={{ flexGrow: 1, minWidth: '300px' }}>
          <TextField.Root
            placeholder="Search by Sensor ID or Gateway ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Select.Root value={sortBy} onValueChange={(val) => setSortBy(val as 'timestamp' | 'sensor_id')}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="timestamp">Sort by Timestamp</Select.Item>
            <Select.Item value="sensor_id">Sort by Sensor ID</Select.Item>
          </Select.Content>
        </Select.Root>
        <Select.Root value={sortOrder} onValueChange={(val) => setSortOrder(val as 'asc' | 'desc')}>
          <Select.Trigger />
          <Select.Content>
            <Select.Item value="desc">Descending</Select.Item>
            <Select.Item value="asc">Ascending</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Card>
        <Table.Root variant="surface" size="2">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Sensor ID</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Temperature</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Humidity</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Voltage</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Signal Strength</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Seq #</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Gateway</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Relay</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>RSSI</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Coordinates</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Timestamp</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredReads.map((read, index) => (
              <Table.Row key={index}>
                <Table.Cell>{read.sensor_id}</Table.Cell>
                <Table.Cell>{read.sensor_type}</Table.Cell>
                <Table.Cell>{read.temperature}</Table.Cell>
                <Table.Cell>{read.humidity}</Table.Cell>
                <Table.Cell>{read.voltage}</Table.Cell>
                <Table.Cell>{read.signal_strength}</Table.Cell>
                <Table.Cell>{read.sequence_number}</Table.Cell>
                <Table.Cell>{read.gateway_id}</Table.Cell>
                <Table.Cell>{read.relay_id}</Table.Cell>
                <Table.Cell>{read.sensor_rssi}</Table.Cell>
                <Table.Cell>{read.coordinates}</Table.Cell>
                <Table.Cell>{new Date(read.timestamp).toLocaleString()}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
        {data?.message && data.message.length >= pageLength && (
          <Flex justify="center" mt="4">
            <Button onClick={handleLoadMore} disabled={isValidating}>Load More</Button>
          </Flex>
        )}
      </Card>
    </Box>
  );
};

export default HistoryPage;