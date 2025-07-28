import {
  Box,
  Flex,
  Grid,
  Card,
  Text,
  Heading,
  Badge,
  Spinner,
  Button,
  Separator,
  Dialog,
  TextField,
  Select,
  TextArea,
  Table,
  Tabs,
  Tooltip,
  ScrollArea
} from "@radix-ui/themes";
import {
  FaPlus,
  FaEnvelope,
  FaMobile,
  FaBell as FaSystemNotification,
  FaInfoCircle,
  FaCode,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaBell,
  FaSync,
  FaArrowLeft,
  FaUser,
  FaCog,
  FaEye
} from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import { useFrappeGetDocList, useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeDeleteDoc } from "frappe-react-sdk";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Alert {
  name: string;
  subject: string;
  enabled: boolean;
  channel: 'Email' | 'SMS' | 'System Notification';
  event: string;
  creation: string;
  document_type: string;
  message: string;
  condition: string;
  send_system_notification: boolean;
  recipients?: {
    receiver_by_role: string;
    condition: string;
  }[];
}

interface DocumentType {
  name: string;
}

interface Role {
  name: string;
}

interface Condition {
  field: string;
  operator: string;
  value: string;
}

const channelIconMap: Record<string, React.ReactNode> = {
  'Email': <FaEnvelope size={16} color="#10B981" />,
  'SMS': <FaMobile size={16} color="#3B82F6" />,
  'System Notification': <FaSystemNotification size={16} color="#F59E0B" />,
};

const channelColorMap: Record<string, "green" | "blue" | "amber"> = {
  'Email': "green",
  'SMS': "blue", 
  'System Notification': "amber",
};

const AlertPage = () => {
  const { id } = useParams<{ id: string }>();
  console.log('Alert Name:', id);
  const decodedid = decodeURIComponent(id || 'default-alert-name');
  console.log('Decoded Alert Name:', decodedid);
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [alertData, setAlertData] = useState<Alert | null>(null);
  const [updatedAlert, setUpdatedAlert] = useState<Partial<Alert>>({});
  const [newRecipient, setNewRecipient] = useState({
    receiver_by_role: '',
    condition: ''
  });
  const [newCondition, setNewCondition] = useState<Condition>({
    field: '',
    operator: '==',
    value: ''
  });
  const [showJinjaHelp, setShowJinjaHelp] = useState<boolean>(false);

  // Fetch alert data
  const { data: alert, isLoading, error, mutate } = useFrappeGetDocList<Alert>('Notification', {
    fields: ['name', 'subject', 'enabled', 'channel', 'event', 'creation', 
            'document_type', 'message', 'condition', 'send_system_notification'],
    filters: [['name', '=', id || '']],
    limit: 1
  });

  // Fetch recipients for the alert
  const { data: recipients } = useFrappeGetDocList<{receiver_by_role: string, condition: string}>(
    'Notification Recipient', 
    {
      fields: ['receiver_by_role', 'condition'],
      filters: [['parent', '=', id || '']]
    }
  );

  // Fetch document types for dropdown
  const { data: documentTypes } = useFrappeGetDocList<DocumentType>('DocType', {
    fields: ['name'],
    filters: [
      ['name', 'in', ['Sensor', 'Sensor Gateway']],
      ['istable', '=', 0]
    ]
  });
  
  // Fetch roles for dropdown
  const { data: roles } = useFrappeGetDocList<Role>('Role', {
    fields: ['name'],
    filters: [
      ['name', 'in', ['Administrator', 'System Manager', 'Maintenance Manager', 'Maintenance User']]
    ]
  });

  // Update and delete mutations
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const { deleteDoc, loading: deleting } = useFrappeDeleteDoc();

  const handleRefresh = () => {
    mutate();
  };

  useEffect(() => {
    if (alert && alert.length > 0) {
      setAlertData(alert[0]);
      setUpdatedAlert(alert[0]);
    }
  }, [alert]);

  const handleUpdateAlert = async () => {
    if (!id) return;
    
    try {
      await updateDoc('Notification', id, updatedAlert);
      setEditMode(false);
      handleRefresh();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const handleDeleteAlert = async () => {
    if (!id) return;
    
    try {
      await deleteDoc('Notification', id);
      navigate('/alerts');
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const toggleAlertStatus = async () => {
    if (!id || !alertData) return;
    
    try {
      await updateDoc('Notification', id, {
        enabled: !alertData.enabled
      });
      setAlertData(prev => prev ? {...prev, enabled: !prev.enabled} : null);
      handleRefresh();
    } catch (error) {
      console.error('Error toggling alert status:', error);
    }
  };

  const addRecipient = async () => {
    if (!id || !newRecipient.receiver_by_role) return;
    
    try {
      await updateDoc('Notification', id, {
        recipients: [...(alertData?.recipients || []), newRecipient]
      });
      setNewRecipient({ receiver_by_role: '', condition: '' });
      handleRefresh();
    } catch (error) {
      console.error('Error adding recipient:', error);
    }
  };

  const removeRecipient = async (role: string) => {
    if (!id) return;
    
    try {
      await updateDoc('Notification', id, {
        recipients: alertData?.recipients?.filter(r => r.receiver_by_role !== role)
      });
      handleRefresh();
    } catch (error) {
      console.error('Error removing recipient:', error);
    }
  };

  const parseConditions = (conditionString: string): Condition[] => {
    if (!conditionString) return [];
    
    // Simple parser for demo - in production you'd want something more robust
    const conditions = conditionString.split(' and ');
    return conditions.map(cond => {
      const parts = cond.trim().split(/\s+/);
      return {
        field: parts[0].replace('doc.', ''),
        operator: parts[1],
        value: parts[2].replace(/"/g, '')
      };
    });
  };

  const channelIcons = {
    'Email': <FaEnvelope />,
    'SMS': <FaMobile />,
    'System Notification': <FaSystemNotification />
  };

  const eventOptions = [
    { value: 'New', label: 'Creation' },
    { value: 'Cancel', label: 'Rejection' },
    { value: 'Value Change', label: 'Value Change' },
    { value: 'Custom', label: 'Custom Event' }
  ];

  const operatorOptions = [
    { value: '==', label: 'equals' },
    { value: '!=', label: 'not equals' },
    { value: '>', label: 'greater than' },
    { value: '<', label: 'less than' },
    { value: '>=', label: 'greater than or equal' },
    { value: '<=', label: 'less than or equal' },
    { value: 'in', label: 'in list' },
    { value: 'not in', label: 'not in list' }
  ];

  const commonConditions = [
    { 
      label: 'Status is Active', 
      value: 'doc.status == "Active"' 
    },
    { 
      label: 'Value exceeds threshold', 
      value: 'doc.value > 100' 
    },
    { 
      label: 'Date is in the past', 
      value: 'doc.date < frappe.utils.nowdate()' 
    },
    { 
      label: 'Field is not empty', 
      value: 'doc.fieldname' 
    },
  ];

  if (isLoading || !alertData) {
    return (
      <Box p="4" style={{ background: 'var(--gray-1)' }}>
        <Card style={{ border: '1px solid var(--gray-6)', borderRadius: '12px' }}>
          <Flex justify="center" align="center" py="8" gap="3">
            <FiRefreshCw 
              className="animate-spin" 
              size={20} 
              color="var(--blue-9)"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <Text size="3" weight="medium" color="gray">
              Loading alert details...
            </Text>
          </Flex>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="4" style={{ background: 'var(--gray-1)' }}>
        <Card 
          variant="surface" 
          style={{ 
            border: '1px solid var(--red-6)',
            borderRadius: '12px',
            background: 'var(--red-2)'
          }}
        >
          <Flex direction="column" align="center" gap="3" py="6">
            <Box style={{ opacity: 0.8 }}>
              <FaBell size={24} color="var(--red-9)" />
            </Box>
            <Text color="red" weight="bold" size="3">Failed to load alert</Text>
            <Text color="red" size="2" style={{ textAlign: 'center', maxWidth: '400px' }}>
              {error.message}
            </Text>
            <Button 
              variant="soft" 
              color="red" 
              onClick={handleRefresh}
              style={{ borderRadius: '8px' }}
            >
              <Flex align="center" gap="2">
                <FaSync size={14} />
                Retry
              </Flex>
            </Button>
          </Flex>
        </Card>
      </Box>
    );
  }

  const conditions = parseConditions(alertData.condition);

  return (
    <Box p="4" style={{ background: 'var(--gray-1)' }}>
      {/* Enhanced Header */}
      <Flex justify="between" align="center" mb="6">
        <Flex align="center" gap="4">
          <Button 
            variant="soft" 
            onClick={() => navigate('/alerts')}
            style={{ borderRadius: '8px' }}
          >
            <FaArrowLeft size={14} />
          </Button>
          <Flex align="center" gap="3">
            <Box 
              style={{ 
                padding: '12px',
                borderRadius: '12px',
                background: alertData.enabled ? 'var(--green-3)' : 'var(--gray-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaBell size={24} color={alertData.enabled ? "var(--green-11)" : "var(--gray-11)"} />
            </Box>
            <Box>
              <Text size="1" color="gray" weight="medium" style={{ letterSpacing: '0.5px' }}>
                ALERT DETAILS
              </Text>
              <Heading size="7" weight="bold" style={{ marginTop: '2px' }}>
                {alertData.subject}
              </Heading>
            </Box>
          </Flex>
        </Flex>
        <Flex gap="3" align="center">
          <Text size="2" color="gray">
            {new Date().toLocaleString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <Button
            variant="soft"
            onClick={handleRefresh}
            disabled={isLoading}
            style={{ borderRadius: '8px' }}
          >
            <Flex align="center" gap="2">
              {isLoading ? <FiRefreshCw className="animate-spin" /> : <FaSync />}
              Refresh
            </Flex>
          </Button>
          <Button 
            variant="soft" 
            color={alertData.enabled ? "green" : "gray"} 
            onClick={toggleAlertStatus}
            disabled={updating}
            style={{ borderRadius: '8px' }}
          >
            {alertData.enabled ? <FaToggleOn className="mr-2" /> : <FaToggleOff className="mr-2" />}
            {alertData.enabled ? "Active" : "Inactive"}
          </Button>
          {editMode ? (
            <>
              <Button 
                variant="soft" 
                color="gray" 
                onClick={() => setEditMode(false)}
                style={{ borderRadius: '8px' }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateAlert} 
                disabled={updating}
                style={{ borderRadius: '8px' }}
              >
                {updating ? <Spinner /> : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="soft" 
                onClick={() => setEditMode(true)}
                style={{ borderRadius: '8px' }}
              >
                <FaEdit className="mr-2" /> Edit
              </Button>
              <Button 
                color="red" 
                onClick={handleDeleteAlert} 
                disabled={deleting}
                style={{ borderRadius: '8px' }}
              >
                {deleting ? <Spinner /> : <FaTrash className="mr-2" />}
                Delete
              </Button>
            </>
          )}
        </Flex>
      </Flex>

      {/* Status Badge Row */}
      <Flex gap="3" mb="6">
        <Badge 
          color={alertData.enabled ? "green" : "gray"} 
          variant="soft"
          style={{ 
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            letterSpacing: '0.3px'
          }}
        >
          {alertData.enabled ? "Active" : "Inactive"}
        </Badge>
        <Badge 
          color={channelColorMap[alertData.channel]} 
          variant="soft"
          style={{ 
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            letterSpacing: '0.3px'
          }}
        >
          <Flex align="center" gap="1">
            {channelIconMap[alertData.channel]}
            {alertData.channel}
          </Flex>
        </Badge>
        <Badge 
          color="blue" 
          variant="soft"
          style={{ 
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            letterSpacing: '0.3px'
          }}
        >
          {alertData.document_type}
        </Badge>
      </Flex>

      {/* Enhanced Alert Details Grid */}
      <Grid columns={{ initial: '1', md: '2' }} gap="6">
        {/* Basic Info Card */}
        <Card 
          style={{
            borderRadius: '12px',
            background: 'var(--color-surface)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--gray-6)'
          }}
        >
          <Flex align="center" gap="3" mb="4">
            <Box 
              style={{ 
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--blue-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaInfoCircle size={18} color="var(--blue-11)" />
            </Box>
            <Heading size="5" weight="bold">Alert Details</Heading>
          </Flex>
          
          {editMode ? (
            <Flex direction="column" gap="4">
              <Box>
                <Text size="2" weight="medium" mb="2">Subject</Text>
                <TextField.Root
                  placeholder="Alert Subject" 
                  value={updatedAlert.subject || ''}
                  onChange={(e) => setUpdatedAlert({...updatedAlert, subject: e.target.value})}
                  style={{ borderRadius: '8px' }}
                />
              </Box>
              
              <Box>
                <Text size="2" weight="medium" mb="2">Document Type</Text>
                <Select.Root 
                  value={updatedAlert.document_type || ''}
                  onValueChange={(value) => setUpdatedAlert({...updatedAlert, document_type: value})}
                >
                  <Select.Trigger placeholder="Select Document Type" />
                  <Select.Content>
                    {documentTypes?.map(docType => (
                      <Select.Item key={docType.name} value={docType.name}>
                        {docType.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
              
              <Box>
                <Text size="2" weight="medium" mb="2">Channel</Text>
                <Select.Root 
                  value={updatedAlert.channel || 'Email'}
                  onValueChange={(value) => setUpdatedAlert({...updatedAlert, channel: value as 'Email' | 'SMS' | 'System Notification'})}
                >
                  <Select.Trigger placeholder="Select Channel" />
                  <Select.Content>
                    <Select.Item value="Email">Email</Select.Item>
                    <Select.Item value="SMS">SMS</Select.Item>
                    <Select.Item value="System Notification">System Notification</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>
              
              <Box>
                <Text size="2" weight="medium" mb="2">Trigger Event</Text>
                <Select.Root 
                  value={updatedAlert.event || 'New'}
                  onValueChange={(value) => setUpdatedAlert({...updatedAlert, event: value})}
                >
                  <Select.Trigger placeholder="Select Trigger Event" />
                  <Select.Content>
                    {eventOptions.map(event => (
                      <Select.Item key={event.value} value={event.value}>
                        {event.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>
          ) : (
            <Flex direction="column" gap="4">
              <Flex align="center" justify="between">
                <Text size="2" color="gray" weight="medium">Document Type</Text>
                <Box 
                  style={{ 
                    background: 'var(--blue-2)',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}
                >
                  <Text size="2" weight="bold" style={{ color: 'var(--blue-11)' }}>
                    {alertData.document_type}
                  </Text>
                </Box>
              </Flex>
              
              <Flex align="center" justify="between">
                <Text size="2" color="gray" weight="medium">Channel</Text>
                <Flex align="center" gap="2">
                  <Text 
                    size="2" 
                    weight="medium"
                    style={{ 
                      color: `var(--${channelColorMap[alertData.channel]}-11)`,
                      textTransform: 'capitalize'
                    }}
                  >
                    {alertData.channel}
                  </Text>
                  <Box style={{ display: 'flex', alignItems: 'center' }}>
                    {channelIconMap[alertData.channel]}
                  </Box>
                </Flex>
              </Flex>
              
              <Flex align="center" justify="between">
                <Text size="2" color="gray" weight="medium">Trigger</Text>
                <Box 
                  style={{ 
                    background: 'var(--gray-3)',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}
                >
                  <Text size="2" weight="bold">
                    {eventOptions.find(e => e.value === alertData.event)?.label || alertData.event}
                  </Text>
                </Box>
              </Flex>
              
              <Flex direction="column" gap="1">
                <Text size="2" color="gray" weight="medium">Created</Text>
                <Text 
                  size="2" 
                  weight="medium"
                  style={{ 
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '11px',
                    background: 'var(--gray-2)',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    color: 'var(--gray-11)'
                  }}
                >
                  {new Date(alertData.creation).toLocaleString()}
                </Text>
              </Flex>
            </Flex>
          )}
        </Card>

        {/* Message Card */}
        <Card 
          style={{
            borderRadius: '12px',
            background: 'var(--color-surface)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--gray-6)'
          }}
        >
          <Flex justify="between" align="center" mb="4">
            <Flex align="center" gap="3">
              <Box 
                style={{ 
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'var(--amber-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaCode size={18} color="var(--amber-11)" />
              </Box>
              <Heading size="5" weight="bold">Message Template</Heading>
            </Flex>
            <Tooltip content="Show Jinja2 Help">
              <Button 
                variant="ghost" 
                size="1" 
                onClick={() => setShowJinjaHelp(!showJinjaHelp)}
                style={{ borderRadius: '6px' }}
              >
                <FaInfoCircle />
              </Button>
            </Tooltip>
          </Flex>
          
          {editMode ? (
            <>
              {showJinjaHelp && (
                <Card 
                  mb="4" 
                  style={{ 
                    background: 'var(--blue-2)', 
                    border: '1px solid var(--blue-6)',
                    borderRadius: '8px'
                  }}
                >
                  <Heading size="3" mb="2">Jinja2 Template Help</Heading>
                  <Text mb="2">You can use these variables and filters in your templates:</Text>
                  
                  <Grid columns="2" gap="3">
                    <Card style={{ background: 'var(--color-surface)' }}>
                      <Heading size="3">Variables</Heading>
                      <Text as="div" mb="2" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px' }}>
                        <code>doc</code> - The document object<br />
                        <code>frappe.utils.nowdate()</code> - Current date<br />
                        <code>frappe.utils.get_url()</code> - System URL
                      </Text>
                    </Card>
                    
                    <Card style={{ background: 'var(--color-surface)' }}>
                      <Heading size="3">Common Examples</Heading>
                      {commonConditions.map((cond, i) => (
                        <Button 
                          key={i} 
                          variant="soft" 
                          onClick={() => setUpdatedAlert({
                            ...updatedAlert,
                            message: updatedAlert.message ? 
                              `${updatedAlert.message}\n${cond.value}` : cond.value
                          })}
                          className="mb-2"
                          style={{ borderRadius: '6px' }}
                        >
                          <FaCode className="mr-2" /> {cond.label}
                        </Button>
                      ))}
                    </Card>
                  </Grid>
                </Card>
              )}
              
              <TextArea 
                placeholder={`Example: Alert for {{ doc.name }}\nStatus: {{ doc.status }}\nValue: {{ doc.value }}`}
                rows={8}
                value={updatedAlert.message || ''}
                onChange={(e) => setUpdatedAlert({...updatedAlert, message: e.target.value})}
                style={{ borderRadius: '8px' }}
              />
            </>
          ) : (
            <Card 
              style={{ 
                background: 'var(--gray-2)', 
                border: '1px solid var(--gray-5)',
                borderRadius: '8px'
              }}
            >
              <ScrollArea style={{ maxHeight: '300px' }}>
                <Text 
                  style={{ 
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {alertData.message || 'No message template defined'}
                </Text>
              </ScrollArea>
            </Card>
          )}
        </Card>

        {/* Conditions Card */}
        <Card 
          style={{
            borderRadius: '12px',
            background: 'var(--color-surface)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--gray-6)'
          }}
        >
          <Flex align="center" gap="3" mb="4">
            <Box 
              style={{ 
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--green-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaCog size={18} color="var(--green-11)" />
            </Box>
            <Heading size="5" weight="bold">Conditions</Heading>
          </Flex>
          
          {editMode ? (
            <>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Field</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Operator</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Value</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                
                <Table.Body>
                  {conditions.map((condition, index) => (
                    <Table.Row key={index}>
                      <Table.Cell>
                        <Badge variant="soft" color="blue">
                          {condition.field}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant="soft" color="gray">
                          {condition.operator}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant="soft" color="amber">
                          {condition.value}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Button 
                          variant="ghost" 
                          color="red" 
                          onClick={() => {
                            const newConditions = [...conditions];
                            newConditions.splice(index, 1);
                            setUpdatedAlert({
                              ...updatedAlert,
                              condition: newConditions.map(cond => 
                                `doc.${cond.field} ${cond.operator} ${isNaN(Number(cond.value)) ? `"${cond.value}"` : cond.value}`
                              ).join(' and ')
                            });
                          }}
                          style={{ borderRadius: '6px' }}
                        >
                          Remove
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  
                  <Table.Row>
                    <Table.Cell>
                      <TextField.Root
                        placeholder="Field name"
                        value={newCondition.field}
                        onChange={(e) => setNewCondition({
                          ...newCondition, 
                          field: e.target.value
                        })}
                        style={{ borderRadius: '6px' }}
                      />
                    </Table.Cell>
                    
                    <Table.Cell>
                      <Select.Root 
                        value={newCondition.operator}
                        onValueChange={(value) => setNewCondition({
                          ...newCondition, 
                          operator: value
                        })}
                      >
                        <Select.Trigger />
                        <Select.Content>
                          {operatorOptions.map(op => (
                            <Select.Item key={op.value} value={op.value}>
                              {op.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Table.Cell>
                    
                    <Table.Cell>
                      <TextField.Root
                        placeholder="Value"
                        value={newCondition.value}
                        onChange={(e) => setNewCondition({
                          ...newCondition, 
                          value: e.target.value
                        })}
                        style={{ borderRadius: '6px' }}
                      />
                    </Table.Cell>
                    
                    <Table.Cell>
                      <Button 
                        onClick={() => {
                          const updatedConditions = [...conditions, newCondition];
                          setUpdatedAlert({
                            ...updatedAlert,
                            condition: updatedConditions.map(cond => 
                              `doc.${cond.field} ${cond.operator} ${isNaN(Number(cond.value)) ? `"${cond.value}"` : cond.value}`
                            ).join(' and ')
                          });
                          setNewCondition({ field: '', operator: '==', value: '' });
                        }}
                        style={{ borderRadius: '6px' }}
                      >
                        Add
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
              
              {conditions.length > 0 && (
                <Card 
                  mt="4" 
                  style={{ 
                    background: 'var(--gray-2)', 
                    border: '1px solid var(--gray-5)',
                    borderRadius: '8px'
                  }}
                >
                  <Heading size="2" mb="2">Generated Condition</Heading>
                  <Text 
                    as="div" 
                    style={{ 
                      fontFamily: 'var(--font-mono, monospace)', 
                      fontSize: '11px',
                      background: 'var(--color-surface)',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--gray-6)'
                    }}
                  >
                    {updatedAlert.condition}
                  </Text>
                </Card>
              )}
            </>
          ) : (
            <Flex direction="column" gap="3">
              {conditions.length > 0 ? (
                conditions.map((condition, index) => (
                  <Card 
                    key={index} 
                    style={{ 
                      background: 'var(--gray-2)', 
                      border: '1px solid var(--gray-5)',
                      borderRadius: '8px'
                    }}
                  >
                    <Flex gap="3" align="center">
                      <Badge variant="soft" color="blue" style={{ fontSize: '11px' }}>
                        {condition.field}
                      </Badge>
                      <Badge variant="soft" color="gray" style={{ fontSize: '11px' }}>
                        {condition.operator}
                      </Badge>
                      <Badge variant="soft" color="amber" style={{ fontSize: '11px' }}>
                        {condition.value}
                      </Badge>
                    </Flex>
                  </Card>
                ))
              ) : (
                <Card 
                  style={{ 
                    background: 'var(--gray-2)', 
                    border: '1px dashed var(--gray-6)',
                    borderRadius: '8px'
                  }}
                >
                  <Flex direction="column" align="center" gap="2" py="4">
                    <Box style={{ opacity: 0.6 }}>
                      <FaCog size={24} color="var(--gray-9)" />
                    </Box>
                    <Text color="gray" size="2" weight="medium">
                      No conditions defined
                    </Text>
                  </Flex>
                </Card>
              )}
            </Flex>
          )}
        </Card>

        {/* Recipients Card */}
        <Card 
          style={{
            borderRadius: '12px',
            background: 'var(--color-surface)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--gray-6)'
          }}
        >
          <Flex align="center" gap="3" mb="4">
            <Box 
              style={{ 
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--violet-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaUser size={18} color="var(--violet-11)" />
            </Box>
            <Heading size="5" weight="bold">Recipients</Heading>
          </Flex>
          
          {editMode ? (
            <>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Condition</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                
                <Table.Body>
                  {(updatedAlert.recipients || []).map((recipient, index) => (
                    <Table.Row key={index}>
                      <Table.Cell>
                        <Badge variant="soft" color="violet">
                          {recipient.receiver_by_role}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {recipient.condition || 'No condition'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Button 
                          variant="ghost" 
                          color="red" 
                          onClick={() => {
                            const newRecipients = [...(updatedAlert.recipients || [])];
                            newRecipients.splice(index, 1);
                            setUpdatedAlert({
                              ...updatedAlert,
                              recipients: newRecipients
                            });
                          }}
                          style={{ borderRadius: '6px' }}
                        >
                          Remove
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  
                  <Table.Row>
                    <Table.Cell>
                      <Select.Root
                        value={newRecipient.receiver_by_role}
                        onValueChange={(value) => setNewRecipient({
                          ...newRecipient,
                          receiver_by_role: value
                        })}
                      >
                        <Select.Trigger placeholder="Select Role" />
                        <Select.Content>
                          {roles?.map(role => (
                            <Select.Item key={role.name} value={role.name}>
                              {role.name}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Table.Cell>
                    
                    <Table.Cell>
                      <TextField.Root
                        placeholder="Condition (optional)"
                        value={newRecipient.condition}
                        onChange={(e) => setNewRecipient({
                          ...newRecipient,
                          condition: e.target.value
                        })}
                        style={{ borderRadius: '6px' }}
                      />
                    </Table.Cell>
                    
                    <Table.Cell>
                      <Button 
                        onClick={() => {
                          setUpdatedAlert({
                            ...updatedAlert,
                            recipients: [...(updatedAlert.recipients || []), newRecipient]
                          });
                          setNewRecipient({ receiver_by_role: '', condition: '' });
                        }} 
                        disabled={!newRecipient.receiver_by_role}
                        style={{ borderRadius: '6px' }}
                      >
                        Add
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
            </>
          ) : (
            <Flex direction="column" gap="3">
              {(alertData.recipients || recipients || []).length > 0 ? (
                (alertData.recipients || recipients || []).map((recipient, index) => (
                  <Card 
                    key={index} 
                    style={{ 
                      background: 'var(--violet-2)', 
                      border: '1px solid var(--violet-5)',
                      borderRadius: '8px'
                    }}
                  >
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="2">
                        <FaUser size={14} color="var(--violet-11)" />
                        <Text weight="bold" style={{ color: 'var(--violet-11)' }}>
                          {recipient.receiver_by_role}
                        </Text>
                      </Flex>
                      <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
                        {recipient.condition || 'No condition'}
                      </Text>
                    </Flex>
                  </Card>
                ))
              ) : (
                <Card 
                  style={{ 
                    background: 'var(--gray-2)', 
                    border: '1px dashed var(--gray-6)',
                    borderRadius: '8px'
                  }}
                >
                  <Flex direction="column" align="center" gap="2" py="4">
                    <Box style={{ opacity: 0.6 }}>
                      <FaUser size={24} color="var(--gray-9)" />
                    </Box>
                    <Text color="gray" size="2" weight="medium">
                      No recipients defined
                    </Text>
                  </Flex>
                </Card>
              )}
            </Flex>
          )}
        </Card>
      </Grid>
    </Box>
  );
};

export default AlertPage;