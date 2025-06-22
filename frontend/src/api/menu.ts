// API for menu here
import axios from 'axios';

// Base URL for API calls
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Types
export interface MenuCategory {
  id: number;
  name: string;
  display_order: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category_id: number;
  is_available: boolean;
  is_wing_item: boolean;
  is_unli_eligible: boolean;
  portion_size?: number;
  max_flavor_count?: number;
  order_count: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WingFlavor {
  id: number;
  name: string;
  is_available: boolean;
  order_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Get all menu categories
export const getMenuCategories = async (): Promise<
  ApiResponse<MenuCategory[]>
> => {
  try {
    const response = await axios.get(`${BASE_URL}/menu/categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching menu categories:', error);
    throw error;
  }
};

// Get menu items by category
export const getMenuItemsByCategory = async (
  categoryId: number,
  forChef: boolean = false,
  includeUnavailable: boolean = false
): Promise<ApiResponse<MenuItem[]>> => {
  try {
    const params = new URLSearchParams();
    if (forChef) params.append('forChef', 'true');
    if (includeUnavailable) params.append('includeUnavailable', 'true');

    const queryString = params.toString();
    const response = await axios.get(
      `${BASE_URL}/menu/categories/${categoryId}/items${
        queryString ? `?${queryString}` : ''
      }`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching menu items for category ${categoryId}:`,
      error
    );
    throw error;
  }
};

// Get all menu items
export const getAllMenuItems = async (): Promise<ApiResponse<MenuItem[]>> => {
  try {
    const response = await axios.get(`${BASE_URL}/menu/items`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    throw error;
  }
};

// Get all wing flavors
export const getWingFlavors = async (
  forChef: boolean = false
): Promise<ApiResponse<WingFlavor[]>> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/menu/flavors${forChef ? '?forChef=true' : ''}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching wing flavors:', error);
    throw error;
  }
};

// Update menu item availability
export const updateMenuItemAvailability = async (
  itemId: number,
  isAvailable: boolean
): Promise<ApiResponse<MenuItem>> => {
  try {
    const response = await axios.patch(`${BASE_URL}/menu/items/${itemId}`, {
      is_available: isAvailable,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating menu item ${itemId} availability:`, error);
    throw error;
  }
};

// Update wing flavor availability
export const updateWingFlavorAvailability = async (
  flavorId: number,
  isAvailable: boolean
): Promise<ApiResponse<WingFlavor>> => {
  try {
    const response = await axios.patch(`${BASE_URL}/menu/flavors/${flavorId}`, {
      is_available: isAvailable,
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error updating wing flavor ${flavorId} availability:`,
      error
    );
    throw error;
  }
};

// Upload image for menu item
export const uploadMenuItemImage = async (
  itemId: number,
  imageFile: File
): Promise<ApiResponse<MenuItem>> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post(
      `${BASE_URL}/menu/items/${itemId}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error uploading image for menu item ${itemId}:`, error);
    throw error;
  }
};

// Delete image for menu item
export const deleteMenuItemImage = async (
  itemId: number
): Promise<ApiResponse<MenuItem>> => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/menu/items/${itemId}/delete-image`
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting image for menu item ${itemId}:`, error);
    throw error;
  }
};

// Get image URL for menu item
export const getMenuItemImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';

  // If it's already a full URL (blob storage URL), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // For local development paths, construct the API URL
  // Normalize path separators to forward slashes
  const normalizedPath = imageUrl.replace(/\\/g, '/');

  // Extract filename from path
  const filename = normalizedPath.split('/').pop();

  return `${BASE_URL}/menu/items/images/${filename}`;
};
