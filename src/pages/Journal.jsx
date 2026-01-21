import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    TextField,
    Button,
    Card,
    CardContent,
    Stack,
    Chip,
    IconButton,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { useDatabase } from '../hooks/useDatabase';
import { analyzeSentiment } from '../services/ai';
import MoodSelector from '../components/MoodSelector';
import { useLocalAI } from '../hooks/useLocalAI';

const Journal = () => {
    const { run, query } = useDatabase();
    const [entries, setEntries] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [mood, setMood] = useState(null);
    const [crisisDialogOpen, setCrisisDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Local AI
    const { generate: generateLocal, response: localResponse, status: localStatus } = useLocalAI();
    const [pendingEntryId, setPendingEntryId] = useState(null);

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        if (!window.electronAPI) return;
        try {
            const result = await query('SELECT * FROM entries ORDER BY created_at DESC');
            setEntries(result);
        } catch (e) { console.error(e); }
    };

    const updateEntryWithAnalysis = async (id, result) => {
        if (!id) return;

        // Fix: Clamp score to 0-100 to prevent negative values
        let safeScore = result.score;
        if (typeof safeScore === 'number') {
            safeScore = Math.max(0, Math.min(100, safeScore));
        }

        await run(
            'UPDATE entries SET sentiment_score = ?, dominant_emotion = ?, reasoning = ? WHERE id = ?',
            [safeScore, result.dominant_emotion, result.reasoning, id]
        );
        if (safeScore !== null && safeScore < 30) setCrisisDialogOpen(true);
        fetchEntries();
    };

    // Effect for Local AI Result (omitted for brevity, unchanged logic except calling update func)
    useEffect(() => {
        if (localStatus === 'ready' && pendingEntryId && localResponse) {
            try {
                const jsonMatch = localResponse.match(/\{[\s\S]*\}/);
                const jsonString = jsonMatch ? jsonMatch[0] : localResponse;
                const result = JSON.parse(jsonString);
                updateEntryWithAnalysis(pendingEntryId, result);
            } catch (e) {
                console.warn("Local AI JSON Error", e);
                updateEntryWithAnalysis(pendingEntryId, { score: 50, dominant_emotion: "Unknown", reasoning: "Analysis unclear." });
            } finally {
                setPendingEntryId(null);
            }
        }
    }, [localStatus, localResponse, pendingEntryId]);

    const handleSave = async () => {
        // Fix: Allow save if mood is present OR text is present
        if (!newNote.trim() && !mood) return;

        setIsSaving(true);
        try {
            const noteContent = newNote.trim() || (mood ? `Mood Log: ${mood.tags.join(', ')}` : "Quick Entry");
            const currentMood = mood;

            // 1. Immediate Save (Sentiment NULL)
            const result = await run(
                'INSERT INTO entries (type, content, sentiment_score) VALUES (?, ?, ?)',
                ['note', noteContent, null]
            );

            if (result && result.id) {
                const entryId = result.id;

                // Save Mood 
                if (currentMood) {
                    const tagsToSave = currentMood.tags ? currentMood.tags : [currentMood];
                    const valueToSave = 5;
                    await run(
                        'INSERT INTO moods (value, tags, note_id) VALUES (?, ?, ?)',
                        [valueToSave, JSON.stringify(tagsToSave), entryId]
                    );
                }

                // UI Feedback
                setNewNote('');
                setMood(null);
                fetchEntries();

                // 2. AI Analysis Logic 
                // Skip AI if it's just a mood log with no text content to analyze? 
                // No, we still want a score for the "Mood Log: ..." text.
                const isLocal = !!localStorage.getItem('preferred_model');

                if (isLocal) {
                    setPendingEntryId(entryId);
                    generateLocal([
                        { role: 'system', content: "Output ONLY JSON." },
                        { role: 'user', content: `Analyze: "${noteContent}". Return JSON: { "score": 0-100, "dominant_emotion": "OneWord", "reasoning": "Max 10 words" }` }
                    ]);
                } else {
                    analyzeSentiment(noteContent).then(async (result) => {
                        await updateEntryWithAnalysis(entryId, result);
                    }).catch(async (err) => {
                        console.error("AI Analysis failed", err);
                        // Fix: Always clear "Analyzing..." state by saving a fallback
                        await updateEntryWithAnalysis(entryId, { score: 50, dominant_emotion: "Neutral", reasoning: "Analysis unavailable." });
                    });
                }
            }
        } catch (err) {
            console.error("Failed to save entry:", err);
        } finally {
            setIsSaving(false);
        }
    };


    const handleDelete = async (id) => {
        await run('DELETE FROM entries WHERE id = ?', [id]);
        fetchEntries();
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="headlineMedium" gutterBottom color="primary">
                Journal
            </Typography>

            {/* Input Section */}
            <Card sx={{ mb: 4, bgcolor: 'surfaceContainer' }} elevation={0}>
                <CardContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        placeholder="What's on your mind?"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    {/* New Mood Selector */}
                    <Box sx={{ mb: 2 }}>
                        <MoodSelector onSelect={(data) => setMood(data)} />
                    </Box>

                    <Stack direction="row" justifyContent="flex-end" alignItems="center">
                        <Button
                            variant="contained"
                            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={(!newNote.trim() && !mood) || isSaving}
                        >
                            {isSaving ? "Logging..." : "Log Entry"}
                        </Button>
                    </Stack>

                    {/* Display selected mood preview if any */}
                    {mood && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {mood.tags.map(t => (
                                <Chip key={t} label={t} size="small" />
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>

            <Divider sx={{ mb: 4 }}>
                <Typography variant="caption" color="text.secondary">HISTORY</Typography>
            </Divider>

            {/* Entry List */}
            <Stack spacing={2}>
                {entries.map((entry) => (
                    <Card key={entry.id} sx={{ bgcolor: 'surface' }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{entry.content}</Typography>
                                <IconButton size="small" onClick={() => handleDelete(entry.id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {new Date(entry.created_at).toLocaleString()}
                                {entry.sentiment_score !== null ? (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            Wellness Score: {entry.sentiment_score} / 100 • {entry.dominant_emotion}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                            "{entry.reasoning}"
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.7 }}>Analyzing...</Typography>
                                )}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            {/* Crisis Intervention Dialog */}
            <Dialog
                open={crisisDialogOpen}
                onClose={() => setCrisisDialogOpen(false)}
                PaperProps={{ sx: { bgcolor: 'error.container', color: 'onSurface' } }}
            >
                <DialogTitle>It sounds like you're going through a tough moment.</DialogTitle>
                <DialogContent>
                    <Typography>
                        Your wellness score is low. Would you like to try some DBT grounding techniques to help stabilize?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCrisisDialogOpen(false)}>No, I'm okay</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            setCrisisDialogOpen(false);
                            window.location.hash = "#/tools";
                        }}
                    >
                        Start DBT Session
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default Journal;
