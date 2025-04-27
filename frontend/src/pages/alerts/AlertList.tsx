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
  Tooltip
} from "@radix-ui/themes";
import {
  FaPlus,
  FaEnvelope,
  FaMobile,
  FaBell as FaSystemNotification,
  FaInfoCircle,
  FaCode
} from "react-icons/fa";
import { useFrappeGetDocList, useFrappeCreateDoc } from "frappe-react-sdk";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

interface Alert {
  name: string;
  subject: string;
  enabled: boolean;
  channel: 'Email' | 'SMS' | 'System Notification';
  event: string;
  creation: string;
  document_type: string;
  [key: string]: any;
}

interface DocumentType {
  name: string;
  fields?: { fieldname: string, label: string }[];
}

interface Role {
  name: string;
}

interface Recipient {
  receiver_by_document_field: string;
  receiver_by_role: string;
  condition: string;
}

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface NewAlert {
  subject: string;
  document_type: string;
  channel: 'Email' | 'SMS' | 'System Notification';
  event: string;
  enabled: boolean;
  message: string;
  recipients: Recipient[];
  condition: string;
  conditions: Condition[];
  send_system_notification: boolean;
}

const AlertDashboard = () => {
  const navigate = useNavigate();
  const [showCreateAlert, setShowCreateAlert] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [newAlert, setNewAlert] = useState<NewAlert>({
    subject: '',
    document_type: '',
    channel: 'Email',
    event: 'New',
    enabled: true,
    message: '',
    recipients: [],
    condition: '',
    conditions: [],
    send_system_notification: false,
  });
  const [newRecipient, setNewRecipient] = useState<Recipient>({
    receiver_by_document_field: '',
    receiver_by_role: '',
    condition: ''
  });
  const [newCondition, setNewCondition] = useState<Condition>({
    field: '',
    operator: '==',
    value: ''
  });
  const [showJinjaHelp, setShowJinjaHelp] = useState<boolean>(false);

  // Fetch alerts data
  const { data: alerts, isLoading } = useFrappeGetDocList<Alert>('Notification', {
    fields: ['name', 'subject', 'enabled', 'channel', 'event', 'creation', 'document_type'],
    filters: [
      ['is_standard', '=', 0]
    ]
  });

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

  // Create alert mutation
  const { createDoc: createAlert, loading: creatingAlert } = useFrappeCreateDoc();

  const handleCreateAlert = async () => {
    try {
      // Combine conditions into Jinja expression
      const conditionString = newAlert.conditions.map(cond => 
        `doc.${cond.field} ${cond.operator} ${isNaN(Number(cond.value)) ? `"${cond.value}"` : cond.value}`
      ).join(' and ');

      await createAlert('Notification', {
        ...newAlert,
        condition: conditionString,
        recipients: newAlert.recipients.map(r => ({
          ...r,
          doctype: 'Notification Recipient'
        }))
      });
      setShowCreateAlert(false);
      setNewAlert({
        subject: '',
        document_type: '',
        channel: 'Email',
        event: 'New',
        enabled: true,
        message: '',
        recipients: [],
        condition: '',
        conditions: [],
        send_system_notification: false
      });
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const addRecipient = () => {
    if (!newRecipient.receiver_by_document_field && !newRecipient.receiver_by_role) return;
    
    setNewAlert(prev => ({
      ...prev,
      recipients: [...prev.recipients, newRecipient]
    }));
    
    setNewRecipient({
      receiver_by_document_field: '',
      receiver_by_role: '',
      condition: ''
    });
  };

  const removeRecipient = (index: number) => {
    setNewAlert(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const addCondition = () => {
    if (!newCondition.field) return;
    
    setNewAlert(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
    
    setNewCondition({
      field: '',
      operator: '==',
      value: ''
    });
  };

  const removeCondition = (index: number) => {
    setNewAlert(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
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

  const insertJinjaExample = (example: string) => {
    setNewAlert(prev => ({
      ...prev,
      message: prev.message ? `${prev.message}\n${example}` : example
    }));
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" className="h-[80vh]">
        <Spinner size="3" />
      </Flex>
    );
  }

  return (
    <Box className="bg-gray-50 p-4 md:p-6">
      {/* Dashboard Header */}
      <Flex justify="between" align="center" mb="6">
        <Heading size="7" weight="bold">Alerts</Heading>
        <Button onClick={() => setShowCreateAlert(true)}>
          <FaPlus className="mr-2" /> Create Alert
        </Button>
      </Flex>

      {/* Tabs for Active/Inactive Alerts */}
      <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'inactive')}>
        <Tabs.List mb="4">
          <Tabs.Trigger value="active">Active</Tabs.Trigger>
          <Tabs.Trigger value="inactive">Inactive</Tabs.Trigger>
        </Tabs.List>

        <Box>
          <Tabs.Content value="active">
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {alerts?.filter(a => a.enabled).map(alert => (
                <motion.div key={alert.name} whileHover={{ y: -2 }}>
                  <Card>
                    <Flex direction="column" gap="3">
                      <Flex justify="between" align="center">
                        <Heading size="4">{alert.subject}</Heading>
                        <Badge color={alert.enabled ? "green" : "gray"}>
                          {alert.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </Flex>
                      
                      <Flex gap="2" align="center">
                        {channelIcons[alert.channel]}
                        <Text>{alert.channel}</Text>
                      </Flex>
                      
                      <Flex gap="2" align="center">
                        <Text color="gray">Trigger:</Text>
                        <Text>{eventOptions.find(e => e.value === alert.event)?.label || alert.event}</Text>
                      </Flex>
                      
                      <Flex gap="2" align="center">
                        <Text color="gray">Type:</Text>
                        <Text>{alert.document_type}</Text>
                      </Flex>
                      
                      <Button variant="soft" onClick={() => navigate(`/alerts/${alert.name}`)}>
                        View Details
                      </Button>
                    </Flex>
                  </Card>
                </motion.div>
              ))}
            </Grid>
          </Tabs.Content>
          
          <Tabs.Content value="inactive">
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {alerts?.filter(a => !a.enabled).map(alert => (
                <motion.div key={alert.name} whileHover={{ y: -2 }}>
                  <Card>
                    <Flex direction="column" gap="3">
                      <Flex justify="between" align="center">
                        <Heading size="4">{alert.subject}</Heading>
                        <Badge color={alert.enabled ? "green" : "gray"}>
                          {alert.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </Flex>
                      
                      <Flex gap="2" align="center">
                        {channelIcons[alert.channel]}
                        <Text>{alert.channel}</Text>
                      </Flex>
                      
                      <Button variant="soft" onClick={() => navigate(`/alerts/${alert.name}`)}>
                        View Details
                      </Button>
                    </Flex>
                  </Card>
                </motion.div>
              ))}
            </Grid>
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {/* Create Alert Dialog */}
      <Dialog.Root open={showCreateAlert} onOpenChange={setShowCreateAlert}>
        <Dialog.Content style={{ maxWidth: 800 }}>
          <Dialog.Title>Create New Alert</Dialog.Title>
          
          <Flex direction="column" gap="4">
            <TextField.Root
              placeholder="Alert Subject" 
              value={newAlert.subject}
              onChange={(e) => setNewAlert({...newAlert, subject: e.target.value})}
            />
            
            <Select.Root 
              value={newAlert.document_type}
              onValueChange={(value) => setNewAlert({...newAlert, document_type: value})}
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
            
            <Select.Root 
              value={newAlert.channel}
              onValueChange={(value) => setNewAlert({...newAlert, channel: value as 'Email' | 'SMS' | 'System Notification'})}
            >
              <Select.Trigger placeholder="Select Channel" />
              <Select.Content>
                <Select.Item value="Email">Email</Select.Item>
                <Select.Item value="SMS">SMS</Select.Item>
                <Select.Item value="System Notification">System Notification</Select.Item>
              </Select.Content>
            </Select.Root>
            
            <Select.Root 
              value={newAlert.event}
              onValueChange={(value) => setNewAlert({...newAlert, event: value})}
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
            
            <Flex align="center" gap="2">
              <Heading size="4">Message Template</Heading>
              <Tooltip content="Show Jinja2 Help">
                <Button variant="ghost" size="1" onClick={() => setShowJinjaHelp(!showJinjaHelp)}>
                  <FaInfoCircle />
                </Button>
              </Tooltip>
            </Flex>
            
            {showJinjaHelp && (
              <Card>
                <Heading size="3" mb="2">Jinja2 Template Help</Heading>
                <Text mb="2">You can use these variables and filters in your templates:</Text>
                
                <Grid columns="2" gap="3">
                  <Card>
                    <Heading size="3">Variables</Heading>
                    <Text as="div" mb="2">
                      <code>doc</code> - The document object<br />
                      <code>frappe.utils.nowdate()</code> - Current date<br />
                      <code>frappe.utils.get_url()</code> - System URL
                    </Text>
                    <Button variant="soft" onClick={() => insertJinjaExample('Document: {{ doc.name }}')}>
                      <FaCode className="mr-2" /> Insert doc.name
                    </Button>
                  </Card>
                  
                  <Card>
                    <Heading size="3">Common Examples</Heading>
                    {commonConditions.map((cond, i) => (
                      <Button 
                        key={i} 
                        variant="soft" 
                        onClick={() => insertJinjaExample(cond.value)}
                        className="mb-2"
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
              rows={5}
              value={newAlert.message}
              onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
            />
            
            <Heading size="4">Conditions</Heading>
            <Text color="gray" mb="2">
              Define when this alert should be triggered. All conditions must be true.
            </Text>
            
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
                {newAlert.conditions.map((condition, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>{condition.field}</Table.Cell>
                    <Table.Cell>{condition.operator}</Table.Cell>
                    <Table.Cell>{condition.value}</Table.Cell>
                    <Table.Cell>
                      <Button 
                        variant="ghost" 
                        color="red" 
                        onClick={() => removeCondition(index)}
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
                    />
                  </Table.Cell>
                  
                  <Table.Cell>
                    <Button onClick={addCondition}>Add</Button>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
            
            {newAlert.conditions.length > 0 && (
              <Card>
                <Heading size="2">Generated Condition</Heading>
                <Text as="div">
                  {newAlert.conditions.map(cond => 
                    `doc.${cond.field} ${cond.operator} ${isNaN(Number(cond.value)) ? `"${cond.value}"` : cond.value}`
                  ).join(' and ')}
                </Text>
              </Card>
            )}
            
            <Separator size="4" />
            

{/* Addable list of role-based recipients */}
<Heading size="4">Recipients by Role</Heading>
<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
      <Table.ColumnHeaderCell>Condition (optional)</Table.ColumnHeaderCell>
      <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
    </Table.Row>
  </Table.Header>

  <Table.Body>
    {newAlert.recipients.map((recipient, index) => (
      <Table.Row key={index}>
        <Table.Cell>{recipient.receiver_by_role}</Table.Cell>
        <Table.Cell>{recipient.condition}</Table.Cell>
        <Table.Cell>
          <Button
            variant="ghost"
            color="red"
            onClick={() => removeRecipient(index)}
          >
            Remove
          </Button>
        </Table.Cell>
      </Table.Row>
    ))}

    {/* Row for adding a new role recipient */}
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
        />
      </Table.Cell>

      <Table.Cell>
        <Button onClick={addRecipient} disabled={!newRecipient.receiver_by_role}>
          Add
        </Button>
      </Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>
          </Flex>
          
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">Cancel</Button>
            </Dialog.Close>
            <Button onClick={handleCreateAlert} disabled={creatingAlert}>
              {creatingAlert ? <Spinner /> : 'Create Alert'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default AlertDashboard;