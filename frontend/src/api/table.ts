import axios from 'axios';

// Base URL for API calls
const BASE_URL = 'http://localhost:5000/api';

// Types
export interface Table {
  id: number;
  table_number: string;
  status: string;
  qr_code_path?: string;
  qr_code_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Get all tables
export const getAllTables = async (): Promise<Table[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/tables`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
};

// Get a specific table by ID
export const getTableById = async (
  tableId: number
): Promise<ApiResponse<Table>> => {
  try {
    const response = await axios.get(`${BASE_URL}/tables/${tableId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching table ${tableId}:`, error);
    throw error;
  }
};

// Update table status
export const updateTableStatus = async (
  tableId: number,
  tableData: Partial<Table>
): Promise<ApiResponse<Table>> => {
  try {
    const response = await axios.put(
      `${BASE_URL}/tables/${tableId}`,
      tableData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating table ${tableId}:`, error);
    throw error;
  }
};

// Set table status to "For Payment"
export const setTableForPayment = async (
  tableId: number
): Promise<ApiResponse<Table>> => {
  try {
    const response = await axios.put(`${BASE_URL}/tables/${tableId}/status`, {
      status: 'For Payment',
    });
    return response.data;
  } catch (error) {
    console.error(`Error setting table ${tableId} for payment:`, error);
    throw error;
  }
};
