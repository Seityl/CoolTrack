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
  FaToggleOff
} from "react-icons/fa";
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
// type AlertDetailParams = {
//   id: string;
// };

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
  const { data: alert, isLoading } = useFrappeGetDocList<Alert>('Notification', {
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
      // Refresh data
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
      // Refresh data
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
      <Flex justify="center" align="center" className="h-[80vh]">
        <Spinner size="3" />
      </Flex>
    );
  }

  const conditions = parseConditions(alertData.condition);

  return (
    <Box className="bg-gray-50 p-4 md:p-6">
      {/* Alert Header */}
      <Flex justify="between" align="center" mb="6">
        <Heading size="7" weight="bold">{alertData.subject}</Heading>
        <Flex gap="3">
          <Button 
            variant="soft" 
            color={alertData.enabled ? "green" : "gray"} 
            onClick={toggleAlertStatus}
            disabled={updating}
          >
            {alertData.enabled ? <FaToggleOn className="mr-2" /> : <FaToggleOff className="mr-2" />}
            {alertData.enabled ? "Active" : "Inactive"}
          </Button>
          {editMode ? (
            <>
              <Button variant="soft" color="gray" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAlert} disabled={updating}>
                {updating ? <Spinner /> : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="soft" onClick={() => setEditMode(true)}>
                <FaEdit className="mr-2" /> Edit
              </Button>
              <Button color="red" onClick={handleDeleteAlert} disabled={deleting}>
                {deleting ? <Spinner /> : <FaTrash className="mr-2" />}
                Delete
              </Button>
            </>
          )}
        </Flex>
      </Flex>

      {/* Alert Details */}
      <Grid columns={{ initial: '1', md: '2' }} gap="6">
        {/* Basic Info Card */}
        <Card>
          <Heading size="5" mb="4">Alert Details</Heading>
          
          {editMode ? (
            <Flex direction="column" gap="4">
              <TextField.Root
                placeholder="Alert Subject" 
                value={updatedAlert.subject || ''}
                onChange={(e) => setUpdatedAlert({...updatedAlert, subject: e.target.value})}
              />
              
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
            </Flex>
          ) : (
            <Flex direction="column" gap="3">
              <Flex gap="2" align="center">
                <Text color="gray" weight="bold">Document Type:</Text>
                <Text>{alertData.document_type}</Text>
              </Flex>
              
              <Flex gap="2" align="center">
                <Text color="gray" weight="bold">Channel:</Text>
                <Flex gap="2" align="center">
                  {channelIcons[alertData.channel]}
                  <Text>{alertData.channel}</Text>
                </Flex>
              </Flex>
              
              <Flex gap="2" align="center">
                <Text color="gray" weight="bold">Trigger:</Text>
                <Text>{eventOptions.find(e => e.value === alertData.event)?.label || alertData.event}</Text>
              </Flex>
              
              <Flex gap="2" align="center">
                <Text color="gray" weight="bold">Created:</Text>
                <Text>{new Date(alertData.creation).toLocaleString()}</Text>
              </Flex>
            </Flex>
          )}
        </Card>

        {/* Message Card */}
        <Card>
          <Flex justify="between" align="center" mb="4">
            <Heading size="5">Message Template</Heading>
            <Tooltip content="Show Jinja2 Help">
              <Button variant="ghost" size="1" onClick={() => setShowJinjaHelp(!showJinjaHelp)}>
                <FaInfoCircle />
              </Button>
            </Tooltip>
          </Flex>
          
          {editMode ? (
            <>
              {showJinjaHelp && (
                <Card mb="4">
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
                    </Card>
                    
                    <Card>
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
              />
            </>
          ) : (
            <Card>
              <ScrollArea style={{ maxHeight: '300px' }}>
                <Text>
                  {alertData.message}
                </Text>
              </ScrollArea>
            </Card>
          )}
        </Card>

        {/* Conditions Card */}
        <Card>
          <Heading size="5" mb="4">Conditions</Heading>
          
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
                      <Table.Cell>{condition.field}</Table.Cell>
                      <Table.Cell>{condition.operator}</Table.Cell>
                      <Table.Cell>{condition.value}</Table.Cell>
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
                      <Button onClick={() => {
                        const updatedConditions = [...conditions, newCondition];
                        setUpdatedAlert({
                          ...updatedAlert,
                          condition: updatedConditions.map(cond => 
                            `doc.${cond.field} ${cond.operator} ${isNaN(Number(cond.value)) ? `"${cond.value}"` : cond.value}`
                          ).join(' and ')
                        });
                        setNewCondition({ field: '', operator: '==', value: '' });
                      }}>
                        Add
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
              
              {conditions.length > 0 && (
                <Card mt="4">
                  <Heading size="2">Generated Condition</Heading>
                  <Text as="div">
                    {updatedAlert.condition}
                  </Text>
                </Card>
              )}
            </>
          ) : (
            <Flex direction="column" gap="3">
              {conditions.length > 0 ? (
                conditions.map((condition, index) => (
                  <Card key={index}>
                    <Flex gap="3">
                      <Text weight="bold">{condition.field}</Text>
                      <Text>{condition.operator}</Text>
                      <Text>{condition.value}</Text>
                    </Flex>
                  </Card>
                ))
              ) : (
                <Text color="gray">No conditions defined</Text>
              )}
            </Flex>
          )}
        </Card>

        {/* Recipients Card */}
        <Card>
          <Heading size="5" mb="4">Recipients</Heading>
          
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
                      <Table.Cell>{recipient.receiver_by_role}</Table.Cell>
                      <Table.Cell>{recipient.condition || '-'}</Table.Cell>
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
                      <Button onClick={() => {
                        setUpdatedAlert({
                          ...updatedAlert,
                          recipients: [...(updatedAlert.recipients || []), newRecipient]
                        });
                        setNewRecipient({ receiver_by_role: '', condition: '' });
                      }} disabled={!newRecipient.receiver_by_role}>
                        Add
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
            </>
          ) : (
            <Flex direction="column" gap="3">
              {(alertData.recipients || []).length > 0 ? (
                (alertData.recipients || []).map((recipient, index) => (
                  <Card key={index}>
                    <Flex justify="between" align="center">
                      <Text weight="bold">{recipient.receiver_by_role}</Text>
                      <Text color="gray">{recipient.condition || 'No condition'}</Text>
                    </Flex>
                  </Card>
                ))
              ) : (
                <Text color="gray">No recipients defined</Text>
              )}
            </Flex>
          )}
        </Card>
      </Grid>
    </Box>
  );
};

export default AlertPage;