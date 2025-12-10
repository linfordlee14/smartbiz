import {
    useContext
} from 'react';
import {
    DarkModeContext
} from '../contexts/DarkModeContext';

/**
 * Custom hook to access dark mode state and toggle function.
 * Must be used within a DarkModeProvider.
 * 
 * @returns {{ darkMode: boolean, toggleDarkMode: () => void }}
 */
export function useDarkMode() {
    const context = useContext(DarkModeContext);

    if (context === undefined) {
        throw new Error('useDarkMode must be used within a DarkModeProvider');
    }

    return context;
}