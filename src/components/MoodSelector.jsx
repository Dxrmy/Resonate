import React, { useState } from 'react';
import {
    Box,
    Chip,
    Typography,
    Stack,
    Button,
    Fade,
    TextField
} from '@mui/material';
import {
    SentimentDissatisfied,
    SentimentVeryDissatisfied,
    SentimentSatisfied,
    SentimentVerySatisfied
} from '@mui/icons-material';

const emotionHierarchy = {
    Joy: {
        color: '#FFD700', // Gold
        icon: <SentimentVerySatisfied />,
        nuances: ['Happy', 'Excited', 'Proud', 'Content', 'Grateful', 'Ecstatic', 'Optimistic']
    },
    Sadness: {
        color: '#1E88E5', // Blue
        icon: <SentimentDissatisfied />,
        nuances: ['Lonely', 'Melancholic', 'Grieving', 'Bored', 'Depressed', 'Disappointed']
    },
    Anger: {
        color: '#D32F2F', // Red
        icon: <SentimentVeryDissatisfied />,
        nuances: ['Frustrated', 'Annoyed', 'Furious', 'Bitter', 'Resentful', 'Irritated']
    },
    Fear: {
        color: '#7B1FA2', // Purple
        icon: <SentimentDissatisfied />, // Reusing/generic
        nuances: ['Anxious', 'Terrified', 'Insecure', 'Overwhelmed', 'Nervous', 'Scared']
    }
};

const defaultContexts = ['Work', 'Relationship', 'Health', 'Finance', 'Weather', 'Family', 'Friends', 'Self'];

const MoodSelector = ({ onSelect }) => {
    const [step, setStep] = useState(1); // 1: Core, 2: Nuance, 3: Context
    const [selection, setSelection] = useState({
        core: null,
        nuance: null,
        context: []
    });
    const [customContext, setCustomContext] = useState('');

    const handleCoreSelect = (core) => {
        setSelection(prev => ({ ...prev, core }));
        setStep(2);
    };

    const handleNuanceSelect = (nuance) => {
        setSelection(prev => ({ ...prev, nuance }));
        setStep(3);
    };

    const handleContextToggle = (ctx) => {
        setSelection(prev => {
            const contexts = prev.context.includes(ctx)
                ? prev.context.filter(c => c !== ctx)
                : [...prev.context, ctx];
            return { ...prev, context: contexts };
        });
    };

    const handleAddCustomContext = () => {
        if (customContext.trim()) {
            handleContextToggle(customContext.trim());
            setCustomContext('');
        }
    };

    const handleFinish = () => {
        // Construct final tag array: [Core, Nuance, ...Contexts]
        const finalTags = [
            selection.core,
            selection.nuance,
            ...selection.context
        ].filter(Boolean);

        // Also pass detailed object if needed, but for now we conform to onSelect(tagArray) or similar
        // The parent expects: onSelect(tags, intensity?)
        // But let's pass a structured object so parent can parse it.
        onSelect({
            tags: finalTags,
            color: emotionHierarchy[selection.core]?.color,
            details: selection
        });

        // Reset
        setStep(1);
        setSelection({ core: null, nuance: null, context: [] });
    };

    return (
        <Box sx={{ width: '100%', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>

            {/* Step 1: Core Emotion */}
            {step === 1 && (
                <Fade in>
                    <Stack spacing={2}>
                        <Typography variant="subtitle2" color="text.secondary">How are you feeling properly?</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {Object.keys(emotionHierarchy).map(key => (
                                <Chip
                                    key={key}
                                    label={key}
                                    icon={emotionHierarchy[key].icon}
                                    onClick={() => handleCoreSelect(key)}
                                    sx={{
                                        bgcolor: `${emotionHierarchy[key].color}20`,
                                        color: emotionHierarchy[key].color,
                                        border: '1px solid transparent',
                                        '&:hover': { border: `1px solid ${emotionHierarchy[key].color}` }
                                    }}
                                />
                            ))}
                        </Stack>
                    </Stack>
                </Fade>
            )}

            {/* Step 2: Nuance */}
            {step === 2 && (
                <Fade in>
                    <Stack spacing={2}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Select a nuance of <span style={{ color: emotionHierarchy[selection.core].color }}>{selection.core}</span>
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {emotionHierarchy[selection.core].nuances.map(nuance => (
                                <Chip
                                    key={nuance}
                                    label={nuance}
                                    onClick={() => handleNuanceSelect(nuance)}
                                    variant="outlined"
                                />
                            ))}
                        </Stack>
                        <Button size="small" onClick={() => setStep(1)}>Back</Button>
                    </Stack>
                </Fade>
            )}

            {/* Step 3: Context */}
            {step === 3 && (
                <Fade in>
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" color="text.secondary">What influenced this?</Typography>
                            <Chip label={`${selection.core} > ${selection.nuance}`} size="small" />
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {defaultContexts.map(ctx => (
                                <Chip
                                    key={ctx}
                                    label={ctx}
                                    onClick={() => handleContextToggle(ctx)}
                                    variant={selection.context.includes(ctx) ? "filled" : "outlined"}
                                    color={selection.context.includes(ctx) ? "primary" : "default"}
                                />
                            ))}
                        </Stack>

                        <Stack direction="row" spacing={1}>
                            <TextField
                                size="small"
                                placeholder="Other context..."
                                value={customContext}
                                onChange={(e) => setCustomContext(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomContext()}
                            />
                            <Button onClick={handleAddCustomContext}>Add</Button>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                            <Button size="small" onClick={() => setStep(2)}>Back</Button>
                            <Button variant="contained" onClick={handleFinish}>Confirm Log</Button>
                        </Stack>
                    </Stack>
                </Fade>
            )}
        </Box>
    );
};

export default MoodSelector;
