import React, {createContext, useContext, useState, useEffect} from 'react';
import {useColorScheme} from 'react-native';
import {Theme} from '../types';

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#00d4aa',
    secondary: '#00a884',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#1a1c23',
    textSecondary: '#6b6f7e',
    success: '#00d4aa',
    warning: '#f59e0b',
    error: '#ef4444',
    border: '#e5e7eb',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#00d4aa',
    secondary: '#00a884',
    background: '#0a0b0f',
    surface: '#16181f',
    text: '#ffffff',
    textSecondary: '#a0a3b1',
    success: '#00d4aa',
    warning: '#f59e0b',
    error: '#ef4444',
    border: '#2a2d36',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => setIsDark(!isDark);
  const setTheme = (dark: boolean) => setIsDark(dark);

  return (
    <ThemeContext.Provider value={{theme, toggleTheme, setTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
