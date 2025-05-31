import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  DollarSign,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  Eye,
} from 'lucide-react';
import OrderDetailsDialog from './Order-Details-Dialog';
import {
  updateTicketStatus,
  processTakeoutPayment,
  OrderTicket,
  getTicketDetails,
} from '@/api/order';

const TakeOutOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<OrderTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderTicket | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTakeOutOrders();
  }, []);

  const fetchTakeOutOrders = async () => {
    setIsLoading(true);
    try {
      // Use the API to fetch take-out orders
      const response = await fetch('http://localhost:5000/api/orders/takeout');
      const data = await response.json();

      if (data.success) {
        // Filter out completed orders and then fetch details
        const activeOrders = data.data.filter(
          (order: OrderTicket) => order.status !== 'Completed'
        );

        const ordersWithDetails = await Promise.all(
          activeOrders.map(async (order: OrderTicket) => {
            try {
              const detailsResponse = await getTicketDetails(order.id);
              return {
                ...order,
                items: detailsResponse.data.items || [],
              };
            } catch (error) {
              console.error(
                `Error fetching details for order ${order.id}:`,
                error
              );
              return {
                ...order,
                items: [],
              };
            }
          })
        );

        setOrders(ordersWithDetails);
      } else {
        toast.error(data.message || 'Failed to load take-out orders');
      }
    } catch (error) {
      console.error('Error fetching take-out orders:', error);
      toast.error('Failed to load take-out orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      // Call the API to update the ticket status
      const result = await updateTicketStatus(
        orderId,
        newStatus as 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Ready'
      );

      if (result.success) {
        if (newStatus === 'Completed') {
          // Remove the order from the list when marked as completed
          setOrders(orders.filter((order) => order.id !== orderId));
          toast.success(
            'Take-out order completed and moved to completed orders tab'
          );
        } else {
          // Update local state for other status changes
          setOrders(
            orders.map((order) =>
              order.id === orderId ? { ...order, status: newStatus } : order
            )
          );
          toast.success(`Take-out order status updated to ${newStatus}`);
        }
      } else {
        toast.error(result.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating take-out order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const processPayment = async (order: OrderTicket) => {
    setIsProcessing(true);
    try {
      // Process the payment via API
      const result = await processTakeoutPayment(order.id, 'Cash');

      if (result.success) {
        // Remove the order from the list when payment is completed
        setOrders(orders.filter((o) => o.id !== order.id));
        toast.success(
          `Payment for order #${order.ticket_number} completed and moved to completed orders tab`
        );
      } else {
        toast.error(result.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const showOrderDetails = async (order: OrderTicket) => {
    try {
      // If the order doesn't have items yet or we want to ensure fresh data, fetch details
      if (!order.items || order.items.length === 0) {
        const details = await getTicketDetails(order.id);
        if (details.success) {
          // Update the order with items in our local state
          setOrders(
            orders.map((o) =>
              o.id === order.id ? { ...o, items: details.data.items } : o
            )
          );
          // Set the selected order with items
          setSelectedOrder({ ...order, items: details.data.items });
        } else {
          toast.error(details.message || 'Failed to fetch order details');
          setSelectedOrder(order);
        }
      } else {
        setSelectedOrder(order);
      }

      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
      // Still open the dialog with what we have
      setSelectedOrder(order);
      setIsDetailsDialogOpen(true);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Invalid date';
    }
  };

  const getTimeSince = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error parsing date for time since:', error);
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading take-out orders...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header with refresh */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Active Take-Out Orders
          </h2>
          <p className="text-sm text-gray-500">
            {orders.length} active order{orders.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTakeOutOrders}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  No active take-out orders
                </p>
                <p className="text-sm text-gray-500">
                  Active take-out orders will appear here when customers place
                  them
                </p>
              </div>
            </div>
          </Card>
        ) : (
          orders.map((order) => (
            <Card
              key={order.id}
              className={`transition-all duration-200 hover:shadow-md
                ${
                  order.status === 'Pending'
                    ? 'border-amber-200 bg-amber-50/30'
                    : order.status === 'Accepted'
                    ? 'border-blue-200 bg-blue-50/30'
                    : order.status === 'Ready'
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-gray-200'
                }
              `}
            >
              <CardHeader className="py-4 px-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        #{order.ticket_number}
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-orange-100 text-orange-800"
                      >
                        Take-Out
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{formatTime(order.created_at)}</span>
                      <span>•</span>
                      <span>{getTimeSince(order.created_at)}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <Badge
                      className={`text-white flex items-center gap-1
                        ${
                          order.status === 'Pending'
                            ? 'bg-amber-500'
                            : order.status === 'Accepted'
                            ? 'bg-blue-500'
                            : order.status === 'Ready'
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }
                      `}
                    >
                      {order.status}
                    </Badge>
                    <div className="font-bold text-lg text-gray-700">
                      ₱{Number(order.total_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="py-0 px-6 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => showOrderDetails(order)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto"
                >
                  <Eye className="h-4 w-4" />
                  <span>
                    View {order.items?.length || 0} item
                    {!order.items || order.items.length !== 1 ? 's' : ''}
                  </span>
                </Button>
              </CardContent>

              <CardFooter className="py-4 px-6 bg-gray-50/50 border-t">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Status:
                    </span>
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        handleStatusChange(order.id, value)
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Ready">Ready</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {order.status === 'Ready' && (
                    <Button
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={() => processPayment(order)}
                      disabled={isProcessing}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Process Payment
                    </Button>
                  )}
                </div>
              </CardFooter>
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

export default TakeOutOrdersTab;
