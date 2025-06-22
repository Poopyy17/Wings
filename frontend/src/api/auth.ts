import axios from 'axios';

// Base URL for API calls
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Login function
export const loginUser = async (username: string, password: string, role: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username,
      password,
      role,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      throw { success: false, message: 'No response from server' };
    } else {
      // Something happened in setting up the request that triggered an Error
      throw { success: false, message: 'Error making request' };
    }
  }
};

// Verify authentication status
export const verifyAuth = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/auth/verify`);
    return response.data;
  } catch (error) {
    return { success: false, message: 'Not authenticated' };
  }
};
