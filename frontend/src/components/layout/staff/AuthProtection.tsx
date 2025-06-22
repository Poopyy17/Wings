import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
  const [localLoading, setLocalLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { isAuthenticated, role: userRole, logout, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Debug logging
    console.log('AuthProtection - Current path:', window.location.pathname);
    console.log('AuthProtection - isLoginPage:', isLoginPage);
    console.log('AuthProtection - isAuthenticated:', isAuthenticated);
    console.log('AuthProtection - userRole:', userRole);
    console.log('AuthProtection - authLoading:', authLoading);

    // Check if logout parameter is present
    const isLogout = searchParams.get('logout') === 'true';

    if (isLogout) {
      console.log('AuthProtection - Logging out user');
      // Clear authentication data using context
      logout();
    }

    // Wait for auth context to finish loading and add extra delay for state synchronization
    if (!authLoading) {
      // Add a small delay to ensure state has fully propagated
      const timer = setTimeout(() => {
        console.log('AuthProtection - Setting localLoading to false');
        setLocalLoading(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [searchParams, logout, authLoading, isAuthenticated, userRole, isLoginPage]);

  // Additional effect to handle redirect when authentication state changes while on login page
  useEffect(() => {
    // Only trigger redirect when on login page and user becomes authenticated
    if (isLoginPage && isAuthenticated && userRole && !authLoading && !localLoading) {
      console.log('AuthProtection - Authentication state changed, triggering redirect');

      const targetPath = (() => {
        switch (userRole) {
          case 'admin':
            return '/staff/admin';
          case 'cashier':
            return '/staff/cashier';
          case 'chef':
            return '/staff/chef';
          default:
            return '/staff/cashier';
        }
      })();

      // Small delay to ensure all components have updated
      setTimeout(() => {
        console.log('AuthProtection - Executing redirect to:', targetPath);
        window.location.replace(targetPath);
      }, 100);
    }
  }, [isAuthenticated, userRole, isLoginPage, authLoading, localLoading]);

  // Show loading if either auth context or local state is loading
  if (authLoading || localLoading) {
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
    !searchParams.get('logout') &&
    !authLoading &&
    !localLoading
  ) {
    console.log('AuthProtection - Redirecting authenticated user from login page to dashboard');
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
