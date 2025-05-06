// utils/auth/AdminRoute.tsx
import { useEffect, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrappeAuth, useFrappeGetCall } from 'frappe-react-sdk';

interface AdminRouteProps {
  children: JSX.Element;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { currentUser, isLoading } = useFrappeAuth();
  const navigate = useNavigate();
  const { data, error } = useFrappeGetCall<{ message: string[] }>(
    'frappe.client.get_roles'
  );

  useEffect(() => {
    if (isLoading || !data) return; // Wait until loading is complete

    // If not logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // If user doesn't have Administrator role, redirect to home
    if (!data.message.includes('Administrator')) {
      navigate('/');
    }
  }, [currentUser, isLoading, navigate, data]);

  // While checking, you might want to show a loading state
  if (isLoading || !data) {
    return null; // Or replace with a loading spinner
  }

  // Only render children if user is admin
  return data.message.includes('Administrator') ? children : null;
};

export default AdminRoute;