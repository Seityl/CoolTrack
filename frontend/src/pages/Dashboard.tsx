import { useNavigate } from "react-router-dom";
import { Card, Flex, Grid, Heading, Text, Button, Table, Badge, Progress } from "@radix-ui/themes";

const Dashboard = () => {
	const navigate = useNavigate();

  const stats = [
    { title: "Pending Declarations", value: 12, color: "orange" },
    { title: "Approved This Week", value: 34, color: "green" },
    { title: "Rejected This Week", value: 5, color: "red" },
    { title: "Avg Processing Time", value: "2.3 days", color: "blue" }
  ];

  const recentActivities = [
    { id: 1, declaration: "IM-2023-0456", type: "Import", status: "Approved", date: "2023-11-15 09:23" },
    { id: 2, declaration: "EX-2023-0789", type: "Export", status: "Pending", date: "2023-11-14 14:45" },
    { id: 3, declaration: "IM-2023-0455", type: "Import", status: "Rejected", date: "2023-11-14 11:12" },
    { id: 4, declaration: "IM-2023-0454", type: "Import", status: "Approved", date: "2023-11-13 16:30" },
    { id: 5, declaration: "EX-2023-0788", type: "Export", status: "Pending", date: "2023-11-13 10:15" }
  ];

  const quickActions = [
    { title: "New Import Declaration", action: "/declarations/new-import" },
    { title: "New Export Declaration", action: "/declarations/new-export" },
    { title: "Upload Invoices", action: "/invoices/upload" },
    { title: "Generate Reports", action: "/reports/generate" }
  ];

  // Simple SVG icons as components
  const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );

  const CrossIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );

  const DocumentIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );

  const UploadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );

  const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  return (
    <Flex direction="column" gap="4" p="4">
      <Heading size="7">Dashboard</Heading>
      
      <Grid columns="4" gap="4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <Flex gap="3" align="center">
              <Flex 
                align="center" 
                justify="center" 
                style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: "50%", 
                  backgroundColor: `var(--${stat.color}-3)` 
                }}
              >
                {index === 0 && <ClockIcon />}
                {index === 1 && <CheckIcon />}
                {index === 2 && <CrossIcon />}
                {index === 3 && <SettingsIcon />}
              </Flex>
              <Flex direction="column">
                <Text size="2" color="gray">
                  {stat.title}
                </Text>
                <Heading size="5">{stat.value}</Heading>
              </Flex>
            </Flex>
          </Card>
        ))}
      </Grid>

      <Flex gap="4">
        <Card style={{ flex: 2 }}>
          <Flex direction="column" gap="3">
            <Heading size="5">Recent Activities</Heading>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Declaration No.</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {recentActivities.map((activity) => (
                  <Table.Row key={activity.id}>
                    <Table.RowHeaderCell>{activity.declaration}</Table.RowHeaderCell>
                    <Table.Cell>{activity.type}</Table.Cell>
                    <Table.Cell>
                      <Badge 
                        color={
                          activity.status === "Approved" ? "green" : 
                          activity.status === "Rejected" ? "red" : "orange"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{activity.date}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
            <Button variant="soft" style={{ alignSelf: "flex-end" }}>
              View All Activities
            </Button>
          </Flex>
        </Card>

        <Flex direction="column" gap="4" style={{ flex: 1 }}>
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="5">Quick Actions</Heading>
              <Grid columns="2" gap="3">
                {quickActions.map((action, index) => (
									<Button 
										key={index} 
										variant="soft" 
										style={{ height: 80 }}
										onClick={() => {
											if (action.title === "Upload Invoices") {
												navigate(action.action);
											} else {
												console.log("Navigate to:", action.action);
											}
										}}
									>
                    <Flex direction="column" gap="1" align="center">
                      {index === 0 && <DocumentIcon />}
                      {index === 1 && <DocumentIcon />}
                      {index === 2 && <UploadIcon />}
                      {index === 3 && <DownloadIcon />}
                      <Text size="2">{action.title}</Text>
                    </Flex>
                  </Button>
                ))}
              </Grid>
            </Flex>
          </Card>

          <Card>
            <Flex direction="column" gap="3">
              <Heading size="5">Processing Status</Heading>
              <Flex direction="column" gap="2">
                <Flex justify="between">
                  <Text size="2">Import Declarations</Text>
                  <Text size="2" weight="bold">65%</Text>
                </Flex>
                <Progress value={65} />
                
                <Flex justify="between">
                  <Text size="2">Export Declarations</Text>
                  <Text size="2" weight="bold">42%</Text>
                </Flex>
                <Progress value={42} />
                
                <Flex justify="between">
                  <Text size="2">Document Verification</Text>
                  <Text size="2" weight="bold">78%</Text>
                </Flex>
                <Progress value={78} />
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Flex>

      <Grid columns="2" gap="4">
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">Upcoming Deadlines</Heading>
            <Flex direction="column" gap="2">
              {[1, 2, 3].map((item) => (
                <Flex key={item} justify="between" align="center" p="2" style={{ 
                  backgroundColor: "var(--gray-2)", 
                  borderRadius: "var(--radius-2)" 
                }}>
                  <Text>IM-2023-04{50 + item}</Text>
                  <Badge color="orange">Due in {item} day{item !== 1 ? 's' : ''}</Badge>
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">System Alerts</Heading>
            <Flex direction="column" gap="2">
              <Flex gap="2" align="center">
                <Badge color="red">Critical</Badge>
                <Text size="2">Customs tariff update required</Text>
              </Flex>
              <Flex gap="2" align="center">
                <Badge color="blue">Info</Badge>
                <Text size="2">New regulatory guidelines available</Text>
              </Flex>
              <Flex gap="2" align="center">
                <Badge color="green">Normal</Badge>
                <Text size="2">System maintenance scheduled</Text>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </Grid>
    </Flex>
  );
};

export default Dashboard;