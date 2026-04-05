import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProviders } from '@/providers/AppProviders';
import AppContent from '@/routes/AppContent';

function App() {
  return (
    <ErrorBoundary level="root">
      <AppProviders>
        <AppContent />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
