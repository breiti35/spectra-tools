require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_MODE = process.env.APP_MODE || 'local'; // 'local' or 'cloud'

// Middleware
app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

// DB Init
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`);
    // Neue Tabelle für gespeicherte Ordner-Pfade
    db.run(`CREATE TABLE IF NOT EXISTS folders (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT UNIQUE, label TEXT)`);
});

// --- HELPER: WINDOWS DRIVES ---
function getWindowsDrives(callback) {
    if (APP_MODE === 'cloud') return callback([]);
    exec('wmic logicaldisk get name', (error, stdout, stderr) => {
        if (error) {
            callback(['C:/', 'D:/']); // Fallback
            return;
        }
        const drives = stdout.split('\r\r\n')
            .filter(value => /[A-Za-z]:/.test(value))
            .map(value => value.trim() + '/');
        callback(drives);
    });
}

// --- API ROUTES ---

// 0. APP INFO
app.get('/api/info', (req, res) => {
    res.json({ mode: APP_MODE });
});

// 0. CONFIG (Settings)
app.get('/api/config/:key', (req, res) => {
    db.get("SELECT value FROM config WHERE key = ?", [req.params.key], (err, row) => {
        if (err || !row) return res.json({ value: null });
        res.json({ value: row.value });
    });
});

app.post('/api/config', (req, res) => {
    const { key, value } = req.body;
    db.run("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", [key, value], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 1. FOLDER BROWSER (Der Dateimanager)
app.post('/api/browse', (req, res) => {
    if (APP_MODE === 'cloud') return res.status(403).json({ error: "Filesystem browsing is disabled in cloud mode." });
    let currentPath = req.body.path;

    // Wenn kein Pfad: Gib Laufwerke zurück (Windows) oder Root (Linux/Mac)
    if (!currentPath) {
        if (process.platform === 'win32') {
            getWindowsDrives((drives) => res.json({ folders: drives, isRoot: true }));
            return;
        } else {
            currentPath = '/';
        }
    }

    try {
        const items = fs.readdirSync(currentPath, { withFileTypes: true });
        const folders = items
            .filter(item => item.isDirectory())
            .map(item => item.name)
            .filter(name => !name.startsWith('$') && !name.startsWith('.')); // Versteckte ausblenden

        res.json({ 
            folders: folders,
            currentPath: path.resolve(currentPath),
            parentPath: path.resolve(currentPath, '..')
        });
    } catch (e) {
        res.status(500).json({ error: "Zugriff verweigert oder Pfad ungültig." });
    }
});

// 2. SAVED FOLDERS (Favoriten)
app.get('/api/folders', (req, res) => {
    db.all("SELECT * FROM folders ORDER BY id DESC", [], (err, rows) => {
        if(err) return res.status(500).json([]);
        res.json(rows);
    });
});

app.post('/api/folders', (req, res) => {
    const { path, label } = req.body;
    db.run("INSERT OR IGNORE INTO folders (path, label) VALUES (?, ?)", [path, label || path], function(err) {
        if(err) return res.status(500).json({error: err.message});
        res.json({ id: this.lastID, path, label });
    });
});

app.delete('/api/folders/:id', (req, res) => {
    db.run("DELETE FROM folders WHERE id = ?", req.params.id, (err) => {
        res.json({ success: true });
    });
});

// 3. IMAGES SCANNER
app.post('/api/local-images', (req, res) => {
    if (APP_MODE === 'cloud') return res.json({ images: [] });
    // Pfad kommt jetzt direkt vom Frontend (aus dem Dropdown)
    const dir = req.body.path; 
    
    if (!dir || !fs.existsSync(dir)) return res.json({ images: [] });
    
    try {
        const files = fs.readdirSync(dir);
        const images = files
            .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
            .map(file => {
                const fullPath = path.join(dir, file);
                try {
                    const stats = fs.statSync(fullPath);
                    return {
                        name: file,
                        fullPath: fullPath,
                        mtime: stats.mtimeMs
                    };
                } catch(e) { return null; }
            })
            .filter(Boolean)
            .sort((a, b) => b.mtime - a.mtime)
            .slice(0, 100);

        res.json({ images });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. IMAGE VIEW
app.get('/api/image-view', (req, res) => {
    if (APP_MODE === 'cloud') return res.status(403).send("Forbidden");
    const imgPath = req.query.path;
    if(!imgPath || !fs.existsSync(imgPath)) return res.status(404).send("Not found");
    res.sendFile(imgPath);
});

// --- GALLERY DBROUTES ---
app.get('/api/gallery', (req, res) => {
    const sql = "SELECT * FROM gallery ORDER BY created_at DESC";
    db.all(sql, [], (err, rows) => {
        if (err) res.status(400).json({ "error": err.message });
        else {
            const items = rows.map(row => ({ ...row, tags: JSON.parse(row.tags||'[]'), settings: JSON.parse(row.settings||'{}') }));
            res.json({ "data": items });
        }
    });
});

app.post('/api/gallery', (req, res) => {
    const { id, prompt, negative_prompt, seed, tags, created_at, settings } = req.body;
    const sql = `INSERT INTO gallery (id, prompt, negative_prompt, seed, tags, created_at, settings) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [id || Date.now().toString(), prompt, negative_prompt || "", seed, JSON.stringify(tags || []), created_at || new Date().toISOString(), JSON.stringify(settings || {})];
    db.run(sql, params, function(err) {
        if (err) res.status(400).json({ "error": err.message });
        else res.json({ "message": "success", "data": req.body, "id": this.lastID });
    });
});

app.delete('/api/gallery/:id', (req, res) => {
    db.run('DELETE FROM gallery WHERE id = ?', req.params.id, function(err) {
        if (err) res.status(400).json({ "error": res.message });
        else res.json({ message: "deleted" });
    });
});

app.delete('/api/gallery', (req, res) => {
    db.run('DELETE FROM gallery', [], function(err) {
        if (err) res.status(400).json({ "error": err.message });
        else res.json({ message: "all deleted" });
    });
});

app.patch('/api/gallery/:id/favorite', (req, res) => {
    const { is_favorite } = req.body;
    db.run('UPDATE gallery SET is_favorite = ? WHERE id = ?', [is_favorite ? 1 : 0, req.params.id], function(err) {
        if (err) res.status(400).json({ "error": err.message });
        else res.json({ success: true });
    });
});

app.get(/.*/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});