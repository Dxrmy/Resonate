-- schema.sql

-- 1. DAILY LOGS (The Core Timeline)
CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,       -- Format: YYYY-MM-DD
    timestamp INTEGER NOT NULL,      -- Unix Timestamp for sorting
    
    -- Analysis
    manual_score INTEGER,            -- User's slider (0-100)
    ai_score INTEGER,                -- AI's calculated score (0-100)
    final_score INTEGER,             -- The score shown on the graph
    summary_text TEXT,               -- AI generated summary of the day
    
    -- Context
    sleep_hours REAL,                -- From Google Fit/Manual
    step_count INTEGER,              -- From Google Fit
    weather_condition TEXT,          -- e.g., "Rainy", "Overcast"
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. JOURNAL ENTRIES (The Raw Data)
CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id INTEGER,                  -- Links to daily_logs
    content TEXT,                    -- The actual text
    content_type TEXT,               -- "text", "voice_transcript", "prompt_answer"
    sentiment_label TEXT,            -- "Positive", "Neutral", "Negative"
    
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(log_id) REFERENCES daily_logs(id) ON DELETE CASCADE
);

-- 3. EMOTIONS (The Plutchik Wheel)
CREATE TABLE IF NOT EXISTS emotion_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id INTEGER,
    entry_id INTEGER,                
    
    emotion_category TEXT,           -- e.g., "Sadness"
    emotion_specific TEXT,           -- e.g., "Loneliness"
    intensity INTEGER,               -- 1-5 scale
    
    FOREIGN KEY(log_id) REFERENCES daily_logs(id) ON DELETE CASCADE
);

-- 4. THE COMPANION (Pet State)
CREATE TABLE IF NOT EXISTS pet_state (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row exists
    name TEXT DEFAULT 'Spirit',
    
    -- Stats
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    current_form TEXT DEFAULT 'egg', -- egg -> hatchling -> evolved
    
    -- Status
    mood_state TEXT DEFAULT 'calm',  -- calm, anxious, sleeping, energetic
    last_interaction DATETIME,
    
    -- Evolution paths
    focus_points INTEGER DEFAULT 0,
    resilience_points INTEGER DEFAULT 0, 
    vitality_points INTEGER DEFAULT 0
);

-- 5. AI SETTINGS & CACHE
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Initialize the Pet if not exists
INSERT OR IGNORE INTO pet_state (id, name, current_form) VALUES (1, 'Companion', 'egg');
