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

// 0. WILDCARDS (Neu!)
app.get('/api/wildcards', async (req, res) => {
    const wcPath = path.join(__dirname, 'wildcards');
    try {
        await fs.promises.access(wcPath);
    } catch (e) {
        try {
            await fs.promises.mkdir(wcPath, { recursive: true }); // Ordner erstellen falls nicht da
        } catch (mkdirError) {
            return res.status(500).json({ error: mkdirError.message });
        }
        return res.json({});
    }

    const wildcards = {};
    try {
        const files = await fs.promises.readdir(wcPath);
        await Promise.all(files.map(async (file) => {
            if (file.endsWith('.txt')) {
                const key = file.replace('.txt', ''); // "colors.txt" -> "colors"
                const content = await fs.promises.readFile(path.join(wcPath, file), 'utf-8');
                // Zeilen trennen und leere entfernen
                wildcards[key] = content.split(/\r?\n/).filter(line => line.trim() !== '');
            }
        }));
        res.json(wildcards);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
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
app.post('/api/browse', async (req, res) => {
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
        const items = await fs.promises.readdir(currentPath, { withFileTypes: true });
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
app.post('/api/local-images', async (req, res) => {
    if (APP_MODE === 'cloud') return res.json({ images: [] });
    // Pfad kommt jetzt direkt vom Frontend (aus dem Dropdown)
    const dir = req.body.path; 
    
    if (!dir) return res.json({ images: [] });
    let dirStats;
    try {
        dirStats = await fs.promises.stat(dir);
    } catch (e) {
        return res.json({ images: [] });
    }
    if (!dirStats.isDirectory()) return res.json({ images: [] });
    
    try {
        const files = await fs.promises.readdir(dir);
        const imageFiles = files.filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));
        const images = (await Promise.all(imageFiles.map(async (file) => {
            const fullPath = path.join(dir, file);
            try {
                const stats = await fs.promises.stat(fullPath);
                return {
                    name: file,
                    fullPath: fullPath,
                    mtime: stats.mtimeMs
                };
            } catch(e) { return null; }
        })))
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

// --- COMFYUI MANAGEMENT ---
let comfyProcess = null;
let comfyLogs = [];

function addLog(data) {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
        if (line.trim()) {
            comfyLogs.push(`[${new Date().toLocaleTimeString()}] ${line.trim()}`);
        }
    });
    // Nur die letzten 100 Zeilen behalten
    if (comfyLogs.length > 100) comfyLogs = comfyLogs.slice(-100);
}

// Hilfsfunktion: Prüft ob ein Port offen ist
function isPortOpen(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
        const net = require('net');
        const socket = new net.Socket();
        
        socket.setTimeout(500);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}

app.post('/api/comfy/start', async (req, res) => {
    if (APP_MODE === 'cloud') return res.status(403).json({ error: "Disabled in cloud mode" });
    
    const { path: comfyPath, args } = req.body;
    
    db.get("SELECT value FROM config WHERE key = ?", ['comfyAdmin'], (err, configAdmin) => {
    db.get("SELECT value FROM config WHERE key = ?", ['comfyMethod'], (err, configMethod) => {
        const asAdmin = configAdmin && configAdmin.value === 'true';
        const method = configMethod ? configMethod.value : 'default';

        if (!comfyPath || !fs.existsSync(comfyPath)) {
            return res.status(400).json({ error: "Ungültiger ComfyUI Pfad" });
        }

        let command = "";
        let finalArgs = [];

        if (method === 'nvidia') {
            command = path.join(comfyPath, 'run_nvidia_gpu.bat');
        } else if (method === 'nvidia_fast') {
            command = path.join(comfyPath, 'run_nvidia_gpu_fast_fp16_accumulation.bat');
        } else {
            const isPortable = fs.existsSync(path.join(comfyPath, 'python_embeded'));
            command = isPortable ? path.join(comfyPath, 'python_embeded', 'python.exe') : 'python';
            
            let scriptPath = path.join(comfyPath, 'main.py');
            if (!fs.existsSync(scriptPath)) {
                const subPath = path.join(comfyPath, 'ComfyUI', 'main.py');
                if (fs.existsSync(subPath)) scriptPath = subPath;
            }
            finalArgs.push(scriptPath);
        }

        if (args) finalArgs.push(...args.split(' '));

        try {
            const { exec, spawn } = require('child_process');
            comfyLogs = [`[SYSTEM] Starte ComfyUI (Method: ${method})...`];

            if (asAdmin) {
                // ADMIN MODUS: Externes Fenster (Logs nicht direkt abfangbar)
                const psArgs = finalArgs.map(a => `\\"${a}\\"`).join(',');
                const adminFlag = "-Verb RunAs";
                const startCmd = `powershell -Command "Start-Process -FilePath '${command}' ${finalArgs.length > 0 ? `-ArgumentList ${formattedArgs}` : ''} -WorkingDirectory '${comfyPath}' ${adminFlag}"`;
                
                exec(startCmd, (error) => {
                    if (error) console.error(`ComfyUI Start Fehler: ${error}`);
                });
                comfyProcess = { pid: 'external' };
                comfyLogs.push("[SYSTEM] Gestartet im Admin-Modus. Logs im externen Fenster.");
            } else {
                // NORMALER MODUS: Wir fangen den Output ab!
                comfyProcess = spawn(command, finalArgs, {
                    cwd: comfyPath,
                    shell: true
                });

                comfyProcess.stdout.on('data', (data) => addLog(data));
                comfyProcess.stderr.on('data', (data) => addLog(data));
                
                comfyProcess.on('close', (code) => {
                    comfyLogs.push(`[SYSTEM] Prozess mit Code ${code} beendet.`);
                    comfyProcess = null;
                });
            }

            res.json({ success: true, message: "ComfyUI wird gestartet...", pid: 'active' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
    });
});

app.get('/api/comfy/status', async (req, res) => {
    const isOpen = await isPortOpen(8188);
    if (!isOpen) comfyProcess = null;
    res.json({ running: isOpen });
});

app.get('/api/comfy/logs', (req, res) => {
    res.json({ logs: comfyLogs });
});

app.post('/api/comfy/logs/clear', (req, res) => {
    comfyLogs = [`[SYSTEM] Konsole geleert am ${new Date().toLocaleTimeString()}`];
    res.json({ success: true });
});

app.post('/api/comfy/stop', async (req, res) => {
    const { exec } = require('child_process');
    
    comfyLogs.push("[SYSTEM] Sende Stopp-Befehl...");

    // 1. Versuch: Den Prozess über den Port 8188 finden und killen (Am sichersten unter Windows)
    const killCmd = `powershell -Command "Get-NetTCPConnection -LocalPort 8188 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"`;

    exec(killCmd, (err) => {
        // 2. Versuch: Falls wir noch eine interne PID haben, diese ebenfalls killen
        if (comfyProcess && comfyProcess.pid && comfyProcess.pid !== 'external') {
            exec(`taskkill /pid ${comfyProcess.pid} /T /F`, () => {});
        }

        comfyProcess = null;
        comfyLogs.push("[SYSTEM] ComfyUI wurde beendet.");
        res.json({ success: true });
    });
});

app.post('/api/comfy/models', (req, res) => {
    const { path: comfyPath } = req.body;
    if (!comfyPath) return res.json({ models: [] });

    // Pfad zu den Checkpoints suchen
    const modelPaths = [
        path.join(comfyPath, 'models', 'checkpoints'),
        path.join(comfyPath, 'ComfyUI', 'models', 'checkpoints')
    ];

    let foundPath = modelPaths.find(p => fs.existsSync(p));
    if (!foundPath) return res.json({ models: [], error: "Modell-Ordner nicht gefunden" });

    try {
        const files = fs.readdirSync(foundPath)
            .filter(f => f.endsWith('.safetensors') || f.endsWith('.ckpt'))
            .map(f => ({ name: f, size: (fs.statSync(path.join(foundPath, f)).size / (1024 * 1024 * 1024)).toFixed(2) + ' GB' }));
        res.json({ models: files, path: foundPath });
    } catch (e) {
        res.json({ models: [], error: e.message });
    }
});

app.get(/.*/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});