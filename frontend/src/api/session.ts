// API for sessions here
import axios from 'axios';

// Base URL for API calls
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface TableSession {
  id: number;
  table_id: number;
  service_type: 'Unliwings' | 'Ala-carte';
  occupancy_count: number;
  status: string;
  unliwings_base_price?: number;
  unliwings_total_charge?: number;
  total_amount: number;
  is_paid: boolean;
  payment_method?: string;
  payment_date?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Create a new table session
export const createTableSession = async (
  tableId: number,
  serviceType: 'Unliwings' | 'Ala-carte',
  occupancyCount: number
): Promise<ApiResponse<TableSession>> => {
  try {
    const response = await axios.post(`${BASE_URL}/sessions`, {
      table_id: tableId,
      service_type: serviceType,
      occupancy_count: occupancyCount,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating table session:', error);
    throw error;
  }
};

// Get all active sessions
export const getActiveSessions = async (): Promise<
  ApiResponse<TableSession[]>
> => {
  try {
    const response = await axios.get(`${BASE_URL}/sessions/active`);
    return response.data;
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    throw error;
  }
};

// Get session by ID
export const getSessionById = async (
  sessionId: number
): Promise<ApiResponse<TableSession>> => {
  try {
    const response = await axios.get(`${BASE_URL}/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching session ${sessionId}:`, error);
    throw error;
  }
};

// Process payment for a session
export const processSessionPayment = async (
  sessionId: number,
  paymentMethod: string,
  processedBy?: number
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/sessions/${sessionId}/payment`,
      {
        payment_method: paymentMethod,
        processed_by: processedBy,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error processing payment for session ${sessionId}:`, error);
    throw error;
  }
};
