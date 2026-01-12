import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isOwner } = useAuthContext();
    const [theme, setThemeState] = useState<Theme>('light');

    // Load theme from localStorage or default to Light
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setThemeState(savedTheme);
            applyTheme(savedTheme);
        } else {
            // Default always to light, ignoring system preferences
            setThemeState('light');
            applyTheme('light');
        }
    }, []);

    // Update theme when user changes (e.g. login)
    useEffect(() => {
        if (user && isOwner) {
            // In a real scenario, we'd fetch settings from the owner table
            // For now, we'll sync with localStorage and update DB when changed
            const fetchUserSettings = async () => {
                const { data, error } = await supabase
                    .from('owners')
                    .select('settings')
                    .eq('id', user.id)
                    .single();

                if (data?.settings?.theme) {
                    setThemeState(data.settings.theme);
                    applyTheme(data.settings.theme);
                }
            };
            fetchUserSettings();
        }
    }, [user, isOwner]);

    const applyTheme = (t: Theme) => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(t);
        localStorage.setItem('theme', t);
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        applyTheme(newTheme);

        if (user && isOwner) {
            // Persist to Supabase
            const { data: currentOwner } = await supabase
                .from('owners')
                .select('settings')
                .eq('id', user.id)
                .single();

            const newSettings = {
                ...(currentOwner?.settings || {}),
                theme: newTheme
            };

            await supabase
                .from('owners')
                .update({ settings: newSettings })
                .eq('id', user.id);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
