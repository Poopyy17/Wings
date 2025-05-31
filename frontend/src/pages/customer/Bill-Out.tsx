import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/Session-Context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { getSessionTickets, OrderTicket } from '@/api/order';
import { setTableForPayment } from '@/api/table';
import {
  ShoppingCart,
  CreditCard,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Type for combined additional items
interface AdditionalItemSummary {
  name: string;
  totalQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

const BillOut = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession();
  const [tickets, setTickets] = useState<OrderTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTickets, setExpandedTickets] = useState<
    Record<string, boolean>
  >({});

  // Collect the ticket details passed from Order Summary
  const { ticketNumber, ticketId } = location.state || {};

  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (!session.sessionId) {
        toast.error('Session information is missing');
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        const response = await getSessionTickets(session.sessionId);
        if (response.success) {
          setTickets(response.data);

          // Automatically expand the latest ticket
          if (response.data.length > 0) {
            const latestTicket = response.data[0];
            setExpandedTickets({ [latestTicket.id]: true });
          }
        } else {
          toast.error('Failed to load order history');
        }
      } catch (error) {
        console.error('Error fetching order history:', error);
        toast.error('Something went wrong while loading order history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderHistory();
  }, [session.sessionId, navigate]);

  // Get the latest ticket
  const latestTicket = tickets.length > 0 ? tickets[0] : null;

  // Check if the latest ticket is pending
  const isLatestTicketPending = latestTicket?.status === 'Pending';

  // Helper function to toggle a ticket's expanded state
  const toggleTicketExpanded = (ticketId: string) => {
    setExpandedTickets((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
  };
  // Gather all flavors from all unliwings items in all tickets (excluding declined tickets)
  const allFlavors = tickets
    .filter((ticket) => ticket.status !== 'Declined') // Filter out declined tickets
    .flatMap((ticket) =>
      (ticket.items || [])
        .filter((item) => item.is_unliwings)
        .flatMap((item) => (item.flavors || []).map((flavor) => flavor.name))
    );
  // Get all additional (regular) items from all tickets combined (excluding declined tickets)
  const getAllAdditionalItems = (): AdditionalItemSummary[] => {
    // Create a map to aggregate items by name
    const itemMap = new Map<string, AdditionalItemSummary>();

    // Go through all tickets (excluding declined tickets)
    tickets
      .filter((ticket) => ticket.status !== 'Declined') // Filter out declined tickets
      .forEach((ticket) => {
        // Process non-unliwings items in each ticket
        (ticket.items || [])
          .filter((item) => !item.is_unliwings)
          .forEach((item) => {
            const name = item.item_name;
            const quantity = item.quantity;
            const unitPrice = Number(item.unit_price);
            const subtotal = Number(item.subtotal);

            if (itemMap.has(name)) {
              // Update existing item in the map
              const existingItem = itemMap.get(name)!;
              existingItem.totalQuantity += quantity;
              existingItem.totalPrice += subtotal;
            } else {
              // Add new item to the map
              itemMap.set(name, {
                name,
                unitPrice,
                totalQuantity: quantity,
                totalPrice: subtotal,
              });
            }
          });
      });

    // Convert the map to an array and sort alphabetically by name
    return Array.from(itemMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  };
  // Get all additional items across all tickets
  const additionalItems = getAllAdditionalItems();

  // Calculate total for regular (non-unliwings) items from accepted/completed tickets only
  const regularItemsTotal = tickets
    .filter((ticket) => ticket.status !== 'Declined') // Filter out declined tickets
    .reduce((sum, ticket) => sum + (parseFloat(ticket.total_amount) || 0), 0);

  const isUnliwingsService = session.serviceType === 'Unliwings';
  const unliwingsTotal = isUnliwingsService
    ? session.unliWingsTotalCharge || 0
    : 0;
  const grandTotal = regularItemsTotal + Number(unliwingsTotal);

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Handle order again navigation with session retention
  const handleOrderAgain = () => {
    // Construct the URL based on the session type
    let menuUrl = '/menu';

    // Add query parameters to maintain session context in the menu
    if (session.serviceType) {
      menuUrl += `?service=${session.serviceType.toLowerCase()}`;

      // If it's Unliwings service, pass additional parameters
      if (session.serviceType === 'Unliwings') {
        menuUrl += `&unliwings=true`;
      }
    }

    // If it's dine-in, include table number
    if (session.orderType === 'dine-in' && session.tableNumber) {
      menuUrl += `&table=${session.tableNumber}`;
    }

    // For take-out orders
    if (session.orderType === 'take-out') {
      menuUrl += `&takeout=true`;
    }

    // Navigate with state to preserve session information
    navigate(menuUrl, {
      state: {
        continuingSession: true,
        sessionId: session.sessionId,
        // Include all other relevant session data
        tableNumber: session.tableNumber,
        occupancyCount: session.occupancyCount,
        serviceType: session.serviceType,
        orderType: session.orderType,
        unliwingsBasePrice: session.unliwingsBasePrice,
        unliWingsTotalCharge: session.unliWingsTotalCharge,
      },
    });
  };

  // Handle proceed to payment
  const handleProceedToPayment = async () => {
    // Show loading toast
    const loadingToast = toast.loading('Preparing your bill for payment...');

    try {
      // For dine-in orders, update the table status
      if (session.orderType === 'dine-in' && session.tableId) {
        // Call the API to update table status
        await setTableForPayment(session.tableId);

        toast.dismiss(loadingToast);
        toast.success('Your table has been marked for payment', {
          description:
            'Please proceed to the counter to complete your payment.',
        });

        // Navigate to thank you page
        navigate('/thank-you', {
          state: {
            grandTotal: grandTotal,
            tableNumber: session.tableNumber,
          },
        });
      } else {
        // For takeout orders, just navigate to thank you
        toast.dismiss(loadingToast);
        toast.success('Your order is ready for payment', {
          description:
            'Please proceed to the counter to complete your payment.',
        });

        navigate('/thank-you', {
          state: {
            grandTotal: grandTotal,
            tableNumber: session.tableNumber,
          },
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error updating table status:', error);
      toast.error('Something went wrong', {
        description: 'Please try again or ask for assistance.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading your bill...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-amber-800">Bill Summary</h1>
          <div className="text-sm text-gray-500">
            {session.orderType === 'dine-in' ? (
              <>
                {session.tableNumber && (
                  <span>Table {session.tableNumber} • </span>
                )}
                {session.occupancyCount && (
                  <span>
                    {session.occupancyCount}{' '}
                    {session.occupancyCount === 1 ? 'Person' : 'People'} •{' '}
                  </span>
                )}
                <span className="font-medium">
                  {session.serviceType === 'Unliwings'
                    ? 'Unli-Wings'
                    : 'Ala-Carte'}
                </span>
              </>
            ) : (
              <span>Take-Out Order</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Order info */}
          <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-medium text-gray-700">
                  Session Information
                </h2>
                <p className="text-sm text-gray-500">
                  {tickets.length > 0
                    ? `You have placed ${tickets.length} order${
                        tickets.length !== 1 ? 's' : ''
                      } in this session`
                    : 'No orders placed yet in this session'}
                </p>
              </div>

              {isLatestTicketPending && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-yellow-600" />
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Order in Progress
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* All Tickets Section */}
          {tickets.length > 0 && (
            <div className="mb-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Your Orders
              </h2>

              {tickets.map((ticket) => (
                <Collapsible
                  key={ticket.id}
                  open={expandedTickets[ticket.id.toString()]}
                  onOpenChange={() =>
                    toggleTicketExpanded(ticket.id.toString())
                  }
                  className="bg-white border rounded-lg overflow-hidden"
                >
                  <CollapsibleTrigger className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {expandedTickets[ticket.id.toString()] ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium">
                          Ticket #{ticket.ticket_number}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(ticket.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusBadgeColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="px-4 pb-4 border-t">
                    {/* Display unliwings items */}
                    {ticket.items?.some((item) => item.is_unliwings) && (
                      <div className="py-3">
                        <h4 className="text-sm font-medium text-amber-800 mb-2">
                          Unlimited Wings
                        </h4>
                        <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
                          {ticket.items
                            .filter((item) => item.is_unliwings)
                            .map((item, idx) => (
                              <div key={idx} className="mb-1 last:mb-0">
                                <span className="text-sm">
                                  {item.quantity}x Wings{' '}
                                </span>
                                {item.flavors && item.flavors.length > 0 && (
                                  <span className="text-xs text-gray-600">
                                    (
                                    {item.flavors.map((f) => f.name).join(', ')}
                                    )
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Display regular items */}
                    {ticket.items?.some((item) => !item.is_unliwings) && (
                      <div className="py-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Additional Items
                        </h4>
                        <div className="space-y-2">
                          {ticket.items
                            .filter((item) => !item.is_unliwings)
                            .map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-start py-1 border-b border-gray-100 last:border-0"
                              >
                                <div>
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium">
                                      {item.item_name}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      × {item.quantity}
                                    </span>
                                  </div>
                                  {item.flavors && item.flavors.length > 0 && (
                                    <p className="text-xs text-gray-500">
                                      Flavor:{' '}
                                      {item.flavors
                                        .map((f) => f.name)
                                        .join(', ')}
                                    </p>
                                  )}
                                </div>{' '}
                                <p className="text-sm font-medium text-gray-800">
                                  ₱{Number(item.subtotal).toFixed(2)}
                                </p>
                              </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 text-sm">
                          <p className="font-medium">Ticket Subtotal</p>
                          <p className="font-bold text-gray-800">
                            ₱{' '}
                            {ticket.items
                              .filter((item) => !item.is_unliwings)
                              .reduce(
                                (sum, item) => sum + Number(item.subtotal),
                                0
                              )
                              .toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* If no items exist in the ticket */}
                    {(!ticket.items || ticket.items.length === 0) && (
                      <div className="py-4 text-center text-sm text-gray-500">
                        No items in this order.
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}

          {/* Unliwings Service Summary - Only show if it's an Unliwings session */}
          {isUnliwingsService && (
            <Card className="mb-6 border-amber-200">
              <CardHeader className="bg-amber-50 border-b border-amber-100">
                <CardTitle className="text-lg text-amber-800">
                  Unlimited Wings Service
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-gray-700">
                      Unli-Wings × {session.occupancyCount}{' '}
                      {session.occupancyCount === 1 ? 'person' : 'people'}
                    </p>
                    <p className="text-sm text-gray-500">
                      ₱{session.unliwingsBasePrice} per person
                    </p>
                  </div>
                  <p className="text-lg font-bold text-amber-800">
                    ₱{Number(session.unliWingsTotalCharge).toFixed(2)}
                  </p>
                </div>

                <Separator className="my-3" />

                {/* Display all flavors ordered across all tickets */}
                <div className="space-y-3 mt-4">
                  <p className="text-sm font-medium text-gray-700">
                    All Ordered Flavors:
                  </p>
                  {allFlavors.length > 0 ? (
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
                      <p className="text-sm text-gray-600">
                        {Array.from(new Set(allFlavors)).join(', ')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No flavors ordered yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Items Summary - with detailed breakdown */}
          {regularItemsTotal > 0 && (
            <Card className="mb-6">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg text-gray-800">
                  Additional Items Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Detailed breakdown of all additional items */}
                <div className="space-y-3 mb-4">
                  {additionalItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            × {item.totalQuantity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Unit price: ₱{item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-gray-800">
                        ₱{item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total for all additional items */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                  <p className="font-medium">Total for Additional Items</p>
                  <p className="font-bold text-gray-800">
                    ₱{regularItemsTotal.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grand Total */}
          <Card className="mb-6 border-amber-300">
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-lg">Grand Total</p>
                <p className="font-bold text-xl text-amber-800">
                  ₱{grandTotal.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <Button
              variant="outline"
              className="flex-1 border-amber-300 text-amber-700 py-6"
              onClick={handleOrderAgain}
              disabled={isLatestTicketPending}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order Again
            </Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700 py-6"
              onClick={handleProceedToPayment}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Proceed to Payment
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BillOut;
