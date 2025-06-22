import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import Menu from '@/components/Menu';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  flavors?: string[];
}

interface TakeoutProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const Takeout: React.FC<TakeoutProps> = ({ cart, setCart }) => {
  const navigate = useNavigate();
  const [showCart, setShowCart] = useState(false);

  // Calculate cart totals
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleAddToCart = (item: any, flavors?: string[]) => {
    setCart((prevCart) => {
      // Check if this item (with the same flavors) is already in cart
      const existingItemIndex = prevCart.findIndex(
        (cartItem) =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.flavors || []) ===
            JSON.stringify(flavors || [])
      );

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += 1;
        return updatedCart;
      } else {
        // Add new item to cart
        return [
          ...prevCart,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            flavors,
          },
        ];
      }
    });

    toast.success(`Added to cart: ${item.name}`);
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove item if quantity is less than 1
      setCart((prevCart) => prevCart.filter((_, i) => i !== index));
    } else {
      // Update quantity
      setCart((prevCart) =>
        prevCart.map((item, i) =>
          i === index ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Cart cleared');
  };

  const handleCheckout = () => {
    // Will implement in a future feature
    toast.success('Order placed successfully!');
    navigate('/cart');
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-amber-800">Take-Out Menu</h1>
          <div className="text-sm text-gray-500 mt-1">
            Select items to add to your order
          </div>
        </div>

        {/* Cart button */}
        <Button
          variant="outline"
          className="relative"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-amber-600">
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Menu component for take-out */}
      <Menu serviceType="ala-carte" onAddToCart={handleAddToCart} />

      {/* Floating cart panel */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Your Cart</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent className="max-h-96 overflow-y-auto py-4">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  Your cart is empty
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.flavors && item.flavors.length > 0 && (
                          <div className="text-sm text-gray-500">
                            Flavors: {item.flavors.join(', ')}
                          </div>
                        )}
                        <div className="text-sm text-amber-600 mt-1">
                          ₱{Number(item.price).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateCartItemQuantity(index, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateCartItemQuantity(index, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex-col">
              <div className="w-full py-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span className="text-lg">₱{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCart(false)}
                >
                  Back to Menu
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  Checkout
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Takeout;
