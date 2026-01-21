import React, { useMemo } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

const emotionColors = {
    Joy: '#FFD700',      // Gold
    Sadness: '#1E88E5',  // Blue
    Anger: '#D32F2F',    // Red
    Fear: '#7B1FA2',     // Purple
    Neutral: '#9E9E9E'   // Grey
};

const MoodHeatmap = ({ entries = [] }) => {
    // ... data memo remains same ...
    const data = useMemo(() => {
        const map = new Map();
        const today = new Date();

        // Initialize last 365 days
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split('T')[0];
            map.set(key, { date: key, count: 0, dominant: null });
        }

        // Populate with entries
        entries.forEach(entry => {
            const dateKey = new Date(entry.created_at).toISOString().split('T')[0];
            if (map.has(dateKey)) {
                const item = map.get(dateKey);
                item.count += 1;

                let emotion = 'Neutral';
                if (entry.dominant_emotion) emotion = entry.dominant_emotion;

                // Simple keyword matching if we don't have structured emotion
                if (['Happy', 'Joy', 'Excited'].some(e => emotion.includes(e))) emotion = 'Joy';
                else if (['Sad', 'Lonely', 'Grief'].some(e => emotion.includes(e))) emotion = 'Sadness';
                else if (['Anger', 'Furious', 'Mad'].some(e => emotion.includes(e))) emotion = 'Anger';
                else if (['Fear', 'Anxious', 'Scared'].some(e => emotion.includes(e))) emotion = 'Fear';

                item.dominant = emotion;
            }
        });

        return Array.from(map.values()).reverse();
    }, [entries]);

    return (
        <Box sx={{ p: 0, bgcolor: 'transparent', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 8, height: 8, bgcolor: emotionColors.Joy, borderRadius: '2px' }} /> Joy</Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 8, height: 8, bgcolor: emotionColors.Sadness, borderRadius: '2px' }} /> Sadness</Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Box sx={{ width: 8, height: 8, bgcolor: emotionColors.Anger, borderRadius: '2px' }} /> Anger</Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', position: 'relative' }}>
                {/* Month Labels (Simplified) */}
                <Typography variant="caption" sx={{ position: 'absolute', top: -20, left: 0 }}>Jan</Typography>
                <Typography variant="caption" sx={{ position: 'absolute', top: -20, left: '25%' }}>Apr</Typography>
                <Typography variant="caption" sx={{ position: 'absolute', top: -20, left: '50%' }}>Jul</Typography>
                <Typography variant="caption" sx={{ position: 'absolute', top: -20, left: '75%' }}>Oct</Typography>

                <Box sx={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gap: '4px' }}>
                    {data.map((day, i) => (
                        <Tooltip key={day.date} title={`${day.date}: ${day.dominant || 'No Data'}`}>
                            <Box
                                sx={{
                                    width: 12,
                                    height: 12,
                                    bgcolor: day.count > 0 ? (emotionColors[getDayDominantColor(day.dominant)] || emotionColors.Neutral) : 'action.disabledBackground',
                                    borderRadius: '3px',
                                    opacity: day.count > 0 ? 1 : 0.3
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

// Helper to map complex emotion strings to core colors
function getDayDominantColor(emotionString) {
    if (!emotionString) return 'Neutral';
    if (emotionString.includes('Joy') || emotionString.includes('Happy')) return 'Joy';
    if (emotionString.includes('Sad') || emotionString.includes('Grief')) return 'Sadness';
    if (emotionString.includes('Anger') || emotionString.includes('Mad')) return 'Anger';
    if (emotionString.includes('Fear') || emotionString.includes('Anxious')) return 'Fear';
    return 'Neutral';
}

export default MoodHeatmap;
