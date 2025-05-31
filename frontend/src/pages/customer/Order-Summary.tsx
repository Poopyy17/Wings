import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/Cart-Context';
import { useSession } from '@/Session-Context';
import { createOrderTicket, createTakeoutOrder } from '@/api/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Check } from 'lucide-react';

const OrderSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, getTotalPrice, clearCart } = useCart();
  const { session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get order parameters from location state
  const { orderType: locationOrderType, isTakeOut } = location.state || {};

  // Determine if this is a take-out order from either session or location
  const isTakeOutOrder =
    session.orderType === 'take-out' ||
    locationOrderType === 'take-out' ||
    isTakeOut === true;

  // Group items by type
  const unliwingsItems = cart.filter((item) => item.isUnliwings);
  const regularItems = cart.filter((item) => !item.isUnliwings);

  // Check if we have Unliwings service
  const isUnliwingsService = session.serviceType === 'Unliwings';

  // Collect all flavors from unliwings items
  const allFlavors = unliwingsItems.reduce((flavors, item) => {
    if (item.flavors && item.flavors.length > 0) {
      return [...flavors, ...item.flavors];
    }
    return flavors;
  }, [] as string[]);

  const handleBackToMenu = () => {
    navigate(-1);
  };

  const handlePlaceOrder = async () => {
    try {
      // Only submit non-empty cart
      if (cart.length === 0) {
        toast.error('Your cart is empty');
        return;
      }

      setIsSubmitting(true);
      // Show loading toast
      const loadingToast = toast.loading('Placing your order...');

      let response;

      if (isTakeOutOrder) {
        // Handle take-out order
        response = await createTakeoutOrder(
          cart.map((item) => ({
            menu_item_id: item.id,
            name: item.name,
            quantity: item.quantity,
            flavors: item.flavors || [],
            is_unliwings: item.isUnliwings || false,
            price: item.price,
          }))
        );
      } else {
        // Handle dine-in order with session
        if (!session.sessionId) {
          toast.dismiss(loadingToast);
          toast.error('Session information missing');
          setIsSubmitting(false);
          return;
        }

        response = await createOrderTicket(
          session.sessionId,
          cart,
          false // not take-out
        );
      }

      toast.dismiss(loadingToast);

      if (response.success) {
        // Clear the cart
        clearCart();

        if (isTakeOutOrder) {
          // For take-out orders, navigate to thank-you page
          toast.success('Take-out order placed successfully!');
          navigate('/thank-you', {
            state: {
              orderNumber: response.data.orderNumber,
              orderId: response.data.id,
              orderType: 'take-out',
            },
          });
        } else {
          // For dine-in orders, navigate to Bill-out page
          toast.success('Order placed successfully!', {
            description: `Ticket #${response.data.ticketNumber} has been sent to the kitchen.`,
          });

          navigate('/bill-out', {
            state: {
              ticketNumber: response.data.ticketNumber,
              ticketId: response.data.ticketId,
            },
          });
        }
      } else {
        toast.error('Failed to place order', {
          description: response.message || 'Please try again',
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Something went wrong', {
        description: 'Failed to place your order. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate only the regular items total (excluding unliwings items)
  const regularItemsTotal = regularItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const totalAmount = getTotalPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-amber-800">Order Summary</h1>
            <div className="text-sm text-gray-500">
              {isTakeOutOrder ? (
                <span className="font-medium">Take-Out Order</span>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back button at the top */}
          <Button
            variant="ghost"
            className="mb-4 text-amber-800"
            onClick={handleBackToMenu}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>

          {/* Unliwings Section - Only show flavor selections without pricing */}
          {isUnliwingsService &&
            unliwingsItems.length > 0 &&
            !isTakeOutOrder && (
              <Card className="mb-6 border-amber-200">
                <CardHeader className="bg-amber-50 border-b border-amber-100">
                  <CardTitle className="text-lg text-amber-800">
                    Unlimited Wings Flavors
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {unliwingsItems.length > 0 ? (
                    <div className="space-y-3">
                      {/* Group by flavor to show quantities */}
                      {unliwingsItems.map((item, index) => (
                        <div key={index} className="py-2">
                          <div className="flex items-center">
                            <span className="text-sm font-medium">
                              {item.quantity}x Wings
                            </span>
                            {item.flavors && item.flavors.length > 0 && (
                              <span className="text-xs text-gray-600 ml-2">
                                ({item.flavors.join(', ')})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      <Separator className="my-3" />

                      {/* Show all flavors in one line */}
                      <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
                        <p className="text-sm font-medium text-amber-800 mb-1">
                          All Ordered Flavors:
                        </p>
                        <p className="text-sm text-gray-600">
                          {allFlavors.length > 0
                            ? Array.from(new Set(allFlavors)).join(', ')
                            : 'No flavors selected'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No wings added to this order.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Regular Items Section */}
          {regularItems.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg text-gray-800">
                  {isTakeOutOrder ? 'Your Order' : 'Additional Items'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {regularItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            × {item.quantity}
                          </span>
                        </div>
                        {item.flavors && item.flavors.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Flavor: {item.flavors.join(', ')}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-gray-800">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {regularItems.length > 0 && (
                  <div className="flex justify-between items-center mt-4 pt-3 border-t">
                    <p className="font-medium">Items Subtotal</p>
                    <p className="font-bold text-gray-800">
                      ₱{regularItemsTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Grand Total */}
          {cart.length > 0 && (
            <Card className="mb-6 border-amber-300">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg">Order Total</p>
                  <p className="font-bold text-xl text-amber-800">
                    ₱{totalAmount.toFixed(2)}
                  </p>
                </div>
                {isUnliwingsService && !isTakeOutOrder && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    *Unli-Wings service charge will be added to your final bill
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Show message if cart is empty */}
          {cart.length === 0 && (
            <div className="bg-white p-6 rounded-lg border text-center my-8">
              <p className="text-gray-600">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">
                Add some items to continue
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleBackToMenu}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || isSubmitting}
            >
              <Check className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderSummary;
