import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';

// Define session interface
export interface SessionInfo {
  sessionId?: number;
  tableId?: number;
  tableNumber?: string;
  serviceType?: 'Unliwings' | 'Ala-carte';
  occupancyCount?: number;
  orderType: 'dine-in' | 'take-out';
  isActive: boolean;
  unliwingsBasePrice?: number;
  unliWingsTotalCharge?: number;
  totalAmount?: number;
  status?: string;
}

// Define context type
interface SessionContextType {
  session: SessionInfo;
  startSession: (sessionData: SessionInfo) => void;
  updateSession: (sessionData: Partial<SessionInfo>) => void;
  endSession: () => void;
  isSessionActive: () => boolean;
  getUnliWingsTotalCharge: () => number;
}

// Create context with default values
const SessionContext = createContext<SessionContextType>({
  session: { orderType: 'take-out', isActive: false },
  startSession: () => {},
  updateSession: () => {},
  endSession: () => {},
  isSessionActive: () => false,
  getUnliWingsTotalCharge: () => 0,
});

// Custom hook to use the session context
export const useSession = () => useContext(SessionContext);

// Provider component
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  // Initialize session from localStorage if available
  const [session, setSession] = useState<SessionInfo>(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('wings_session');
      return savedSession
        ? JSON.parse(savedSession)
        : { orderType: 'take-out', isActive: false };
    }
    return { orderType: 'take-out', isActive: false };
  });

  // Update localStorage whenever session changes
  useEffect(() => {
    localStorage.setItem('wings_session', JSON.stringify(session));
  }, [session]);

  const startSession = (sessionData: SessionInfo) => {
    // Ensure the session is marked as active
    const newSession = {
      ...sessionData,
      isActive: true,
    };

    setSession(newSession);
  };

  const updateSession = (sessionData: Partial<SessionInfo>) => {
    setSession((prev) => ({ ...prev, ...sessionData }));
  };

  const endSession = () => {
    // Clear session data but keep minimal structure
    setSession({ orderType: 'take-out', isActive: false });

    // Also clear from localStorage
    localStorage.removeItem('wings_session');

    // Optionally clear cart when session ends
    localStorage.removeItem('wings_cart');
  };

  const isSessionActive = () => {
    return session.isActive;
  };

  const getUnliWingsTotalCharge = () => {
    return session.unliWingsTotalCharge || 0;
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        startSession,
        updateSession,
        endSession,
        isSessionActive,
        getUnliWingsTotalCharge,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;
