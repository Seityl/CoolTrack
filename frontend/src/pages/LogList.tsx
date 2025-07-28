import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Card,
  Spinner,
  Heading,
  Button,
} from "@radix-ui/themes";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { motion } from "framer-motion";
import { FaRegClipboard, FaSyncAlt, FaFileAlt, FaCheck, FaExclamationTriangle } from "react-icons/fa";

const Toast = ({ message, type, onClose }: { 
  message: string; 
  type: 'success' | 'error';
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: type === 'success' ? 'var(--green-9)' : 'var(--red-9)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '300px',
        animation: 'slideIn 0.3s ease-out',
      }}>
        {type === 'success' ? (
          <FaCheck size={16} />
        ) : (
          <FaExclamationTriangle size={16} />
        )}
        <Text size="2" style={{ flex: 1 }}>{message}</Text>
      </div>
    </>
  );
};

const LogList = () => {
  const { data: logs, isValidating, mutate } = useFrappeGetDocList("Approval Log", {
      fields: ["name", "data", "creation"],
      orderBy: {
          field: "creation",
          order: "desc"
      }
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast(null);
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

  if (isValidating && !isRefreshing) {
      return (
          <Flex height="60vh" align="center" justify="center">
              <Flex direction="column" align="center" gap="4">
                  <Spinner size="3" />
              </Flex>
          </Flex>
      );
  }

  return (
      <Box style={{ background: "var(--gray-1)" }}>
          {toast?.show && (
              <Toast 
                  message={toast.message} 
                  type={toast.type} 
                  onClose={closeToast} 
              />
          )}

          {/* Header */}
          <Box 
              style={{ 
                  background: "white", 
                  borderBottom: "1px solid var(--gray-6)",
                  top: 0,
                  zIndex: 10
              }}
          >
              <Flex 
                  justify="between" 
                  align="center" 
                  p={{ initial: "4", sm: "6" }}
                  gap="3"
                  style={{
                      flexWrap: "wrap"
                  }}
              >
                  <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
                      <FaFileAlt 
                          size={window.innerWidth < 768 ? 20 : 24} 
                          color="var(--blue-9)" 
                      />
                      <Heading 
                          size={{ initial: "4", sm: "6" }} 
                          weight="bold"
                          style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                          }}
                      >
                          Approval Logs
                      </Heading>
                  </Flex>
                  <Button 
                      variant="soft" 
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      size={{ initial: "2", sm: "3" }}
                      style={{
                          flexShrink: 0,
                          fontSize: window.innerWidth < 768 ? "12px" : "14px"
                      }}
                  >
                      <FaSyncAlt 
                          className={isRefreshing ? "animate-spin" : ""}
                          size={window.innerWidth < 768 ? 12 : 14}
                      />
                      <span style={{ display: window.innerWidth < 480 ? "none" : "inline" }}>
                          Refresh
                      </span>
                  </Button>
              </Flex>
          </Box>

          <Box p={{ initial: "3", sm: "4", md: "6" }}>
              <Flex direction="column" gap={{ initial: "3", sm: "4" }}>
                  {logs && logs.length > 0 ? (
                      logs.map((log, index) => (
                          <motion.div
                              key={log.name}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.03 }}
                          >
                              <Card 
                                  size={{ initial: "2", sm: "3" }} 
                                  style={{ 
                                      border: "1px solid var(--gray-6)",
                                      overflow: "hidden"
                                  }}
                              >
                                  <Box p={{ initial: "3", sm: "4", md: "5" }}>
                                      <Flex direction="column" gap="3">
                                          <div
                                              className="text-sm text-gray-700"
                                              style={{ 
                                                  lineHeight: 1.6,
                                                  color: "var(--gray-12)",
                                                  fontSize: window.innerWidth < 768 ? "13px" : "14px",
                                                  wordWrap: "break-word",
                                                  overflowWrap: "break-word",
                                                  hyphens: "auto"
                                              }}
                                              dangerouslySetInnerHTML={{ __html: log.data }}
                                          />
                                          <Flex justify="end" mt="2">
                                              <Text 
                                                  size={{ initial: "1", sm: "2" }}
                                                  color="gray" 
                                                  style={{ 
                                                      fontStyle: "italic",
                                                      fontSize: window.innerWidth < 768 ? "11px" : "12px",
                                                      textAlign: "right",
                                                      lineHeight: 1.3
                                                  }}
                                              >
                                                  {new Intl.DateTimeFormat('en-US', {
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: '2-digit',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                      hour12: true,
                                                  }).format(new Date(log.creation))}
                                              </Text>
                                          </Flex>
                                      </Flex>
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
                          <Card 
                              size={{ initial: "3", sm: "4" }} 
                              style={{ border: "1px solid var(--gray-6)" }}
                          >
                              <Flex 
                                  direction="column" 
                                  align="center" 
                                  justify="center" 
                                  p={{ initial: "6", sm: "8" }} 
                                  gap="4"
                              >
                                  <FaRegClipboard 
                                      size={window.innerWidth < 768 ? 36 : 48} 
                                      color="var(--gray-8)" 
                                  />
                                  <Flex direction="column" align="center" gap="2">
                                      <Heading 
                                          size={{ initial: "4", sm: "5" }} 
                                          color="gray"
                                          style={{ textAlign: "center" }}
                                      >
                                          No logs available
                                      </Heading>
                                      <Text 
                                          size={{ initial: "2", sm: "3" }} 
                                          color="gray" 
                                          style={{ 
                                              textAlign: "center",
                                              maxWidth: "280px",
                                              lineHeight: 1.5
                                          }}
                                      >
                                          All approval logs will appear here when activities occur.
                                      </Text>
                                  </Flex>
                              </Flex>
                          </Card>
                      </motion.div>
                  )}
              </Flex>
          </Box>

          <style>
              {`
                  .animate-spin {
                      animation: spin 1s linear infinite;
                  }
                  
                  @keyframes spin {
                      from {
                          transform: rotate(0deg);
                      }
                      to {
                          transform: rotate(360deg);
                      }
                  }

                  /* Mobile-specific optimizations */
                  @media (max-width: 767px) {
                      /* Ensure proper touch targets */
                      button {
                          min-height: 44px;
                      }
                      
                      /* Improve readability on small screens */
                      .text-sm {
                          line-height: 1.7 !important;
                      }
                      
                      /* Optimize spacing for mobile */
                      [data-radix-themes] {
                          --space-3: 12px;
                          --space-4: 16px;
                      }
                  }
                  
                  @media (max-width: 479px) {
                      /* Extra small screens */
                      [data-radix-themes] {
                          --space-3: 8px;
                          --space-4: 12px;
                      }
                  }
              `}
          </style>
      </Box>
  );
};

export default LogList;