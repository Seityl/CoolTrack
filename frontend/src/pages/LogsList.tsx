import {
    Box,
    Flex,
    Text,
    Card,
    Spinner,
    Heading
  } from "@radix-ui/themes";
  import { useFrappeGetDocList } from "frappe-react-sdk";
  import { motion } from "framer-motion";
  import { FaRegClipboard } from "react-icons/fa";
  
  const LogsList = () => {
    const { data: logs, isValidating } = useFrappeGetDocList("Approval Log", {
      fields: ["name", "data", "creation"],
      orderBy: {
        field: "creation",
        order: "desc"
      }
    });
  
    if (isValidating) {
      return (
        <Flex justify="center" align="center" className="h-[60vh]">
          <Spinner size="3" />
        </Flex>
      );
    }
  
    return (
      <Box className="bg-gray-50 px-4 py-6">
        <Box
          className="px-4 w-full bg-white/90 backdrop-blur-sm"
          style={{ position: 'sticky', top: 0, zIndex: 100 }}
        >
          <Flex gap="3" justify="start" align="center" py="3">
            <div className="p-2 rounded-full bg-indigo-50">
              <FaRegClipboard size="24" className="text-indigo-600" />
            </div>
            <Heading size="5" weight="bold" className="text-gray-900">
              Logs
            </Heading>
          </Flex>
        </Box>
  
        <Box className="px-4 py-6">
          <Flex direction="column" gap="3" className="w-full">
            {logs && logs.length > 0 ? (
              logs.map((log, index) => (
                <motion.div
                  key={log.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="shadow-sm w-full bg-white">
                    <Box p="5">
                      <div
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: log.data }}
                      />
                      <Text size="1" color="gray" mt="2" className="italic">
                        {new Intl.DateTimeFormat('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        }).format(new Date(log.creation))}
                      </Text>
                    </Box>
                  </Card>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-sm w-full bg-white">
                  <Box p="6" className="text-center">
                    <FaRegClipboard size="24" className="mx-auto text-gray-300 mb-3" />
                    <Heading size="4" color="gray" mb="2">
                      No logs available
                    </Heading>
                    <Text size="2" color="gray">
                      All approval logs will appear here.
                    </Text>
                  </Box>
                </Card>
              </motion.div>
            )}
          </Flex>
        </Box>
      </Box>
    );
  };
  
  export default LogsList;
  