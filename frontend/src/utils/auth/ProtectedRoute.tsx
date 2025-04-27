import { useEffect, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, isLoading } = useFrappeAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // Wait until loading is complete
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, isLoading, navigate]);
  return children;
};

export default ProtectedRoute;