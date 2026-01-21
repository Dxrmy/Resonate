const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class DatabaseManager {
    constructor() {
        const userDataPath = app.getPath('userData');
        // Force V2 DB to fix schema mismatch
        const dbPath = path.join(userDataPath, 'resonate_v2.db');

        console.log(`Loading database from: ${dbPath}`);

        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) console.error('Could not open database:', err);
            else {
                console.log('Database connected.');
                this.initSchema();
            }
        });
    }

    // Helper: Promisified Run
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            try {
                this.db.run(sql, params, function (err) {
                    if (err) {
                        console.error(`DB Run Error [${sql}]:`, err);
                        reject(err);
                    } else {
                        // Return object matching better-sqlite3 structure if possible, or just id
                        resolve({ id: this.lastID, changes: this.changes });
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    // Helper: Promisified Query (All)
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            try {
                this.db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error(`DB Query Error [${sql}]:`, err);
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    // Helper: Promisified Get (Single)
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    initSchema() {
        // Hardcoded Schema V2 to match Frontend 'entries' calls
        const schema = `
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT,
                content TEXT,
                sentiment_score INTEGER,
                dominant_emotion TEXT, -- Fixes SQLITE_ERROR
                reasoning TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS moods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                value REAL,
                tags TEXT,
                note_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(note_id) REFERENCES entries(id)
            );

            CREATE TABLE IF NOT EXISTS pet_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                name TEXT DEFAULT 'Spirit',
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                current_form TEXT DEFAULT 'egg',
                mood_state TEXT DEFAULT 'calm',
                last_interaction DATETIME
            );
            
            INSERT OR IGNORE INTO pet_state (id) VALUES (1);

            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT, -- 'cbt', 'dbt', 'general'
                role TEXT, -- 'user', 'assistant', 'system'
                content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Phase 3: FTS5 Knowledge Index
            CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_index USING fts5(
                summary_text, 
                tags,
                source_id UNINDEXED, -- Reference to entries/chat_messages
                source_type UNINDEXED
            );
        `;

        this.db.exec(schema, (err) => {
            if (err) console.error("Schema init failed:", err);
            else console.log("Schema V2 initialized with FTS5.");
        });
    }

    // --- API METHODS ---

    /**
     * Search knowledge via FTS5
     */
    searchKnowledge(queryText) {
        return this.query(`
            SELECT *, rank 
            FROM knowledge_index 
            WHERE knowledge_index MATCH ? 
            ORDER BY rank
        `, [queryText]);
    }

    /**
     * Add to knowledge index
     */
    indexKnowledge(text, tags, sourceId, sourceType) {
        return this.run(`
            INSERT INTO knowledge_index (summary_text, tags, source_id, source_type)
            VALUES (?, ?, ?, ?)
        `, [text, tags, sourceId, sourceType]);
    }

    /**
     * Tool: Query Correlation
     * Compares two metrics (e.g. sleep vs mood)
     */
    async queryCorrelation(metricA, metricB) {
        // This is a simplified statistical query
        // Usually would join specific tables, but for now we look at entries
        return this.query(`
            SELECT 
                sentiment_score as mood,
                reasoning as context,
                created_at
            FROM entries 
            WHERE type = 'checkin'
            ORDER BY created_at DESC 
            LIMIT 30
        `);
    }

    /**
     * Tool: Retrieve Past Context (RAG-lite)
     */
    async retrievePastContext(tagsArray) {
        const tagQueries = tagsArray.map(t => `tags MATCH '${t}'`).join(' OR ');
        return this.query(`
            SELECT summary_text, tags, created_at
            FROM knowledge_index
            WHERE ${tagQueries}
            ORDER BY rank
            LIMIT 5
        `);
    }
    getWeeklyProgress() {
        // Updated to use new 'entries' table
        return this.query(`
      SELECT created_at as date, sentiment_score as final_score 
      FROM entries 
      WHERE type = 'checkin'
      ORDER BY created_at DESC 
      LIMIT 7
    `).then(rows => rows.reverse());
    }

    createDailyLog(data) {
        // This is now mostly handled by the frontend calling 'run' directly,
        // but we keep this as a backend helper if needed.
        return this.run(`
            INSERT INTO entries (type, content, sentiment_score)
            VALUES (?, ?, ?)
        `, ['daily_log', "Quick Log", data.mood]);
    }

    getPetState() {
        return this.get('SELECT * FROM pet_state WHERE id = 1');
    }

    addPetXP(amount) {
        return this.run(`
      UPDATE pet_state 
      SET experience = experience + ? 
      WHERE id = 1
    `, [amount]);
    }

    /**
     * Phase 4: getInsightStats
     * Aggregates mood by DOW and emotion frequency.
     */
    async getInsightStats() {
        const weeklyRhythm = await this.query(`
            SELECT 
                CAST(strftime('%w', created_at) AS INTEGER) as day_index,
                AVG(sentiment_score) as avg_mood
            FROM entries 
            WHERE created_at > date('now', '-7 days') AND sentiment_score IS NOT NULL
            GROUP BY day_index
        `);

        const spectrum = await this.query(`
            SELECT 
                dominant_emotion as name,
                COUNT(*) as value
            FROM entries 
            WHERE created_at > date('now', '-30 days') AND dominant_emotion IS NOT NULL
            GROUP BY dominant_emotion
        `);

        // Context: Mapping day_index (0=Sun) to Names
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const formattedRhythm = dayNames.map((name, i) => {
            const found = weeklyRhythm.find(r => r.day_index === i);
            return { name, score: found ? Math.round(found.avg_mood) : 0 };
        });

        return {
            weeklyRhythm: formattedRhythm,
            spectrum: spectrum.length > 0 ? spectrum : [{ name: 'Unknown', value: 1 }]
        };
    }
}

module.exports = DatabaseManager;
