import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users } from 'lucide-react';

interface OccupancySelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occupancyCount: number;
  setOccupancyCount: (count: number) => void;
  onSubmit: () => void;
  maxOccupants?: number;
}

const OccupancySelection: React.FC<OccupancySelectionProps> = ({
  open,
  onOpenChange,
  occupancyCount,
  setOccupancyCount,
  onSubmit,
  maxOccupants = 8,
}) => {
  const occupancyOptions = Array.from(
    { length: maxOccupants },
    (_, i) => i + 1
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        className="sm:max-w-md bg-amber-50 border-amber-200"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-amber-800">
            How many people?
          </DialogTitle>
        </DialogHeader>
        <div className="py-8">
          <div className="flex flex-col items-center gap-8">
            {/* Visual indicator of selected count */}
            <div className="flex items-center justify-center gap-1">
              {occupancyOptions.map((num) => (
                <div
                  key={`indicator-${num}`}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    num <= occupancyCount
                      ? 'bg-amber-600 scale-110'
                      : 'bg-amber-200'
                  }`}
                />
              ))}
            </div>

            {/* People illustration */}
            <div className="flex items-end justify-center gap-2 h-16 mb-2">
              {Array.from({ length: occupancyCount }).map((_, index) => (
                <div
                  key={`person-${index}`}
                  className="flex flex-col items-center animate-in fade-in zoom-in duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
                    <Users size={16} className="text-white" />
                  </div>
                  <div className="w-0.5 h-6 bg-amber-600"></div>
                </div>
              ))}
            </div>

            {/* Number selection */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
              {occupancyOptions.map((num) => (
                <Button
                  key={`btn-${num}`}
                  variant={occupancyCount === num ? 'default' : 'outline'}
                  className={`w-full h-16 text-xl transition-all ${
                    occupancyCount === num
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md scale-105'
                      : 'border-amber-300 hover:border-amber-500 text-amber-800'
                  }`}
                  onClick={() => setOccupancyCount(num)}
                >
                  {num}
                </Button>
              ))}
            </div>

            {/* Continue button */}
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-7 text-lg mt-4 shadow-md"
              onClick={onSubmit}
            >
              Continue with {occupancyCount}{' '}
              {occupancyCount === 1 ? 'person' : 'people'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OccupancySelection;
