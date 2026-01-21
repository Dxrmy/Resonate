const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Legacy / Generic (Direct SQL)
    run: (sql, params) => ipcRenderer.invoke('db-run', sql, params),
    query: (sql, params) => ipcRenderer.invoke('db-query', sql, params),

    // Specific / Semantic (The new architecture)
    getPetState: () => ipcRenderer.invoke('get-pet-state'),
    addPetXP: (amount) => ipcRenderer.invoke('add-pet-xp', amount),
    createDailyLog: (data) => ipcRenderer.invoke('create-daily-log', data),
    getWeeklyProgress: () => ipcRenderer.invoke('get-weekly-progress'),

    // Phase 3: AI & Tools
    aiGenerate: (data) => ipcRenderer.invoke('ai-generate', data),
    getRegionalResources: () => ipcRenderer.invoke('get-regional-resources'),
    toolQueryCorrelation: (params) => ipcRenderer.invoke('tool-query-correlation', params),
    toolRetrieveContext: (tags) => ipcRenderer.invoke('tool-retrieve-context', tags),
    toolIndexKnowledge: (data) => ipcRenderer.invoke('tool-index-knowledge', data),
    getInsightStats: () => ipcRenderer.invoke('get-insight-stats'),
});
