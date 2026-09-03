import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ThemeMode } from '../models/user-setting.model';
import { userSettingService } from '../services/user-setting.service';
import i18n from '../../../core/i18n/i18n';

interface UserSettingContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  language: string;
  changeLanguage: (lang: string) => void;
}

const UserSettingContext = createContext<UserSettingContextType>({
  theme: 'Light',
  toggleTheme: () => {},
  language: 'vi',
  changeLanguage: () => {},
});

export const useTheme = () => {
  const { theme, toggleTheme } = useContext(UserSettingContext);
  return { theme, toggleTheme };
};

export const useLanguage = () => {
  const { language, changeLanguage } = useContext(UserSettingContext);
  return { language, changeLanguage };
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode;
    return saved === 'Light' || saved === 'Dark' ? saved : 'Light';
  });

  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('language') || 'vi';
  });

  useEffect(() => {
    // Only fetch if a token is present assuming API requires auth
    const token = localStorage.getItem('token');
    if (token) {
      userSettingService.getMySettings().then((res) => {
        if (res.data && res.data.success && res.data.data) {
          const apiTheme = res.data.data.themeMode;
          const apiLang = res.data.data.language || 'vi';
          
          setTheme(apiTheme);
          localStorage.setItem('themeMode', apiTheme);

          setLanguage(apiLang);
          localStorage.setItem('language', apiLang);
          i18n.changeLanguage(apiLang);
        }
      }).catch(() => {
        console.error('Failed to load user settings');
      });
    }
  }, []);

  useEffect(() => {
    if (theme === 'Dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'Light' ? 'Dark' : 'Light';
    setTheme(newTheme);
    localStorage.setItem('themeMode', newTheme);
    
    // Ngầm gọi server
    const token = localStorage.getItem('token');
    if (token) {
      userSettingService.updateTheme({ themeMode: newTheme }).catch(() => {
        console.error('Failed to sync theme settings');
      });
    }
  };

  const changeLanguage = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    i18n.changeLanguage(newLang);

    // Ngầm gọi server
    const token = localStorage.getItem('token');
    if (token) {
      userSettingService.updateLanguage(newLang).catch(() => {
        console.error('Failed to sync language settings');
      });
    }
  };

  return (
    <UserSettingContext.Provider value={{ theme, toggleTheme, language, changeLanguage }}>
      {children}
    </UserSettingContext.Provider>
  );
};
