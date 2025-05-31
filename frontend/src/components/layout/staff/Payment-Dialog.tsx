import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table } from '@/api/table';
import { TableSession } from '@/api/session';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table & { session?: TableSession };
  onProcessPayment: (tableId: number, paymentMethod: string) => Promise<void>;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  table,
  onProcessPayment,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      await onProcessPayment(table.id, paymentMethod);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate the total amount to display (total_amount + unliwings_total_charge)
  const calculateTotalAmount = (session: TableSession) => {
    const itemsTotal = Number(session.total_amount) || 0;
    const unliwingsCharge = Number(session.unliwings_total_charge) || 0;
    return itemsTotal + unliwingsCharge;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <p>
              <strong>{table.table_number}</strong>
            </p>
            {table.session && (
              <p className="text-sm text-gray-600">
                {table.session.occupancy_count} person(s) •{' '}
                {table.session.service_type}
              </p>
            )}
          </div>

          {table.session && (
            <div className="space-y-4">
              {table.session.service_type === 'Unliwings' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Unliwings Charge
                  </label>
                  <Input
                    type="text"
                    value={`₱${Number(
                      table.session.unliwings_total_charge
                    ).toFixed(2)}`}
                    disabled
                    className="text-amber-800"
                  />
                </div>
              )}

              {Number(table.session.total_amount) > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Menu Items
                  </label>
                  <Input
                    type="text"
                    value={`₱${Number(table.session.total_amount).toFixed(2)}`}
                    disabled
                    className="text-amber-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Total Amount to Pay
                </label>
                <Input
                  type="text"
                  value={`₱${calculateTotalAmount(table.session).toFixed(2)}`}
                  disabled
                  className="text-lg font-bold text-amber-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment Method
                </label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="GCash">GCash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
