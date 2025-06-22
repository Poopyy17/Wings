import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Shield,
  CreditCard,
  ChefHat,
  User,
  Key,
  ArrowLeft,
} from 'lucide-react';
import { loginUser } from '@/api/auth';

const StaffLogin = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('cashier');
  const [username, setUsername] = useState('cashier');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill username when role changes
  useEffect(() => {
    setUsername(activeRole);
  }, [activeRole]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Trim whitespace from inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    try {
      const response = await loginUser(
        trimmedUsername,
        trimmedPassword,
        activeRole
      );

      if (response.success) {
        // Save user info to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('role', activeRole);

        toast.success(`Logged in as ${username}`, {
          description: `Welcome to the ${activeRole} dashboard`,
        });

        // Add a small delay before navigation to ensure state is updated
        setTimeout(() => {
          // Redirect based on role
          switch (activeRole) {
            case 'admin':
              navigate('/staff/admin');
              break;
            case 'cashier':
              navigate('/staff/cashier');
              break;
            case 'chef':
              navigate('/staff/chef');
              break;
            default:
              navigate('/staff/cashier');
          }
        }, 200); // Small delay to ensure localStorage is updated
      } else {
        setError(response.message || 'Login failed');
        toast.error('Login failed', {
          description: response.message,
        });
      }    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials');
      toast.error('Login failed', {
        description: err.message || 'Invalid credentials',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-amber-800">Staff Login</h1>
          <p className="text-gray-500">
            Please select your role and enter your credentials
          </p>
        </CardHeader>

        <CardContent>
          <div className="flex justify-center mb-6">
            <Tabs
              defaultValue="cashier"
              value={activeRole}
              onValueChange={setActiveRole}
              className="w-full max-w-sm"
            >
              <TabsList className="grid grid-cols-3 w-full h-auto p-1">
                <TabsTrigger
                  value="cashier"
                  className="flex flex-col items-center gap-1 py-3 h-auto data-[state=active]:shadow-sm"
                >
                  <CreditCard size={18} />
                  <span>Cashier</span>
                </TabsTrigger>
                <TabsTrigger
                  value="chef"
                  className="flex flex-col items-center gap-1 py-3 h-auto data-[state=active]:shadow-sm"
                >
                  <ChefHat size={18} />
                  <span>Chef</span>
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="flex flex-col items-center gap-1 py-3 h-auto data-[state=active]:shadow-sm"
                >
                  <Shield size={18} />
                  <span>Admin</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  Username
                </label>
                <Input
                  type="text"
                  id="username"
                  placeholder={`Enter ${activeRole} username`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key size={16} className="text-gray-400" />
                  Password
                </label>
                <Input
                  type="password"
                  id="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 py-1">{error}</div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-amber-600 hover:bg-amber-700"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4">
          <div className="text-sm text-gray-500 text-center">
            Default credentials for testing:
            <div>
              <strong>Cashier:</strong> cashier / 234567 •{' '}
              <strong>Chef:</strong> chef / 345678 • <strong>Admin:</strong>{' '}
              admin / 123456
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StaffLogin;
