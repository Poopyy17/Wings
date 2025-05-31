// API for orders here
import axios from 'axios';
import { CartItem } from '@/Cart-Context';

// Base URL for API calls
const BASE_URL = 'http://localhost:5000/api';

// Types
export interface OrderTicket {
  id: number;
  session_id: number;
  is_takeout: boolean;
  ticket_number: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
  total_amount: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  ticket_id: number;
  menu_item_id: number;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  is_unliwings: boolean;
  notes?: string;
  created_at: string;
  flavors?: { name: string; quantity: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Create a new order ticket with items
export const createOrderTicket = async (
  sessionId: number,
  items: CartItem[],
  isTakeout: boolean = false
): Promise<
  ApiResponse<{ ticketId: number; ticketNumber: string; totalAmount: number }>
> => {
  try {
    // Process items to ensure they have the required properties
    const processedItems = items.map((item) => ({
      ...item,
      // For unliwings items with id 9999, explicitly mark them
      isUnliwings: item.isUnliwings || item.id === 9999,
    }));

    const response = await axios.post(`${BASE_URL}/orders/tickets`, {
      sessionId,
      items: processedItems,
      isTakeout,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating order ticket:', error);
    throw error;
  }
};

// Get all tickets for a session
export const getSessionTickets = async (
  sessionId: number
): Promise<ApiResponse<OrderTicket[]>> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/orders/sessions/${sessionId}/tickets`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching tickets for session ${sessionId}:`, error);
    throw error;
  }
};

// Get ticket details with items and flavors
export const getTicketDetails = async (
  ticketId: number
): Promise<ApiResponse<OrderTicket>> => {
  try {
    const response = await axios.get(`${BASE_URL}/orders/tickets/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    throw error;
  }
};

// Update ticket status
export const updateTicketStatus = async (
  ticketId: number,
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed'
): Promise<ApiResponse<OrderTicket>> => {
  try {
    const response = await axios.put(
      `${BASE_URL}/orders/tickets/${ticketId}/status`,
      {
        status,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating ticket ${ticketId} status:`, error);
    throw error;
  }
};

export const createTakeoutOrder = async (items) => {
  try {
    const mappedItems = items.map((item) => ({
      menu_item_id: item.menu_item_id, // Keep this as menu_item_id, not convert to id
      name: item.name, // Make sure name is preserved
      price: item.price,
      quantity: item.quantity,
      flavors: item.flavors || [],
      is_unliwings: item.is_unliwings || false, // Make sure to use is_unliwings, not isUnliwings
      notes: item.notes || null,
    }));

    console.log('Mapped items:', JSON.stringify(mappedItems)); // Debug log

    const response = await axios.post(`${BASE_URL}/orders/takeout`, {
      items: mappedItems,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating take-out order:', error);
    if (axios.isAxiosError(error) && error.response) {
      // Return the specific error from the server if available
      return {
        success: false,
        message:
          error.response.data.message || 'Failed to create take-out order',
        error: error.response.data.error,
      };
    }
    return {
      success: false,
      message: 'Network error occurred',
    };
  }
};

export const processTakeoutPayment = async (
  orderId: number,
  paymentMethod: string,
  processedBy?: number
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/orders/takeout/${orderId}/payment`,
      {
        payment_method: paymentMethod,
        processed_by: processedBy,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error processing payment for take-out order ${orderId}:`,
      error
    );
    throw error;
  }
};

// Get completed orders
export const getCompletedOrders = async (
  startDate?: string,
  endDate?: string,
  limit?: number
): Promise<ApiResponse<OrderTicket[]>> => {
  try {
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = `${BASE_URL}/orders/completed${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching completed orders:', error);
    throw error;
  }
};
