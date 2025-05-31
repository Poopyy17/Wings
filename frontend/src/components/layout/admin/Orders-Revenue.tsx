import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, ShoppingBag } from 'lucide-react';
import { analyticsAPI, type SummaryData } from '@/api/analytics';
import { toast } from 'sonner';

const OrdersRevenue = () => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    total_revenue: 0,
    total_payments: 0,
    total_orders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setIsLoading(true);
        const data = await analyticsAPI.getSummary();
        setSummaryData(data);
      } catch (error) {
        console.error('Error fetching summary data:', error);
        toast.error('Failed to load summary data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-full animate-pulse">
              <DollarSign className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold animate-pulse">Loading...</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full animate-pulse">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-2xl font-bold animate-pulse">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="bg-white">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <DollarSign className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(summaryData.total_revenue))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="text-2xl font-bold">
              {Number(summaryData.total_orders).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersRevenue;
