import {
  Box,
  Flex,
  Text,
  Card,
  Spinner,
  Heading,
  Button,
  Dialog,
  AlertDialog
} from "@radix-ui/themes";
import { useFrappeGetDocList, useFrappeDeleteDoc, useFrappeAuth } from "frappe-react-sdk";
import { motion } from "framer-motion";
import { FaRegClipboard, FaTrash, FaTrashAlt, FaSyncAlt } from "react-icons/fa";
import { useState } from "react";
import * as Toast from '@radix-ui/react-toast';

const LogList = () => {
  const { data: logs, isValidating, mutate } = useFrappeGetDocList("Approval Log", {
      fields: ["name", "data", "creation"],
      orderBy: {
          field: "creation",
          order: "desc"
      }
  });
  const { deleteDoc } = useFrappeDeleteDoc();
  const [deletingLog, setDeletingLog] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const { currentUser } = useFrappeAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error") => {
      setToastMessage(message);
      setToastType(type);
      setToastOpen(true);
  };

  const handleDeleteLog = async (name: string) => {
      setDeletingLog(name);
      try {
          await deleteDoc('Approval Log', name);
          mutate();
          showToast("Log deleted successfully", "success");
      } catch (error) {
          console.error("Error deleting log:", error);
          showToast("Failed to delete log", "error");
      } finally {
          setDeletingLog(null);
      }
  };

  const handleClearAllLogs = async () => {
      if (!logs) return;
      
      setIsClearingAll(true);
      setShowClearAllDialog(false);
      
      try {
          const deletePromises = logs.map(log => 
              deleteDoc('Approval Log', log.name).catch(err => {
                  console.error(`Error deleting log ${log.name}:`, err);
                  return null;
              })
          );
          
          await Promise.all(deletePromises);
          mutate();
          showToast("All logs cleared successfully", "success");
      } catch (error) {
          console.error("Error clearing all logs:", error);
          showToast("Failed to clear all logs", "error");
      } finally {
          setIsClearingAll(false);
      }
  };

  const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
          await mutate();
          showToast("Logs refreshed successfully", "success");
      } catch (error) {
          console.error("Error refreshing logs:", error);
          showToast("Failed to refresh logs", "error");
      } finally {
          setIsRefreshing(false);
      }
  };

  if (isValidating && !isRefreshing && !isClearingAll) {
      return (
          <Flex justify="center" align="center" className="h-[60vh]">
              <Spinner size="3" />
          </Flex>
      );
  }

  return (
      <Box className="bg-gray-50 px-4 py-6">
          <Toast.Provider>
              <Box
                  className="px-4 w-full bg-white/90 backdrop-blur-sm"
                  style={{ position: 'sticky', top: 0, zIndex: 100 }}
              >
                  <Flex gap="3" justify="between" align="center" py="3">
                      <Flex gap="3" align="center">
                        <Heading size="6">
                          Logs
                        </Heading>
                      </Flex>
                      <Flex gap="3">
                          <Button 
                              variant="soft" 
                              onClick={handleRefresh}
                              disabled={isRefreshing}
                          >
                              <FaSyncAlt className={isRefreshing ? "animate-spin" : ""} />
                              Refresh
                          </Button>
                          {currentUser === "Administrator" && logs && logs.length > 0 && (
                              <Button 
                                  variant="soft" 
                                  color="red" 
                                  onClick={() => setShowClearAllDialog(true)}
                                  disabled={isClearingAll}
                              >
                                  {isClearingAll ? (
                                      <Spinner />
                                  ) : (
                                      <>
                                          <FaTrashAlt /> Clear All
                                      </>
                                  )}
                              </Button>
                          )}
                      </Flex>
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
                                          <Flex justify="between" align="start" gap="3">
                                              <div
                                                  className="text-sm text-gray-700 flex-1"
                                                  dangerouslySetInnerHTML={{ __html: log.data }}
                                              />
                                              {currentUser === "Administrator" && (
                                                  <Dialog.Root>
                                                      <Dialog.Trigger>
                                                          <Button 
                                                              variant="ghost" 
                                                              color="red" 
                                                              size="1"
                                                              disabled={deletingLog === log.name || isClearingAll}
                                                          >
                                                              {deletingLog === log.name ? (
                                                                  <Spinner size="1" />
                                                              ) : (
                                                                  <FaTrash />
                                                              )}
                                                          </Button>
                                                      </Dialog.Trigger>
                                                      <Dialog.Content style={{ maxWidth: 450 }}>
                                                          <Dialog.Title>Delete Log</Dialog.Title>
                                                          <Dialog.Description size="2" mb="4">
                                                              Are you sure you want to delete this log entry?
                                                          </Dialog.Description>

                                                          <Flex gap="3" mt="4" justify="end">
                                                              <Dialog.Close>
                                                                  <Button variant="soft" color="gray">
                                                                      Cancel
                                                                  </Button>
                                                              </Dialog.Close>
                                                              <Dialog.Close>
                                                                  <Button 
                                                                      variant="solid" 
                                                                      color="red"
                                                                      onClick={() => handleDeleteLog(log.name)}
                                                                      disabled={deletingLog === log.name}
                                                                  >
                                                                      {deletingLog === log.name ? (
                                                                          <Spinner />
                                                                      ) : (
                                                                          "Delete"
                                                                      )}
                                                                  </Button>
                                                              </Dialog.Close>
                                                          </Flex>
                                                      </Dialog.Content>
                                                  </Dialog.Root>
                                              )}
                                          </Flex>
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

              {/* Clear All Dialog */}
              <AlertDialog.Root open={showClearAllDialog}>
                  <AlertDialog.Content style={{ maxWidth: 450 }}>
                      <AlertDialog.Title>Clear All Logs</AlertDialog.Title>
                      <AlertDialog.Description size="2">
                          Are you sure you want to delete all log entries? This action cannot be undone.
                      </AlertDialog.Description>

                      <Flex gap="3" mt="4" justify="end">
                          <Button 
                              variant="soft" 
                              color="gray" 
                              onClick={() => setShowClearAllDialog(false)}
                              disabled={isClearingAll}
                          >
                              Cancel
                          </Button>
                          <Button 
                              variant="solid" 
                              color="red"
                              onClick={handleClearAllLogs}
                              disabled={isClearingAll}
                          >
                              {isClearingAll ? (
                                  <Spinner />
                              ) : (
                                  "Clear All"
                              )}
                          </Button>
                      </Flex>
                  </AlertDialog.Content>
              </AlertDialog.Root>

              {/* Toast Notification */}
              <Toast.Root
                  className={`${toastType === "success" ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"} border rounded-md shadow-sm p-3 data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-swipeOut`}
                  open={toastOpen}
                  onOpenChange={setToastOpen}
              >
                  <Toast.Title className={`${toastType === "success" ? "text-green-800" : "text-red-800"} font-medium`}>
                      {toastType === "success" ? "Success" : "Error"}
                  </Toast.Title>
                  <Toast.Description className={`${toastType === "success" ? "text-green-700" : "text-red-700"} text-sm`}>
                      {toastMessage}
                  </Toast.Description>
                  <Toast.Action asChild altText="Close">
                      <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                          ×
                      </button>
                  </Toast.Action>
              </Toast.Root>
              <Toast.Viewport className="fixed bottom-4 right-4 z-[1000] outline-none" />
          </Toast.Provider>
      </Box>
  );
};

export default LogList;