const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(app.getPath('userData'), 'resonate.db');
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, async (err) => {
                if (err) {
                    console.error('Could not connect to database', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database at', this.dbPath);
                    await this.createSchemas();
                    await this.runMigrations(); // Run migrations after schema creation
                    resolve();
                }
            });
        });
    }

    createSchemas() {
        // Base schemas
        const schemas = [
            `CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        content TEXT,
        sentiment_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS moods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value INTEGER,
        tags TEXT,
        note_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(note_id) REFERENCES entries(id)
      )`
        ];

        return new Promise((resolve) => {
            this.db.serialize(() => {
                schemas.forEach(schema => {
                    this.db.run(schema, (err) => {
                        if (err) console.error('Error creating schema:', err);
                    });
                });
                resolve();
            });
        });
    }

    // Simple migration runner to add columns if they don't exist
    runMigrations() {
        return new Promise((resolve) => {
            const migrations = [
                "ALTER TABLE entries ADD COLUMN dominant_emotion TEXT",
                "ALTER TABLE entries ADD COLUMN reasoning TEXT"
            ];

            this.db.serialize(() => {
                let completed = 0;
                migrations.forEach(migration => {
                    this.db.run(migration, (err) => {
                        // Ignore error if column already exists
                        if (err && !err.message.includes("duplicate column")) {
                            console.log("Migration info (might be existing col):", err.message);
                        }
                        completed++;
                        if (completed === migrations.length) resolve();
                    });
                });
                // Fallback resolve if loop finishes instantly
                if (migrations.length === 0) resolve();
            });
        });
    }

    // Generic query wrapper for IPC
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = new DatabaseManager();
