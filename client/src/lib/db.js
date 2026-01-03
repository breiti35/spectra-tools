// client/src/lib/db.js

export const DB = {
    apiUrl: '/api/gallery',

    async init() {
        try {
            const res = await fetch(this.apiUrl);
            return res.ok;
        } catch(e) { throw e; }
    },

    async getAppInfo() {
        try {
            const res = await fetch('/api/info');
            return await res.json();
        } catch(e) { return { mode: 'local' }; }
    },

    async getWildcards() {
        try {
            const res = await fetch('/api/wildcards');
            return await res.json();
        } catch(e) { return {}; }
    },

    // --- PROMPTS ---
    async addItem(item) {
        const payload = { ...item, created_at: item.date, negative_prompt: item.negative || "" };
        const res = await fetch(this.apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("Fehler beim Speichern");
        return true;
    },

    async getAllItems() {
        try {
            const res = await fetch(this.apiUrl);
            const json = await res.json();
            return json.data.map(entry => ({ 
                id: entry.id, 
                prompt: entry.prompt, 
                seed: entry.seed, 
                tags: entry.tags, 
                date: entry.created_at, 
                isFavorite: entry.is_favorite === 1,
                ...entry.settings 
            }));
        } catch (e) { return []; }
    },

    async deleteItem(id) {
        const res = await fetch(`${this.apiUrl}/${id}`, { method: 'DELETE' });
        return res.ok;
    },

    async deleteAllItems() {
        const res = await fetch(this.apiUrl, { method: 'DELETE' });
        return res.ok;
    },

    async toggleFavorite(id, isFavorite) {
        const res = await fetch(`${this.apiUrl}/${id}/favorite`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_favorite: isFavorite })
        });
        return res.ok;
    },

    // --- CONFIG ---
    async getConfig(key) {
        try {
            const res = await fetch(`/api/config/${key}`);
            const json = await res.json();
            return json.value;
        } catch(e) { return null; }
    },

    async setConfig(key, value) {
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        });
        return true;
    },

    // --- FOLDER MANAGER (Neu) ---
    async getFolders() {
        try {
            const res = await fetch('/api/folders');
            return await res.json();
        } catch(e) { return []; }
    },

    async addFolder(path, label) {
        const res = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, label })
        });
        return await res.json();
    },

    async deleteFolder(id) {
        await fetch(`/api/folders/${id}`, { method: 'DELETE' });
        return true;
    },

    async browsePath(currentPath) {
        const res = await fetch('/api/browse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: currentPath })
        });
        return await res.json();
    },

    async getLocalImages(path) {
        const res = await fetch('/api/local-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        const json = await res.json();
        return json.images || [];
    }
};
