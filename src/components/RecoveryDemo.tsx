import { useState } from 'react';
import { useErrorRecovery } from '@/hooks/use-error-recovery';
import { RecoveryStatus, CircuitBreakerIndicator } from '@/components/RecoveryStatus';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { globalRecoveryManager } from '@/lib/error-recovery';

async function simulateUnreliableOperation(): Promise<string> {
  if (Math.random() < 0.5) {
    throw new Error('Simulated network failure');
  }
  return 'Operation successful!';
}

async function simulateSlowOperation(): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return 'Slow operation completed';
}

export function RecoveryDemo() {
  const [result, setResult] = useState<string | null>(null);

  const [executeUnreliable, unreliableState, retryUnreliable] = useErrorRecovery(
    simulateUnreliableOperation,
    {
      key: 'unreliable-demo',
      maxAttempts: 3,
      initialDelayMs: 1000,
      failureThreshold: 5,
      autoRetry: true,
      notifyOnRecovery: true,
      onRetry: (error, attempt, delay) => {
        console.log(`Retry attempt ${attempt} after ${delay}ms:`, error);
      }
    }
  );

  const [executeSlow, slowState] = useErrorRecovery(
    simulateSlowOperation,
    {
      key: 'slow-demo',
      maxAttempts: 2,
      initialDelayMs: 500
    }
  );

  const handleUnreliableTest = async () => {
    try {
      const data = await executeUnreliable();
      setResult(data);
    } catch (error) {
      console.error('Operation failed after all retries:', error);
    }
  };

  const handleSlowTest = async () => {
    try {
      const data = await executeSlow();
      setResult(data);
    } catch (error) {
      console.error('Slow operation failed:', error);
    }
  };

  const circuitStates = globalRecoveryManager.getAllStates();

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Card className="p-6 bg-card border border-border">
        <h2 className="display-font text-2xl mb-4 uppercase">Automated Error Recovery Demo</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This demo shows automated retry logic, circuit breakers, and recovery status tracking.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="font-ui text-lg mb-3 font-semibold">Test Unreliable Operation</h3>
            <p className="text-xs text-muted-foreground mb-4">
              50% chance of failure - watch it automatically retry with exponential backoff
            </p>
            
            <RecoveryStatus
              {...unreliableState}
              onRetry={retryUnreliable}
              onDismiss={() => setResult(null)}
              className="mb-4"
            />

            <div className="flex gap-3">
              <Button 
                onClick={handleUnreliableTest}
                disabled={unreliableState.isRetrying}
                className="snap-transition"
              >
                {unreliableState.isRetrying ? 'Retrying...' : 'Test Unreliable Operation'}
              </Button>

              <CircuitBreakerIndicator
                state={unreliableState.circuitState}
                failureCount={0}
              />
            </div>
          </div>

          <div>
            <h3 className="font-ui text-lg mb-3 font-semibold">Test Slow Operation</h3>
            <p className="text-xs text-muted-foreground mb-4">
              2 second delay - recovery system handles timeouts gracefully
            </p>
            
            <RecoveryStatus
              {...slowState}
              compact={true}
              className="mb-4"
            />

            <Button 
              onClick={handleSlowTest}
              disabled={slowState.isRetrying}
              variant="outline"
            >
              {slowState.isRetrying ? 'Processing...' : 'Test Slow Operation'}
            </Button>
          </div>

          {result && (
            <Card className="p-4 bg-accent/10 border-accent">
              <div className="data-font text-sm">
                <span className="text-accent font-bold">Result: </span>
                {result}
              </div>
            </Card>
          )}

          <div>
            <h3 className="font-ui text-lg mb-3 font-semibold">Circuit Breaker States</h3>
            <div className="space-y-2">
              {Array.from(circuitStates.entries()).map(([key, state]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-secondary border border-border">
                  <span className="data-font text-xs">{key}</span>
                  <CircuitBreakerIndicator state={state} />
                </div>
              ))}
              {circuitStates.size === 0 && (
                <p className="text-xs text-muted-foreground">No active circuit breakers</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="font-ui text-sm font-semibold mb-2">Recovery Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
              <li>Exponential backoff retry (1s → 2s → 4s)</li>
              <li>Circuit breaker opens after 5 consecutive failures</li>
              <li>Automatic recovery testing every 60 seconds</li>
              <li>Visual progress indicators during retries</li>
              <li>Manual retry option after failures</li>
              <li>Stale data served during outages</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
