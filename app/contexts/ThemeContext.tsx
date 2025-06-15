import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { useColorScheme } from 'react-native';

// Theme colors
export const themes = {
  dark: {
    background: '#000',
    surface: '#111',
    card: '#1a1a1a',
    primary: '#e50914',
    primaryLight: 'rgba(229, 9, 20, 0.1)',
    text: '#fff',
    textSecondary: '#ccc',
    textTertiary: '#999',
    textMuted: '#666',
    border: '#333',
    overlay: 'rgba(0, 0, 0, 0.7)',
    gradient: ['transparent', 'rgba(0,0,0,0.8)', '#000'],
    headerBackground: '#000',
    tabBarBackground: '#000',
    statusBar: 'light',
    error: '#e50914',
    warning: '#FFD700',
    success: '#4CAF50',
  },
  light: {
    background: '#fff',
    surface: '#f8f9fa',
    card: '#ffffff',
    primary: '#e50914',
    primaryLight: 'rgba(229, 9, 20, 0.1)',
    text: '#000',
    textSecondary: '#333',
    textTertiary: '#666',
    textMuted: '#999',
    border: '#e1e1e1',
    overlay: 'rgba(0, 0, 0, 0.5)',
    gradient: ['transparent', 'rgba(255,255,255,0.8)', '#fff'],
    headerBackground: '#fff',
    tabBarBackground: '#fff',
    statusBar: 'dark',
    error: '#e50914',
    warning: '#F57C00',
    success: '#2E7D32',
  },
};

export type Theme = typeof themes.dark;
export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  isDark: boolean;
}

type ThemeAction = 
  | { type: 'SET_THEME'; payload: ThemeMode }
  | { type: 'SET_SYSTEM_THEME'; payload: 'light' | 'dark' };

const ThemeContext = createContext<{
  themeState: ThemeState;
  setTheme: (mode: ThemeMode) => void;
} | null>(null);

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_THEME':
      const mode = action.payload;
      let isDark: boolean;
      let theme: Theme;
      
      if (mode === 'auto') {
        // Will be updated by SET_SYSTEM_THEME
        isDark = state.isDark;
        theme = state.theme;
      } else {
        isDark = mode === 'dark';
        theme = themes[mode];
      }
      
      return {
        mode,
        theme,
        isDark,
      };
    case 'SET_SYSTEM_THEME':
      if (state.mode === 'auto') {
        const isDark = action.payload === 'dark';
        return {
          ...state,
          isDark,
          theme: themes[action.payload],
        };
      }
      return state;
    default:
      return state;
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  
  const [themeState, dispatch] = useReducer(themeReducer, {
    mode: 'dark', // Default to dark mode
    theme: themes.dark,
    isDark: true,
  });

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system theme changes and mode is auto
  useEffect(() => {
    if (systemColorScheme) {
      dispatch({ type: 'SET_SYSTEM_THEME', payload: systemColorScheme });
    }
  }, [systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme) {
        const mode = savedTheme as ThemeMode;
        dispatch({ type: 'SET_THEME', payload: mode });
        
        // If auto mode and we have system theme, apply it
        if (mode === 'auto' && systemColorScheme) {
          dispatch({ type: 'SET_SYSTEM_THEME', payload: systemColorScheme });
        }
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('theme_preference', mode);
      dispatch({ type: 'SET_THEME', payload: mode });
      
      // If setting to auto mode, immediately apply system theme
      if (mode === 'auto' && systemColorScheme) {
        dispatch({ type: 'SET_SYSTEM_THEME', payload: systemColorScheme });
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeState, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 