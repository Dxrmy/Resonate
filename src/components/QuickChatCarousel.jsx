import React, { useState } from 'react';
import { Paper, Typography, Box, IconButton, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowForward, ArrowBack, ChatBubbleOutline, Psychology, SelfImprovement, Spa } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CARDS = [
    {
        id: 'cbt',
        title: 'Cognitive Shift',
        icon: <Psychology sx={{ fontSize: 60 }} />,
        color: '#e3f2fd', // Light Blue
        accent: '#1976d2',
        prompt: "I want to start a CBT session. Help me identify and challenge my negative thoughts."
    },
    {
        id: 'stoic',
        title: 'Stoic Reflect',
        icon: <SelfImprovement sx={{ fontSize: 60 }} />,
        color: '#f3e5f5', // Light Purple
        accent: '#7b1fa2',
        prompt: "I want to practice Stoicism. Help me distinguish between what is in my control and what is not."
    },
    {
        id: 'dbt',
        title: 'Mindful Balance',
        icon: <Spa sx={{ fontSize: 60 }} />,
        color: '#e0f2f1', // Light Teal
        accent: '#00796b',
        prompt: "I want to do a DBT check-in. Help me practice mindfulness and emotional regulation."
    }
];

const QuickChatCarousel = () => {
    const [index, setIndex] = useState(0);
    const navigate = useNavigate();

    const nextCard = () => {
        setIndex((prev) => (prev + 1) % CARDS.length);
    };

    const prevCard = () => {
        setIndex((prev) => (prev - 1 + CARDS.length) % CARDS.length);
    };

    const handleStartChat = () => {
        const card = CARDS[index];
        navigate('/chat', { state: { sessionId: card.id } });
    };

    return (
        <Paper
            sx={{
                height: '100%',
                borderRadius: '20px',
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'surfaceContainer',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{
                p: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <IconButton size="small" onClick={prevCard}>
                    <ArrowBack fontSize="small" />
                </IconButton>
                <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Typography variant="h6" color="primary" sx={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: 1.2 }}>
                        Quick Chat
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                        Guided Sessions
                    </Typography>
                </Box>
                <IconButton size="small" onClick={nextCard}>
                    <ArrowForward fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, position: 'relative', width: '100%', overflow: 'hidden' }}>
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            padding: '0 16px 16px 16px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                flexGrow: 1,
                                bgcolor: CARDS[index].color,
                                borderRadius: 4,
                                p: 1.2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-evenly',
                                gap: 0.5,
                                border: `1px solid ${CARDS[index].accent}20`
                            }}
                        >
                            <Box sx={{ color: CARDS[index].accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {CARDS[index].icon}
                            </Box>

                            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1 }}>
                                {CARDS[index].title}
                            </Typography>

                            <Button
                                variant="contained"
                                size="small"
                                disableElevation
                                onClick={handleStartChat}
                                sx={{
                                    bgcolor: CARDS[index].accent,
                                    color: '#fff',
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    px: 2,
                                    '&:hover': { bgcolor: CARDS[index].accent, filter: 'brightness(0.9)' }
                                }}
                            >
                                Start
                            </Button>
                        </Paper>
                    </motion.div>
                </AnimatePresence>
            </Box>
        </Paper>
    );
};

export default QuickChatCarousel;
