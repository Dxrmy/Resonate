import { create } from 'zustand';
import { createTheme } from '@mui/material';

// Define Color Palettes
const palettes = {
    light: { primary: '#6200EA', secondary: '#00B0FF', background: '#f5f5f5', paper: '#ffffff' },
    ocean: { primary: '#00B0FF', secondary: '#00E5FF', background: '#E3F2FD', paper: '#FFFFFF' },
    forest: { primary: '#2E7D32', secondary: '#66BB6A', background: '#E8F5E9', paper: '#FFFFFF' },
    sunset: { primary: '#D84315', secondary: '#FF7043', background: '#FBE9E7', paper: '#FFFFFF' },
};

export const useThemeStore = create((set, get) => ({
    currentMode: localStorage.getItem('theme_mode') || 'light',

    setMode: (mode) => {
        console.log("Switching Theme to:", mode);
        localStorage.setItem('theme_mode', mode);
        set({ currentMode: mode });
    },

    getMuiTheme: () => {
        const mode = get().currentMode;
        const palette = palettes[mode] || palettes.light;

        return createTheme({
            palette: {
                mode: 'light', // Force light mode for now as per design
                primary: { main: palette.primary },
                secondary: { main: palette.secondary },
                background: {
                    default: palette.background,
                    paper: palette.paper
                }
            },
            typography: {
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                h1: { fontWeight: 700 },
                h2: { fontWeight: 700 },
                h4: { fontWeight: 600 },
                button: { textTransform: 'none', fontWeight: 600 }
            },
            shape: {
                borderRadius: 16 // Modern rounded corners
            },
            components: {
                MuiButton: {
                    styleOverrides: {
                        root: { borderRadius: 12, padding: '8px 24px' }
                    }
                },
                MuiCard: {
                    styleOverrides: {
                        root: { borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }
                    }
                }
            }
        });
    }
}));
