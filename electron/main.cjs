const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const https = require('node:https');
const DatabaseManager = require('./database/DatabaseManager.cjs');

// Safety: Crisis Interceptor Triggers
const CRISIS_TRIGGERS = /(suicid|kill myself|end it all|hurt myself|overdose|die|hopeless|give up)/i;

// Safety: Regional Resource Map
const RESOURCE_MAP = {
    "GB": { "emergency": "999", "helpline": "111", "text": "Text SHOUT to 85258" },
    "US": { "emergency": "911", "helpline": "988", "text": "Text HOME to 741741" },
    "IN": { "emergency": "112", "helpline": "9152987821", "text": "Aasra Support" },
    "International": { "emergency": "Local Police", "helpline": "Check befrienders.org", "text": "Reach out to a trusted friend" }
};

let userCountry = "US"; // Default

// Initialize DB Manager
let dbManager;

// Fetch Location on Startup
function fetchLocation() {
    https.get('https://ipapi.co/json/', (res) => {
        let data = '';
        res.on('data', hunk => data += hunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.country_code) {
                    userCountry = json.country_code;
                    console.log(`Detected Country: ${userCountry}`);
                }
            } catch (e) {
                console.warn("Geo-location fetch failed, using default.");
            }
        });
    }).on('error', () => {
        console.warn("Offline or IP API unreachable.");
    });
}

// Enable WebGPU and SharedArrayBuffer for WebLLM
app.commandLine.appendSwitch('enable-dawn-features', 'allow_unsafe_apis,disable_robustness');
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');

function createWindow() {
    const win = new BrowserWindow({
        title: 'Resonate',
        icon: path.join(__dirname, '../public/vite.svg'),
        width: 1200,
        height: 800,
        backgroundColor: '#121212',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        console.log("🔹 DEVELOPMENT MODE: Loading from Vite Server ->", process.env.VITE_DEV_SERVER_URL);
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
        process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
    } else {
        console.log("🔸 PRODUCTION MODE: Loading from dist/index.html");
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    fetchLocation();

    // 1. Initialize Database
    try {
        dbManager = new DatabaseManager();
        console.log("DatabaseManager initialized.");
    } catch (e) {
        console.error("Failed to init DB Manager:", e);
    }

    // 2. Setup IPC Handlers

    // AI Generate Bridge (The Interceptor)
    ipcMain.handle('ai-generate', async (event, { prompt, context }) => {
        // Step 1: Crisis Scan
        if (CRISIS_TRIGGERS.test(prompt)) {
            console.warn("⚠️ CRISIS DETECTED in AI prompt. Overriding response.");
            return {
                status: 'CRISIS_MODE',
                resources: RESOURCE_MAP[userCountry] || RESOURCE_MAP["International"]
            };
        }

        // Step 2: Protocol Check (JSON Straitjacket)
        // If the prompt requires JSON, we ensure we handle it in the bridge if needed,
        // but for now we let the service call handle the actual fetch.
        // This bridge is primarily for intercepting.
        return { status: 'OK' };
    });

    ipcMain.handle('get-regional-resources', () => {
        return RESOURCE_MAP[userCountry] || RESOURCE_MAP["International"];
    });

    // Tool Handlers for AI
    ipcMain.handle('tool-query-correlation', (e, params) => dbManager.queryCorrelation(params.a, params.b));
    ipcMain.handle('tool-retrieve-context', (e, tags) => dbManager.retrievePastContext(tags));
    ipcMain.handle('tool-index-knowledge', (e, data) => dbManager.indexKnowledge(data.text, data.tags, data.id, data.type));

    // Generic Run/Query
    ipcMain.handle('db-run', async (event, sql, params) => {
        try {
            return dbManager.run(sql, params);
        } catch (err) {
            return { error: err.message };
        }
    });

    ipcMain.handle('db-query', async (event, sql, params) => {
        try {
            return dbManager.query(sql, params);
        } catch (err) {
            return [];
        }
    });

    ipcMain.handle('get-pet-state', () => dbManager.getPetState());
    ipcMain.handle('add-pet-xp', (e, amount) => dbManager.addPetXP(amount));
    ipcMain.handle('create-daily-log', (e, data) => dbManager.createDailyLog(data));
    ipcMain.handle('get-weekly-progress', () => dbManager.getWeeklyProgress());
    ipcMain.handle('get-insight-stats', () => dbManager.getInsightStats());

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
