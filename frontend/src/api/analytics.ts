// API functions for analytics data
const API_BASE = 'http://localhost:5000/api';

// Backend response interface (for components)
interface SummaryData {
  total_revenue: number;
  total_payments: number;
  total_orders: number;
}

// PDF export interface
interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
}

interface TrendData {
  date: string;
  value: number;
}

interface TopSellingItem {
  name: string;
  quantity: number;
}

// Transform function to convert backend response to PDF interface
const transformSummaryData = (data: SummaryData): AnalyticsSummary => ({
  totalRevenue: data.total_revenue || 0,
  totalOrders: data.total_orders || 0,
});

const transformTrendData = (
  data: {
    date: string;
    revenue?: number;
    orders?: number;
  }[]
): TrendData[] =>
  data.map((item) => ({
    date: item.date,
    value: item.revenue || item.orders || 0,
  }));

export const analyticsAPI = {
  // Get overall summary data (returns original format for components)
  getSummary: async (): Promise<SummaryData> => {
    const response = await fetch(`${API_BASE}/analytics/summary`);
    if (!response.ok) {
      throw new Error('Failed to fetch analytics summary');
    }
    return response.json();
  },

  // Get summary data for PDF export (returns transformed format)
  getSummaryForPDF: async (): Promise<AnalyticsSummary> => {
    const response = await fetch(`${API_BASE}/analytics/summary`);
    if (!response.ok) {
      throw new Error('Failed to fetch analytics summary');
    }
    const data = await response.json();
    return transformSummaryData(data);
  },

  // Get revenue trend data
  getRevenueTrend: async (
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
  ): Promise<TrendData[]> => {
    const response = await fetch(
      `${API_BASE}/analytics/revenue-trend?period=${period}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch revenue trend');
    }
    const data = await response.json();
    return transformTrendData(data);
  },

  // Get orders trend data
  getOrdersTrend: async (
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
  ): Promise<TrendData[]> => {
    const response = await fetch(
      `${API_BASE}/analytics/orders-trend?period=${period}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch orders trend');
    }
    const data = await response.json();
    return transformTrendData(data);
  },

  // Get top selling items
  getTopSelling: async (): Promise<TopSellingItem[]> => {
    const response = await fetch(`${API_BASE}/analytics/top-selling`);
    if (!response.ok) {
      throw new Error('Failed to fetch top selling items');
    }
    return response.json();
  },
};

export type { SummaryData, AnalyticsSummary, TrendData, TopSellingItem };
