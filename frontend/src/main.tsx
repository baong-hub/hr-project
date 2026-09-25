import ReactDOM from 'react-dom/client'
import './app/core/i18n/i18n'
import App from './app/App'
import './styles/main.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}
