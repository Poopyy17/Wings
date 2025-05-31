import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { analyticsAPI, type TopSellingItem } from '@/api/analytics';
import { toast } from 'sonner';

const SellingItems = () => {
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopSellingItems = async () => {
      try {
        setIsLoading(true);
        const data = await analyticsAPI.getTopSelling();
        setTopSellingItems(data);
      } catch (error) {
        console.error('Error fetching top selling items:', error);
        toast.error('Failed to load top selling items');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopSellingItems();
  }, []);

  return (
    <Card>
      <CardHeader>
        <h3 className="font-medium">Top Selling Items</h3>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex justify-between animate-pulse">
                <div>
                  <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {topSellingItems.length > 0 ? (
              topSellingItems.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <div className="font-medium">
                      {index + 1}. {item.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Number(item.quantity).toLocaleString()} sold
                    </div>
                  </div>
                  <div className="text-right font-medium text-blue-700">
                    {Number(item.quantity).toLocaleString()} pcs
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No sales data available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SellingItems;
