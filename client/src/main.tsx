import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Global Error & Promise Rejection Telemetry
window.addEventListener('error', (event) => {
  console.error('[PoySic Telemetry] Unhandled client error:', event.message, event.filename, event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[PoySic Telemetry] Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);


