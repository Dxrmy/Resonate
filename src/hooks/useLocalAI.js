import { useState, useEffect, useRef, useCallback } from 'react';

// GLOBAL SINGLETON WORKER
// Created only once when the module is loaded.
let globalWorker = null;
const listeners = new Set(); // To broadcast state to all hook users

// Shared State (Simple Store Pattern)
let globalState = {
    status: 'idle',
    progress: null,
    response: '',
    error: null
};

// Function to handle global updates
const updateState = (newState) => {
    globalState = { ...globalState, ...newState };
    listeners.forEach(listener => listener(globalState));
};

// Initialize Singleton
if (!globalWorker) {
    globalWorker = new Worker(new URL('../workers/ai.worker.js', import.meta.url), {
        type: 'module'
    });

    globalWorker.onmessage = (e) => {
        const { type, data, status, error } = e.data;
        // console.log("Worker Msg:", e.data); // Debug

        // Standardize handling based on 'ai.worker.js' format
        if (type === 'progress') {
            updateState({ status: 'loading', progress: data });
        } else if (type === 'status') {
            updateState({ status: status }); // e.g., 'ready', 'idle'
            if (status === 'ready') updateState({ progress: null, error: null });
        } else if (type === 'stream') { // Assuming worker sends 'stream' chunks?
            // Actually, worker uses 'status' mostly. Let's check worker code.
            // If worker sends raw text, we append.
            // Based on previous worker code:
            // self.postMessage({ type: 'stream', data: chunk }); 
        } else if (type === 'error') {
            updateState({ status: 'error', error: error });
        }

        // Handle explicit stream if added
        if (e.data.message) { // some examples use 'message'
            // ...
        }

        // The previous worker implementation (step 765) sends:
        // type: 'progress', data: ...
        // type: 'status', status: 'ready' / 'idle'
        // type: 'error', error: ...
        // type: 'result', data: output (full text completion?)

        // Let's support the stream if we implemented efficient streaming in worker
        if (type === 'chunk') {
            updateState({ status: 'generating', response: globalState.response + data });
        }

        if (type === 'complete') {
            updateState({ status: 'ready', response: data }); // Set full response
        }
    };
}

export const useLocalAI = () => {
    const [state, setState] = useState(globalState);

    useEffect(() => {
        // Subscribe
        listeners.add(setState);
        return () => listeners.delete(setState);
    }, []);

    const loadModel = useCallback((modelId) => {
        if (globalWorker) {
            updateState({ status: 'loading', error: null });
            globalWorker.postMessage({ type: 'LOAD_MODEL', payload: { modelId } });
        }
    }, []);

    const generate = useCallback((messages) => {
        if (globalWorker) {
            updateState({ status: 'generating', response: '', error: null });
            globalWorker.postMessage({ type: 'GENERATE', payload: { messages } });
        }
    }, []);

    const deleteModel = useCallback(() => {
        if (globalWorker) {
            globalWorker.postMessage({ type: 'DELETE' });
            updateState({ status: 'idle', response: '', error: null });
        }
    }, []);

    return { ...state, loadModel, generate, deleteModel };
};
