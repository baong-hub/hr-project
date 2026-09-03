import { Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/ThemeContext';
import styles from './LanguageSelector.module.scss';

export const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    const nextLang = language === 'vi' ? 'en' : 'vi';
    changeLanguage(nextLang);
  };

  return (
    <button 
      className={styles.languageBtn} 
      onClick={toggleLanguage} 
      title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
      aria-label="Toggle Language"
    >
      <Globe size={18} />
      <span className={styles.languageText}>{language === 'vi' ? 'VI' : 'EN'}</span>
    </button>
  );
};
