import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';

// Define cart item interface
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  flavors?: string[];
  isUnliwings?: boolean;
}

// Define context type
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotalPrice: () => 0,
  getItemCount: () => 0,
});

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext);

// Provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Initialize cart from localStorage if available
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('wings_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  // Update localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('wings_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      (cartItem) =>
        cartItem.id === item.id &&
        JSON.stringify(cartItem.flavors) === JSON.stringify(item.flavors)
    );

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += item.quantity;
      setCart(newCart);
    } else {
      // Add new item to cart
      setCart((prev) => [...prev, item]);
    }
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      removeFromCart(index);
      return;
    }

    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const clearCart = () => {
    setCart([]);
    // Also clear from localStorage
    localStorage.removeItem('wings_cart');
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => {
      return count + item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
