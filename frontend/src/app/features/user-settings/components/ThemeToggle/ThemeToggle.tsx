import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './ThemeToggle.module.scss';


export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className={styles.themeToggleBtn} 
      onClick={toggleTheme} 
      aria-label="Toggle Theme"
      title="Toggle Dark/Light Mode"
    >
      {theme === 'Dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
