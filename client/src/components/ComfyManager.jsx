import React, { useState, useEffect } from 'react';
import { DB } from '../lib/db';

export default function ComfyManager({ comfyPath, t }) {
    const [status, setStatus] = useState('offline'); // offline, starting, running
    const [models, setModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    useEffect(() => {
        checkStatus();
        loadModels();
        
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/comfy/status');
            const data = await res.json();
            setStatus(data.running ? 'running' : 'offline');
        } catch (e) {
            setStatus('offline');
        }
    };

    const loadModels = async () => {
        if (!comfyPath) return;
        setIsLoadingModels(true);
        try {
            const res = await fetch('/api/comfy/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: comfyPath })
            });
            const data = await res.json();
            setModels(data.models || []);
        } catch (e) {
            console.error("Modelle konnten nicht geladen werden");
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleStart = async () => {
        setStatus('starting');
        const args = await DB.getConfig('comfyArgs');
        try {
            const res = await fetch('/api/comfy/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: comfyPath, args })
            });
            const data = await res.json();
            if (data.success) {
                setTimeout(checkStatus, 2000);
            } else {
                alert(data.error || "Start fehlgeschlagen");
                setStatus('offline');
            }
        } catch (e) {
            alert("Serverfehler beim Starten");
            setStatus('offline');
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-all ${
                            status === 'running' ? 'bg-green-500 text-white' : 
                            status === 'starting' ? 'bg-yellow-500 text-white animate-pulse' : 
                            'bg-gray-200 dark:bg-zinc-700 text-gray-400'
                        }`}>
                            {status === 'running' ? '🚀' : status === 'starting' ? '⏳' : '💤'}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">ComfyUI Control</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
                                    {status === 'running' ? t.comfyRunning : status === 'starting' ? 'Starting...' : t.comfyOffline}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleStart}
                        disabled={status !== 'offline'}
                        className={`px-8 py-3 rounded-xl font-bold transition-all shadow-xl ${
                            status === 'offline' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95' 
                            : 'bg-gray-100 dark:bg-zinc-700 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {t.startComfy}
                    </button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-zinc-700/50">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t.comfyPath}</div>
                    <div className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900 px-4 py-2 rounded-lg border border-gray-100 dark:border-zinc-800 break-all">
                        {comfyPath}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="text-2xl">🧠</span> {t.comfyModels}
                    </h3>
                    <button 
                        onClick={loadModels}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors text-gray-400"
                        title="Neu laden"
                    >
                        🔄
                    </button>
                </div>

                {isLoadingModels ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {models.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 dark:border-zinc-700 rounded-2xl">
                                Keine Modelle gefunden oder Pfad falsch.
                            </div>
                        ) : (
                            models.map((m, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-blue-400/30 transition-all group">
                                    <div className="font-bold text-gray-700 dark:text-gray-200 text-sm truncate" title={m.name}>{m.name}</div>
                                    <div className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-widest">{m.size}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
