import React, { useEffect, useState, useCallback } from 'react';
import { Paper, Box, Typography, useTheme, Skeleton, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { useDatabase } from '../hooks/useDatabase';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const FluidMoodGraph = () => {
    const theme = useTheme();
    const { query } = useDatabase();

    const [pathData, setPathData] = useState('');
    const [viewMode, setViewMode] = useState('week'); // week, month, year
    const [loading, setLoading] = useState(true);

    const MODES = ['week', 'month', 'year'];

    // Cycle Mode
    const handleNextMode = () => {
        const idx = MODES.indexOf(viewMode);
        setViewMode(MODES[(idx + 1) % MODES.length]);
    };

    const handlePrevMode = () => {
        const idx = MODES.indexOf(viewMode);
        setViewMode(MODES[(idx - 1 + MODES.length) % MODES.length]);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        if (!window.electronAPI) {
            setPathData("M 0 50 L 100 50");
            setLoading(false);
            return;
        }

        let dateModifier = '-7 days';
        if (viewMode === 'month') dateModifier = '-30 days';
        if (viewMode === 'year') dateModifier = '-365 days';

        try {
            const result = await query(
                `SELECT AVG(sentiment_score) as avg_score, date(created_at) as day 
                 FROM entries 
                 WHERE created_at > datetime('now', ?) 
                 GROUP BY day
                 ORDER BY day ASC`,
                [dateModifier]
            );

            if (!result || result.length < 2) {
                // Flat line if no data
                setPathData("M 0 50 L 100 50");
                return;
            }

            // Normalise
            const points = result.map((r, i) => {
                const x = (i / (result.length - 1)) * 100;
                const score = r.avg_score || 50;
                const y = 100 - score;
                return { x, y };
            });

            // Smooth Path
            const d = points.reduce((acc, point, i, a) => {
                if (i === 0) return `M ${point.x},${point.y}`;
                const prev = a[i - 1];
                const cp1x = prev.x + (point.x - prev.x) * 0.5;
                const cp1y = prev.y;
                const cp2x = prev.x + (point.x - prev.x) * 0.5;
                const cp2y = point.y;
                return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
            }, "");

            setPathData(d);

        } catch (e) {
            console.error("Graph fetch error", e);
            setPathData("M 0 50 L 100 50");
        } finally {
            setLoading(false);
        }
    }, [query, viewMode]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Title Helper
    const getTitle = () => {
        if (viewMode === 'week') return 'Last 7 Days';
        if (viewMode === 'month') return 'Last 30 Days';
        return 'Last Year';
    };

    return (
        <Paper sx={{
            height: '100%',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'surfaceContainer' // Changed to surfaceContainer for consistent Widget bg if needed, or stick to paper
        }}>

            {/* Header with Navigation */}
            <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
                <IconButton size="small" onClick={handlePrevMode}>
                    <motion.div whileTap={{ scale: 0.8 }}><ChevronLeft fontSize="small" /></motion.div>
                </IconButton>
                <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Typography variant="h6" color="primary" sx={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: 1.2 }}>
                        Mental Flow
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                        {getTitle()}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={handleNextMode}>
                    <motion.div whileTap={{ scale: 0.8 }}><ChevronRight fontSize="small" /></motion.div>
                </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, position: 'relative', width: '100%', minHeight: '80px', pb: 1 }}>
                {loading ? (
                    <Skeleton variant="rectangular" width="100%" height="100%" sx={{ opacity: 0.2 }} />
                ) : (
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Guide Lines */}
                        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />

                        {/* Fill Area with Gradient */}
                        <motion.path
                            d={`${pathData} V 100 H 0 Z`}
                            fill="url(#flowGradient)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                        />

                        {/* Stroke Line - Thicker and Smoother + Idle Wave */}
                        <motion.path
                            d={pathData}
                            fill="none"
                            stroke={theme.palette.primary.main}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))"
                            initial={{ pathLength: 0, scaleY: 1 }}
                            animate={{
                                pathLength: 1,
                                scaleY: [1, 1.05, 0.95, 1],
                                y: [0, -2, 2, 0]
                            }}
                            transition={{
                                pathLength: { duration: 1.5, ease: "easeOut" },
                                default: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                            }}
                        />
                    </svg>
                )}
            </Box>
        </Paper>
    );
};

export default FluidMoodGraph;
