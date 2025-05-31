import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import TableSelection from '@/components/layout/customer/Table-Selection';
import OccupancySelection from '@/components/layout/customer/Occupancy-Selection';
import ServiceSelection from '@/components/layout/customer/Service-Selection';
import { getAllTables, updateTableStatus } from '@/api/table';
import { createTableSession } from '@/api/session';
import { useSession } from '@/Session-Context';
import { KeyRound, Utensils } from 'lucide-react';

interface Table {
  id: number;
  table_number: string;
  status: string;
  qr_code_url?: string;
}

const Homepage = () => {
  const { startSession } = useSession();
  const [isOrderTypeDialogOpen, setIsOrderTypeDialogOpen] = useState(false);
  const [isTableSelectionOpen, setIsTableSelectionOpen] = useState(false);
  const [isOccupancySelectionOpen, setIsOccupancySelectionOpen] =
    useState(false);
  const [isServiceSelectionOpen, setIsServiceSelectionOpen] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [occupancyCount, setOccupancyCount] = useState(1);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Load tables when table selection dialog opens
  useEffect(() => {
    if (isTableSelectionOpen) {
      loadTables();
    }
  }, [isTableSelectionOpen]);
  const loadTables = async () => {
    setTablesLoading(true);
    setTablesError(null);
    try {
      const response = await getAllTables();
      // API is returning an array directly instead of {success, data, message} format
      if (Array.isArray(response)) {
        setTables(response);
      } else if (response.success && response.data) {
        // Handle the case where API might return the expected format
        setTables(response.data);
      } else {
        setTablesError('Invalid response format from server');
      }
    } catch (error) {
      setTablesError('Could not connect to server');
      console.error('Error loading tables:', error);
    } finally {
      setTablesLoading(false);
    }
  };

  const handleStartOrder = () => {
    setIsOrderTypeDialogOpen(true);
  };

  const handleStaffLogin = () => {
    navigate('/staff/login');
  };

  const handleDineIn = () => {
    setIsOrderTypeDialogOpen(false);
    setIsTableSelectionOpen(true);
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setIsTableSelectionOpen(false);
    setIsOccupancySelectionOpen(true);
    toast.success(`${table.table_number} selected`, {
      description: 'Now select the number of people',
    });
  };

  const handleOccupancySubmit = () => {
    setIsOccupancySelectionOpen(false);
    setIsServiceSelectionOpen(true);
  };

  const handleServiceSelect = async (
    serviceType: 'unli-wings' | 'ala-carte'
  ) => {
    setIsServiceSelectionOpen(false);

    if (selectedTable) {
      try {
        // Show loading toast
        const loadingToast = toast.loading('Creating your session...');

        // 1. Update table status to "Occupied"
        await updateTableStatus(selectedTable.id, { status: 'Occupied' });

        // 2. Create a table session
        const mappedServiceType =
          serviceType === 'unli-wings' ? 'Unliwings' : 'Ala-carte';
        const sessionResponse = await createTableSession(
          selectedTable.id,
          mappedServiceType,
          occupancyCount
        );

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (sessionResponse.success) {
          const sessionData = sessionResponse.data;

          // Save session to context/localStorage with unliwings pricing information
          startSession({
            sessionId: sessionData.id,
            tableId: selectedTable.id,
            tableNumber: selectedTable.table_number,
            serviceType: mappedServiceType,
            occupancyCount: occupancyCount,
            orderType: 'dine-in',
            isActive: true,
            status: sessionData.status,
            unliwingsBasePrice: sessionData.unliwings_base_price || undefined,
            unliWingsTotalCharge:
              sessionData.unliwings_total_charge || undefined,
            totalAmount: sessionData.total_amount || 0,
          });

          // Success toast
          toast.success(
            `${
              serviceType === 'unli-wings' ? 'Unli-Wings' : 'Ala-Carte'
            } session created`,
            {
              description: `Table: ${selectedTable.table_number}, People: ${occupancyCount}`,
            }
          );

          // Navigate to menu page with all the necessary details
          navigate(
            `/menu?orderType=dine-in&tableId=${selectedTable.id}&sessionId=${sessionResponse.data.id}&occupancy=${occupancyCount}&serviceType=${serviceType}`
          );
        } else {
          // If session creation failed, show error
          toast.error('Failed to create session', {
            description: sessionResponse.message || 'Please try again',
          });
        }
      } catch (error) {
        console.error('Error during service selection:', error);
        toast.error('Something went wrong', {
          description: 'Failed to setup your dining session. Please try again.',
        });
      }
    }
  };

  const handleTakeOut = () => {
    setIsOrderTypeDialogOpen(false);
    navigate('/menu?orderType=take-out');
    toast.success('Take-out selected');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-red-200 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-yellow-200 rounded-full blur-2xl"></div>
          <div className="absolute bottom-40 right-10 w-28 h-28 bg-orange-300 rounded-full blur-xl"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Hero section */}
        <div className="text-center mb-16 max-w-4xl">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-xl">
                <svg
                  className="w-12 h-12 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-orange-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 bg-clip-text text-transparent mb-8 tracking-tight py-2">
            Unli-Wings
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-6 font-medium">
            Unlimited Flavors, Unlimited Satisfaction
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 text-sm md:text-base">
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="w-5 h-5 text-orange-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
              </svg>
              <span>Fresh & Hot</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="w-5 h-5 text-orange-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
              <span>Quick Service</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="w-5 h-5 text-orange-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <span>Premium Quality</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-8 text-xl font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 border-0"
            onClick={handleStartOrder}
          >
            <Utensils className="text-white" />
            Start Ordering
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-2 border-orange-300 text-orange-700 py-8 text-xl font-semibold hover:text-orange-700 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-md transform hover:scale-105 transition-all duration-200"
            onClick={handleStaffLogin}
          >
            <KeyRound className="text-orange-700" />
            Staff Login
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-orange-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-12 h-12 bg-red-200 rounded-full opacity-60 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-8 w-8 h-8 bg-yellow-200 rounded-full opacity-60 animate-pulse delay-300"></div>
      </div>

      {/* Order Type Dialog */}
      <Dialog
        open={isOrderTypeDialogOpen}
        onOpenChange={setIsOrderTypeDialogOpen}
      >
        <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-gray-800 mb-2">
              Choose Order Type
            </DialogTitle>
            <p className="text-center text-gray-600">
              How would you like to enjoy your meal?
            </p>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-6">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-8 text-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={handleDineIn}
            >
              <svg
                className="w-6 h-6 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
              </svg>
              Dine In
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 py-8 text-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={handleTakeOut}
            >
              <svg
                className="w-6 h-6 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
              Take Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Selection Dialog */}
      <TableSelection
        open={isTableSelectionOpen}
        onOpenChange={setIsTableSelectionOpen}
        tables={tables}
        loading={tablesLoading}
        error={tablesError}
        onSelectTable={handleTableSelect}
      />

      {/* Occupancy Selection Dialog */}
      <OccupancySelection
        open={isOccupancySelectionOpen}
        onOpenChange={setIsOccupancySelectionOpen}
        occupancyCount={occupancyCount}
        setOccupancyCount={setOccupancyCount}
        onSubmit={handleOccupancySubmit}
      />

      {/* Service Type Selection Dialog */}
      <ServiceSelection
        open={isServiceSelectionOpen}
        onOpenChange={setIsServiceSelectionOpen}
        onSelectService={handleServiceSelect}
      />
    </div>
  );
};

export default Homepage;
