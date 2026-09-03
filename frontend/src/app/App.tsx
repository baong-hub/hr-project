import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './routes';
import { ThemeProvider } from './features/user-settings/contexts/ThemeContext';
import { ToastContainer } from './shared/ui/Toast/ToastContainer';
import { TopProgressBar } from './shared/ui/TopProgressBar/TopProgressBar';

function App() {
  return (
    <ThemeProvider>
      <TopProgressBar />
      <ToastContainer />
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;
