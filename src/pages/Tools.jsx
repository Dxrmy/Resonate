import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardActionArea, CardContent, Chip } from '@mui/material';
import { Psychology, SelfImprovement, Spa } from '@mui/icons-material';
import ChatSession from '../components/ChatSession';

const Tools = () => {
    const [activeMode, setActiveMode] = useState(null);

    const methods = [
        {
            id: 'cbt',
            name: 'CBT Practitioner',
            desc: 'Challenge negative thoughts and distortions.',
            icon: <Psychology fontSize="large" color="primary" />,
            color: 'primary.main'
        },
        {
            id: 'dbt',
            name: 'DBT Coach',
            desc: 'Distress tolerance and grounding for crises.',
            icon: <Spa fontSize="large" color="secondary" />,
            color: 'secondary.main'
        },
        {
            id: 'stoic',
            name: 'Stoic Mentor',
            desc: 'Perspective, resilience, and dichotomy of control.',
            icon: <SelfImprovement fontSize="large" color="warning" />,
            color: 'warning.main'
        }
    ];

    if (activeMode) {
        return (
            <Box sx={{ p: 4, height: '100%' }}>
                <Typography
                    variant="button"
                    onClick={() => setActiveMode(null)}
                    sx={{ cursor: 'pointer', mb: 2, display: 'block', color: 'text.secondary' }}
                >
                    ← Back to Methods
                </Typography>
                <ChatSession mode={activeMode} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>The Methods</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Select a psychological framework to guide your session.
            </Typography>

            <Grid container spacing={3}>
                {methods.map((method) => (
                    <Grid item xs={12} md={6} key={method.id} lg={4}>
                        <Card
                            sx={{
                                height: '100%',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' }
                            }}
                        >
                            <CardActionArea
                                onClick={() => setActiveMode(method.id)}
                                sx={{ height: '100%', p: 2 }}
                            >
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
                                    {method.icon}
                                    <Typography variant="h6">{method.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {method.desc}
                                    </Typography>
                                    <Chip label="Start Session" clickable color="primary" variant="outlined" />
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default Tools;
