import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Paper,
    // NavigationRail as M3NavigationRail, -- Removed invalid import
    IconButton,
    Typography,
    Tooltip,
    Box,
    Fab
} from '@mui/material';
import {
    Home as HomeIcon,
    Book as JournalIcon,
    Timeline as InsightsIcon,
    Spa as ToolsIcon,
    Settings as SettingsIcon,
    Add as AddIcon
} from '@mui/icons-material';

const NavItem = ({ icon: Icon, label, path, active, onClick }) => (
    <Tooltip title={label} placement="right">
        <Box
            component="button"
            onClick={onClick}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                p: 1,
                mb: 2,
                width: '100%',
                color: active ? 'primary.main' : 'text.secondary',
                '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                }
            }}
        >
            <Box
                sx={{
                    bgcolor: active ? 'secondary.container' : 'transparent',
                    p: 0.5,
                    borderRadius: 4,
                    width: 56,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                }}
            >
                <Icon sx={{ color: active ? 'onSecondaryContainer' : 'inherit' }} />
            </Box>
            <Typography variant="caption" sx={{ mt: 0.5, fontWeight: active ? 600 : 400 }}>
                {label}
            </Typography>
        </Box>
    </Tooltip>
);

const NavigationRail = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: 'Home', path: '/', icon: HomeIcon },
        { label: 'Journal', path: '/journal', icon: JournalIcon },
        { label: 'Insights', path: '/insights', icon: InsightsIcon },
        { label: 'Chat', path: '/chat', icon: ToolsIcon },
        { label: 'Settings', path: '/settings', icon: SettingsIcon },
    ];

    return (
        <Paper
            elevation={0}
            sx={{
                width: 80,
                height: '100vh',
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: 2,
                bgcolor: 'background.surface' // M3 surface
            }}
        >
            {/* FAB for Quick Action (Exploding button later) */}
            <Fab
                color="primary"
                aria-label="add"
                onClick={() => navigate('/journal')}
                sx={{ mb: 4, boxShadow: 0 }}
                size="medium"
            >
                <AddIcon />
            </Fab>

            <Box sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {navItems.map((item) => (
                    <NavItem
                        key={item.path}
                        {...item}
                        active={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                    />
                ))}
            </Box>
        </Paper>
    );
};

export default NavigationRail;
