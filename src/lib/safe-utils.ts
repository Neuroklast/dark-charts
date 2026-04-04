export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  fallback?: T[K]
): T[K] | typeof fallback {
  if (obj === null || obj === undefined) {
    return fallback as T[K];
  }
  
  try {
    const value = obj[key];
    return value !== undefined ? value : (fallback as T[K]);
  } catch (error) {
    console.error(`Error accessing property "${String(key)}":`, error);
    return fallback as T[K];
  }
}

export function safeArrayAccess<T>(
  arr: T[] | null | undefined,
  index: number,
  fallback?: T
): T | typeof fallback | undefined {
  if (!Array.isArray(arr)) {
    return fallback;
  }
  
  if (index < 0 || index >= arr.length) {
    return fallback;
  }
  
  try {
    return arr[index] ?? fallback;
  } catch (error) {
    console.error(`Error accessing array index ${index}:`, error);
    return fallback;
  }
}

export function safeFilter<T>(
  arr: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean
): T[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  try {
    return arr.filter((item, index) => {
      try {
        return predicate(item, index);
      } catch (error) {
        console.error('Error in filter predicate:', error);
        return false;
      }
    });
  } catch (error) {
    console.error('Error filtering array:', error);
    return [];
  }
}

export function safeMap<T, U>(
  arr: T[] | null | undefined,
  mapper: (item: T, index: number) => U,
  fallback: U[] = []
): U[] {
  if (!Array.isArray(arr)) {
    return fallback;
  }
  
  try {
    return arr.map((item, index) => {
      try {
        return mapper(item, index);
      } catch (error) {
        console.error('Error in map function:', error);
        throw error;
      }
    });
  } catch (error) {
    console.error('Error mapping array:', error);
    return fallback;
  }
}

export function safeFind<T>(
  arr: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean,
  fallback?: T
): T | typeof fallback | undefined {
  if (!Array.isArray(arr)) {
    return fallback;
  }
  
  try {
    const result = arr.find((item, index) => {
      try {
        return predicate(item, index);
      } catch (error) {
        console.error('Error in find predicate:', error);
        return false;
      }
    });
    return result ?? fallback;
  } catch (error) {
    console.error('Error finding in array:', error);
    return fallback;
  }
}

export function safeFindIndex<T>(
  arr: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean,
  fallback: number = -1
): number {
  if (!Array.isArray(arr)) {
    return fallback;
  }
  
  try {
    const result = arr.findIndex((item, index) => {
      try {
        return predicate(item, index);
      } catch (error) {
        console.error('Error in findIndex predicate:', error);
        return false;
      }
    });
    return result !== -1 ? result : fallback;
  } catch (error) {
    console.error('Error finding index in array:', error);
    return fallback;
  }
}

export function safeSlice<T>(
  arr: T[] | null | undefined,
  start?: number,
  end?: number,
  fallback: T[] = []
): T[] {
  if (!Array.isArray(arr)) {
    return fallback;
  }
  
  try {
    return arr.slice(start, end);
  } catch (error) {
    console.error('Error slicing array:', error);
    return fallback;
  }
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function hasProperty<T extends object>(
  obj: T | null | undefined,
  prop: PropertyKey
): obj is T {
  if (isNullOrUndefined(obj)) {
    return false;
  }
  
  try {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  } catch (error) {
    console.error('Error checking property:', error);
    return false;
  }
}

export async function safeAsync<T>(
  promise: Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (errorMessage) {
      console.error(errorMessage, error);
    } else {
      console.error('Async operation failed:', error);
    }
    return fallback;
  }
}

export function safeJsonParse<T>(
  json: string | null | undefined,
  fallback: T
): T {
  if (!json || typeof json !== 'string') {
    return fallback;
  }
  
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

export function safeJsonStringify(
  value: unknown,
  fallback: string = '{}'
): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Error stringifying JSON:', error);
    return fallback;
  }
}

export function safeObjectKeys<T extends object>(
  obj: T | null | undefined
): Array<keyof T> {
  if (isNullOrUndefined(obj)) {
    return [];
  }
  
  try {
    return Object.keys(obj) as Array<keyof T>;
  } catch (error) {
    console.error('Error getting object keys:', error);
    return [];
  }
}

export function safeObjectValues<T extends object>(
  obj: T | null | undefined
): Array<T[keyof T]> {
  if (isNullOrUndefined(obj)) {
    return [];
  }
  
  try {
    return Object.values(obj);
  } catch (error) {
    console.error('Error getting object values:', error);
    return [];
  }
}

export function createSafeHandler<Args extends unknown[], Result>(
  handler: (...args: Args) => Result,
  fallback: Result,
  errorMessage?: string
): (...args: Args) => Result {
  return (...args: Args) => {
    try {
      return handler(...args);
    } catch (error) {
      if (errorMessage) {
        console.error(errorMessage, error);
      } else {
        console.error('Handler error:', error);
      }
      return fallback;
    }
  };
}

export function createSafeAsyncHandler<Args extends unknown[], Result>(
  handler: (...args: Args) => Promise<Result>,
  fallback: Result,
  errorMessage?: string
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (errorMessage) {
        console.error(errorMessage, error);
      } else {
        console.error('Async handler error:', error);
      }
      return fallback;
    }
  };
}
