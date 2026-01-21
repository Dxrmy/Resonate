import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    Stack,
    CircularProgress,
    Avatar,
    Chip,
    Fab
} from '@mui/material';
import { Send, Psychology, Spa, SelfImprovement, Memory } from '@mui/icons-material';
import { generateTherapyResponse } from '../services/ai';
import { useLocalAI } from '../hooks/useLocalAI';
import { motion, AnimatePresence } from 'framer-motion';

const MODES = {
    cbt: { name: 'CBT Practitioner', color: 'primary.main', icon: <Psychology /> },
    dbt: { name: 'DBT Coach', color: 'purple', icon: <Spa /> },
    stoic: { name: 'Stoic Mentor', color: 'warning.main', icon: <SelfImprovement /> }
};

const ChatSession = ({ mode = 'cbt' }) => {
    // Mode fallback
    const currentMode = MODES[mode] ? mode : 'cbt';
    const modeConfig = MODES[currentMode];

    const [messages, setMessages] = useState([
        { role: 'system', content: `Session started in ${modeConfig.name} mode.` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef(null);

    // Local AI Hook
    const { generate: generateLocal, response: localResponse, status: localStatus, loadModel } = useLocalAI();
    const isLocalMode = !!localStorage.getItem('preferred_model');

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, localResponse]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        if (isLocalMode) {
            // Local AI Logic
            // Construct a simple history string or array for the worker
            const history = messages.filter(m => m.role !== 'system').concat(userMsg);

            // Add system instruction based on mode
            const systemPrompt = { role: 'system', content: `You are a ${currentMode} therapist. Keep it short.` };

            generateLocal([systemPrompt, ...history]);
        } else {
            // Cloud AI Logic
            try {
                const aiData = await generateTherapyResponse(currentMode, input);
                const responseText = aiData.response || aiData;
                const aiMsg = { role: 'assistant', content: responseText };
                setMessages(prev => [...prev, aiMsg]);
            } catch (error) {
                setMessages(prev => [...prev, { role: 'system', content: "Error connecting to AI." }]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Effect to handle Local AI streaming updates
    useEffect(() => {
        if (localStatus === 'generating') {
            setIsLoading(true);
        } else if (localStatus === 'ready' && localResponse) {
            // Finished generating
            setIsLoading(false);
            // Ensure we update or append the final message
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last.role === 'assistant' && last.isStreaming) {
                    // If we were tracking streaming state in message objects, we'd replace.
                    // Here we just append. To avoid duplicates if 'ready' fires multiple times, handle carefully.
                    // Ideally we just replace the last assistant message if it exists, or append.
                    return [...prev.slice(0, -1), { role: 'assistant', content: localResponse }];
                }
                // Simple append for now
                return [...prev, { role: 'assistant', content: localResponse }];
            });
        }
    }, [localStatus, localResponse]);

    // Live streaming view
    const currentStream = (isLocalMode && localStatus === 'generating') ? localResponse : null;

    return (
        <Paper elevation={3} sx={{ height: '600px', display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{ p: 2, bgcolor: modeConfig.color, color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'white', color: modeConfig.color }}>
                    {modeConfig.icon}
                </Avatar>
                <Box>
                    <Typography variant="h6">{modeConfig.name}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {isLocalMode ? <Chip icon={<Memory sx={{ color: 'inherit !important' }} />} label="Local Cortex" size="small" sx={{ color: 'white', borderColor: 'white', height: 20 }} variant="outlined" /> : "Cloud Connected"}
                    </Typography>
                </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', bgcolor: 'background.default' }}>
                <Stack spacing={2}>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                        >
                            <Paper sx={{
                                p: 2,
                                maxWidth: '80%',
                                borderRadius: 4,
                                bgcolor: msg.role === 'user' ? 'primary.main' : 'surfaceContainer',
                                color: msg.role === 'user' ? 'white' : 'text.primary',
                                borderTopLeftRadius: msg.role === 'assistant' ? 0 : 4,
                                borderTopRightRadius: msg.role === 'user' ? 0 : 4
                            }}>
                                <Typography variant="body1">{msg.content}</Typography>
                            </Paper>
                        </motion.div>
                    ))}

                    {/* Stream Placeholder */}
                    {currentStream && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Paper sx={{ p: 2, maxWidth: '80%', borderRadius: 4, bgcolor: 'surfaceContainer', borderTopLeftRadius: 0 }}>
                                <Typography variant="body1">{currentStream}<span className="cursor">|</span></Typography>
                            </Paper>
                        </motion.div>
                    )}

                    {isLoading && !currentStream && (
                        <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="caption">Resonate is processing...</Typography>
                        </Box>
                    )}
                    <div ref={bottomRef} />
                </Stack>
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, bgcolor: 'surfaceContainer' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        placeholder="Type your thoughts..."
                        variant="outlined"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                        size="small"
                        sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                    />
                    <Fab color="primary" onClick={handleSend} disabled={isLoading || !input.trim()} size="medium">
                        <Send />
                    </Fab>
                </Box>
            </Box>
        </Paper>
    );
};

export default ChatSession;
