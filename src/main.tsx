import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Set up Spark KV polyfill for non-Spark environments.
// On GitHub Spark, window.spark is provided by the Spark runtime before React boots.
// Here we only set the polyfill if window.spark has not already been initialised.
if (typeof window !== 'undefined' && !window.spark) {
  window.spark = {
    kv: {
      get: async (key: string) => {
        try {
          const val = localStorage.getItem(key);
          return val ? JSON.parse(val) : null;
        } catch {
          return null;
        }
      },
      set: async (key: string, value: any) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // Ignore storage errors (e.g. private browsing, storage quota exceeded)
        }
      },
      delete: async (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore
        }
      },
      keys: async (prefix?: string) => {
        try {
          const allKeys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (!prefix || k.startsWith(prefix))) {
              allKeys.push(k);
            }
          }
          return allKeys;
        } catch {
          return [];
        }
      },
    }
  } as any;
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
