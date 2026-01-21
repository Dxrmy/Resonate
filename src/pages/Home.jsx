import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    IconButton,
    Paper,
    Tooltip,
    Snackbar,
    Alert,
    useTheme
} from '@mui/material';
import {
    PlayArrow,
    LocalFireDepartment,
    Settings,
    SwapHoriz,
    ArrowBack,
    ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MotivationCard from '../components/MotivationCard';
import FluidMoodGraph from '../components/FluidMoodGraph';
import QuickChatCarousel from '../components/QuickChatCarousel';
import CheckInWizard from '../components/CheckInWizard';
import { useDatabase } from '../hooks/useDatabase';

const Widget = ({ title, children }) => (
    <Card sx={{ height: '100%', bgcolor: 'surfaceContainer', position: 'relative' }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1, '&:last-child': { pb: 1 } }}>
            <Typography variant="h6" color="primary.main" sx={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', mb: 1 }}>
                {title}
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {children}
            </Box>
        </CardContent>
    </Card>
);

const Home = () => {
    const { query } = useDatabase();
    const [spiritState, setSpiritState] = useState('idle');
    const [evolutionStage, setEvolutionStage] = useState('neutral');
    const [streak, setStreak] = useState(0);
    const [checkInOpen, setCheckInOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '' });
    const [todayComplete, setTodayComplete] = useState(false);

    // Tile Reordering State
    const [isEditing, setIsEditing] = useState(false);
    const [widgetOrder, setWidgetOrder] = useState(() => {
        const saved = localStorage.getItem('widgetOrder');
        return saved ? JSON.parse(saved) : ['graph', 'streak', 'log', 'chat'];
    });

    useEffect(() => {
        localStorage.setItem('widgetOrder', JSON.stringify(widgetOrder));
    }, [widgetOrder]);

    const moveWidget = (index, direction) => {
        const newOrder = [...widgetOrder];
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= newOrder.length) return;
        [newOrder[index], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[index]];
        setWidgetOrder(newOrder);
    };

    const determineState = async () => {
        if (!query) return;
        try {
            // Check if logged today (for dots)
            const todayStr = new Date().toISOString().split('T')[0];
            const todayEntries = await query(`SELECT sentiment_score FROM entries WHERE date(created_at) = ?`, [todayStr]);
            setTodayComplete(todayEntries && todayEntries.length > 0);

            const latestStatus = await query('SELECT sentiment_score FROM entries ORDER BY created_at DESC LIMIT 1');
            if (latestStatus && latestStatus.length > 0) {
                const score = latestStatus[0].sentiment_score;
                if (score > 80) setSpiritState('happy');
                else if (score < 40) setSpiritState('sadness');
                else setSpiritState('idle');
                return;
            }
            setSpiritState('idle');
        } catch (e) {
            console.error(e);
        }
    };

    const determineEvolution = async () => {
        if (!query) return;
        try {
            const count = await query('SELECT COUNT(*) as total FROM entries');
            const total = count[0].total;
            if (total > 50) setEvolutionStage('scholar');
            else if (total > 20) setEvolutionStage('athlete');
            else setEvolutionStage('neutral');
        } catch (e) {
            console.error(e);
        }
    };

    const calculateStreak = async () => {
        if (!window.electronAPI.getWeeklyProgress) return;
        try {
            const progress = await window.electronAPI.getWeeklyProgress();
            const daysDone = Object.values(progress).filter(v => v > 0).length;
            setStreak(daysDone);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        determineState();
        determineEvolution();
        calculateStreak();
    }, [query]);

    const handleQuickLog = async (emoji, moodLabel, score) => {
        if (!window.electronAPI.createDailyLog) return;
        try {
            await window.electronAPI.createDailyLog({
                date: new Date().toISOString().split('T')[0],
                mood: score,
                sleep: 8
            });
            setNotification({ open: true, message: `Logged: ${moodLabel}` });
            setTimeout(async () => {
                await Promise.all([
                    determineState(),
                    determineEvolution(),
                    calculateStreak()
                ]);
            }, 300);
        } catch (e) {
            console.error("Quick Log Error:", e);
        }
    };

    const userName = localStorage.getItem('user_name') || 'Traveler';

    return (
        <Box sx={{ p: 0, height: '100%', position: 'relative', overflowY: 'auto', pb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="headlineMedium" component="h1">
                        Good Afternoon, {userName}.
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Resonate with your inner self today.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => setCheckInOpen(true)}
                    sx={{ borderRadius: 4, px: 3 }}
                >
                    Start Check-in
                </Button>
            </Box>

            {/* --- HERO SECTION --- */}
            <Box sx={{ mb: 3, width: '100%', height: { xs: 'auto', md: 220 }, flexShrink: 0, position: 'relative' }}>
                <Button
                    size="small"
                    startIcon={isEditing ? <SwapHoriz /> : <Settings />}
                    onClick={() => setIsEditing(!isEditing)}
                    sx={{ position: 'absolute', top: 12, right: 12, zIndex: 100, bgcolor: 'background.paper', borderRadius: 4, opacity: 0.6, '&:hover': { opacity: 1 } }}
                >
                    {isEditing ? 'Done' : 'Edit Layout'}
                </Button>
                <MotivationCard
                    spiritState={spiritState}
                    evolutionStage={evolutionStage}
                    streak={streak}
                    todayComplete={todayComplete}
                />
            </Box>

            {/* --- WIDGET GRID --- */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 4,
                width: '100%'
            }}>
                {widgetOrder.map((key, idx) => (
                    <Box key={key} sx={{ position: 'relative', aspectRatio: '1/1', width: '100%', minWidth: 0 }}>
                        {isEditing && (
                            <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 50, display: 'flex', gap: 0.5, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 2, p: 0.5 }}>
                                <IconButton size="small" onClick={() => moveWidget(idx, -1)} disabled={idx === 0}><ArrowBack fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => moveWidget(idx, 1)} disabled={idx === widgetOrder.length - 1}><ArrowForward fontSize="small" /></IconButton>
                            </Box>
                        )}

                        {key === 'graph' && <FluidMoodGraph />}

                        {key === 'streak' && (
                            <Widget title="Streak">
                                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pb: 4 }}>
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1], filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="displayLarge" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '3rem', md: '4rem' } }}>
                                                {streak}
                                            </Typography>
                                            <LocalFireDepartment sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, color: '#ff5722' }} />
                                        </Box>
                                    </motion.div>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mt: 1 }}>Days in a row</Typography>
                                </Box>
                            </Widget>
                        )}

                        {key === 'log' && (
                            <Widget title="Quick Log">
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 0.25,
                                    height: '100%',
                                    alignContent: 'center',
                                    padding: 0.25,
                                    pb: 3
                                }}>
                                    {[
                                        { e: '🤩', t: 'Great', score: 95 }, { e: '🔥', t: 'Motivated', score: 90 }, { e: '😂', t: 'Joyful', score: 85 },
                                        { e: '😌', t: 'Calm', score: 75 }, { e: '🍃', t: 'Peaceful', score: 70 }, { e: '🤔', t: 'Pondering', score: 60 },
                                        { e: '😫', t: 'Frustrated', score: 30 }, { e: '😢', t: 'Sad', score: 15 }, { e: '🌫️', t: 'Tired', score: 40 }
                                    ].map((item, index) => (
                                        <Tooltip key={index} title={item.t} arrow>
                                            <Paper
                                                elevation={0}
                                                onClick={() => handleQuickLog(item.e, item.t, item.score)}
                                                sx={{
                                                    aspectRatio: '1/1',
                                                    borderRadius: '8px',
                                                    bgcolor: 'background.default',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: { xs: '1.2rem', md: '1.6rem' },
                                                    transition: 'all 0.2s',
                                                    '&:hover': { bgcolor: 'primary.light', color: 'white', transform: 'scale(1.1)' }
                                                }}
                                            >
                                                {item.e}
                                            </Paper>
                                        </Tooltip>
                                    ))}
                                </Box>
                            </Widget>
                        )}

                        {key === 'chat' && <QuickChatCarousel />}
                    </Box>
                ))}
            </Box>

            <CheckInWizard
                open={checkInOpen}
                onClose={() => setCheckInOpen(false)}
                onComplete={() => {
                    setNotification({ open: true, message: "Morning Check-in Complete" });
                    determineState();
                }}
            />

            <Snackbar
                open={notification.open}
                autoHideDuration={3000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Home;
