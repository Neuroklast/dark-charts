import { motion, AnimatePresence } from 'framer-motion';
import { ArrowsClockwise, Check, Warning, X, CircleNotch } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface RecoveryStatusProps {
  isRetrying: boolean;
  retryAttempt: number;
  maxAttempts?: number;
  lastError: Error | null;
  isRecovered: boolean;
  circuitState?: 'closed' | 'open' | 'half-open';
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
}

export function RecoveryStatus({
  isRetrying,
  retryAttempt,
  maxAttempts = 3,
  lastError,
  isRecovered,
  circuitState = 'closed',
  onRetry,
  onDismiss,
  compact = false,
  className = ''
}: RecoveryStatusProps) {
  const showStatus = isRetrying || lastError || isRecovered;

  if (!showStatus) return null;

  const getStatusColor = () => {
    if (isRecovered) return 'text-accent';
    if (isRetrying) return 'text-muted-foreground';
    if (circuitState === 'open') return 'text-destructive';
    if (lastError) return 'text-destructive';
    return 'text-foreground';
  };

  const getStatusIcon = () => {
    if (isRecovered) return <Check className="w-4 h-4" weight="bold" />;
    if (isRetrying) return <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />;
    if (circuitState === 'open') return <Warning className="w-4 h-4" weight="fill" />;
    if (lastError) return <X className="w-4 h-4" weight="bold" />;
    return null;
  };

  const getStatusMessage = () => {
    if (isRecovered) return 'Operation recovered successfully';
    if (isRetrying) return `Retrying... (Attempt ${retryAttempt}/${maxAttempts})`;
    if (circuitState === 'open') return 'Service temporarily unavailable';
    if (lastError) return lastError.message || 'Operation failed';
    return '';
  };

  const getCircuitBadge = () => {
    if (circuitState === 'open') {
      return <Badge variant="destructive" className="text-[10px]">OPEN</Badge>;
    }
    if (circuitState === 'half-open') {
      return <Badge variant="secondary" className="text-[10px]">TESTING</Badge>;
    }
    return null;
  };

  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center gap-2 px-3 py-2 bg-card border border-border ${className}`}
        >
          <span className={getStatusColor()}>{getStatusIcon()}</span>
          <span className="text-xs data-font">{getStatusMessage()}</span>
          {getCircuitBadge()}
          {onDismiss && !isRetrying && (
            <button
              onClick={onDismiss}
              className="ml-auto p-1 hover:bg-secondary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={className}
      >
        <Card className="bg-card border border-border">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${getStatusColor()}`}>
                {getStatusIcon()}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-ui text-sm font-medium">{getStatusMessage()}</h4>
                  {getCircuitBadge()}
                </div>

                {isRetrying && (
                  <Progress 
                    value={(retryAttempt / maxAttempts) * 100} 
                    className="h-1"
                  />
                )}

                {lastError && !isRetrying && (
                  <p className="text-xs text-muted-foreground data-font">
                    {lastError.stack ? lastError.stack.split('\n')[0] : 'Unknown error'}
                  </p>
                )}

                {isRecovered && (
                  <p className="text-xs text-accent">
                    Service restored after {retryAttempt} {retryAttempt === 1 ? 'attempt' : 'attempts'}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {onRetry && !isRetrying && lastError && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className="h-8"
                  >
                    <ArrowsClockwise className="w-3 h-3 mr-1" weight="bold" />
                    Retry
                  </Button>
                )}
                {onDismiss && !isRetrying && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDismiss}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

interface RecoveryToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onClose?: () => void;
}

export function RecoveryToast({ message, type = 'info', onClose }: RecoveryToastProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-accent" weight="bold" />;
      case 'error':
        return <X className="w-5 h-5 text-destructive" weight="bold" />;
      case 'warning':
        return <Warning className="w-5 h-5 text-primary" weight="fill" />;
      default:
        return <CircleNotch className="w-5 h-5 text-foreground" weight="bold" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed top-4 right-4 z-50"
    >
      <Card className="bg-card border border-border shadow-lg">
        <div className="flex items-center gap-3 p-4 pr-12">
          {getIcon()}
          <span className="text-sm data-font">{message}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface CircuitBreakerIndicatorProps {
  state: 'closed' | 'open' | 'half-open';
  failureCount?: number;
  className?: string;
}

export function CircuitBreakerIndicator({
  state,
  failureCount = 0,
  className = ''
}: CircuitBreakerIndicatorProps) {
  const getStateColor = () => {
    switch (state) {
      case 'closed':
        return 'bg-accent';
      case 'half-open':
        return 'bg-primary';
      case 'open':
        return 'bg-destructive';
    }
  };

  const getStateLabel = () => {
    switch (state) {
      case 'closed':
        return 'ONLINE';
      case 'half-open':
        return 'TESTING';
      case 'open':
        return 'OFFLINE';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${getStateColor()}`} />
        {state !== 'closed' && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${getStateColor()} animate-ping opacity-75`} />
        )}
      </div>
      <span className="text-[10px] font-bold tracking-wider data-font">{getStateLabel()}</span>
      {failureCount > 0 && (
        <Badge variant="outline" className="text-[8px] h-4 px-1">
          {failureCount} {failureCount === 1 ? 'FAILURE' : 'FAILURES'}
        </Badge>
      )}
    </div>
  );
}
