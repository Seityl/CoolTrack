import {
  Box,
  Flex,
  Text,
  Card,
  Spinner,
  Button,
  TextField,
  Grid,
  Heading,
  Avatar
} from "@radix-ui/themes";
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import { useFrappeAuth, useFrappeGetDoc } from "frappe-react-sdk";

interface FrappeUser {
  email: string;
  first_name: string;
  last_name: string;
}

const ProfilePage = () => {
  const { currentUser, logout } = useFrappeAuth();
  const userEmail = typeof currentUser === "string" ? currentUser : currentUser ?? "";
  const { data: userDoc, isValidating } = useFrappeGetDoc<FrappeUser>("User", userEmail);

  if (!userDoc || isValidating) {
    return (
      <Flex justify="center" align="center" className="h-[60vh]">
        <Spinner size="3" />
      </Flex>
    );
  }

  const fullName = `${userDoc.first_name || ''} ${userDoc.last_name || ''}`.trim() || 'User';

  return (
    <Box className="bg-gray-50 flex flex-col">
      {/* Main Content */}
      <Box className="flex-1 w-full px-4 py-6">
				<Flex direction="column" gap="6" className="w-full">
					{/* Profile Header */}
					<Card className="shadow-sm w-full">
						<Flex gap="4" align="center" p="6">
							<Avatar
								size="5"
								radius="full"
								fallback={<FaUser />}
								className="bg-indigo-100 text-indigo-600"
							/>
							<Flex direction="column">
								<Heading size="6" weight="bold">
									{fullName}
								</Heading>
								<Text size="2" color="gray">
									{userDoc.email}
								</Text>
							</Flex>
						</Flex>
					</Card>

					{/* Profile Details */}
					<Card className="shadow-sm w-full">
						<Box p="6">
							<Heading size="5" mb="5">Profile Information</Heading>
							
							<Grid columns={{ initial: '1', sm: '2' }} gap="5">
								<Flex direction="column" gap="1">
									<Text as="label" size="2" weight="medium" color="gray">
										Email
									</Text>
									<TextField.Root
										variant="soft"
										className="rt-TextFieldInput"
										value={userDoc.email}
										readOnly
									/>
								</Flex>

								<Flex direction="column" gap="1">
									<Text as="label" size="2" weight="medium" color="gray">
										First Name
									</Text>
									<TextField.Root
										variant="soft"
										className="rt-TextFieldInput"
										value={userDoc.first_name}
										readOnly
									/>
								</Flex>

								<Flex direction="column" gap="1">
									<Text as="label" size="2" weight="medium" color="gray">
										Last Name
									</Text>
									<TextField.Root
										variant="soft"
										className="rt-TextFieldInput"
										value={userDoc.last_name}
										readOnly
									/>
								</Flex>
							</Grid>
						</Box>
					</Card>

					{/* Logout Card */}
					<Card className="shadow-sm w-full border-red-100">
						<Box p="6">
							<Button 
								variant="outline" 
								color="red" 
								onClick={logout}
								className="w-full"
							>
								<FaSignOutAlt /> Log Out
							</Button>
						</Box>
					</Card>
				</Flex>
      </Box>
    </Box>
  );
};

export default ProfilePage;