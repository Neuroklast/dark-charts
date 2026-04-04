import { Component, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Warning, ArrowClockwise, House } from '@phosphor-icons/react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'root' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        try {
          return this.props.fallback(this.state.error, this.resetError);
        } catch (fallbackError) {
          console.error('Error in fallback render:', fallbackError);
        }
      }

      if (this.props.level === 'root') {
        return <RootErrorFallback error={this.state.error} reset={this.resetError} />;
      }

      return <ComponentErrorFallback error={this.state.error} reset={this.resetError} />;
    }

    return this.props.children;
  }
}

function RootErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const reloadPage = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <Warning className="w-8 h-8 text-destructive" weight="duotone" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Application Error
              </h1>
              <p className="text-muted-foreground">
                The application encountered an unexpected error. This has been logged for investigation.
              </p>
            </div>
          </div>

          <Alert variant="destructive" className="mb-6">
            <Warning className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 text-xs overflow-auto max-h-32 p-2 bg-background/50 rounded">
                {error?.message || 'Unknown error occurred'}
              </pre>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button onClick={reset} variant="default" className="flex-1">
              <ArrowClockwise className="mr-2" />
              Try Again
            </Button>
            <Button onClick={reloadPage} variant="outline" className="flex-1">
              <House className="mr-2" />
              Reload Application
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ComponentErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
      <div className="flex items-start gap-3">
        <Warning className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground mb-1">
            Component Error
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            This section encountered an error. You can try reloading it or continue using other parts of the application.
          </p>
          {error?.message && (
            <pre className="text-xs text-destructive bg-background/50 p-2 rounded mb-3 overflow-auto max-h-20">
              {error.message}
            </pre>
          )}
          <Button onClick={reset} size="sm" variant="outline">
            <ArrowClockwise className="mr-1 w-3 h-3" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  level: 'root' | 'component' = 'component'
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary level={level}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
