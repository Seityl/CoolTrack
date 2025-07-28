import {
  Box,
  Flex,
  Text,
  Card,
  Heading,
  Button,
  Separator,
  Spinner,
} from "@radix-ui/themes";
import {
  FaUser,
  FaThermometer,
  FaClipboard,
  FaPlus,
  FaSync,
  FaArrowLeft,
} from "react-icons/fa";
import { useFrappeGetDoc } from "frappe-react-sdk";
import { useNavigate, useParams } from "react-router-dom";

interface MaintenanceRecord {
  name: string;
  user: string;
  sensor: string;
  notes: string;
  modified: string;
  owner: string;
  creation: string;
}

const MaintenancePage = () => {
  const { name } = useParams();
  const navigate = useNavigate();

  // Fetch document with all required fields
  const { data: record, isLoading, error, mutate } = useFrappeGetDoc<MaintenanceRecord>(
    "Cool Track Maintenance",
    name,
    {
      fields: ["name", "user", "sensor", "notes", "modified", "owner", "creation"]
    }
  );

  const handleRefresh = () => {
    mutate();
  };

  const handleAddNew = () => {
    navigate('/maintenance/new');
  };

  if (isLoading) {
    return (
      <Box style={{ background: "var(--gray-1)", minHeight: "100vh" }}>
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
          >
            <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
              <FaClipboard 
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
                Maintenance
              </Heading>
            </Flex>
            <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
              <Button
                variant="soft"
                onClick={handleAddNew}
                size={{ initial: "1", sm: "2" }}
                style={{ 
                  borderRadius: '8px',
                  fontSize: window.innerWidth < 768 ? "11px" : "14px"
                }}
              >
                <Flex align="center" gap="2">
                  <FaPlus size={window.innerWidth < 768 ? 10 : 12} />
                  {window.innerWidth >= 768 && <span>Add</span>}
                </Flex>
              </Button>
              <Button
                variant="soft"
                onClick={handleRefresh}
                disabled={isLoading}
                size={{ initial: "1", sm: "2" }}
                style={{ 
                  borderRadius: '8px',
                  fontSize: window.innerWidth < 768 ? "11px" : "14px"
                }}
              >
                <Flex align="center" gap="2">
                  <FaSync 
                    className={isLoading ? "animate-spin" : ""}
                    size={window.innerWidth < 768 ? 10 : 12}
                  />
                  {window.innerWidth >= 768 && <span>Refresh</span>}
                </Flex>
              </Button>
            </Flex>
          </Flex>
        </Box>

        <Flex justify="center" align="center" p="6">
          <Spinner size="3" />
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ background: "var(--gray-1)", minHeight: "100vh" }}>
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
          >
            <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
              <FaClipboard 
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
                Maintenance
              </Heading>
            </Flex>
            <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
              <Button
                variant="soft"
                onClick={handleAddNew}
                size={{ initial: "1", sm: "2" }}
                style={{ 
                  borderRadius: '8px',
                  fontSize: window.innerWidth < 768 ? "11px" : "14px"
                }}
              >
                <Flex align="center" gap="2">
                  <FaPlus size={window.innerWidth < 768 ? 10 : 12} />
                  {window.innerWidth >= 768 && <span>Add</span>}
                </Flex>
              </Button>
              <Button
                variant="soft"
                onClick={handleRefresh}
                size={{ initial: "1", sm: "2" }}
                style={{ 
                  borderRadius: '8px',
                  fontSize: window.innerWidth < 768 ? "11px" : "14px"
                }}
              >
                <Flex align="center" gap="2">
                  <FaSync size={window.innerWidth < 768 ? 10 : 12} />
                  {window.innerWidth >= 768 && <span>Refresh</span>}
                </Flex>
              </Button>
            </Flex>
          </Flex>
        </Box>

        <Box p={{ initial: "3", sm: "4", md: "6" }}>
          <Card 
            variant="surface" 
            mt="4"
            style={{ 
              border: '1px solid var(--red-6)',
              borderRadius: window.innerWidth < 768 ? '8px' : '12px',
              background: 'var(--red-2)'
            }}
          >
            <Flex direction="column" align="center" gap="3" p={{ initial: "4", sm: "6" }}>
              <Text color="red" weight="bold" size={{ initial: "2", sm: "3" }}>
                Failed to load record
              </Text>
              <Text color="red" size={{ initial: "1", sm: "2" }}>
                {error.message}
              </Text>
              <Button variant="soft" color="red" onClick={() => mutate()}>
                Retry
              </Button>
            </Flex>
          </Card>
        </Box>
      </Box>
    );
  }

  if (!record) {
    return (
      <Box style={{ background: "var(--gray-1)", minHeight: "100vh" }}>
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
          >
            <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
              <FaClipboard 
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
                Maintenance
              </Heading>
            </Flex>
            <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
              <Button
                variant="soft"
                onClick={handleAddNew}
                size={{ initial: "1", sm: "2" }}
                style={{ 
                  borderRadius: '8px',
                  fontSize: window.innerWidth < 768 ? "11px" : "14px"
                }}
              >
                <Flex align="center" gap="2">
                  <FaPlus size={window.innerWidth < 768 ? 10 : 12} />
                  {window.innerWidth >= 768 && <span>Add</span>}
                </Flex>
              </Button>
              <Button
                variant="soft"
                onClick={handleRefresh}
                size={{ initial: "1", sm: "2" }}
                style={{ 
                  borderRadius: '8px',
                  fontSize: window.innerWidth < 768 ? "11px" : "14px"
                }}
              >
                <Flex align="center" gap="2">
                  <FaSync size={window.innerWidth < 768 ? 10 : 12} />
                  {window.innerWidth >= 768 && <span>Refresh</span>}
                </Flex>
              </Button>
            </Flex>
          </Flex>
        </Box>

        <Box p={{ initial: "3", sm: "4", md: "6" }}>
          <Card mt="4">
            <Flex direction="column" align="center" gap="3" py="4">
              <Text color="red" weight="bold">Record not found</Text>
              <Button variant="soft" onClick={() => navigate('/maintenance')}>
                <Flex align="center" gap="2">
                  <FaArrowLeft size={12} />
                  Back to Maintenance
                </Flex>
              </Button>
            </Flex>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box style={{ background: "var(--gray-1)", minHeight: "100vh" }}>
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
        >
          <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
            <FaClipboard 
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
              Maintenance
            </Heading>
          </Flex>
          <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
            <Button
              variant="soft"
              onClick={handleAddNew}
              size={{ initial: "1", sm: "2" }}
              style={{ 
                borderRadius: '8px',
                fontSize: window.innerWidth < 768 ? "11px" : "14px"
              }}
            >
              <Flex align="center" gap="2">
                <FaPlus size={window.innerWidth < 768 ? 10 : 12} />
                {window.innerWidth >= 768 && <span>Add</span>}
              </Flex>
            </Button>
            <Button
              variant="soft"
              onClick={handleRefresh}
              size={{ initial: "1", sm: "2" }}
              style={{ 
                borderRadius: '8px',
                fontSize: window.innerWidth < 768 ? "11px" : "14px"
              }}
            >
              <Flex align="center" gap="2">
                <FaSync size={window.innerWidth < 768 ? 10 : 12} />
                {window.innerWidth >= 768 && <span>Refresh</span>}
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Content */}
      <Box p={{ initial: "3", sm: "4", md: "6" }}>
        <Card style={{ borderRadius: window.innerWidth < 768 ? '8px' : '12px' }}>
          <Flex direction="column" gap="4" p={{ initial: "3", sm: "4" }}>
            <Heading size={{ initial: "4", sm: "6" }}>
              Maintenance Record: {record.name}
            </Heading>

            {/* System Fields */}
            <Flex direction="column" gap="2">
              <Text size="1" color="gray">
                Created by {record.owner} on {new Date(record.creation).toLocaleString()}
              </Text>
              <Text size="1" color="gray">
                Last modified: {new Date(record.modified).toLocaleString()}
              </Text>
            </Flex>

            <Separator size="4" />

            {/* Display Fields */}
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <FaUser size={window.innerWidth < 768 ? 14 : 16} />
                  <Text weight="bold" size={{ initial: "2", sm: "3" }}>User</Text>
                </Flex>
                <Text size={{ initial: "2", sm: "3" }}>
                  {record.user || "Not specified"}
                </Text>
              </Flex>

              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <FaThermometer size={window.innerWidth < 768 ? 14 : 16} />
                  <Text weight="bold" size={{ initial: "2", sm: "3" }}>Sensor</Text>
                </Flex>
                <Text size={{ initial: "2", sm: "3" }}>
                  {record.sensor || "Not specified"}
                </Text>
              </Flex>

              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <FaClipboard size={window.innerWidth < 768 ? 14 : 16} />
                  <Text weight="bold" size={{ initial: "2", sm: "3" }}>Notes</Text>
                </Flex>
                <Text 
                  size={{ initial: "2", sm: "3" }}
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5
                  }}
                >
                  {record.notes || "No notes available"}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Card>
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

export default MaintenancePage;