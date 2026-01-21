import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Card, CardContent, Button,
    LinearProgress, Chip, Stack, Divider, Alert,
    ToggleButton, ToggleButtonGroup, TextField
} from '@mui/material';
import { CloudDownload, CheckCircle, Memory, DataUsage, SettingsEthernet, Terminal, Brush, Key, Cloud } from '@mui/icons-material';
import { useLocalAI } from '../hooks/useLocalAI';
import { useThemeStore } from '../store/themeStore';

const AVAILABLE_WEB_MODELS = [
    {
        id: "Phi-3-Mini-4k-Instruct-q4f16_1-MLC",
        name: "Resonate Spark (Phi-3)",
        size: "2.3GB - Balanced",
        desc: "Microsoft's efficient 3.8B model. Best balance of reasoning and speed."
    },
    {
        id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
        name: "Resonate Nano (TinyLlama)",
        size: "600MB - Ultra Fast",
        desc: "Extremely lightweight. Good for simple motivation and quick chats."
    }
];

const Settings = () => {
    // Provider Config
    const [provider, setProvider] = useState(localStorage.getItem('ai_provider') || 'webllm'); // 'webllm' or 'ollama'
    const [ollamaModel, setOllamaModel] = useState(localStorage.getItem('ollama_model') || 'minicpm-v');
    const { currentMode, setMode } = useThemeStore();

    // WebLLM Hook
    const { status, progress, loadModel, deleteModel, error: webError } = useLocalAI();
    const [activeWebModel, setActiveWebModel] = useState(localStorage.getItem('preferred_model') || null);

    const handleProviderChange = (event, newProvider) => {
        if (newProvider) {
            setProvider(newProvider);
            localStorage.setItem('ai_provider', newProvider);
        }
    };

    const handleWebLoad = (modelId) => {
        loadModel(modelId);
        setActiveWebModel(modelId); // Optimistic update
        localStorage.setItem('preferred_model', modelId);
    };

    const handleOllamaSave = () => {
        localStorage.setItem('ollama_model', ollamaModel);
        // Could trigger a connection test here
    };

    return (
        <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>Settings</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage your AI Architecture and Privacy.
            </Typography>

            <Card sx={{ bgcolor: 'surfaceContainer', mb: 4 }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
                        <Brush fontSize="large" color="primary" />
                        <Box>
                            <Typography variant="h6">Appearance</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Customize your Resonance interface.
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                        {[
                            { id: 'light', color: '#6200EA' }, // Purple (Default)
                            { id: 'ocean', color: '#00B0FF' }, // Blue
                            { id: 'forest', color: '#2E7D32' }, // Green
                            { id: 'sunset', color: '#D84315' }  // Orange
                        ].map((theme) => (
                            <Box
                                key={theme.id}
                                onClick={() => {
                                    setMode(theme.id);
                                    localStorage.setItem('theme_mode', theme.id);
                                }}
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    bgcolor: theme.color,
                                    cursor: 'pointer',
                                    border: currentMode === theme.id ? '4px solid white' : 'none',
                                    boxShadow: currentMode === theme.id ? '0 0 0 2px #6200EA' : 'none',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.1)' }
                                }}
                            />
                        ))}
                    </Stack>
                </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'surfaceContainer', mb: 4 }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
                        <Memory fontSize="large" color="primary" />
                        <Box>
                            <Typography variant="h6">AI Provider</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Choose the brain that powers Resonate.
                            </Typography>
                        </Box>
                    </Stack>

                    <ToggleButtonGroup
                        value={provider}
                        exclusive
                        onChange={handleProviderChange}
                        fullWidth
                        sx={{ mb: 4 }}
                    >
                        <ToggleButton value="webllm">
                            <Stack direction="row" gap={1} alignItems="center">
                                <CloudDownload fontSize="small" /> Web (Local)
                            </Stack>
                        </ToggleButton>
                        <ToggleButton value="ollama">
                            <Stack direction="row" gap={1} alignItems="center">
                                <Terminal fontSize="small" /> Ollama (Local)
                            </Stack>
                        </ToggleButton>
                        <ToggleButton value="google">
                            <Stack direction="row" gap={1} alignItems="center">
                                <Cloud fontSize="small" /> Gemini (Cloud)
                            </Stack>
                        </ToggleButton>
                        <ToggleButton value="openai">
                            <Stack direction="row" gap={1} alignItems="center">
                                <Cloud fontSize="small" /> OpenAI (Cloud)
                            </Stack>
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Divider sx={{ my: 3 }} />

                    {/* --- WEB LLM SECTION --- */}
                    {provider === 'webllm' && (
                        <Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">Browser-Native Models</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Runs inside the app via WebGPU. convenient, but heavy on VRAM.
                                </Typography>
                            </Box>

                            {status === 'loading' && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" gutterBottom>
                                        {progress?.text || "Initializing..."}
                                    </Typography>
                                    <LinearProgress variant="determinate" value={progress?.progress ? progress.progress * 100 : 0} />
                                </Box>
                            )}

                            {webError && (
                                <Alert severity="error" sx={{ mb: 2 }}>{webError}</Alert>
                            )}

                            <Stack spacing={2}>
                                {AVAILABLE_WEB_MODELS.map(model => (
                                    <Card key={model.id} variant="outlined" sx={{
                                        borderColor: activeWebModel === model.id ? 'primary.main' : 'divider',
                                        bgcolor: activeWebModel === model.id ? 'action.selected' : 'transparent'
                                    }}>
                                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {model.name}
                                                    {activeWebModel === model.id && <Chip label="Active" size="small" color="success" sx={{ ml: 1 }} icon={<CheckCircle />} />}
                                                </Typography>
                                                <Typography variant="body2">{model.desc}</Typography>
                                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                                                    <DataUsage fontSize="inherit" /> {model.size} download
                                                </Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1}>
                                                {activeWebModel === model.id && (
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={() => {
                                                            deleteModel();
                                                            setActiveWebModel(null);
                                                            localStorage.removeItem('preferred_model');
                                                        }}
                                                    >
                                                        Unload
                                                    </Button>
                                                )}
                                                <Button
                                                    variant={activeWebModel === model.id ? "outlined" : "contained"}
                                                    startIcon={activeWebModel === model.id ? <CheckCircle /> : <CloudDownload />}
                                                    onClick={() => handleWebLoad(model.id)}
                                                    disabled={status === 'loading'}
                                                >
                                                    {activeWebModel === model.id ? "Reload" : "Download"}
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* --- OLLAMA SECTION --- */}
                    {provider === 'ollama' && (
                        <Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">Local Host (Ollama)</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Privacy-First. Runs via http://localhost:11434. Ideal for high-end GPUs.
                                </Typography>
                            </Box>

                            <Stack spacing={2} direction="row" alignItems="center">
                                <TextField
                                    label="Model Tag"
                                    placeholder="e.g. minicpm-v, llama3, mistral"
                                    value={ollamaModel}
                                    onChange={(e) => setOllamaModel(e.target.value)}
                                    title="Make sure you have pulled this model in Ollama first"
                                    fullWidth
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleOllamaSave}
                                    sx={{ height: 56 }}
                                    startIcon={<SettingsEthernet />}
                                >
                                    Save
                                </Button>
                            </Stack>

                            <Box sx={{ mt: 2 }}>
                                <OllamaTestButton />
                            </Box>
                        </Box>
                    )}

                    {/* --- CLOUD API SECTION --- */}
                    {(provider === 'google' || provider === 'openai') && (
                        <Box>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight="bold">Cloud AI Configuration</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    High performance, but requires an API Key. Keys are stored safely on your device.
                                </Typography>
                            </Box>

                            <APIKeyInput
                                provider={provider}
                                label={provider === 'google' ? "Gemini API Key" : "OpenAI API Key"}
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'surfaceContainer', mb: 4 }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 3 }}>
                        <Typography variant="h6">User Profile</Typography>
                    </Stack>
                    <TextField
                        label="Your Name"
                        fullWidth
                        placeholder="What should we call you?"
                        defaultValue={localStorage.getItem('user_name') || ''}
                        onBlur={(e) => localStorage.setItem('user_name', e.target.value)}
                        helperText="The AI will use this name to address you."
                    />
                </CardContent>
            </Card>


            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Storage</Typography>
                    <Typography variant="body2">
                        Your journal entries are stored locally.
                    </Typography>
                    <Button color="error" variant="text" sx={{ mt: 2 }}>
                        Clear All Data (Danger)
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};

// Extracted for cleaner state management
const OllamaTestButton = () => {
    const [testStatus, setTestStatus] = useState('idle'); // idle, loading, success, error

    const testConnection = async () => {
        setTestStatus('loading');
        try {
            const res = await fetch('http://localhost:11434/api/tags');
            if (res.ok) setTestStatus('success');
            else setTestStatus('error');
        } catch (e) {
            setTestStatus('error');
        }
    };

    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <Button
                variant="outlined"
                color="info"
                onClick={testConnection}
                disabled={testStatus === 'loading'}
            >
                {testStatus === 'loading' ? 'Testing...' : 'Test Connection'}
            </Button>

            {testStatus === 'success' && (
                <Chip icon={<CheckCircle />} label="Connected to Ollama" color="success" variant="outlined" />
            )}

            {testStatus === 'error' && (
                <Chip label="Connection Failed" color="error" variant="outlined" />
            )}
        </Stack>
    );
};

export default Settings;
