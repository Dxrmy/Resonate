import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Card, CardContent,
    useTheme, Skeleton, IconButton, Tooltip
} from '@mui/material';
import {
    AutoAwesome,
    Timeline,
    DonutLarge,
    InfoOutlined,
    TrendingUp
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    ResponsiveContainer, Cell, PieChart, Pie, Tooltip as RechartsTooltip
} from 'recharts';
import { useDatabase } from '../hooks/useDatabase';
import { generateWeeklySummary } from '../services/ai';
import MoodHeatmap from '../components/MoodHeatmap';

const GlassCard = ({ children, sx = {} }) => (
    <Paper
        elevation={0}
        sx={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            p: 3,
            height: '100%',
            ...sx
        }}
    >
        {children}
    </Paper>
);

const Insights = () => {
    const theme = useTheme();
    const { query } = useDatabase();

    // States
    const [stats, setStats] = useState({ weeklyRhythm: [], spectrum: [] });
    const [entries, setEntries] = useState([]);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!window.electronAPI) return;
            try {
                // 1. Fetch Heatmap Entries
                const entryRes = await query('SELECT created_at, dominant_emotion, sentiment_score, content FROM entries ORDER BY created_at DESC');
                setEntries(entryRes || []);

                // 2. Fetch Aggregated Stats
                if (window.electronAPI.getInsightStats) {
                    const statRes = await window.electronAPI.getInsightStats();
                    setStats(statRes);
                }

                // 3. Generate AI Summary (Last 7 entries)
                const lastWeek = entryRes?.slice(0, 7) || [];
                if (lastWeek.length > 0) {
                    const aiSummary = await generateWeeklySummary(lastWeek);
                    setSummary(aiSummary);
                } else {
                    setSummary("Log more entries to unlock your AI psychological summary.");
                }

            } catch (e) {
                console.error("Insights load error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Color Palette
    const COLORS = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        '#8e24aa',
        '#d81b60'
    ];

    return (
        <Box sx={{ p: 4, position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Background Polish: Blurred Orb */}
            <Box sx={{
                position: 'fixed',
                bottom: -100,
                right: -100,
                width: 400,
                height: 400,
                background: `radial-gradient(circle, ${theme.palette.primary.main}22 0%, transparent 70%)`,
                filter: 'blur(60px)',
                zIndex: -1
            }} />

            <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
                Insights
            </Typography>

            <Grid container spacing={3}>
                {/* ROW 1: AI Narrator (Full Width) */}
                <Grid item xs={12}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <GlassCard sx={{ background: 'linear-gradient(135deg, rgba(30,136,229,0.1) 0%, rgba(255,255,255,0.05) 100%)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <AutoAwesome color="primary" />
                                <Typography variant="h6" fontWeight="bold">The AI Narrator</Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Tooltip title="AI Analysis of your last 7 logs">
                                    <IconButton size="small"><InfoOutlined fontSize="small" /></IconButton>
                                </Tooltip>
                            </Box>

                            {loading ? (
                                <Box>
                                    <Skeleton width="90%" height={30} />
                                    <Skeleton width="70%" height={30} />
                                </Box>
                            ) : (
                                <Typography variant="body1" sx={{
                                    lineHeight: 1.8,
                                    fontStyle: 'italic',
                                    color: 'text.secondary',
                                    fontSize: '1.1rem'
                                }}>
                                    {summary.split('. ').map((sentence, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 + (i * 0.3) }}
                                        >
                                            {sentence}.{" "}
                                        </motion.span>
                                    ))}
                                </Typography>
                            )}
                        </GlassCard>
                    </motion.div>
                </Grid>

                {/* ROW 2: Weekly Rhythm (60%) & Emotional Spectrum (40%) */}
                <Grid item xs={12} md={7}>
                    <GlassCard>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <Timeline color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">Weekly Rhythm</Typography>
                        </Box>

                        <Box sx={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.weeklyRhythm}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.5)" />
                                    <YAxis hide domain={[0, 100]} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1e1e1e', border: 'none', borderRadius: 8, color: '#fff' }}
                                    />
                                    <Bar
                                        dataKey="score"
                                        radius={[10, 10, 0, 0]}
                                        animationDuration={1500}
                                        label={{ position: 'top', fill: theme.palette.text.secondary, fontSize: 12, offset: 10 }}
                                    >
                                        {stats.weeklyRhythm.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`url(#colorGradient)`}
                                            />
                                        ))}
                                    </Bar>
                                    <defs>
                                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </GlassCard>
                </Grid>

                <Grid item xs={12} md={5}>
                    <GlassCard>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <DonutLarge color="primary" />
                            <Typography variant="subtitle1" fontWeight="bold">Emotional Spectrum</Typography>
                        </Box>

                        <Box sx={{ height: 300, width: '100%', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.spectrum}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1200}
                                    >
                                        {stats.spectrum.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text for Donut */}
                            <Box sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center'
                            }}>
                                <TrendingUp sx={{ color: 'primary.main', opacity: 0.5 }} />
                                <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>Dominant</Typography>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {stats.spectrum[0]?.name || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    </GlassCard>
                </Grid>

                {/* ROW 3: Yearly Resonance (Heatmap) */}
                <Grid item xs={12}>
                    <GlassCard>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                            Yearly Resonance
                        </Typography>
                        <Box sx={{ overflowX: 'auto', py: 2 }}>
                            <MoodHeatmap entries={entries} />
                        </Box>
                    </GlassCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Insights;
