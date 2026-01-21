import { CreateMLCEngine } from "@mlc-ai/web-llm";

let engine;
let currentModelId = null;

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    try {
        if (type === 'LOAD_MODEL') {
            const modelId = payload?.modelId;
            currentModelId = modelId;

            try {
                // Safety net for GPU crash
                engine = await CreateMLCEngine(modelId, {
                    initProgressCallback: (progress) => {
                        self.postMessage({ type: 'progress', data: progress });
                    }
                });
                self.postMessage({ type: 'status', status: 'ready' });
            } catch (error) {
                console.error("Critical GPU Failure:", error);
                self.postMessage({ type: 'error', error: "GPU Incompatible or Driver Crash. Switch to Cloud Mode." });
            }
        }

        if (type === 'DELETE') {
            try {
                if (engine) {
                    await engine.deleteCache();
                    engine = null;
                }
                // Also attempt to delete by ID if engine wasn't instantiated but ID is known?
                // For now, this is sufficient.
                self.postMessage({ type: 'status', status: 'idle' });
            } catch (err) {
                console.error("Delete failed", err);
                self.postMessage({ type: 'error', error: "Failed to delete cache." });
            }
        }

        if (type === 'GENERATE') {
            if (!engine) {
                // Try auto-reload if we have an ID? No, safer to fail.
                throw new Error("Model not loaded");
            }

            // Stream the response
            const chunks = await engine.chat.completions.create({
                messages: payload.messages,
                temperature: 0.7,
                stream: true,
            });

            let fullText = "";
            for await (const chunk of chunks) {
                const content = chunk.choices[0]?.delta?.content || "";
                fullText += content;
                // Send chunk
                self.postMessage({ type: 'chunk', data: content });
            }

            // Send complete signal
            self.postMessage({ type: 'complete', data: fullText });
        }
    } catch (err) {
        self.postMessage({ type: 'error', error: err.message });
    }
};
