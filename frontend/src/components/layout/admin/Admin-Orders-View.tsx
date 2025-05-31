import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, ShoppingBag } from 'lucide-react';
import DineInOrdersTab from '../staff/Dine-In-Orders';
import TakeOutOrdersTab from '../staff/Take-Out-Orders';

const AdminOrdersView: React.FC = () => {
  return (
    <Tabs defaultValue="dine-in">
      <TabsList className="mb-4">
        <TabsTrigger value="dine-in" className="flex items-center gap-1">
          <UtensilsCrossed className="h-4 w-4" /> Dine-In Orders
        </TabsTrigger>
        <TabsTrigger value="take-out" className="flex items-center gap-1">
          <ShoppingBag className="h-4 w-4" /> Take-Out Orders
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dine-in">
        <DineInOrdersTab />
      </TabsContent>

      <TabsContent value="take-out">
        <TakeOutOrdersTab />
      </TabsContent>
    </Tabs>
  );
};

export default AdminOrdersView;
