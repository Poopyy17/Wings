import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { getAllTables, updateTableStatus, Table } from '@/api/table';
import {
  getActiveSessions,
  TableSession,
  processSessionPayment,
} from '@/api/session';
import { getSessionTickets, OrderTicket } from '@/api/order';
import PaymentDialog from './Payment-Dialog';

interface ExtendedTable extends Table {
  session?: TableSession;
  hasPendingOrders?: boolean;
  pendingOrdersCount?: number;
}

interface TablesViewProps {
  onNavigateToOrders?: () => void;
}

const TablesView: React.FC<TablesViewProps> = ({ onNavigateToOrders }) => {
  const [tables, setTables] = useState<ExtendedTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<ExtendedTable | null>(
    null
  );
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      // 1. Get all tables
      const tablesData = await getAllTables();

      // 2. Get active sessions
      const sessionsResponse = await getActiveSessions();

      let activeSessions: TableSession[] = [];
      if (sessionsResponse.success) {
        activeSessions = sessionsResponse.data;
      }

      // 3. Check for pending orders for each session
      const tablesWithSessions = await Promise.all(
        tablesData.map(async (table: Table) => {
          // Find matching session for this table if it exists
          const matchingSession = activeSessions.find(
            (session) => session.table_id === table.id
          );

          if (matchingSession) {
            try {
              // Check for pending orders in this session
              const ticketsResponse = await getSessionTickets(
                matchingSession.id
              );

              let hasPendingOrders = false;
              let pendingOrdersCount = 0;

              if (ticketsResponse.success && ticketsResponse.data.length > 0) {
                const pendingTickets = ticketsResponse.data.filter(
                  (ticket: OrderTicket) => ticket.status === 'Pending'
                );
                hasPendingOrders = pendingTickets.length > 0;
                pendingOrdersCount = pendingTickets.length;
              }

              return {
                ...table,
                session: matchingSession,
                hasPendingOrders,
                pendingOrdersCount,
              };
            } catch (error) {
              console.error(
                `Error fetching tickets for session ${matchingSession.id}:`,
                error
              );
              return {
                ...table,
                session: matchingSession,
                hasPendingOrders: false,
                pendingOrdersCount: 0,
              };
            }
          }

          return {
            ...table,
            hasPendingOrders: false,
            pendingOrdersCount: 0,
          };
        })
      );

      setTables(tablesWithSessions);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableClick = (table: ExtendedTable) => {
    setSelectedTable(table);

    // If table has pending orders, navigate to orders tab
    if (table.hasPendingOrders && onNavigateToOrders) {
      onNavigateToOrders();
      toast.info(`Navigating to orders for Table ${table.table_number}`);
      return;
    }

    // If table is ready for payment, open payment dialog
    if (table.status === 'For Payment' && table.session) {
      setIsPaymentDialogOpen(true);
    }
  };

  const handlePayment = async (tableId: number, paymentMethod: string) => {
    try {
      if (!selectedTable || !selectedTable.session) {
        toast.error('No active session for this table');
        return;
      }

      // 1. Process payment via API
      const result = await processSessionPayment(
        selectedTable.session.id,
        paymentMethod
      );

      if (result.success) {
        // 2. Update table status
        await updateTableStatus(tableId, { status: 'Available' });

        // 3. Refresh tables
        await fetchTables();

        toast.success('Payment processed successfully');
        setIsPaymentDialogOpen(false);
        setSelectedTable(null);
      } else {
        toast.error(result.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  // Calculate the total amount to display (total_amount + unliwings_total_charge)
  const calculateTotalAmount = (session: TableSession) => {
    const itemsTotal = Number(session.total_amount) || 0;
    const unliwingsCharge = Number(session.unliwings_total_charge) || 0;
    return itemsTotal + unliwingsCharge;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
          <span>Loading tables...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tables Grid - Optimized for 6 tables */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all hover:shadow-lg relative min-h-[200px] ${
                table.hasPendingOrders
                  ? 'border-orange-500 shadow-orange-100 shadow-md ring-2 ring-orange-200 hover:ring-orange-300'
                  : table.status === 'For Payment'
                  ? 'border-amber-500 shadow-amber-100 shadow-md hover:border-amber-600'
                  : table.status === 'Occupied'
                  ? 'border-blue-200 hover:border-blue-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTableClick(table)}
            >
              {/* Pending orders indicator */}
              {table.hasPendingOrders && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg z-10">
                  {table.pendingOrdersCount}
                </div>
              )}

              <CardContent className="p-4 h-full flex flex-col">
                {/* Table Header */}
                <div className="flex-shrink-0 text-center mb-3">
                  <div className="font-bold text-xl text-gray-800 mb-1">
                    Table {table.table_number}
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant="outline"
                    className={`text-sm ${
                      table.status === 'Available'
                        ? 'border-green-500 text-green-700 bg-green-50'
                        : table.status === 'Occupied'
                        ? 'border-blue-500 text-blue-700 bg-blue-50'
                        : 'border-amber-500 text-amber-700 bg-amber-50'
                    }`}
                  >
                    {table.status}
                  </Badge>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col">
                  {/* Pending orders notification */}
                  {table.hasPendingOrders && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-2">
                      <div className="flex items-center justify-center gap-1 text-orange-700">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {table.pendingOrdersCount} Pending Order
                          {table.pendingOrdersCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-xs text-orange-600 text-center mt-1">
                        Click to view orders
                      </div>
                    </div>
                  )}

                  {/* Session Details or Available Message */}
                  <div className="text-center flex-1 flex flex-col justify-center">
                    {table.session ? (
                      <div className="space-y-2">
                        {/* Guest count */}
                        <div className="flex items-center justify-center gap-1 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">
                            {table.session.occupancy_count} guests
                          </span>
                        </div>

                        {/* Service type */}
                        <div className="text-sm text-gray-500 italic">
                          {table.session.service_type}
                        </div>

                        {/* Payment ready indicator */}
                        {table.status === 'For Payment' && (
                          <Badge className="bg-amber-500 text-white text-sm">
                            Ready to Pay
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <div className="text-lg font-medium">Available</div>
                        <div className="text-sm mt-1">Ready for guests</div>
                      </div>
                    )}
                  </div>

                  {/* Total Amount at bottom - Only show for occupied/payment ready tables */}
                  {table.session &&
                    table.status !== 'Available' &&
                    (Number(table.session.total_amount) > 0 ||
                      Number(table.session.unliwings_total_charge) > 0) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="bg-amber-50 rounded-lg p-2">
                          <div className="flex items-center justify-center gap-1">
                            <DollarSign className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-medium text-amber-800">
                              Total Bill
                            </span>
                          </div>
                          <div className="text-base font-bold text-amber-700 text-center">
                            ₱{calculateTotalAmount(table.session).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedTable && (
        <PaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          table={selectedTable}
          onProcessPayment={handlePayment}
        />
      )}
    </>
  );
};

export default TablesView;
