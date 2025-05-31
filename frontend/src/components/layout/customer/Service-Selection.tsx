import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Drumstick, Utensils, ArrowRight } from 'lucide-react';

interface ServiceSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectService: (serviceType: 'unli-wings' | 'ala-carte') => void;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({
  open,
  onOpenChange,
  onSelectService,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        className="sm:max-w-3xl bg-amber-50 border-amber-200"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-amber-800">
            Select Service Type
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          {/* Unli-Wings Card */}
          <div
            className="rounded-xl border-2 border-amber-600 bg-white shadow-lg overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
            onClick={() => onSelectService('unli-wings')}
          >
            <div className="bg-amber-600 py-3 px-4">
              <h3 className="text-xl font-bold text-white flex items-center justify-center">
                <Drumstick className="mr-2 h-6 w-6" /> Unli-Wings
              </h3>
            </div>

            <div className="p-6 flex flex-col items-center">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-amber-600">₱289</span>
                <span className="text-gray-600 ml-1">per person</span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-start">
                  <div className="rounded-full bg-amber-100 p-1 mr-2 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#d97706"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p>Unlimited orders of any flavor wings</p>
                </div>
                <div className="flex items-start">
                  <div className="rounded-full bg-amber-100 p-1 mr-2 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#d97706"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p>Choose from 17 different flavors</p>
                </div>
                <div className="flex items-start">
                  <div className="rounded-full bg-amber-100 p-1 mr-2 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#d97706"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p>Other menu items available for purchase</p>
                </div>
              </div>

              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 mt-2 group"
                onClick={() => onSelectService('unli-wings')}
              >
                <span>Select Unli-Wings</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* Ala-Carte Card */}
          <div
            className="rounded-xl border-2 border-amber-300 bg-white shadow-lg overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
            onClick={() => onSelectService('ala-carte')}
          >
            <div className="bg-amber-300 py-3 px-4">
              <h3 className="text-xl font-bold text-amber-800 flex items-center justify-center">
                <Utensils className="mr-2 h-6 w-6" /> Ala-Carte
              </h3>
            </div>

            <div className="p-6 flex flex-col items-center">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-amber-500">Pay</span>
                <span className="text-gray-600 ml-1">per item</span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-start">
                  <div className="rounded-full bg-amber-100 p-1 mr-2 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#d97706"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p>Order wings in sets (3pc, 6pc, 12pc, etc.)</p>
                </div>
                <div className="flex items-start">
                  <div className="rounded-full bg-amber-100 p-1 mr-2 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#d97706"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p>Full selection of rice meals and sides</p>
                </div>
                <div className="flex items-start">
                  <div className="rounded-full bg-amber-100 p-1 mr-2 mt-0.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="#d97706"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p>Perfect for lighter appetites or take-out</p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-amber-400 text-amber-700 hover:bg-amber-100 py-6 mt-2 group"
                onClick={() => onSelectService('ala-carte')}
              >
                <span>Select Ala-Carte</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceSelection;
