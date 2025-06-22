import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export const useLoginRedirect = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (isAuthenticated && role) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        switch (role) {
          case 'admin':
            navigate('/staff/admin', { replace: true });
            break;
          case 'cashier':
            navigate('/staff/cashier', { replace: true });
            break;
          case 'chef':
            navigate('/staff/chef', { replace: true });
            break;
          default:
            navigate('/staff/cashier', { replace: true });
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, role, navigate]);
};
