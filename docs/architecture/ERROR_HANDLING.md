# Error Handling & Automated Recovery Implementation

This document describes the comprehensive error handling and automated recovery system implemented across the Dark Charts application.

## Overview

The application now has a multi-layered error handling system with automated recovery mechanisms designed to prevent crashes, provide graceful degradation, and automatically recover from common failure scenarios:

1. **React Error Boundaries** - Catch rendering errors at component level
2. **Defensive Coding** - Null/undefined checks before data access  
3. **Try-Catch Blocks** - Wrap all async operations and state updates
4. **Safe Utility Functions** - Helper functions for safe data manipulation
5. **Context Error Handling** - Services initialize with fallbacks
6. **Automated Retry Logic** - Exponential backoff for failed operations
7. **Circuit Breakers** - Prevent cascading failures
8. **Resilience Caching** - Serve stale data during outages

## Automated Recovery Features

### Retry with Exponential Backoff

Location: `src/lib/error-recovery.ts`

Automatically retries failed operations with increasing delays between attempts:

```typescript
import { retryWithBackoff } from '@/lib/error-recovery';

const result = await retryWithBackoff(
  () => fetchData(),
  {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    onRetry: (error, attempt, delay) => {
      console.log(`Retry attempt ${attempt} after ${delay}ms`);
    }
  }
);
```

**Features:**
- Exponential backoff (1s → 2s → 4s → ...)
- Configurable max attempts and delays
- Retry callbacks for monitoring
- Abort signal support
- Retryable vs non-retryable error types

### Circuit Breaker Pattern

Location: `src/lib/error-recovery.ts`

Prevents overwhelming failing services by temporarily blocking requests:

```typescript
import { CircuitBreaker } from '@/lib/error-recovery';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000,
  halfOpenRetries: 1
});

const result = await breaker.execute(() => callExternalService());
```

**States:**
- **Closed**: Normal operation, requests pass through
- **Open**: Too many failures, requests blocked immediately
- **Half-Open**: Testing if service recovered

**Features:**
- Automatic state transitions
- Configurable failure thresholds
- Recovery testing period
- Per-service circuit breakers

### React Hooks for Recovery

Location: `src/hooks/use-error-recovery.ts`

#### useErrorRecovery

Wraps operations with automatic retry and circuit breaker logic:

```typescript
import { useErrorRecovery } from '@/hooks/use-error-recovery';

const [fetchWithRecovery, state, manualRetry] = useErrorRecovery(
  fetchChartData,
  {
    key: 'charts-fetch',
    maxAttempts: 3,
    failureThreshold: 5,
    autoRetry: true
  }
);

// Use the wrapped function
const data = await fetchWithRecovery();

// Monitor recovery state
const { isRetrying, retryAttempt, lastError, circuitState } = state;
```

#### useFailsafe

Provides timeout protection and fallback values:

```typescript
import { useFailsafe } from '@/hooks/use-error-recovery';

const { execute, isLoading, error, hasTimedOut } = useFailsafe(
  () => fetchData(),
  {
    timeout: 5000,
    fallback: [],
    onError: (err) => console.error(err)
  }
);

const result = await execute(); // Returns fallback on timeout/error
```

#### useAutoRecovery

Automatically retries failed operations on an interval:

```typescript
import { useAutoRecovery } from '@/hooks/use-error-recovery';

const { data, isLoading, error, retryCount, refetch } = useAutoRecovery(
  () => fetchChartData(),
  {
    key: 'charts',
    enabled: true,
    interval: 5000,
    maxFailures: 3,
    onSuccess: (data) => console.log('Recovered!', data)
  }
);
```

### Recovery UI Components

Location: `src/components/RecoveryStatus.tsx`

Visual feedback for recovery operations:

#### RecoveryStatus Component

```typescript
import { RecoveryStatus } from '@/components/RecoveryStatus';

<RecoveryStatus
  isRetrying={state.isRetrying}
  retryAttempt={state.retryAttempt}
  maxAttempts={3}
  lastError={state.lastError}
  isRecovered={state.isRecovered}
  circuitState={state.circuitState}
  onRetry={manualRetry}
  onDismiss={() => {}}
  compact={false}
/>
```

#### CircuitBreakerIndicator Component

```typescript
import { CircuitBreakerIndicator } from '@/components/RecoveryStatus';

<CircuitBreakerIndicator
  state="closed"
  failureCount={0}
/>
```

### Resilience Caching

Location: `src/lib/error-recovery.ts`

Serves stale data during outages with background revalidation:

```typescript
import { ResilienceCache, staleWhileRevalidate } from '@/lib/error-recovery';

const cache = new ResilienceCache({ ttlMs: 300000 });

const data = await staleWhileRevalidate(
  'charts-data',
  () => fetchFreshData(),
  cache,
  {
    returnStaleOnError: true,
    onRevalidate: (fresh) => console.log('Updated', fresh)
  }
);
```

### Batch Operations with Recovery

Process multiple items with individual error handling:

```typescript
import { batchWithRecovery } from '@/lib/error-recovery';

const results = await batchWithRecovery(
  tracks,
  async (track) => enrichTrack(track),
  {
    batchSize: 5,
    continueOnError: true,
    onItemError: (track, error) => {
      console.error(`Failed to process ${track.id}:`, error);
    }
  }
);
```

## Common Failure Scenarios

### Network Request Failures

**Automatic Recovery:**
- Retry with exponential backoff (3 attempts)
- Circuit breaker opens after 5 consecutive failures
- Stale cache served during outages
- User notified of retry attempts

### Service Unavailability

**Automatic Recovery:**
- Circuit breaker immediately blocks new requests
- Automatic testing after 60 second timeout
- Graceful degradation with cached data
- Visual circuit state indicator

### Timeout Issues

**Automatic Recovery:**
- 5 second default timeout
- Fallback values returned automatically
- No blocking UI states
- Background retry attempts

### Data Corruption

**Manual Recovery:**
- Error boundaries catch render errors
- Safe utilities prevent crashes
- Retry button for user-initiated recovery
- Detailed error logging

## Implementation Patterns

### Service-Level Recovery

Wrap service methods with recovery logic:

```typescript
import { withRecovery } from '@/lib/error-recovery';

class DataService {
  fetchCharts = withRecovery(
    async () => {
      const response = await fetch('/api/charts');
      return response.json();
    },
    'charts-fetch',
    {
      maxAttempts: 3,
      failureThreshold: 5
    }
  );
}
```

### Component-Level Recovery

Use hooks in components for automatic recovery:

```typescript
function ChartView() {
  const [fetchCharts, recoveryState] = useErrorRecovery(
    chartService.fetchCharts,
    {
      key: 'chart-view',
      maxAttempts: 3,
      notifyOnRecovery: true
    }
  );

  return (
    <>
      <RecoveryStatus {...recoveryState} />
      {/* Component content */}
    </>
  );
}
```

### Critical Path Protection

Use failsafe for essential operations:

```typescript
const { execute } = useFailsafe(
  () => fetchUserSession(),
  {
    timeout: 3000,
    fallback: null,
    onError: (err) => {
      // Log to monitoring service
      console.error('Session fetch failed:', err);
    }
  }
);

const session = await execute(); // Never throws, always returns
```

## Components

### ErrorBoundary Component
Location: `src/components/ErrorBoundary.tsx`

A reusable error boundary component with two levels:
- **Root Level**: Shows full-page error UI with reload options
- **Component Level**: Shows inline error with retry button

**Usage:**
```tsx
<ErrorBoundary level="root">
  <App />
</ErrorBoundary>

<ErrorBoundary level="component">
  <MyComponent />
</ErrorBoundary>
```

### Safe Utilities
Location: `src/lib/safe-utils.ts`

A collection of defensive utility functions:

- `safeGet()` - Safe object property access
- `safeArrayAccess()` - Safe array index access
- `safeFilter()` - Safe array filtering
- `safeMap()` - Safe array mapping
- `safeFind()` - Safe array find
- `safeFindIndex()` - Safe array findIndex
- `safeSlice()` - Safe array slicing
- `isNullOrUndefined()` - Type guard for null/undefined
- `hasProperty()` - Safe property existence check
- `safeAsync()` - Wrap promises with error handling
- `safeJsonParse()` - Safe JSON parsing
- `safeJsonStringify()` - Safe JSON stringification
- `createSafeHandler()` - Create error-wrapped function
- `createSafeAsyncHandler()` - Create error-wrapped async function

**Example:**
```tsx
// Instead of:
const value = array[index];  // Can throw

// Use:
const value = safeArrayAccess(array, index, defaultValue);

// Instead of:
const filtered = tracks.filter(t => t.genres.includes(genre));  // Can throw

// Use:
const filtered = safeFilter(tracks, t => 
  t && t.genres && t.genres.includes(genre)
);
```

## Implementation Patterns

### 1. Component-Level Protection

All major UI sections are wrapped in error boundaries:
```tsx
<ErrorBoundary level="component">
  <Navigation />
</ErrorBoundary>

<ErrorBoundary level="component">
  <GenreCharts />
</ErrorBoundary>
```

### 2. Async Operation Safety

All async operations are wrapped in try-catch:
```tsx
const loadCharts = async () => {
  setIsLoading(true);
  try {
    if (!dataService) {
      throw new Error('DataService not available');
    }
    const data = await dataService.getAllCharts();
    
    setFanCharts(Array.isArray(data.fanCharts) ? data.fanCharts : []);
  } catch (error) {
    console.error('Failed to load charts:', error);
    setFanCharts([]);  // Fallback to empty array
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Null/Undefined Checks

Before accessing properties:
```tsx
// Check objects
if (!track || !track.id) {
  console.warn('Invalid track');
  return;
}

// Check arrays
if (!Array.isArray(tracks) || tracks.length === 0) {
  return [];
}

// Safe array operations
const filtered = safeFilter(tracks, t => 
  t && Array.isArray(t.genres) && t.genres.length > 0
);
```

### 4. State Update Safety

State updates wrapped in try-catch:
```tsx
const handleToggleGenre = useCallback((genre: Genre) => {
  try {
    if (!genre) {
      console.warn('Invalid genre');
      return;
    }
    
    setSelectedGenres(current => {
      try {
        if (!Array.isArray(current)) {
          return [genre];
        }
        // ... safe operations
        return newValue;
      } catch (error) {
        console.error('Error toggling genre:', error);
        return current;  // Return unchanged on error
      }
    });
  } catch (error) {
    console.error('Error in handleToggleGenre:', error);
  }
}, []);
```

### 5. Service Initialization

Services initialize with fallbacks:
```tsx
const [dataService] = useState<IDataService>(() => {
  try {
    return providedDataService || new ComprehensiveDataService();
  } catch (error) {
    console.error('Failed to initialize DataService:', error);
    return new ComprehensiveDataService();  // Fallback
  }
});
```

### 6. Context Error Tracking

Contexts track and expose errors:
```tsx
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;  // Exposed error state
  // ...
}
```

## Error Boundaries Placement

Error boundaries are strategically placed:

1. **Root Level** - Wraps entire app
2. **Navigation** - Protects nav component
3. **Main Views** - Each view wrapped separately
4. **Chart Components** - Individual chart displays
5. **Music Player** - Player component
6. **Modals** - Dialog/modal components

## Fallback Values

Consistent fallback patterns:

- **Arrays**: `[]` (empty array)
- **Objects**: `{}` or specific default object
- **Strings**: `''` (empty string) or default message
- **Numbers**: `0` or `-1` for indices
- **Booleans**: `false`

## Error Logging

All errors are logged to console with context:
```tsx
console.error('Failed to load charts:', error);
console.warn('Invalid track object');
```

## Benefits

1. **No Crashes**: App continues to function even with errors
2. **Clear Feedback**: Users see helpful error messages
3. **Easy Recovery**: Retry buttons and reload options
4. **Debugging**: All errors logged for investigation
5. **Graceful Degradation**: Features fail individually, not system-wide

## Best Practices

When adding new code:

1. ✅ Wrap async operations in try-catch
2. ✅ Check for null/undefined before access
3. ✅ Use safe utility functions for arrays/objects
4. ✅ Provide fallback values for all operations
5. ✅ Log errors with meaningful context
6. ✅ Wrap new components in ErrorBoundary
7. ✅ Never assume data exists - always validate
8. ✅ Use Array.isArray() before array operations
9. ✅ Return safe fallbacks on error
10. ✅ Test error scenarios

## Testing Error Scenarios

To test error handling:

1. Intentionally pass null/undefined to components
2. Force async operations to fail
3. Remove required data from context
4. Test with malformed data
5. Check console for proper error logging
