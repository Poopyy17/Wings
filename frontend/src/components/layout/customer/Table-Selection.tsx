import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Table {
  id: number;
  table_number: string;
  status: string;
  qr_code_url?: string;
}

interface TableSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: Table[];
  loading: boolean;
  error: string | null;
  onSelectTable: (table: Table) => void;
}

const TableSelection: React.FC<TableSelectionProps> = ({
  open,
  onOpenChange,
  tables,
  loading,
  error,
  onSelectTable,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Select a Table
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
          {loading ? (
            <p className="col-span-full text-center">Loading tables...</p>
          ) : error ? (
            <p className="col-span-full text-center text-red-500">{error}</p>
          ) : (
            tables.map((table) => (
              <Button
                key={table.id}
                variant={table.status === 'Available' ? 'outline' : 'secondary'}
                disabled={table.status !== 'Available'}
                className={`relative p-0 h-auto w-full ${
                  table.status === 'Available'
                    ? 'hover:bg-amber-50 border-amber-300'
                    : ''
                }`}
                onClick={() => onSelectTable(table)}
              >
                {' '}
                <div className="flex flex-col items-center w-full p-4">
                  {/* Table number */}
                  <div className="text-lg font-semibold mb-2">
                    {table.table_number}
                  </div>

                  {/* QR code */}
                  {table.qr_code_url && (
                    <div className="w-32 h-32 flex items-center justify-center p-1">
                      <img
                        src={table.qr_code_url}
                        alt={`QR Code for ${table.table_number}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Status */}
                  <div
                    className={`mt-2 text-sm px-2 py-1 rounded-full ${
                      table.status === 'Available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {table.status}
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableSelection;
