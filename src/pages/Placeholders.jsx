import React from 'react';
import { Box, Typography } from '@mui/material';

const PlaceholderPage = ({ title }) => (
    <Box sx={{ p: 0 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
            {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
            This module is under construction.
        </Typography>
    </Box>
);

// export const Journal = () => <PlaceholderPage title="Journal" />; // Removed
export const Insights = () => <PlaceholderPage title="Insights" />;
export const Settings = () => <Box sx={{ p: 4 }}><Typography variant="h4">Settings</Typography></Box>;
