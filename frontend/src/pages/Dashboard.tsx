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
} from "@radix-ui/themes";
import {
  FaBell,
  FaExclamationTriangle,
  FaServer,
  FaRegDotCircle as FaSensor,
  FaHistory,
  FaArrowRight
} from "react-icons/fa";
import { useFrappeAuth, useFrappeGetDocList, useFrappeGetCall } from "frappe-react-sdk";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import dayjs from "dayjs";

const Dashboard = () => {
  const { currentUser } = useFrappeAuth();

  // Fetch sensors data
  const { data: sensors, isLoading: isLoadingSensors } = useFrappeGetDocList("Sensor", {
    fields: ["name", "sensor_id", "status", "gateway_id"],
    limit: 5,
    orderBy: {
      field: "modified",
      order: "desc"
    }
  });

  // Fetch gateways data
  const { data: gateways, isLoading: isLoadingGateways } = useFrappeGetDocList("Sensor Gateway", {
    fields: ["name", "gateway_type", "status", "last_heartbeat"],
    limit: 5,
    orderBy: {
      field: "modified",
      order: "desc"
    }
  });

  // Fetch alerts data from Notification Log
  const { data: alerts, isLoading: isLoadingAlerts } = useFrappeGetDocList("Notification Log", {
    fields: ["name", "subject", "creation", "read"],
    filters: [
      ["for_user", "=", currentUser],
      ["type", "=", "Alert"]
    ],
    limit: 5,
    orderBy: {
      field: "creation",
      order: "desc"
    }
  });

  // Get count of unread alerts
  const { data: unreadCount, mutate: refreshUnreadCount } = useFrappeGetCall<{ message: number }>(
    "frappe.client.get_count",
    {
      doctype: "Notification Log",
      filters: JSON.stringify({
        for_user: currentUser,
        read: 0,
        type: "Alert"
      })
    },
    undefined,
    {
      revalidateOnFocus: true
    }
  );

  // Calculate summary stats
  const activeSensors = sensors?.filter(s => s.status === "Active").length || 0;
  const onlineGateways = gateways?.filter(g => g.status === "Active").length || 0;
  const unreadAlerts = unreadCount?.message || 0;

  const isLoading = isLoadingSensors || isLoadingGateways || isLoadingAlerts;

  if (isLoading) {
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
      <Grid columns={{ initial: '1', sm: '2' }} gap="4" mb="6">
        <motion.div whileHover={{ y: -2 }}>
          <Card size="3">
            <Flex gap="4" align="center">
              <div className="p-3 rounded-full bg-green-100">
                <FaSensor className="text-green-600 text-xl" />
              </div>
              <Flex direction="column">
                <Text size="2" color="gray">Active Sensors</Text>
                <Heading size="6">{activeSensors}/{sensors?.length || 0}</Heading>
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
                <Text size="2" color="gray">Online Locations</Text>
                <Heading size="6">{onlineGateways}/{gateways?.length || 0}</Heading>
              </Flex>
            </Flex>
          </Card>
        </motion.div>

        {/* <motion.div whileHover={{ y: -2 }}>
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
        </motion.div> */}
      </Grid>

      {/* Main Content Grid */}
      <Grid columns={{ initial: '1', lg: '2' }} gap="6">
        {/* Recent Sensors */}
        <Card>
          <Flex justify="between" align="center" mb="4">
            <Heading size="5">Recent</Heading>
            <Button variant="ghost" asChild>
              <Link to="/sensors">
                View All <FaArrowRight className="ml-2" />
              </Link>
            </Button>
          </Flex>

          <Flex direction="column" gap="3">
            {sensors?.length ? (
              sensors.map(sensor => (
                <motion.div key={sensor.name} whileHover={{ x: 2 }}>
                  <Card variant="classic">
                    <Flex justify="between" align="center">
                      <Flex direction="column">
                        <Text weight="bold">ID: {sensor.sensor_id}</Text>
                        <Text size="2" color="gray">
                          Location: {sensor.gateway_id}
                        </Text>
                      </Flex>
                      <Badge 
                        color={sensor.status === "Active" ? "green" : 
                               sensor.status === "Maintenance" ? "orange" : "gray"}
                      >
                        {sensor.status}
                      </Badge>
                    </Flex>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <Flex justify="center" align="center" py="4">
                  <Text color="gray">No sensors found</Text>
                </Flex>
              </Card>
            )}
          </Flex>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <Flex justify="between" align="center" mb="4">
            <Heading size="5">Recent Alerts</Heading>
            <Button variant="ghost" asChild onClick={() => refreshUnreadCount()}>
              <Link to="/alerts">
                View All <FaArrowRight className="ml-2" />
              </Link>
            </Button>
          </Flex>

          <Flex direction="column" gap="3">
            {alerts?.length ? (
              alerts.map(alert => (
                <motion.div key={alert.name} whileHover={{ x: 2 }}>
                  <Card className={`${!alert.read ? 'border-l-4 border-red-500' : ''}`}>
                    <Flex direction="column" gap="1">
                      <Text weight="bold">{alert.subject}</Text>
                      <Flex justify="between">
                        <Text size="2" color="gray">
                          {dayjs(alert.creation).format("YYYY-MM-DD HH:mm")}
                        </Text>
                        {!alert.read && <Badge color="red">New</Badge>}
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
            <Heading size="5">Location Status</Heading>
            <Button variant="ghost" asChild>
              <Link to="/gateways">
                View All <FaArrowRight className="ml-2" />
              </Link>
            </Button>
          </Flex>

          <Flex direction="column" gap="3">
            {gateways?.length ? (
              gateways.map(gateway => (
                <motion.div key={gateway.name} whileHover={{ x: 2 }}>
                  <Card>
                    <Flex justify="between" align="center">
                      <Flex direction="column">
                        <Text weight="bold">{gateway.gateway_type}</Text>
                        <Text size="2" color="gray">
                          Location: {gateway.name}
                        </Text>
                        <Text size="2" color="gray">
                          Last seen: {gateway.last_heartbeat ? dayjs(gateway.last_heartbeat).format("YYYY-MM-DD HH:mm") : 'Never'}
                        </Text>
                      </Flex>
                      <Badge 
                        color={gateway.status === "Online" ? "green" : 
                               gateway.status === "Maintenance" ? "orange" : "gray"}
                      >
                        {gateway.status}
                      </Badge>
                    </Flex>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <Flex justify="center" align="center" py="4">
                  <Text color="gray">No gateways found</Text>
                </Flex>
              </Card>
            )}
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