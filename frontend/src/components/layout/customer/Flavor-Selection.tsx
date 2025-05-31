import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { WingFlavor } from '@/api/menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Map wing portion sizes to max flavor counts
const PORTION_TO_MAX_FLAVORS: Record<string, number> = {
  '3pcs': 1,
  '6pcs': 2,
  '12pcs': 3,
  '24pcs': 6,
  '36pcs': 9,
};

interface WingFlavorSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  availableFlavors: WingFlavor[];
  onConfirm: (selectedFlavors: string[]) => void;
  onCancel: () => void;
}

const WingFlavorSelection = ({
  open,
  onOpenChange,
  itemName,
  availableFlavors,
  onConfirm,
  onCancel,
}: WingFlavorSelectionProps) => {
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [maxFlavors, setMaxFlavors] = useState<number>(1);

  // Extract portion size from item name (e.g., "6pcs of wings" -> "6pcs")
  useEffect(() => {
    for (const portion in PORTION_TO_MAX_FLAVORS) {
      if (itemName.toLowerCase().includes(portion.toLowerCase())) {
        setMaxFlavors(PORTION_TO_MAX_FLAVORS[portion]);
        break;
      }
    }
  }, [itemName]);

  const handleToggleFlavor = (flavorName: string) => {
    if (selectedFlavors.includes(flavorName)) {
      // Remove flavor if already selected
      setSelectedFlavors(selectedFlavors.filter((f) => f !== flavorName));
    } else {
      // Add flavor if under the max limit
      if (selectedFlavors.length < maxFlavors) {
        setSelectedFlavors([...selectedFlavors, flavorName]);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedFlavors.length === 0) {
      return; // Prevent submitting with no flavors
    }
    onConfirm(selectedFlavors);
    setSelectedFlavors([]); // Reset selections
  };

  const handleCancel = () => {
    setSelectedFlavors([]); // Reset selections
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-800">
            Select Wing Flavors
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Select{' '}
              {maxFlavors === 1 ? 'a flavor' : `up to ${maxFlavors} flavors`}{' '}
              for your {itemName}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-2">
            {availableFlavors.map((flavor) => (
              <div
                key={flavor.id}
                className={`flex items-center space-x-2 p-2 rounded-md border ${
                  selectedFlavors.includes(flavor.name)
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200'
                }`}
              >
                <Checkbox
                  id={`flavor-${flavor.id}`}
                  checked={selectedFlavors.includes(flavor.name)}
                  onCheckedChange={() => handleToggleFlavor(flavor.name)}
                  disabled={
                    !selectedFlavors.includes(flavor.name) &&
                    selectedFlavors.length >= maxFlavors
                  }
                />
                <Label
                  htmlFor={`flavor-${flavor.id}`}
                  className="flex-1 cursor-pointer"
                >
                  {flavor.name}
                </Label>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-600 mt-4 text-center">
            {selectedFlavors.length} of {maxFlavors} flavors selected
          </div>
        </div>

        {/* Fixed button layout */}
        <div className="mt-6 w-full grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="w-full h-10 bg-amber-400 hover:bg-amber-500 text-amber-950"
            disabled={selectedFlavors.length === 0}
          >
            Confirm Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WingFlavorSelection;
