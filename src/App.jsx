import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { useThemeStore } from './store/themeStore';
import NavigationRail from './components/NavigationRail';
import Home from './pages/Home';
import Journal from './pages/Journal';
import Insights from './pages/Insights';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

// Fix reactivity by subscribing to currentMode
function App() {
  const currentMode = useThemeStore((state) => state.currentMode);
  const { getMuiTheme } = useThemeStore();

  // Memoize theme to avoid unnecessary recalculations, dependent on currentMode
  const theme = React.useMemo(() => getMuiTheme(), [currentMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>

          {/* Left Navigation */}
          <NavigationRail />

          {/* Main Content Area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              bgcolor: 'background.default',
              overflowY: 'auto' // Scroll content, not rail
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
