import { create } from 'zustand';
import { createTheme } from '@mui/material/styles';

// 1. Define the Color Palettes
const PALETTES = {
    calm: { primary: '#6750A4', secondary: '#958DA5', bg: '#F7F2FA' }, // Purple/Lilac
    energetic: { primary: '#B3261E', secondary: '#F2B8B5', bg: '#FFF8F6' }, // Red/Warm
    melancholy: { primary: '#00639B', secondary: '#CCE5FF', bg: '#F0F7FF' }, // Blue/Cool
    nature: { primary: '#386A20', secondary: '#B8F397', bg: '#F4F9F1' }, // Green/Growth
};

export const useThemeStore = create((set, get) => ({
    currentMode: 'calm', // Default start

    setThemeMode: (mode) => set({ currentMode: mode }),

    getMuiTheme: () => {
        const mode = get().currentMode;
        const colors = PALETTES[mode] || PALETTES.calm;

        return createTheme({
            palette: {
                primary: { main: colors.primary },
                secondary: { main: colors.secondary },
                background: { default: colors.bg, paper: '#ffffff' },
            },
            shape: {
                borderRadius: 16, // Material 3 Rounded Corners
            },
            typography: {
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            }
        });
    }
}));
