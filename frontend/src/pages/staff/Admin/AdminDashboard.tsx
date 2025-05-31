import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  LogOut,
  Download,
  BarChart3,
  TableIcon,
  ClipboardList,
  CheckCircle,
  Utensils,
} from 'lucide-react';

// Import analytics components
import OrdersRevenue from '@/components/layout/admin/Orders-Revenue';
import RevenueTrend from '@/components/layout/admin/Revenue-Trend';
import SellingItems from '@/components/layout/admin/Selling-Items';
import OrdersTrend from '@/components/layout/admin/Orders-Trend';

// Import operational components
import AdminTablesView from '@/components/layout/admin/Admin-Tables-View';
import AdminOrdersView from '@/components/layout/admin/Admin-Orders-View';
import AdminCompletedOrdersView from '@/components/layout/admin/Admin-Completed-Orders';
import AdminMenuView from '@/components/layout/admin/Admin-Menu-View';

// Import analytics API and PDF export hook
import { analyticsAPI } from '@/api/analytics';
import { useAnalyticsPDFExport } from '@/hooks/useAnalyticsPDFExport';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { exportToPDF, isExporting } = useAnalyticsPDFExport();
  const [activeTab, setActiveTab] = useState('analytics');

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

  const handleExportPDF = async () => {
    try {
      // Fetch all data needed for PDF export
      const [summaryData, revenueData, ordersData, topItemsData] =
        await Promise.all([
          analyticsAPI.getSummaryForPDF(),
          analyticsAPI.getRevenueTrend('daily'),
          analyticsAPI.getOrdersTrend('daily'),
          analyticsAPI.getTopSelling(),
        ]);

      await exportToPDF({
        summary: summaryData,
        revenueTrend: revenueData,
        ordersTrend: ordersData,
        topSellingItems: topItemsData,
        revenuePeriod: 'daily',
        ordersPeriod: 'daily',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export analytics report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-amber-800">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Complete operations management and analytics
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'analytics' && (
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
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

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-medium">Sales Report</h2>
              </div>

              {/* Summary Cards */}
              <OrdersRevenue />

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RevenueTrend />
                <SellingItems />
              </div>

              {/* Orders Chart */}
              <OrdersTrend />
            </div>
          </TabsContent>

          <TabsContent value="tables">
            <AdminTablesView onNavigateToOrders={navigateToOrders} />
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrdersView />
          </TabsContent>

          <TabsContent value="completed">
            <AdminCompletedOrdersView />
          </TabsContent>

          <TabsContent value="menu">
            <AdminMenuView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
