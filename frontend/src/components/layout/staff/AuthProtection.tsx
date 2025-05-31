import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

interface AuthProtectionProps {
  children: React.ReactNode;
  allowedRole?: string;
  isLoginPage?: boolean;
}

const AuthProtection: React.FC<AuthProtectionProps> = ({
  children,
  allowedRole,
  isLoginPage = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkAuth = () => {
      // Check if logout parameter is present
      const isLogout = searchParams.get('logout') === 'true';

      if (isLogout) {
        // Clear authentication data
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setIsAuthenticated(false);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role');

      if (storedUser && storedRole) {
        setIsAuthenticated(true);
        setUserRole(storedRole);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If this is the login page and user is already authenticated (and not logging out), redirect to their dashboard
  if (
    isLoginPage &&
    isAuthenticated &&
    userRole &&
    !searchParams.get('logout')
  ) {
    switch (userRole) {
      case 'admin':
        return <Navigate to="/staff/admin" replace />;
      case 'cashier':
        return <Navigate to="/staff/cashier" replace />;
      case 'chef':
        return <Navigate to="/staff/chef" replace />;
      default:
        return <Navigate to="/staff/cashier" replace />;
    }
  }

  // If this is a protected page and user is not authenticated, redirect to login
  if (!isLoginPage && !isAuthenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  // If this is a protected page with role requirement, check role match
  if (!isLoginPage && allowedRole && userRole !== allowedRole) {
    return <Navigate to="/staff/login" replace />;
  }

  return <>{children}</>;
};

export default AuthProtection;
