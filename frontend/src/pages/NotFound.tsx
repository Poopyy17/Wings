import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-6xl font-bold text-amber-600">404</div>
          <p className="text-gray-600">
            Sorry, the page you're looking for doesn't exist.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate('/')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
