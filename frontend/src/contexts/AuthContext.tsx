import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom event for authentication changes
const AUTH_CHANGE_EVENT = 'authChange';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const checkAuthFromStorage = () => {
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role');

      if (storedUser && storedRole) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setRole(storedRole);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          logout();
        }
      } else {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
      }
    };

    // Check on mount
    checkAuthFromStorage();

    // Listen for custom auth change events
    const handleAuthChange = () => {
      checkAuthFromStorage();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const login = async (userData: AuthUser, userRole: string): Promise<void> => {
    return new Promise((resolve) => {
      setUser(userData);
      setRole(userRole);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
      
      // Small delay to ensure state is fully updated
      setTimeout(() => {
        resolve();
      }, 10);
    });
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
