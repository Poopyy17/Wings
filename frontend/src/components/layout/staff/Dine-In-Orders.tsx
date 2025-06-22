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
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import OrderDetailsDialog from './Order-Details-Dialog';
import {
  OrderTicket,
  getSessionTickets,
  updateTicketStatus,
  getTicketDetails,
} from '@/api/order';
import { getActiveSessions, TableSession } from '@/api/session';

const DineInOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<OrderTicket[]>([]);
  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderTicket | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchDineInOrders();
  }, []);

  const fetchDineInOrders = async () => {
    setIsLoading(true);
    try {
      // 1. Get all active sessions
      const sessionsResponse = await getActiveSessions();

      if (!sessionsResponse.success) {
        toast.error(
          sessionsResponse.message || 'Failed to fetch active sessions'
        );
        return;
      }

      const activeSessions = sessionsResponse.data;
      setSessions(activeSessions);

      // 2. For each session, get all tickets
      let allOrders: OrderTicket[] = [];

      for (const session of activeSessions) {
        try {
          const ticketsResponse = await getSessionTickets(session.id);

          if (ticketsResponse.success && ticketsResponse.data.length > 0) {
            // Add table information to each ticket and filter out completed orders
            const ticketsWithTableInfo = ticketsResponse.data
              .filter((ticket) => ticket.status !== 'Completed') // Exclude completed orders
              .map((ticket) => ({
                ...ticket,
                tableNumber: session.table_id.toString(),
                sessionId: session.id,
              }));

            allOrders = [...allOrders, ...ticketsWithTableInfo];
          }
        } catch (error) {
          console.error(
            `Error fetching tickets for session ${session.id}:`,
            error
          );
        }
      }

      // Sort orders by creation date, newest first
      allOrders.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching dine-in orders:', error);
      toast.error('Failed to load dine-in orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setUpdatingOrderId(ticketId);
    try {
      const result = await updateTicketStatus(
        ticketId,
        newStatus as 'Pending' | 'Accepted' | 'Declined' | 'Completed'
      );

      if (result.success) {
        if (newStatus === 'Completed') {
          // Remove the order from the list when marked as completed
          setOrders(orders.filter((order) => order.id !== ticketId));
          toast.success('Order completed and moved to completed orders tab');        } else {
          // Update local state for other status changes
          setOrders(
            orders.map((order) =>
              order.id === ticketId ? { ...order, status: newStatus as any } : order
            )
          );
          toast.success(`Order status updated to ${newStatus}`);
        }
      } else {
        toast.error(result.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const showOrderDetails = async (order: OrderTicket) => {
    try {
      // Ensure we have the latest ticket details with items
      const detailsResponse = await getTicketDetails(order.id);

      if (detailsResponse.success) {
        // Update the order with items in our local state
        setOrders(
          orders.map((o) =>
            o.id === order.id ? { ...o, items: detailsResponse.data.items } : o
          )
        );

        setSelectedOrder({ ...order, items: detailsResponse.data.items });
      } else {
        toast.error(detailsResponse.message || 'Failed to fetch order details');
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

  // Get the table number string from table ID
  const getTableNumber = (tableId: number) => {
    const session = sessions.find((s) => s.table_id === tableId);
    return session ? `Table ${session.table_id}` : `Table ${tableId}`;
  };

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending':
        return {
          color: 'bg-amber-500 hover:bg-amber-600',
          icon: Clock,
          bgClass: 'border-amber-200 bg-amber-50/30',
        };
      case 'Accepted':
        return {
          color: 'bg-blue-500 hover:bg-blue-600',
          icon: Loader,
          bgClass: 'border-blue-200 bg-blue-50/30',
        };
      case 'Declined':
        return {
          color: 'bg-red-500 hover:bg-red-600',
          icon: XCircle,
          bgClass: 'border-red-200 bg-red-50/30',
        };
      default:
        return {
          color: 'bg-gray-500 hover:bg-gray-600',
          icon: Clock,
          bgClass: 'border-gray-200',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader className="h-5 w-5 animate-spin" />
          <span>Loading dine-in orders...</span>
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
            Active Dine-In Orders
          </h2>
          <p className="text-sm text-gray-500">
            {orders.length} active order{orders.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDineInOrders}
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
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  No active dine-in orders
                </p>
                <p className="text-sm text-gray-500">
                  Active orders will appear here when customers place them
                </p>
              </div>
            </div>
          </Card>
        ) : (
          orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={order.id}
                className={`transition-all duration-200 hover:shadow-md ${statusConfig.bgClass}`}
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
                          className="flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          {getTableNumber(
                            order.tableNumber ? parseInt(order.tableNumber) : 0
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(order.created_at)}</span>
                        </div>
                        <span>•</span>
                        <span>{getTimeSince(order.created_at)}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <Badge
                        className={`${statusConfig.color} text-white flex items-center gap-1`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {order.status}
                      </Badge>
                      <div className="flex items-center gap-1 font-bold text-lg text-gray-700">
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
                    <span className="text-sm font-medium text-gray-700">
                      Update Status:
                    </span>
                    <div className="flex items-center gap-2">
                      {updatingOrderId === order.id && (
                        <Loader className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          handleStatusChange(order.id, value)
                        }
                        disabled={updatingOrderId === order.id}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="Accepted">
                            <div className="flex items-center gap-2">
                              <Loader className="h-4 w-4 text-blue-500" />
                              Accepted
                            </div>
                          </SelectItem>
                          <SelectItem value="Declined">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              Declined
                            </div>
                          </SelectItem>
                          <SelectItem value="Completed">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Completed
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            );
          })
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

export default DineInOrdersTab;
