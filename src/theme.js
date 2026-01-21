import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark', // Default to dark mode for mental health apps (calming)
        primary: {
            main: '#D0BCFF', // M3 Purple 80
        },
        secondary: {
            main: '#CCC2DC', // M3 Purple Grey 80
        },
        background: {
            default: '#1C1B1F', // M3 Dark Surface
            paper: '#1C1B1F',
        },
    },
    typography: {
        fontFamily: [
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px', // M3 Card roundness
                },
            },
        },
    },
});

export default theme;
