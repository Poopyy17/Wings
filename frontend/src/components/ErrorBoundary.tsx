import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                An unexpected error occurred. Please try refreshing the page or go back to the home page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={this.handleReload}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                >
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
