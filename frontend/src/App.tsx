import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

// Customer Pages
import MenuPage from './pages/customer/Menu-Page';
import OrderSummary from './pages/customer/Order-Summary';
import BillOut from './pages/customer/Bill-Out';

import Homepage from './pages/Homepage';
import StaffLogin from './pages/staff/StaffLogin';
import CashierDashboard from './pages/staff/Staff/CashierDashboard';
import ChefDashboard from './pages/staff/Chef/ChefDashboard';
import AdminDashboard from './pages/staff/Admin/AdminDashboard';
import AuthProtection from './components/layout/staff/AuthProtection';
import ThankYou from './pages/customer/Thank-You';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/Menu" element={<MenuPage />} />
        <Route path="/Order-summary" element={<OrderSummary />} />
        <Route path="/Bill-out" element={<BillOut />} />
        <Route path="/Thank-you" element={<ThankYou />} />

        {/* Staff Routes */}
        <Route
          path="/staff/login"
          element={
            <AuthProtection isLoginPage={true}>
              <StaffLogin />
            </AuthProtection>
          }
        />

        <Route
          path="/staff/cashier"
          element={
            <AuthProtection allowedRole="cashier">
              <CashierDashboard />
            </AuthProtection>
          }
        />

        <Route
          path="/staff/chef"
          element={
            <AuthProtection allowedRole="chef">
              <ChefDashboard />
            </AuthProtection>
          }
        />

        <Route
          path="/staff/admin"
          element={
            <AuthProtection allowedRole="admin">
              <AdminDashboard />
            </AuthProtection>
          }
        />

        {/* Catch-all route for 404 pages */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
