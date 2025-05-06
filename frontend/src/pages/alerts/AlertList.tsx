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
    FaChevronLeft,
    FaChevronRight
  } from "react-icons/fa";
  import { useFrappeGetDocList, useFrappeCreateDoc } from "frappe-react-sdk";
  import { useNavigate } from "react-router-dom";
  import { motion } from "framer-motion";
  import { useState } from "react";
  import { useEffect } from "react";


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
  
  interface Sensor {
    name: string;
    sensor_id: string;
    status: string;
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
      document_type: 'Sensor',
      channel: 'Email',
      event: 'Value Change',
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
    useEffect(() => {
        if (newAlert.subject === "Sensor Reading") {
          setNewCondition(prev => ({ ...prev, field: "last_temperature" }));
        } else if (newAlert.subject === "Device Battery Level") {
          setNewCondition(prev => ({ ...prev, field: "last_battery" }));
        } else if (newAlert.subject === "Device Inactivity Status") {
          setNewCondition(prev => ({ ...prev, field: "last_heartbeat" }));
        }
      }, [newAlert.subject]);
      
    const [newCondition, setNewCondition] = useState<Condition>({
      field: '',
      operator: '==',
      value: ''
    });
    const [showJinjaHelp, setShowJinjaHelp] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
    // Fetch active sensors
    const { data: activeSensors } = useFrappeGetDocList<Sensor>("Sensor", {
      fields: ["name", "sensor_id", "status"],
      filters: [["status", "=", "Active"]]
    });
  
    // Fetch alerts data
    const { data: alerts, isLoading } = useFrappeGetDocList<Alert>('Notification', {
      fields: ['name', 'subject', 'enabled', 'channel', 'event', 'creation', 'document_type'],
      filters: [
        ['is_standard', '=', 0]
      ]
    });
  
    // Fetch roles for dropdown
    const { data: roles } = useFrappeGetDocList<Role>('Role', {
      fields: ['name'],
      filters: [
        ['name', 'in', ['Administrator', 'System Manager', 'Maintenance Manager', 'Maintenance User']]
      ]
    });
  
    // Step validation checks
    const canProceed = () => {
      switch(currentStep) {
        case 1: return !!newAlert.subject;
        case 2: return selectedDevices.length > 0;
        case 3: return newAlert.conditions.length > 0;
        case 4: return !!newAlert.channel && !!newAlert.message;
        default: return true;
      }
    };
  
    // Create alert mutation
    const { createDoc: createAlert, loading: creatingAlert } = useFrappeCreateDoc();
  
    const handleCreateAlert = async () => {
        try {
          // Auto-generate device selection condition
          const deviceCondition = selectedDevices.length > 0 
            ? `doc.name in [${selectedDevices.map(d => `"${d}"`).join(', ')}]`
            : '';
      
          const userConditions = newAlert.conditions.map(cond => {
            const isNumeric = !isNaN(parseFloat(cond.value)) && isFinite(Number(cond.value));
            const value = isNumeric ? cond.value : `"${cond.value}"`;
            return `doc.${cond.field} ${cond.operator} ${value}`;
          });
      
          const allConditions = [deviceCondition, ...userConditions].filter(Boolean);
          const conditionString = allConditions.join(' and ');
      
          let valueChangedField = '';
          if (newAlert.subject === "Sensor Reading") {
            valueChangedField = "last_temperature";
          } else if (newAlert.subject === "Device Battery Level") {
            valueChangedField = "last_battery";
          } else if (newAlert.subject === "Device Inactivity Status") {
            valueChangedField = "last_heartbeat";
          }
      
          await createAlert('Notification', {
            ...newAlert,
            value_changed: valueChangedField,
            condition: conditionString,
            recipients: newAlert.recipients.map(r => ({
              ...r,
              doctype: 'Notification Recipient'
            }))
          });
      
          // Reset state
          setShowCreateAlert(false);
          setNewAlert({
            subject: '',
            document_type: 'Sensor',
            channel: 'Email',
            event: 'Value Change',
            enabled: true,
            message: '',
            recipients: [],
            condition: '',
            conditions: [],
            send_system_notification: false
          });
          setSelectedDevices([]);
          setCurrentStep(1);
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
  
    const renderStepContent = () => {
      switch(currentStep) {
        case 1:
          return (
            <Flex direction="column" gap="4">
              <Heading size="4">Select Alert Type</Heading>
              <Text color="gray">Choose what type of alert you want to create</Text>
              
              <Grid columns="1" gap="3">
                {["Sensor Reading", "Device Battery Level", "Device Inactivity Status"].map((subject) => (
                  <Card 
                    key={subject}
                    className={`cursor-pointer hover:bg-gray-50 ${newAlert.subject === subject ? 'border-blue-500 border-2' : ''}`}
                    onClick={() => setNewAlert({...newAlert, subject})}
                  >
                    <Flex align="center" gap="3">
                      <Box className="p-2 bg-blue-50 rounded-full">
                        <FaInfoCircle className="text-blue-500" />
                      </Box>
                      <Text weight="medium">{subject}</Text>
                    </Flex>
                  </Card>
                ))}
              </Grid>
            </Flex>
          );
  
        case 2:
          return (
            <Flex direction="column" gap="4">
              <Heading size="4">Select Devices</Heading>
              <Text color="gray">Choose which sensors this alert will monitor</Text>
              <ScrollArea style={{ maxHeight: 300 }}>
                <Grid columns="2" gap="2">
                  {activeSensors?.map(sensor => (
                    <Card 
                      key={sensor.name}
                      className={`cursor-pointer ${selectedDevices.includes(sensor.name) ? 'bg-blue-50 border-blue-500' : ''}`}
                      onClick={() => {
                        if(selectedDevices.includes(sensor.name)) {
                          setSelectedDevices(selectedDevices.filter(d => d !== sensor.name));
                        } else {
                          setSelectedDevices([...selectedDevices, sensor.name]);
                        }
                      }}
                    >
                      <Flex justify="between" align="center">
                        <Text weight="medium">{sensor.sensor_id}</Text>
                        <Badge color={selectedDevices.includes(sensor.name) ? "blue" : "gray"}>
                          {selectedDevices.includes(sensor.name) ? "Selected" : "Not Selected"}
                        </Badge>
                      </Flex>
                    </Card>
                  ))}
                </Grid>
              </ScrollArea>
            </Flex>
          );
  
        case 3:
          return (
            <Flex direction="column" gap="4">
              <Heading size="4">Set Conditions</Heading>
              <Text color="gray">Define when this alert should trigger</Text>
              
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
            </Flex>
          );
  
        case 4:
          return (
            <Flex direction="column" gap="4">
              <Heading size="4">Configure Actions</Heading>
              
              <Flex direction="column" gap="3">
                <Text weight="bold">Notification Channel</Text>
                <Select.Root 
                  value={newAlert.channel}
                  onValueChange={(value) => setNewAlert({...newAlert, channel: value as any})}
                >
                  <Select.Trigger placeholder="Select Channel" />
                  <Select.Content>
                    <Select.Item value="Email">Email</Select.Item>
                    <Select.Item value="SMS">SMS</Select.Item>
                    <Select.Item value="System Notification">System Notification</Select.Item>
                  </Select.Content>
                </Select.Root>
  
                <Text weight="bold">Message Template</Text>
                <TextArea 
                  placeholder="Enter your message template..."
                  rows={5}
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                />
  
                <Text weight="bold">Recipients</Text>
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
            </Flex>
          );
      }
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
                          <Text>{alert.event}</Text>
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
            
            {/* Progress indicator */}
            <Flex gap="2" mb="4">
              {[1, 2, 3, 4].map(step => (
                <Box
                  key={step}
                  className={`h-2 w-full rounded-full ${currentStep >= step ? 'bg-blue-500' : 'bg-gray-200'}`}
                />
              ))}
            </Flex>
  
            {renderStepContent()}
  
            <Flex gap="3" mt="4" justify="between">
              <Flex gap="2">
                {currentStep > 1 && (
                  <Button 
                    variant="soft" 
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    <FaChevronLeft /> Back
                  </Button>
                )}
              </Flex>
              
              <Flex gap="2">
                {currentStep < 4 ? (
                  <Button 
                    onClick={() => setCurrentStep(currentStep + 1)} 
                    disabled={!canProceed()}
                  >
                    Next <FaChevronRight />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCreateAlert} 
                    disabled={creatingAlert || !canProceed()}
                  >
                    {creatingAlert ? <Spinner /> : 'Create Alert'}
                  </Button>
                )}
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Box>
    );
  };
  
  export default AlertDashboard;