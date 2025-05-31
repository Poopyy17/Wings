import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMenuCategories,
  getMenuItemsByCategory,
  getWingFlavors,
  updateMenuItemAvailability,
  updateWingFlavorAvailability,
  uploadMenuItemImage,
  deleteMenuItemImage,
  getMenuItemImageUrl,
  MenuCategory,
  MenuItem,
  WingFlavor,
} from '@/api/menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/Confirmation-Dialog';
import {
  Utensils,
  Plus,
  Loader2,
  ShoppingBag,
  Coffee,
  LogOut,
  Upload,
  X,
  ImageIcon,
} from 'lucide-react';

const ChefDashboard = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<Record<number, MenuItem[]>>({});
  const [wingFlavors, setWingFlavors] = useState<WingFlavor[]>([]);
  const [activeTab, setActiveTab] = useState<string>('menu');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [uploadingImages, setUploadingImages] = useState<
    Record<number, boolean>
  >({});

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    confirmText: '',
    onConfirm: () => {},
    isLoading: false,
    variant: 'default' as 'default' | 'destructive',
  });

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    // Navigate to login page with logout parameter
    navigate('/staff/login?logout=true');

    // Optional: Show success message
    toast.success('Logged out successfully');
  };

  // Handle image upload
  const handleImageUpload = async (itemId: number, file: File) => {
    try {
      setUploadingImages((prev) => ({ ...prev, [itemId]: true }));

      const response = await uploadMenuItemImage(itemId, file);

      if (response.success) {
        // Update the menu item in local state
        setMenuItems((prev) => {
          const updatedItems = { ...prev };
          Object.keys(updatedItems).forEach((categoryId) => {
            const categoryItems = updatedItems[parseInt(categoryId)];
            const itemIndex = categoryItems.findIndex(
              (item) => item.id === itemId
            );
            if (itemIndex !== -1) {
              updatedItems[parseInt(categoryId)][itemIndex] = response.data;
            }
          });
          return updatedItems;
        });

        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImages((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Handle image deletion with confirmation
  const handleImageDeleteConfirm = (item: MenuItem) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Image',
      description: `Are you sure you want to delete the image for "${item.name}"? This action cannot be undone.`,
      confirmText: 'Delete Image',
      variant: 'destructive',
      isLoading: false,
      onConfirm: () => handleImageDelete(item.id),
    });
  };

  // Handle image deletion
  const handleImageDelete = async (itemId: number) => {
    try {
      setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
      setUploadingImages((prev) => ({ ...prev, [itemId]: true }));

      const response = await deleteMenuItemImage(itemId);

      if (response.success) {
        // Update the menu item in local state
        setMenuItems((prev) => {
          const updatedItems = { ...prev };
          Object.keys(updatedItems).forEach((categoryId) => {
            const categoryItems = updatedItems[parseInt(categoryId)];
            const itemIndex = categoryItems.findIndex(
              (item) => item.id === itemId
            );
            if (itemIndex !== -1) {
              updatedItems[parseInt(categoryId)][itemIndex] = response.data;
            }
          });
          return updatedItems;
        });

        toast.success('Image deleted successfully');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setUploadingImages((prev) => ({ ...prev, [itemId]: false }));
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Image upload component
  const ImageUploadBox = ({ item }: { item: MenuItem }) => {
    const inputId = `image-upload-${item.id}`;
    const isUploading = uploadingImages[item.id];
    const hasImage = item.image_url;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('File size must be less than 5MB');
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }

        handleImageUpload(item.id, file);
      }
      // Reset input value so same file can be selected again
      event.target.value = '';
    };

    return (
      <div className="flex-shrink-0 mr-4">
        <div className="relative w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          ) : hasImage ? (
            <div className="relative w-full h-full">
              <img
                src={getMenuItemImageUrl(item.image_url!)}
                alt={item.name}
                className="w-full h-full object-cover rounded-md"
              />
              <button
                onClick={() => handleImageDeleteConfirm(item)}
                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs transition-colors"
                title="Delete image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={inputId}
              className="w-full h-full flex items-center justify-center cursor-pointer"
            >
              <Plus className="h-6 w-6 text-gray-400" />
            </label>
          )}

          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
        <p className="text-xs text-gray-500 text-center mt-1">Image</p>
      </div>
    );
  };

  // Fetch menu data
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        // Fetch categories
        const categoriesResponse = await getMenuCategories();
        setCategories(categoriesResponse.data);

        // Fetch wing flavors
        const flavorsResponse = await getWingFlavors(true);
        setWingFlavors(flavorsResponse.data);

        // Fetch menu items for each category
        const itemsMap: Record<number, MenuItem[]> = {};
        for (const category of categoriesResponse.data) {
          const itemsResponse = await getMenuItemsByCategory(category.id, true);
          itemsMap[category.id] = itemsResponse.data;
        }
        setMenuItems(itemsMap);
      } catch (error) {
        console.error('Error fetching menu data:', error);
        toast.error('Failed to load menu data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Toggle menu item availability
  const toggleItemAvailability = async (item: MenuItem) => {
    const itemKey = `item-${item.id}`;

    try {
      setIsUpdating((prev) => ({ ...prev, [itemKey]: true }));

      // Make API call to update item availability using the imported function
      const response = await updateMenuItemAvailability(
        item.id,
        !item.is_available
      );

      if (response.success) {
        // Update local state
        setMenuItems((prev) => {
          const updatedItems = [...prev[item.category_id]];
          const itemIndex = updatedItems.findIndex((i) => i.id === item.id);

          if (itemIndex !== -1) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              is_available: !item.is_available,
            };
          }

          return {
            ...prev,
            [item.category_id]: updatedItems,
          };
        });

        toast.success(
          `${item.name} is now ${
            !item.is_available ? 'available' : 'unavailable'
          }`
        );
      } else {
        toast.error('Failed to update item availability');
      }
    } catch (error) {
      console.error('Error updating item availability:', error);
      toast.error('Failed to update item availability');
    } finally {
      setIsUpdating((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  // Toggle wing flavor availability
  const toggleFlavorAvailability = async (flavor: WingFlavor) => {
    const flavorKey = `flavor-${flavor.id}`;

    try {
      setIsUpdating((prev) => ({ ...prev, [flavorKey]: true }));

      // Make API call to update flavor availability using the imported function
      const response = await updateWingFlavorAvailability(
        flavor.id,
        !flavor.is_available
      );

      if (response.success) {
        // Update local state
        setWingFlavors((prev) => {
          const updatedFlavors = [...prev];
          const flavorIndex = updatedFlavors.findIndex(
            (f) => f.id === flavor.id
          );

          if (flavorIndex !== -1) {
            updatedFlavors[flavorIndex] = {
              ...updatedFlavors[flavorIndex],
              is_available: !flavor.is_available,
            };
          }

          return updatedFlavors;
        });

        toast.success(
          `${flavor.name} is now ${
            !flavor.is_available ? 'available' : 'unavailable'
          }`
        );
      } else {
        toast.error('Failed to update flavor availability');
      }
    } catch (error) {
      console.error('Error updating flavor availability:', error);
      toast.error('Failed to update flavor availability');
    } finally {
      setIsUpdating((prev) => ({ ...prev, [flavorKey]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-4" />
        <p className="text-gray-600">Loading menu data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-amber-800">Chef Dashboard</h1>
            <p className="text-sm text-gray-500">
              Manage menu items and flavors availability
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Menu Management
            </h2>
            <p className="text-gray-600">
              Toggle availability for menu items and wing flavors
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="menu"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
            <TabsTrigger
              value="menu"
              className="flex items-center justify-center"
            >
              <Utensils className="h-4 w-4 mr-2" />
              Menu Items
            </TabsTrigger>
            <TabsTrigger
              value="flavors"
              className="flex items-center justify-center"
            >
              <Coffee className="h-4 w-4 mr-2" />
              Wing Flavors
            </TabsTrigger>
          </TabsList>

          {/* Menu Items Tab */}
          <TabsContent value="menu" className="space-y-6">
            {categories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="">
                  <CardTitle className="flex items-center font-bold text-xl mt-2">
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {menuItems[category.id]?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center p-4 hover:bg-gray-50"
                      >
                        {/* Image Upload Box */}
                        <ImageUploadBox item={item} />

                        {/* Menu Item Details */}
                        <div className="flex-grow mr-4">
                          <div className="flex items-center">
                            <h3 className="font-medium">{item.name}</h3>
                            {item.is_wing_item && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Wing Item
                              </Badge>
                            )}
                            {item.is_unli_eligible && (
                              <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                Unli-Eligible
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            ₱{parseFloat(item.price.toString()).toFixed(2)}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Availability Toggle */}
                        <div className="flex items-center">
                          <div className="mr-4 text-right">
                            <Badge
                              variant={
                                item.is_available ? 'default' : 'secondary'
                              }
                              className="mb-1"
                            >
                              {item.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {item.order_count || 0} orders
                            </p>
                          </div>
                          <div className="flex items-center">
                            {isUpdating[`item-${item.id}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                            ) : (
                              <Switch
                                checked={item.is_available}
                                onCheckedChange={() =>
                                  toggleItemAvailability(item)
                                }
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!menuItems[category.id] ||
                      menuItems[category.id].length === 0) && (
                      <p className="p-4 text-center text-gray-500 italic">
                        No items in this category
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Wing Flavors Tab */}
          <TabsContent value="flavors">
            <Card>
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center">
                  <Coffee className="h-5 w-5 mr-2 text-amber-600" />
                  Wing Flavors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {wingFlavors.map((flavor) => (
                    <div
                      key={flavor.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div className="flex-grow">
                        <h3 className="font-medium">{flavor.name}</h3>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-4 text-right">
                          <Badge
                            variant={
                              flavor.is_available ? 'default' : 'secondary'
                            }
                            className="mb-1"
                          >
                            {flavor.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {flavor.order_count || 0} orders
                          </p>
                        </div>
                        <div className="flex items-center">
                          {isUpdating[`flavor-${flavor.id}`] ? (
                            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                          ) : (
                            <Switch
                              checked={flavor.is_available}
                              onCheckedChange={() =>
                                toggleFlavorAvailability(flavor)
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {wingFlavors.length === 0 && (
                    <p className="p-4 text-center text-gray-500 italic">
                      No wing flavors available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={confirmDialog.open}
          onOpenChange={(open) =>
            setConfirmDialog((prev) => ({ ...prev, open }))
          }
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText}
          onConfirm={confirmDialog.onConfirm}
          isLoading={confirmDialog.isLoading}
          variant={confirmDialog.variant}
        />
      </main>
    </div>
  );
};

export default ChefDashboard;
