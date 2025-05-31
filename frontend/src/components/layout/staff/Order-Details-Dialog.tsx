import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { OrderTicket, OrderItem } from '@/api/order';

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderTicket;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  open,
  onOpenChange,
  order,
}) => {
  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Invalid date';
    }
  };

  // Separate and process items
  const processOrderItems = () => {
    if (!order.items || order.items.length === 0) {
      return { unliwingsFlavors: [], regularItems: [] };
    }

    const unliwingsFlavors: string[] = [];
    const regularItems: OrderItem[] = [];

    order.items.forEach((item: OrderItem) => {
      if (item.is_unliwings) {
        // Extract flavor names from Unlimited Wings items
        if (item.flavors && item.flavors.length > 0) {
          item.flavors.forEach((flavor) => {
            unliwingsFlavors.push(flavor.name);
          });
        }
      } else if (item.menu_item_id) {
        // Regular menu items
        regularItems.push(item);
      }
    });

    return { unliwingsFlavors, regularItems };
  };

  const { unliwingsFlavors, regularItems } = processOrderItems();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Order #{order.ticket_number}</p>
                <p className="text-sm text-gray-600">
                  {order.tableNumber ||
                    (order.is_takeout ? 'Take-Out' : 'Unknown Table')}
                </p>
              </div>
              <Badge
                className={`
                  ${
                    order.status === 'Pending'
                      ? 'bg-amber-500'
                      : order.status === 'Accepted'
                      ? 'bg-blue-500'
                      : order.status === 'Ready' || order.status === 'Completed'
                      ? 'bg-green-500'
                      : 'bg-gray-500'
                  }
                `}
              >
                {order.status}
              </Badge>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Ordered: {formatTime(order.created_at)}
            </div>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {/* Unlimited Wings Section */}
            {unliwingsFlavors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800"
                  >
                    Unlimited Wings
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {unliwingsFlavors.length} flavor
                    {unliwingsFlavors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 ml-4">
                  {unliwingsFlavors.map((flavor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-sm">{flavor}</span>
                      </div>
                      <span className="text-xs text-gray-500">1 order</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Separator if both sections exist */}
            {unliwingsFlavors.length > 0 && regularItems.length > 0 && (
              <Separator />
            )}

            {/* Regular Menu Items Section */}
            {regularItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    Menu Items
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {regularItems.length} item
                    {regularItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3 ml-4">
                  {regularItems.map((item: OrderItem, idx: number) => (
                    <div
                      key={idx}
                      className="border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">
                            {item.quantity}x {item.item_name}
                          </div>
                          {item.notes && (
                            <div className="text-sm text-gray-600 italic mt-1">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-gray-700 font-bold">
                          ₱{Number(item.subtotal).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No items case */}
            {unliwingsFlavors.length === 0 && regularItems.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No items to display
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between items-center font-bold text-lg">
            <div>Total:</div>
            <div className="text-gray-700">
              ₱{Number(order.total_amount).toFixed(2)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
