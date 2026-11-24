import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
    theme: ThemeMode;
    setTheme: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const STORAGE_KEY = 'oss_theme_mode_v1';

const ThemeContext = createContext < ThemeContextValue | null > (null);

function getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
    } catch {
        // Ignore storage access errors
    }
    return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState < ThemeMode > (getInitialTheme);

    const applyTheme = useCallback((mode: ThemeMode) => {
        const daisyTheme = mode === 'light' ? 'oss-light' : 'oss';
        document.documentElement.setAttribute('data-theme', daisyTheme);
        document.documentElement.style.colorScheme = mode;
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch {
            // Ignore storage access errors
        }
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    const setTheme = useCallback((mode: ThemeMode) => {
        setThemeState(mode);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used inside ThemeProvider');
    }
    return ctx;
}
