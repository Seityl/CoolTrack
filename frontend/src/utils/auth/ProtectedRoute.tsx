import { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';
import { Flex, Spinner } from '@radix-ui/themes';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, isLoading } = useFrappeAuth();

  if (isLoading) {
    return (
      <Flex height="100vh" align="center" justify="center">
        <Spinner size="3" />
      </Flex>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;