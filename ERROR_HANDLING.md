# Error Handling Implementation

This document describes the comprehensive error handling system implemented across the Dark Charts application.

## Overview

The application now has a multi-layered error handling system designed to prevent crashes and provide graceful degradation:

1. **React Error Boundaries** - Catch rendering errors at component level
2. **Defensive Coding** - Null/undefined checks before data access  
3. **Try-Catch Blocks** - Wrap all async operations and state updates
4. **Safe Utility Functions** - Helper functions for safe data manipulation
5. **Context Error Handling** - Services initialize with fallbacks

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
