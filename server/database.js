const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Pfad zur Datenbank-Datei (Konfigurierbar via ENV)
const dbPath = process.env.DB_PATH 
    ? path.resolve(__dirname, process.env.DB_PATH)
    : path.resolve(__dirname, 'pormt.db');

// Verbindung herstellen
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Verbinden zur Datenbank:', err.message);
    } else {
        console.log('Verbunden mit der SQLite-Datenbank.');
    }
});

// Tabellen initialisieren
db.serialize(() => {
    // 1. Tabelle für die Galerie (Prompts, Seeds, Settings)
    db.run(`CREATE TABLE IF NOT EXISTS gallery (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        negative_prompt TEXT,
        seed TEXT,
        tags TEXT,
        created_at TEXT,
        settings TEXT,
        is_favorite INTEGER DEFAULT 0,
        image_path TEXT
    )`);

    // 2. Tabelle für Ordner/Sammlungen (Optional für später)
    db.run(`CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT
    )`);
});

module.exports = db;
