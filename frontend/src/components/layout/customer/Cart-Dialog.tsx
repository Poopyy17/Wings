import { useState } from 'react';
import { useCart, CartItem } from '@/Cart-Context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MinusCircle, PlusCircle, X, Trash2 } from 'lucide-react';

interface CartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: () => void;
}

const CartDialog = ({ open, onOpenChange, onCheckout }: CartDialogProps) => {
  const { cart, removeFromCart, updateQuantity, getTotalPrice, getItemCount } =
    useCart();

  // Group items by type (unliwings vs regular items)
  const unliwingsItems = cart.filter((item) => item.isUnliwings);
  const regularItems = cart.filter((item) => !item.isUnliwings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-800">
            Your Order
            {getItemCount() > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {cart.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">Your cart is empty</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => onOpenChange(false)}
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[60vh]">
              {/* Display unliwings items first if any */}
              {unliwingsItems.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-amber-800 mb-2">
                    Unlimited Wings
                  </h3>
                  <div className="space-y-3">
                    {unliwingsItems.map((item, index) => {
                      const cartIndex = cart.indexOf(item);
                      return (
                        <CartItemRow
                          key={`${item.id}-${index}`}
                          item={item}
                          index={cartIndex}
                          onUpdateQuantity={updateQuantity}
                          onRemove={removeFromCart}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Regular items */}
              {regularItems.length > 0 && (
                <div>
                  <h3 className="font-medium text-amber-800 mb-2">
                    {unliwingsItems.length > 0 ? 'Additional Items' : 'Items'}
                  </h3>
                  <div className="space-y-3">
                    {regularItems.map((item, index) => {
                      const cartIndex = cart.indexOf(item);
                      return (
                        <CartItemRow
                          key={`${item.id}-${index}`}
                          item={item}
                          index={cartIndex}
                          onUpdateQuantity={updateQuantity}
                          onRemove={removeFromCart}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </ScrollArea>

            <Separator className="my-4" />

            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-700 font-medium">Total</span>
              <span className="text-lg font-bold text-amber-800">
                ₱{getTotalPrice().toFixed(2)}
              </span>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-300"
                onClick={() => onOpenChange(false)}
              >
                Continue Ordering
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={onCheckout}
              >
                Proceed to Checkout
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface CartItemRowProps {
  item: CartItem;
  index: number;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
}

const CartItemRow = ({
  item,
  index,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-start p-2 rounded-md bg-white border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-grow">
        <div className="flex justify-between">
          <div className="font-medium">{item.name}</div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-5 w-5 text-gray-400 hover:text-red-500 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Display flavors if any */}
        {item.flavors && item.flavors.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Flavor: {item.flavors.join(', ')}
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full bg-gray-100"
              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[20px] text-center">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full bg-gray-100"
              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm font-semibold text-amber-800">
            ₱{(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDialog;
