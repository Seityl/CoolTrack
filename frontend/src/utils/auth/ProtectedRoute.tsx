import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';

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
    // Optionally, render a loading spinner or placeholder
    return <div>Loading...</div>;
  }

  return children;
};

export default ProtectedRoute;
