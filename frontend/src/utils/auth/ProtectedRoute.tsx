import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';
import { Flex, Spinner } from '@radix-ui/themes';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, isLoading } = useFrappeAuth();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return; // Wait until loading is complete
    if (!currentUser) {
      navigate('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [currentUser, isLoading, navigate]);

  if (isLoading || isAuthenticated === null) {
    return (
        <Flex justify="center" align="center" className="h-[60vh]">
          <Spinner size="3" />
        </Flex>
      );
    }
  return children;
};

export default ProtectedRoute;
