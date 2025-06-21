import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShoppingCart, Plus, ArrowRight, ImageIcon } from 'lucide-react';
import {
  getMenuCategories,
  getMenuItemsByCategory,
  getWingFlavors,
  getMenuItemImageUrl,
} from '@/api/menu';
import { MenuCategory, MenuItem, WingFlavor } from '@/api/menu';
import { useCart } from '@/Cart-Context';
import CartDialog from '@/components/layout/customer/Cart-Dialog';
import { useSession } from '@/Session-Context';
import WingFlavorSelection from '@/components/layout/customer/Flavor-Selection';

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, updateSession } = useSession();

  // Get order parameters from URL
  const orderType = searchParams.get('orderType'); // 'dine-in' or 'take-out'
  const tableId = searchParams.get('tableId');
  const sessionId = searchParams.get('sessionId');
  const occupancy = searchParams.get('occupancy');
  const serviceType = searchParams.get('serviceType'); // 'unli-wings' or 'ala-carte'

  // Local state to track if we're in an unli-wings session
  const [isUnliWingsService, setIsUnliWingsService] = useState(false);

  // State for menu data
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<Record<number, MenuItem[]>>({});
  const [flavors, setFlavors] = useState<WingFlavor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showFlavorSelection, setShowFlavorSelection] = useState(false);
  const [selectedWingItem, setSelectedWingItem] = useState<MenuItem | null>(
    null
  );
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // State for cart dialog
  const [showCart, setShowCart] = useState(false);

  // Use cart context instead of local state
  const { addToCart, getItemCount } = useCart();

  const sessionRestored = useRef(false);

  // Handle image loading errors
  const handleImageError = (itemId: number) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  // Image placeholder component - smaller size like chef dashboard
  const ImagePlaceholder = ({ className }: { className?: string }) => (
    <div
      className={`bg-gray-100 flex items-center justify-center rounded-md ${className}`}
    >
      <div className="text-center text-gray-400">
        <ImageIcon className="h-4 w-4 mx-auto mb-1" />
        <span className="text-xs">No Image</span>
      </div>
    </div>
  );

  // Menu item image component - smaller size like chef dashboard
  const MenuItemImage = ({ item }: { item: MenuItem }) => {
    const hasImage = item.image_url && !imageErrors[item.id];

    if (hasImage) {
      return (
        <img
          src={getMenuItemImageUrl(item.image_url!)}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-md"
          onError={() => handleImageError(item.id)}
        />
      );
    }

    return <ImagePlaceholder className="w-16 h-16" />;
  };

  useEffect(() => {
    // Only process if we haven't already restored this session and there's state to restore
    if (
      !sessionRestored.current &&
      location.state &&
      location.state.continuingSession
    ) {
      const {
        sessionId,
        tableNumber,
        occupancyCount,
        serviceType,
        orderType,
        unliwingsBasePrice,
        unliWingsTotalCharge,
      } = location.state;

      // Log the restored session for debugging
      console.log('Restoring session from Bill-Out:', location.state);

      // Restore the session
      if (sessionId) {
        // Update the session context with all the values from state
        updateSession({
          sessionId,
          tableNumber,
          occupancyCount,
          serviceType,
          orderType,
          unliwingsBasePrice,
          unliWingsTotalCharge,
        });

        // Set unli-wings flag for UI rendering
        setIsUnliWingsService(serviceType === 'Unliwings');

        // Set initial category based on service type
        if (serviceType === 'Unliwings') {
          // If it's an unli-wings session, we might want to
          // show wings category first when available
          toast.info('Continue ordering for your session', {
            description: `${serviceType} service at Table ${tableNumber}`,
          });
        } // Mark that we've restored the session to prevent infinite loop
        sessionRestored.current = true;
      }
    }
  }, [location.state, updateSession]);

  // Update unli-wings flag whenever session changes
  useEffect(() => {
    if (session.serviceType === 'Unliwings') {
      setIsUnliWingsService(true);
    } else if (serviceType === 'unli-wings') {
      setIsUnliWingsService(true);
    } else {
      setIsUnliWingsService(false);
    }
  }, [session, serviceType]);

  // Fetch menu data on component mount
  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);

      // Load categories
      const categoriesResponse = await getMenuCategories();
      if (categoriesResponse.success && categoriesResponse.data.length > 0) {
        // Load menu items for each category
        const itemsMap: Record<number, MenuItem[]> = {};
        const categoriesToShow: MenuCategory[] = [];
        for (const category of categoriesResponse.data) {
          const itemsResponse = await getMenuItemsByCategory(
            category.id,
            false,
            true
          ); // Include unavailable items for customer viewing
          if (itemsResponse.success) {
            // Filter out unli-eligible items for all service types
            // as these will be handled separately in the Unliwings section
            const filteredItems = itemsResponse.data.filter(
              (item) => !item.is_unli_eligible
            );

            // Include categories that have items after filtering (both available and unavailable)
            if (filteredItems.length > 0) {
              itemsMap[category.id] = filteredItems;
              categoriesToShow.push(category);
            }
          }
        }

        // Set filtered categories and select the first one if available
        setCategories(categoriesToShow);
        if (categoriesToShow.length > 0) {
          setActiveCategory(categoriesToShow[0].id.toString());
        }

        setMenuItems(itemsMap);
      } // Load wing flavors (include unavailable ones for customer viewing)
      const flavorsResponse = await getWingFlavors(true); // Use forChef=true to include unavailable flavors
      if (flavorsResponse.success) {
        setFlavors(flavorsResponse.data);
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
      toast.error('Failed to load menu', {
        description: 'Please try refreshing the page',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWingItemSelect = (item: MenuItem) => {
    setSelectedWingItem(item);
    setShowFlavorSelection(true);
  };

  // Add this method to handle flavor selection confirmation
  const handleFlavorSelectionConfirm = (selectedFlavors: string[]) => {
    if (selectedWingItem) {
      handleAddToCart(selectedWingItem, selectedFlavors);
      setShowFlavorSelection(false);
      setSelectedWingItem(null);
    }
  };

  // Add this method to handle flavor selection cancellation
  const handleFlavorSelectionCancel = () => {
    setShowFlavorSelection(false);
    setSelectedWingItem(null);
  };

  const handleAddToCart = (item: MenuItem, selectedFlavors: string[] = []) => {
    // Create a cart item
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      isUnliwings: item.is_unli_eligible || false,
      flavors: selectedFlavors.length > 0 ? selectedFlavors : undefined,
    };

    // Add to cart using context
    addToCart(cartItem);

    toast.success(`${item.name} added to cart`, {
      description:
        selectedFlavors.length > 0
          ? `Flavors: ${selectedFlavors.join(', ')}`
          : undefined,
    });
  };

  const handleCheckout = () => {
    // Use session ID from location state if available (continuing session)
    const checkoutSessionId =
      (location.state && location.state.sessionId) || sessionId;

    // Navigate to order summary with order data
    navigate('/order-summary', {
      state: {
        orderType: (location.state && location.state.orderType) || orderType,
        tableId: (location.state && location.state.tableNumber) || tableId,
        sessionId: checkoutSessionId,
        occupancy:
          (location.state && location.state.occupancyCount) || occupancy,
        serviceType:
          (location.state && location.state.serviceType) || serviceType,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-amber-800">Menu</h1>
            <div className="text-sm text-gray-500">
              {session.orderType === 'dine-in' || orderType === 'dine-in' ? (
                <>
                  {(session.tableNumber || tableId) && (
                    <span>Table {session.tableNumber || tableId} • </span>
                  )}
                  {(session.occupancyCount || occupancy) && (
                    <span>
                      {session.occupancyCount || occupancy}{' '}
                      {session.occupancyCount === 1 || occupancy === '1'
                        ? 'Person'
                        : 'People'}{' '}
                      •{' '}
                    </span>
                  )}
                  <span className="font-medium capitalize">
                    {isUnliWingsService ? 'Unli-Wings' : 'Ala-Carte'}
                  </span>
                </>
              ) : (
                <span>Take-Out Order</span>
              )}
            </div>
          </div>

          {/* Cart button */}
          <Button
            variant="outline"
            className="relative"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {getItemCount() > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-amber-600">
                {getItemCount()}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Menu Content */}
      <main className="container mx-auto py-6 px-4">
        {/* Unliwings section - only visible for unli-wings service type */}
        {isUnliWingsService && (
          <div className="mb-8">
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-800 flex items-center">
                  Unlimited Wings
                  <Badge
                    variant="outline"
                    className="ml-2 bg-amber-100 text-amber-800 border-amber-300"
                  >
                    ₱{session.unliwingsBasePrice || '289'} per person
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 mb-4">
                  Select any flavor for your unlimited wings. You can order as
                  many servings as you want!
                </p>{' '}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {flavors.map((flavor) => (
                    <Button
                      key={flavor.id}
                      variant="outline"
                      className={`h-auto py-3 px-3 border-amber-200 ${
                        flavor.is_available
                          ? 'bg-white text-amber-800 hover:bg-amber-100 hover:text-amber-900'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                      }`}
                      disabled={!flavor.is_available}
                      onClick={() => {
                        if (!flavor.is_available) return;

                        // For Unliwings, we'll create a special cart item
                        // that represents an unlimited wings order with the selected flavor
                        const unliWingsItem: MenuItem = {
                          id: 9999, // Special ID for unli wings
                          name: 'Unlimited Wings',
                          price: 0, // No additional charge
                          category_id: 0,
                          is_available: true,
                          is_wing_item: true,
                          is_unli_eligible: true,
                          order_count: 0,
                          created_at: '',
                          updated_at: '',
                        };

                        handleAddToCart(unliWingsItem, [flavor.name]);
                      }}
                    >
                      <div className="flex flex-col items-center w-full">
                        <span className="font-medium">{flavor.name}</span>
                        <div
                          className={`text-xs mt-1 ${
                            flavor.is_available
                              ? 'text-amber-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {flavor.is_available ? (
                            <Plus className="h-4 w-4" />
                          ) : (
                            <span className="text-xs">Unavailable</span>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Regular menu items */}
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="space-y-4"
        >
          <TabsList className="bg-white border h-12 p-1 w-full flex overflow-x-auto">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id.toString()}
                className="flex-shrink-0"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id.toString()}>
              {' '}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems[category.id]?.map((item) => (
                  <Card
                    key={item.id}
                    className={`overflow-hidden transition-all ${
                      !item.is_available
                        ? 'opacity-60 bg-gray-50 border-gray-200'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <CardHeader className="py-3 border-b">
                      <div className="flex items-start space-x-3">
                        {/* Small Menu Item Image - positioned on the left */}
                        <div
                          className={`flex-shrink-0 ${
                            !item.is_available ? 'grayscale' : ''
                          }`}
                        >
                          <MenuItemImage item={item} />
                        </div>

                        {/* Menu Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle
                                  className={`text-md font-semibold leading-tight ${
                                    !item.is_available ? 'text-gray-500' : ''
                                  }`}
                                >
                                  {item.name}
                                </CardTitle>
                                {!item.is_available && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-gray-200 text-gray-600"
                                  >
                                    Unavailable
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p
                                  className={`text-xs mt-1 line-clamp-2 ${
                                    !item.is_available
                                      ? 'text-gray-400'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div
                              className={`font-bold flex-shrink-0 ml-2 ${
                                !item.is_available
                                  ? 'text-gray-400'
                                  : 'text-amber-600'
                              }`}
                            >
                              ₱
                              {item.price !== undefined && item.price !== null
                                ? Number(item.price).toFixed(2)
                                : '0.00'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>{' '}
                    <CardContent className="p-3">
                      <Button
                        className={`w-full ${
                          item.is_available
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!item.is_available}
                        onClick={() => {
                          if (!item.is_available) return;

                          // For wing items we need to handle flavor selection
                          if (item.is_wing_item && !item.is_unli_eligible) {
                            // Open flavor selection dialog for wing items
                            handleWingItemSelect(item);
                          } else {
                            handleAddToCart(item);
                          }
                        }}
                      >
                        {item.is_available
                          ? 'Add to Order'
                          : 'Currently Unavailable'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Cart Dialog */}
      <CartDialog
        open={showCart}
        onOpenChange={setShowCart}
        onCheckout={handleCheckout}
      />

      {/* Proceed to checkout button */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-center">
          <Button
            className="w-full max-w-md bg-amber-600 hover:bg-amber-700"
            onClick={handleCheckout}
          >
            Proceed to Order Summary ({getItemCount()}{' '}
            {getItemCount() === 1 ? 'item' : 'items'})
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add the WingFlavorSelection dialog */}
      {selectedWingItem && (
        <WingFlavorSelection
          open={showFlavorSelection}
          onOpenChange={setShowFlavorSelection}
          itemName={selectedWingItem.name}
          availableFlavors={flavors}
          onConfirm={handleFlavorSelectionConfirm}
          onCancel={handleFlavorSelectionCancel}
        />
      )}
    </div>
  );
};

export default MenuPage;
