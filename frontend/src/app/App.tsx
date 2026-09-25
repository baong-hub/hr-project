import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppRoutes } from './routes';
import { ThemeProvider } from './features/user-settings/contexts/ThemeContext';
import { ToastContainer } from './shared/ui/Toast/ToastContainer';
import { TopProgressBar } from './shared/ui/TopProgressBar/TopProgressBar';
import { ErrorBoundary } from './shared/ui/ErrorBoundary/ErrorBoundary';

import { CookieConsentBanner } from './shared/components/CookieConsentBanner';

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <TopProgressBar />
          <ToastContainer />
          <Router>
            <AppRoutes />
            <CookieConsentBanner />
          </Router>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
