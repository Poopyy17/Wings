import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/Session-Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Home, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

const ThankYou = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, endSession } = useSession();
  const [showConfetti, setShowConfetti] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Get data from location state
  const { grandTotal, tableNumber, orderType, orderNumber } =
    location.state || {};

  // Determine if this is a take-out order
  const isTakeOut = orderType === 'take-out';

  // Trigger confetti animation
  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const runConfetti = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#d97706', '#fcd34d'],
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#d97706', '#fcd34d'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(runConfetti);
      }
    };

    runConfetti();
  };

  // Effect for ending the session - only run for dine-in orders
  useEffect(() => {
    if (!sessionEnded && !isTakeOut && session.sessionId) {
      endSession();
      setSessionEnded(true);
    }
  }, [sessionEnded, isTakeOut, session, endSession]);

  // Effect for initial confetti
  useEffect(() => {
    if (showConfetti) {
      triggerConfetti();
      return () => {
        setShowConfetti(false);
      };
    }
  }, [showConfetti]);

  const handleBackToHome = () => {
    navigate('/');
  };

  // Capture the table number before session is cleared
  const displayTableNumber = tableNumber || session.tableNumber;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md mx-auto text-center">
          {/* Success icon */}
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-amber-800 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-8">
            {isTakeOut
              ? 'Your take-out order has been placed successfully'
              : 'Your order has been confirmed and is ready for payment'}
          </p>

          <Card className="mb-8 border-amber-200 shadow-md">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* For take-out orders, show order number */}
                {isTakeOut && orderNumber && (
                  <div className="flex flex-col items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 mb-1">
                      Your order number
                    </span>
                    <span className="text-2xl font-bold text-amber-800">
                      {orderNumber}
                    </span>
                  </div>
                )}

                {/* Show total amount if available */}
                {grandTotal && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Order Total:</span>
                    <span className="text-xl font-bold text-amber-800">
                      ₱{grandTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Show table number for dine-in */}
                {!isTakeOut && displayTableNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Table Number:</span>
                    <span className="font-medium">{displayTableNumber}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-left">
            <p className="text-amber-800 font-medium mb-2">Next Steps:</p>
            {isTakeOut ? (
              <ul className="text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">1.</span>
                  <span>Your order is being prepared</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">2.</span>
                  <span>
                    Present your order number when collecting your order
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">3.</span>
                  <span>
                    Pay for your order at the counter during collection
                  </span>
                </li>
              </ul>
            ) : (
              <ul className="text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">1.</span>
                  <span>Please proceed to the counter for payment</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">2.</span>
                  <span>Present your table number to the cashier</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">3.</span>
                  <span>
                    Choose your preferred payment method at the counter
                  </span>
                </li>
              </ul>
            )}
          </div>

          <div className="flex flex-col space-y-3">
            <Button
              className="bg-amber-600 hover:bg-amber-700 py-6"
              onClick={handleBackToHome}
            >
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <footer className="py-4 bg-white border-t">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500">
            {isTakeOut
              ? 'Thank you for ordering from Wings Restaurant! We hope you enjoy your meal.'
              : 'Thank you for dining at Wings Restaurant! We hope to see you again soon.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ThankYou;
