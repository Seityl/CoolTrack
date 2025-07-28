import {
  Box,
  Flex,
  Text,
  Card,
  Spinner,
  Button,
  Heading,
  Avatar,
  Separator
} from "@radix-ui/themes";
import { FaUser, FaInfoCircle, FaEnvelope, FaIdCard } from "react-icons/fa";
import { useFrappeAuth, useFrappeGetDoc } from "frappe-react-sdk";
import { FiLogOut, FiSettings } from "react-icons/fi";

interface FrappeUser {
  email: string;
  first_name: string;
  last_name: string;
}

const ProfilePage = () => {
  const { currentUser, logout } = useFrappeAuth();
  const userEmail = typeof currentUser === "string" ? currentUser : currentUser ?? "";
  const { data: userDoc, isValidating } = useFrappeGetDoc<FrappeUser>("User", userEmail);

  const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <Flex gap="3" align="center" mb="3">
      <Box 
        style={{ 
          padding: '6px',
          borderRadius: '6px',
          background: 'var(--gray-3)',
          color: 'var(--gray-11)'
        }}
      >
        {icon}
      </Box>
      <Heading 
        size={{ initial: "3", sm: "4" }} 
        weight="medium" 
        style={{ color: 'var(--gray-12)' }}
      >
        {title}
      </Heading>
    </Flex>
  );

  const DetailCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card 
      variant="surface" 
      style={{ 
        borderRadius: '12px',
        border: '1px solid var(--gray-4)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease',
        background: 'var(--color-surface)'
      }}
    >
      <Box p={{ initial: "3", sm: "4" }}>
        <SectionHeader title={title} icon={icon} />
        <Box style={{ marginTop: '12px' }}>
          {children}
        </Box>
      </Box>
    </Card>
  );

  const DetailItem = ({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) => (
    <Flex direction="column" gap="2" py={{ initial: "2", sm: "3" }}>
      <Flex align="center" gap="2">
        {icon && (
          <Box style={{ color: 'var(--gray-9)' }}>
            {icon}
          </Box>
        )}
        <Text 
          size="1" 
          weight="medium"
          style={{ 
            color: 'var(--gray-10)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {label}
        </Text>
      </Flex>
      <Text 
        size="2" 
        weight="medium" 
        style={{
          color: value ? 'var(--gray-12)' : 'var(--gray-9)',
          wordBreak: 'break-word',
          lineHeight: '1.4'
        }}
      >
        {value || "—"}
      </Text>
    </Flex>
  );

  if (!userDoc || isValidating) {
    return (
      <Box style={{ background: 'var(--gray-1)' }}>
        <Flex justify="center" align="center" style={{ height: '80vh' }}>
          <Flex direction="column" gap="3" align="center">
            <Spinner size="3" />
          </Flex>
        </Flex>
      </Box>
    );
  }

  const fullName = `${userDoc.first_name || ''} ${userDoc.last_name || ''}`.trim() || 'User';

  return (
    <Box style={{ background: 'var(--gray-1)' }}>
      {/* Header */}
      <Box 
        style={{ 
          background: "white", 
          borderBottom: "1px solid var(--gray-6)"
        }}
      >
        <Flex 
          justify="between" 
          align="center" 
          p={{ initial: "4", sm: "6" }}
        >
          <Flex align="center" gap={{ initial: "2", sm: "3" }}>
            <FaUser size={20} color="var(--blue-9)" style={{ display: 'block' }} />
            <Heading 
              size={{ initial: "4", sm: "6" }} 
              weight="bold"
              style={{ display: 'block' }}
            >
              Profile
            </Heading>
          </Flex>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box 
        px={{ initial: "4", sm: "6" }} 
        py="4" 
        style={{ 
          maxWidth: '800px',
          width: '100%',
          margin: '0 auto'
        }}
      >
        
        {/* Profile Header */}
        <Card 
          style={{ 
            borderRadius: '16px',
            border: '1px solid var(--gray-4)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            marginBottom: '24px',
            background: 'var(--color-surface)'
          }}
        >
          <Flex 
            gap={{ initial: "3", sm: "4" }} 
            align="center" 
            p={{ initial: "4", sm: "6" }}
            direction={{ initial: "column", sm: "row" }}
          >
            <Box 
              style={{ 
                padding: '16px',
                background: 'var(--gray-2)',
                borderRadius: '12px',
                border: '1px solid var(--gray-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Avatar
                size={{ initial: "5", sm: "6" }}
                radius="full"
                fallback={<FaUser size={20} />}
                style={{ 
                  background: 'var(--indigo-3)',
                  color: 'var(--indigo-9)'
                }}
              />
            </Box>
            <Flex 
              direction="column" 
              gap="1" 
              align={{ initial: "center", sm: "start" }}
            >
              <Heading 
                size={{ initial: "4", sm: "5" }} 
                weight="bold" 
                style={{ 
                  color: 'var(--gray-12)',
                  textAlign: 'center'
                }}
                className="sm:text-left"
              >
                {fullName}
              </Heading>
              <Text 
                color="gray" 
                size="2"
                style={{ 
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.2px',
                  wordBreak: 'break-all',
                  textAlign: 'center'
                }}
                className="sm:text-left"
              >
                {userDoc.email}
              </Text>
            </Flex>
          </Flex>
        </Card>

        {/* Profile Details Grid */}
        <Flex 
          direction="column" 
          gap="4" 
          style={{ 
            width: '100%'
          }}
        >
          <DetailCard title="Personal Information" icon={<FaInfoCircle />}>
            <DetailItem 
              label="Email Address" 
              value={userDoc.email} 
              icon={<FaEnvelope />} 
            />
            <Separator size="1" style={{ background: 'var(--gray-4)' }} />
            <DetailItem 
              label="First Name" 
              value={userDoc.first_name} 
              icon={<FaIdCard />} 
            />
            <Separator size="1" style={{ background: 'var(--gray-4)' }} />
            <DetailItem 
              label="Last Name" 
              value={userDoc.last_name} 
              icon={<FaIdCard />} 
            />
          </DetailCard>

          {/* Actions Card */}
          <Card 
            variant="surface" 
            style={{ 
              borderRadius: '12px',
              border: '1px solid var(--gray-4)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease',
              background: 'var(--color-surface)'
            }}
          >
            <Box p={{ initial: "3", sm: "4" }}>
              <SectionHeader title="Actions" icon={<FiSettings />} />
              <Box style={{ marginTop: '12px' }}>
                <Button
                  variant="soft"
                  color="red"
                  onClick={logout}
                  size={{ initial: "2", sm: "2" }}
                  style={{ 
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <FiLogOut size={14} style={{ marginRight: '6px' }} />
                  Log Out
                </Button>
              </Box>
            </Box>
          </Card>
        </Flex>
      </Box>
    </Box>
  );
};

export default ProfilePage;