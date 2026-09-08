import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './routes';
import { ThemeProvider } from './features/user-settings/contexts/ThemeContext';
import { ToastContainer } from './shared/ui/Toast/ToastContainer';
import { TopProgressBar } from './shared/ui/TopProgressBar/TopProgressBar';

import { ErrorBoundary } from './shared/ui/ErrorBoundary/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TopProgressBar />
        <ToastContainer />
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
