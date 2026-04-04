import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Polyfill window.spark.kv for Vercel deployments
if (typeof window !== 'undefined' && !window.spark) {
  window.spark = {
    kv: {
      get: async (key: string) => {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      },
      set: async (key: string, value: any) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      delete: async (key: string) => {
        localStorage.removeItem(key);
      }
    }
  } as any;
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
