import React, { useState } from 'react';
import {
    Dialog, DialogContent, Box, Typography, Slider, Button,
    TextField, Stack, CircularProgress, Card, CardContent
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { AutoAwesome, BatteryChargingFull, CheckCircle } from '@mui/icons-material';
import MoodSelector from './MoodSelector';
import SpiritConstruct from './SpiritConstruct';
import { IntegrationService } from '../services/integrationService';
import { generateCorrelationInsight } from '../services/ai';
import { useDatabase } from '../hooks/useDatabase';

const CheckInWizard = ({ open, onClose, onComplete }) => {
    const { run } = useDatabase();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data Collection
    const [energy, setEnergy] = useState(50);
    const [moodData, setMoodData] = useState(null); // { tags: [], color: ... }
    const [note, setNote] = useState('');

    // Result
    const [insight, setInsight] = useState(null);

    const handleFinish = async () => {
        setStep(4); // Processing/Result view
        setLoading(true);

        // 1. Persist Data
        // Log Entry
        const entryRes = await run(
            'INSERT INTO entries (type, content, sentiment_score) VALUES (?, ?, ?)',
            ['checkin', note, null] // AI will score it later or we can do it here
        );

        // Log Mood
        if (moodData && entryRes) {
            await run(
                'INSERT INTO moods (value, tags, note_id) VALUES (?, ?, ?)',
                [energy / 10, JSON.stringify(moodData.tags), entryRes.id]
            );
        }

        // 2. Fetch Context (Simulated)
        const calendarEvents = await IntegrationService.getTodayEvents();
        const healthStats = await IntegrationService.getTodayHealth();

        // 3. AI Correlation Analysis
        try {
            const result = await generateCorrelationInsight({
                note,
                energy,
                moodTags: moodData?.tags || [],
                calendar: calendarEvents,
                health: healthStats
            });
            setInsight(result);
            if (onComplete) onComplete(result);
        } catch (e) {
            console.error(e);
            setInsight("You are doing your best, and that is enough.");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: // Energy
                // Dynamic State Mapping based on energy
                let energyState = 'idle';
                if (energy < 20) energyState = 'neglected';
                else if (energy < 40) energyState = 'sadness';
                else if (energy < 60) energyState = 'idle';
                else if (energy < 80) energyState = 'happy';
                else energyState = 'thriving';

                const gradientColor = `linear-gradient(90deg, #ef5350 0%, #ffca28 ${energy}%, #66bb6a 100%)`;

                return (
                    <Box sx={{ textAlign: 'center', py: 4, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Box
                            sx={{
                                width: 200,
                                height: 200,
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Box sx={{ transform: 'scale(1.2)' }}>
                                <SpiritConstruct state={energyState} />
                            </Box>
                        </Box>

                        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>How is your energy?</Typography>
                        <Slider
                            value={energy}
                            onChange={(_, v) => setEnergy(v)}
                            valueLabelDisplay="auto"
                            sx={{
                                mt: 4,
                                width: '80%',
                                '& .MuiSlider-rail': { opacity: 0.5, backgroundColor: '#bfbfbf' },
                                '& .MuiSlider-track': { border: 'none', background: gradientColor },
                                '& .MuiSlider-thumb': { boxShadow: '0 0 10px rgba(0,0,0,0.2)' }
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            {energy < 30 ? "Depleted" : energy > 70 ? "Charged" : "Balanced"}
                        </Typography>
                        <Button variant="contained" onClick={() => setStep(2)} sx={{ mt: 4 }}>Next</Button>
                    </Box>
                );
            // ... (Lines 87-130 Omitted / Unchanged) ...
            case 4: // Result
                return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        {loading ? (
                            <Stack alignItems="center" spacing={2}>
                                <CircularProgress />
                                <Typography>Connecting dots...</Typography>
                            </Stack>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
                                <Typography variant="h5" gutterBottom>Check-in Complete</Typography>

                                <Card sx={{ mt: 2, bgcolor: 'primary.container', color: 'onPrimary.container' }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" sx={{ opacity: 0.8, textTransform: 'uppercase' }}>
                                            Insight Generated
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
                                            "{insight || "Resonate with your inner self. You are doing well."}"
                                        </Typography>
                                    </CardContent>
                                </Card>

                                <Button variant="outlined" sx={{ mt: 3 }} onClick={onClose}>
                                    Close
                                </Button>
                            </motion.div>
                        )}
                    </Box>
                );
            default: return null;
        }
    };

    return (
        <Dialog open={open} onClose={loading ? null : onClose} fullWidth maxWidth="sm">
            <DialogContent>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};

export default CheckInWizard;
