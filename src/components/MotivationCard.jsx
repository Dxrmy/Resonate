import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Skeleton, IconButton, Popover, useTheme } from '@mui/material';
import { AutoAwesome, Refresh, InfoOutlined } from '@mui/icons-material';
import { useDatabase } from '../hooks/useDatabase';
import { generateMotivation } from '../services/ai';
import SpiritConstruct from './SpiritConstruct';

const MotivationCard = ({ spiritState = 'idle', evolutionStage = 'neutral', streak = 0, todayComplete = false }) => {
    const { query } = useDatabase();
    const theme = useTheme();
    const [quote, setQuote] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Popover State
    const [anchorEl, setAnchorEl] = useState(null);
    const handleInfoClick = (event) => setAnchorEl(event.currentTarget);
    const handleInfoClose = () => setAnchorEl(null);
    const openInfo = Boolean(anchorEl);

    useEffect(() => {
        const fetchAndGenerate = async () => {
            const today = new Date().toDateString();
            const cached = localStorage.getItem('daily_quote');
            const cachedDate = localStorage.getItem('daily_quote_date');

            if (cached && cachedDate === today && refreshTrigger === 0) {
                setQuote(cached);
                setLoading(false);
                return;
            }

            if (!window.electronAPI) {
                setQuote("Your potential is limitless.");
                setLoading(false);
                return;
            }

            const recentEntries = await query(`
                SELECT created_at, sentiment_score 
                FROM entries 
                WHERE created_at > date('now', '-7 days')
                ORDER BY created_at DESC
             `);

            const daysMap = new Set();
            let totalScore = 0;
            let count = 0;
            if (recentEntries) {
                recentEntries.forEach(e => {
                    daysMap.add(new Date(e.created_at).toDateString());
                    if (e.sentiment_score !== null) {
                        totalScore += e.sentiment_score;
                        count++;
                    }
                });
            }

            const consistency = daysMap.size;
            const trend = count > 0 ? (totalScore / count).toFixed(0) : 50;
            const daysSinceLast = 0;

            try {
                const newQuote = await generateMotivation({ consistency, trend, daysSinceLast });
                const cleanQuote = newQuote.replace(/^"|"$/g, '');
                setQuote(cleanQuote);
                localStorage.setItem('daily_quote', cleanQuote);
                localStorage.setItem('daily_quote_date', today);
            } catch (e) {
                setQuote("Every moment is a fresh beginning.");
            } finally {
                setLoading(false);
            }
        };

        fetchAndGenerate();
    }, [refreshTrigger, query]);

    return (
        <Card sx={{
            bgcolor: 'secondary.container',
            color: 'onSecondary.container',
            height: '100%', // Fill container
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible' // Allow spirit glow/dots to spill slightly if needed, though hidden by grid usually
        }}>
            <CardContent sx={{
                display: 'flex',
                flex: 1,
                gap: 2,
                p: 3,
                pb: '24px !important',
                alignItems: 'center'
            }}>
                {/* Left Side: Spirit (Fixed Aspect Ratio) */}
                <Box sx={{
                    height: '100%',
                    aspectRatio: '1/1',        // Force Square
                    minWidth: 150,             // Prevent getting too small
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'transparent'
                }}>
                    <SpiritConstruct
                        state={spiritState}
                        evolution={evolutionStage}
                        baseColor={theme.palette.primary.main}
                        streak={streak}
                        todayComplete={todayComplete}
                    />
                </Box>

                {/* Right Side: content */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AutoAwesome color="inherit" />
                            <Typography variant="labelLarge" sx={{ opacity: 0.8, fontWeight: 'bold' }}>
                                DAILY INSIGHT
                            </Typography>
                        </Box>

                        <Box>
                            <IconButton onClick={handleInfoClick} color="inherit" size="small" sx={{ mr: 1 }}>
                                <InfoOutlined fontSize="small" />
                            </IconButton>
                            <IconButton onClick={() => {
                                localStorage.removeItem('daily_quote');
                                setRefreshTrigger(p => p + 1);
                            }} color="inherit" size="small">
                                <Refresh fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    {loading ? (
                        <Skeleton variant="text" width="100%" height={60} />
                    ) : (
                        <Typography variant="headlineSmall" sx={{ fontStyle: 'italic', lineHeight: 1.4 }}>
                            {quote}
                        </Typography>
                    )}
                </Box>
            </CardContent>

            {/* Info Popover */}
            <Popover
                open={openInfo}
                anchorEl={anchorEl}
                onClose={handleInfoClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Box sx={{ p: 2, maxWidth: 300 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>About Your Spirit</Typography>
                    <Typography variant="body2" paragraph>
                        This spirit reflects your current state. Log your mood to see it react!
                    </Typography>
                    <Typography variant="body2" paragraph>
                        • <strong>Color/Shape:</strong> Changes with your mood data.
                    </Typography>
                    <Typography variant="body2">
                        • <strong>Orbiting Dots:</strong> Represent your daily streak. Keep coming back to complete the circle!
                    </Typography>
                </Box>
            </Popover>
        </Card>
    );
};

export default MotivationCard;
