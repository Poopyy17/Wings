import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Eye, CheckCircle, RefreshCw, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import OrderDetailsDialog from './Order-Details-Dialog';
import {
  OrderTicket,
  getCompletedOrders, // You'll need to create this API function
  getTicketDetails,
} from '@/api/order';

const CompletedOrdersView: React.FC = () => {
  const [completedOrders, setCompletedOrders] = useState<OrderTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderTicket | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const fetchCompletedOrders = async () => {
    setIsLoading(true);
    try {
      const response = await getCompletedOrders(undefined, undefined, 50);
      if (response.success) {
        setCompletedOrders(response.data);
      } else {
        toast.error(response.message || 'Failed to load completed orders');
      }
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      toast.error('Failed to load completed orders');
    } finally {
      setIsLoading(false);
    }
  };

  const showOrderDetails = async (order: OrderTicket) => {
    try {
      const detailsResponse = await getTicketDetails(order.id);
      if (detailsResponse.success) {
        setSelectedOrder({ ...order, items: detailsResponse.data.items });
      } else {
        setSelectedOrder(order);
      }
      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
      setSelectedOrder(order);
      setIsDetailsDialogOpen(true);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy h:mm a');
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading completed orders...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Completed Orders
          </h2>
          <p className="text-sm text-gray-500">
            {completedOrders.length} completed order
            {completedOrders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCompletedOrders}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {completedOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">No completed orders</p>
                <p className="text-sm text-gray-500">
                  Completed orders will appear here
                </p>
              </div>
            </div>
          </Card>
        ) : (
          completedOrders.map((order) => (
            <Card key={order.id} className="border-green-200 bg-green-50/30">
              <CardHeader className="py-4 px-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        #{order.ticket_number}
                      </h3>{' '}
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800"
                      >
                        {order.is_takeout ? 'Take-Out' : 'Dine-In'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Completed: {formatTime(order.updated_at)}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <Badge className="bg-green-500 text-white flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Completed
                    </Badge>
                    <div className="font-semibold text-lg text-green-700">
                      ₱{Number(order.total_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="py-0 px-6 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => showOrderDetails(order)}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 p-0 h-auto"
                >
                  <Eye className="h-4 w-4" />
                  <span>View order details</span>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          order={selectedOrder}
        />
      )}
    </>
  );
};

export default CompletedOrdersView;
