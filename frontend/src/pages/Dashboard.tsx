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
    Separator
  } from "@radix-ui/themes";
  import {
    FaBell,
    FaExclamationTriangle,
    FaServer,
    FaRegDotCircle as FaSensor,
    FaHistory,
    FaArrowRight
  } from "react-icons/fa";
  import { useFrappeAuth } from "frappe-react-sdk";
  import { Link, useNavigate } from "react-router-dom";
  import { motion } from "framer-motion";
  
  // Sample data for sensors, gateways, and alerts
  const sampleSensors = [
    { name: "sensor1", sensor_name: "ID: 11242036", status: "Active", last_reading: "2025-04-24T10:00:00Z", battery_level: 80, gateway: "Gateway 1" },
    { name: "sensor2", sensor_name: "ID: 11242228", status: "Inactive", last_reading: "", battery_level: 50, gateway: "Gateway 2" },
  ];
  
  const sampleGateways = [
    { name: "gateway1", gateway_name: "ID: 19670799", status: "Online", last_seen: "2025-04-22T10:00:00Z" },
  ];
  
  const sampleAlerts = [
    { name: "alert1", subject: "High Temperature", creation: "2025-04-24T09:30:00Z", seen: false },
    { name: "alert2", subject: "Offline", creation: "2025-04-21T08:00:00Z", seen: true },
  ];
  
  const Dashboard = () => {
    const navigate = useNavigate();
    const { currentUser } = useFrappeAuth();
  
    // Sample data for status summary
    const activeSensors = sampleSensors.filter(s => s.status === "Active").length;
    const onlineGateways = sampleGateways.filter(g => g.status === "Online").length;
    const unreadAlerts = sampleAlerts.filter(a => !a.seen).length;
  
    if (!sampleSensors || !sampleGateways || !sampleAlerts) {
      return (
        <Flex justify="center" align="center" className="h-[80vh]">
          <Spinner size="3" />
        </Flex>
      );
    }
  
    return (
      <Box className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* Dashboard Header */}
        <Flex justify="between" align="center" mb="6">
          <Heading size="7" weight="bold">Dashboard</Heading>
          <Text color="gray">Welcome back, {currentUser}</Text>
        </Flex>
  
        {/* Status Overview Cards */}
        <Grid columns={{ initial: '1', sm: '3' }} gap="4" mb="6">
          <motion.div whileHover={{ y: -2 }}>
            <Card size="3">
              <Flex gap="4" align="center">
                <div className="p-3 rounded-full bg-green-100">
                  <FaSensor className="text-green-600 text-xl" />
                </div>
                <Flex direction="column">
                  <Text size="2" color="gray">Active Sensors</Text>
                  <Heading size="6">{activeSensors}/{sampleSensors.length}</Heading>
                </Flex>
              </Flex>
            </Card>
          </motion.div>
  
          <motion.div whileHover={{ y: -2 }}>
            <Card size="3">
              <Flex gap="4" align="center">
                <div className="p-3 rounded-full bg-blue-100">
                  <FaServer className="text-blue-600 text-xl" />
                </div>
                <Flex direction="column">
                  <Text size="2" color="gray">Online Gateways</Text>
                  <Heading size="6">{onlineGateways}/{sampleGateways.length}</Heading>
                </Flex>
              </Flex>
            </Card>
          </motion.div>
  
          <motion.div whileHover={{ y: -2 }}>
            <Card size="3">
              <Flex gap="4" align="center">
                <div className="p-3 rounded-full bg-red-100">
                  <FaExclamationTriangle className="text-red-600 text-xl" />
                </div>
                <Flex direction="column">
                  <Text size="2" color="gray">Unread Alerts</Text>
                  <Heading size="6">{unreadAlerts}</Heading>
                </Flex>
              </Flex>
            </Card>
          </motion.div>
        </Grid>
  
        {/* Main Content Grid */}
        <Grid columns={{ initial: '1', lg: '2' }} gap="6">
          {/* Recent Sensors */}
          <Card>
            <Flex justify="between" align="center" mb="4">
              <Heading size="5">Recent Sensors</Heading>
              <Button variant="ghost" asChild>
                <Link to="/sensors">
                  View All <FaArrowRight className="ml-2" />
                </Link>
              </Button>
            </Flex>
  
            <Flex direction="column" gap="3">
              {sampleSensors.map(sensor => (
                <motion.div key={sensor.name} whileHover={{ x: 2 }}>
                  <Card variant="classic">
                    <Flex justify="between" align="center">
                      <Flex direction="column">
                        <Text weight="bold">{sensor.sensor_name}</Text>
                        <Text size="2" color="gray">
                          {sensor.gateway} • Battery: {sensor.battery_level}%
                        </Text>
                      </Flex>
                      <Badge 
                        color={sensor.status === "Active" ? "green" : 
                               sensor.status === "Alert" ? "red" : "gray"}
                      >
                        {sensor.status}
                      </Badge>
                    </Flex>
                  </Card>
                </motion.div>
              ))}
            </Flex>
          </Card>
  
          {/* Recent Alerts */}
          <Card>
            <Flex justify="between" align="center" mb="4">
              <Heading size="5">Recent Alerts</Heading>
              <Button variant="ghost" asChild>
                <Link to="/alerts">
                  View All <FaArrowRight className="ml-2" />
                </Link>
              </Button>
            </Flex>
  
            <Flex direction="column" gap="3">
              {sampleAlerts.length ? (
                sampleAlerts.map(alert => (
                  <motion.div key={alert.name} whileHover={{ x: 2 }}>
                    <Card className={`${!alert.seen ? 'border-l-4 border-red-500' : ''}`}>
                      <Flex direction="column" gap="1">
                        <Text weight="bold">{alert.subject}</Text>
                        <Flex justify="between">
                          <Text size="2" color="gray">
                            {new Date(alert.creation).toLocaleString()}
                          </Text>
                          {!alert.seen && <Badge color="red">New</Badge>}
                        </Flex>
                      </Flex>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card>
                  <Flex justify="center" align="center" py="4">
                    <Text color="gray">No recent alerts</Text>
                  </Flex>
                </Card>
              )}
            </Flex>
          </Card>
  
          {/* Gateway Status */}
          <Card>
            <Flex justify="between" align="center" mb="4">
              <Heading size="5">Gateway Status</Heading>
              <Button variant="ghost" asChild>
                <Link to="/gateways">
                  View All <FaArrowRight className="ml-2" />
                </Link>
              </Button>
            </Flex>
  
            <Flex direction="column" gap="3">
              {sampleGateways.map(gateway => (
                <motion.div key={gateway.name} whileHover={{ x: 2 }}>
                  <Card>
                    <Flex justify="between" align="center">
                      <Flex direction="column">
                        <Text weight="bold">{gateway.gateway_name}</Text>
                        <Text size="2" color="gray">
                          Last seen: {new Date(gateway.last_seen).toLocaleString()}
                        </Text>
                      </Flex>
                      <Badge 
                        color={gateway.status === "Online" ? "green" : 
                               gateway.status === "Maintenance" ? "yellow" : "gray"}
                      >
                        {gateway.status}
                      </Badge>
                    </Flex>
                  </Card>
                </motion.div>
              ))}
            </Flex>
          </Card>
  
          {/* Quick Actions */}
					<Card>
						<Heading size="5" mb="4">Quick Actions</Heading>
						<Grid columns="2" gap="3" style={{ height: '100%' }}>
							<motion.div whileHover={{ scale: 1.05 }}>
								<Button
									variant="soft"
									asChild
									style={{
										height: '100px', 
										display: 'flex', 
										justifyContent: 'center', 
										alignItems: 'center', 
										padding: '16px', 
										borderRadius: '8px',
									}}
								>
									<Link to="/alerts" style={{ display: 'flex', alignItems: 'center' }}>
										<FaBell className="mr-2" /> View Alerts
									</Link>
								</Button>
							</motion.div>
							
							<motion.div whileHover={{ scale: 1.05 }}>
								<Button
									variant="soft"
									asChild
									style={{
										height: '100px', 
										display: 'flex', 
										justifyContent: 'center', 
										alignItems: 'center', 
										padding: '16px', 
										borderRadius: '8px',
									}}
								>
									<Link to="/history" style={{ display: 'flex', alignItems: 'center' }}>
										<FaHistory className="mr-2" /> View History
									</Link>
								</Button>
							</motion.div>
						</Grid>
					</Card>
        </Grid>
      </Box>
    );
  };
  
  export default Dashboard;
  