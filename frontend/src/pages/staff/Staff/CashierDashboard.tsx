import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  LogOut,
  TableIcon,
  ClipboardList,
  CheckCircle,
  Utensils,
} from 'lucide-react';
import TablesView from '@/components/layout/staff/Tables-View';
import OrdersView from '@/components/layout/staff/Orders-View';
import CompletedOrdersView from '@/components/layout/staff/Completed-Orders';
import Menu from '@/components/Menu';

const CashierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tables');

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    // Navigate to login page with logout parameter
    navigate('/staff/login?logout=true');

    // Optional: Show success message
    toast.success('Logged out successfully');
  };

  const navigateToOrders = () => {
    setActiveTab('orders');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-amber-800">
              Cashier Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Manage tables, orders, payments and menu
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="tables" className="flex items-center gap-1">
              <TableIcon className="h-4 w-4" /> Tables
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Completed Orders
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-1">
              <Utensils className="h-4 w-4" /> Menu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables">
            <TablesView onNavigateToOrders={navigateToOrders} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersView />
          </TabsContent>

          <TabsContent value="completed">
            <CompletedOrdersView />
          </TabsContent>

          <TabsContent value="menu">
            <Menu />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CashierDashboard;
