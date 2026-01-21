import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box, Paper, TextField, Typography, Avatar, IconButton,
    List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Divider, Fab, CircularProgress, Chip, useTheme,
    Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import {
    Send,
    Psychology, // CBT
    Spa, // DBT
    SelfImprovement, // Stoic
    ChatBubbleOutline, // General
    MenuOpen,
    DeleteOutline,
    AutoAwesome,
    Warning
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { useDatabase } from '../hooks/useDatabase';
import { generateTherapyResponse } from '../services/ai';
import { useLocalAI } from '../hooks/useLocalAI';

// Session Configurations
const SESSIONS = [
    { id: 'general', name: 'General Chat', icon: <ChatBubbleOutline />, color: '#757575', desc: 'Casual conversation' },
    { id: 'cbt', name: 'CBT Guide', icon: <Psychology />, color: '#1E88E5', desc: 'Challenge negative thoughts' },
    { id: 'dbt', name: 'DBT Coach', icon: <Spa />, color: '#8E24AA', desc: 'Emotional regulation skills' },
    { id: 'stoic', name: 'Stoic Mentor', icon: <SelfImprovement />, color: '#FBC02D', desc: 'Ancient wisdom & perspective' },
];

const CrisisSupportCard = ({ resources }) => (
    <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
            p: 4,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #FF5252 0%, #D32F2F 100%)',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 12px 24px rgba(211, 47, 47, 0.3)'
        }}
    >
        <Warning sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
            Emergency Support
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>
            I hear you're in deep pain right now. I'm an AI, not a doctor.
            Please connect with a human who can help you immediately.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Button
                variant="contained"
                color="inherit"
                sx={{ color: '#D32F2F', borderRadius: 4, py: 1.5, fontWeight: 'bold' }}
                onClick={() => window.open(`tel:${resources?.emergency}`)}
            >
                Call Emergency ({resources?.emergency || '911'})
            </Button>
            <Button
                variant="contained"
                color="inherit"
                sx={{ color: '#D32F2F', borderRadius: 4, py: 1.5, fontWeight: 'bold' }}
                onClick={() => window.open(`tel:${resources?.helpline}`)}
            >
                Call Helpline ({resources?.helpline || '988'})
            </Button>
            {resources?.text && (
                <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {resources.text}
                    </Typography>
                </Box>
            )}
        </Box>
    </Box>
);

const Chat = () => {
    const theme = useTheme();
    const { query, run } = useDatabase();
    const location = useLocation();

    // State
    const [currentSession, setCurrentSession] = useState('general');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Effect to switch session if navigated from Quick Chat
    useEffect(() => {
        if (location.state?.sessionId) {
            setCurrentSession(location.state.sessionId);
            // Clear state so it doesn't reset on every render/update if we were to add deps
            // mostly fine here as logic is simple
        }
    }, [location.state]);

    const bottomRef = useRef(null);

    // Initial Icebreaker Map
    const ICEBREAKERS = {
        general: "Hi there. I'm here to listen. What's on your mind today?",
        cbt: "Hello. I'm your CBT Guide. I can help you examine your thoughts. Is there a situation troubling you?",
        dbt: "Hi. I'm your DBT Coach. I'm here to help you navigate your emotions. How are you feeling right now?",
        stoic: "Greetings. I am here to offer perspective. What difficulty do you face?"
    };

    // Load History
    useEffect(() => {
        loadHistory(currentSession);
    }, [currentSession]);

    // Scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const loadHistory = async (sessionId) => {
        if (!window.electronAPI) return;
        setIsLoading(true);
        try {
            const rows = await query(
                `SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`,
                [sessionId]
            );

            if (rows && rows.length > 0) {
                setMessages(rows);
            } else {
                // No history? Agent speaks first.
                setMessages([{
                    role: 'assistant',
                    content: ICEBREAKERS[sessionId] || ICEBREAKERS.general,
                    created_at: new Date().toISOString()
                }]);
            }
        } catch (e) {
            console.error("Failed to load chat history", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const text = input;
        setInput('');

        // 1. Optimistic User Message
        const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // 2. Persist User Message
            if (window.electronAPI) {
                await run(
                    `INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)`,
                    [currentSession, 'user', text]
                );
            }

            // 3. Generate AI Response
            const aiData = await generateTherapyResponse(currentSession, text);

            // Handle Crisis Mode
            if (aiData.status === 'CRISIS_MODE' || (aiData.response && typeof aiData.response === 'string' && aiData.response.includes('concerned about you'))) {
                const regional = aiData.resources || (window.electronAPI ? await window.electronAPI.getRegionalResources() : null);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: aiData.response || "Emergency Protocol",
                    isCrisis: true,
                    resources: regional
                }]);
                setIsLoading(false);
                return;
            }

            const responseText = aiData.response || aiData;

            // Ensure distinctness
            if (Date.now() - start < 500) await new Promise(r => setTimeout(r, 800));

            // 4. Update UI with AI Message
            const aiMsg = { role: 'assistant', content: responseText, created_at: new Date().toISOString() };
            setMessages(prev => [...prev, aiMsg]);

            // 5. Persist AI Message
            if (window.electronAPI) {
                await run(
                    `INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)`,
                    [currentSession, 'assistant', responseText]
                );
            }

        } catch (e) {
            console.error("Chat Error:", e);
            setMessages(prev => [...prev, { role: 'system', content: "Error: Could not reach the Neural Cloud." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmClearHistory = async () => {
        setDeleteDialogOpen(false);

        // Optimistic update: Clear immediately but keep icebreaker
        setMessages([{
            role: 'assistant',
            content: ICEBREAKERS[currentSession] || ICEBREAKERS.general,
            created_at: new Date().toISOString()
        }]);

        try {
            await run(`DELETE FROM chat_messages WHERE session_id = ?`, [currentSession]);
        } catch (e) {
            console.error("Failed to clear history", e);
        }
    };

    const activeConfig = SESSIONS.find(s => s.id === currentSession);

    return (
        <Box sx={{ display: 'flex', height: '100%', gap: 3 }}>
            {/* Sidebar (Session Selector) */}
            <Paper elevation={0} sx={{ width: 260, borderRadius: '20px', display: { xs: 'none', md: 'flex' }, flexDirection: 'column', bgcolor: 'surfaceContainer' }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold">Sessions</Typography>
                    <Typography variant="caption" color="text.secondary">Choose your guide</Typography>
                </Box>
                <List sx={{ px: 2 }}>
                    {SESSIONS.map((session) => (
                        <ListItemButton
                            key={session.id}
                            selected={currentSession === session.id}
                            onClick={() => setCurrentSession(session.id)}
                            sx={{
                                borderRadius: '16px',
                                mb: 1,
                                bgcolor: currentSession === session.id ? 'action.selected' : 'transparent'
                            }}
                        >
                            <ListItemIcon sx={{ color: session.color, minWidth: 40 }}>
                                {session.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={session.name}
                                secondary={session.id === currentSession ? 'Active' : null}
                                primaryTypographyProps={{ fontWeight: currentSession === session.id ? 700 : 400 }}
                            />
                        </ListItemButton>
                    ))}
                </List>
                <Box sx={{ flexGrow: 1 }} />
                <Divider sx={{ mx: 2, mb: 1 }} />
                <List sx={{ px: 2, pb: 2 }}>
                    <ListItemButton
                        onClick={() => {
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: 'Emergency Protocol Activated',
                                isCrisis: true
                            }]);
                        }}
                        sx={{ borderRadius: '16px', color: 'error.main' }}
                    >
                        <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}><Warning /></ListItemIcon>
                        <ListItemText primary="Emergency" primaryTypographyProps={{ fontWeight: 'bold' }} />
                    </ListItemButton>
                </List>
            </Paper>

            {/* Main Chat Area */}
            <Paper elevation={2} sx={{ flexGrow: 1, borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>

                {/* Chat Header */}
                <Box sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: activeConfig.color + '10' // Slight tint
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: activeConfig.color, color: 'white' }}>
                            {activeConfig.icon}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">{activeConfig.name}</Typography>
                            <Typography variant="caption">{activeConfig.desc}</Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={() => setDeleteDialogOpen(true)} title="Clear Conversation">
                        <DeleteOutline />
                    </IconButton>
                </Box>

                {/* Messages List */}
                <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {messages.length === 0 && (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, flexDirection: 'column' }}>
                            <AutoAwesome sx={{ fontSize: 60, mb: 2, color: 'text.disabled' }} />
                            <Typography>Start a conversation with {activeConfig.name}</Typography>
                        </Box>
                    )}

                    {messages.map((msg, index) => (
                        <Box
                            key={index}
                            sx={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                width: msg.isCrisis ? '100%' : 'auto'
                            }}
                        >
                            {msg.isCrisis ? (
                                <CrisisSupportCard resources={msg.resources} />
                            ) : (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: '20px',
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.container',
                                        color: msg.role === 'user' ? 'white' : 'text.primary',
                                        borderBottomRightRadius: msg.role === 'user' ? 4 : 20,
                                        borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 20,
                                    }}
                                >
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{msg.content}</Typography>
                                </Paper>
                            )}
                        </Box>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <Box sx={{ alignSelf: 'flex-start' }}>
                            <Paper elevation={0} sx={{ p: 2, borderRadius: '20px', bgcolor: 'secondary.container' }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>
                                        <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />
                                    </motion.div>
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}>
                                        <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />
                                    </motion.div>
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}>
                                        <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />
                                    </motion.div>
                                </Box>
                            </Paper>
                        </Box>
                    )}
                    <div ref={bottomRef} />
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            placeholder={`Message ${activeConfig.name}...`}
                            variant="outlined"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: '20px' }
                            }}
                        />
                        <Fab
                            color="primary"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            sx={{ boxShadow: 'none' }}
                        >
                            <Send />
                        </Fab>
                    </Box>
                </Box>
            </Paper>

            {/* Delete Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
            >
                <DialogTitle>Clear Conversation?</DialogTitle>
                <DialogContent>
                    <Typography>
                        This will delete all messages in this session. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 4 }}>Cancel</Button>
                    <Button onClick={confirmClearHistory} color="error" variant="contained" sx={{ borderRadius: 4 }}>
                        Clear History
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Chat;
