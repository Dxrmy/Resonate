import { useState, useCallback } from 'react';

export const useOllama = () => {
    const [status, setStatus] = useState('idle'); // idle, generating, error
    const [response, setResponse] = useState('');
    const [error, setError] = useState(null);

    const generate = useCallback(async (messages, modelName = 'minicpm-v') => {
        setStatus('generating');
        setResponse('');
        setError(null);

        try {
            const res = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelName,
                    messages: messages,
                    stream: true
                })
            });

            if (!res.body) throw new Error("No response body from Ollama");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.message && json.message.content) {
                            const part = json.message.content;
                            fullText += part;
                            setResponse(prev => prev + part);
                        }
                        if (json.done) {
                            setStatus('idle');
                        }
                    } catch (e) {
                        console.warn("Error parsing Ollama chunk", e);
                    }
                }
            }

        } catch (e) {
            console.error("Ollama connection failed:", e);
            setError("Could not connect to Ollama (http://localhost:11434). Is it running?");
            setStatus('error');
        }
    }, []);

    return { generate, response, status, error };
};
