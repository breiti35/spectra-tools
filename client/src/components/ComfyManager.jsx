import React, { useState, useEffect, useCallback } from 'react';
import { DB } from '../lib/db';

export default function ComfyManager({ comfyPath, t }) {
    const [status, setStatus] = useState('offline'); // offline, starting, running
    const [models, setModels] = useState([]);
    const [logs, setLogs] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const logContainerRef = React.useRef(null);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/comfy/status');
            const data = await res.json();
            setStatus(data.running ? 'running' : 'offline');
        } catch {
            setStatus('offline');
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            const res = await fetch('/api/comfy/logs');
            const data = await res.json();
            setLogs(data.logs || []);
        } catch { /* ignore */ }
    }, []);

    const loadModels = useCallback(async () => {
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
        } catch {
            console.error("Modelle konnten nicht geladen werden");
        } finally {
            setIsLoadingModels(false);
        }
    }, [comfyPath]);

    useEffect(() => {
        checkStatus();
        loadModels();
        fetchLogs();

        const interval = setInterval(() => {
            checkStatus();
            fetchLogs();
        }, 3000);
        return () => clearInterval(interval);
    }, [checkStatus, fetchLogs, loadModels]);

    useEffect(() => {
        // Korrigierter Auto-Scroll: Nur den Container scrollen
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

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
        } catch {
            alert("Serverfehler beim Starten");
            setStatus('offline');
        }
    };

    const handleStop = async () => {
        if(!confirm(t.stopComfy + "?")) return;
        try {
            await fetch('/api/comfy/stop', { method: 'POST' });
            setTimeout(checkStatus, 1000);
        } catch { /* ignore */ }
    };

    const handleClearLogs = async () => {
        try {
            await fetch('/api/comfy/logs/clear', { method: 'POST' });
            // Sofortige Abfrage nach dem Löschen, um den Buffer-Status vom Server zu holen
            await fetchLogs();
        } catch { /* ignore */ }
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
                    
                    <div className="flex gap-3">
                        {status === 'offline' ? (
                            <button 
                                onClick={handleStart}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                            >
                                {t.startComfy}
                            </button>
                        ) : (
                            <button 
                                onClick={handleStop}
                                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center gap-2"
                            >
                                <span>⏹️</span> {t.stopComfy}
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-zinc-700/50">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t.comfyPath}</div>
                    <div className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900 px-4 py-2 rounded-lg border border-gray-100 dark:border-zinc-800 break-all">
                        {comfyPath}
                    </div>
                </div>
            </div>

            {/* CONSOLE / LOGS */}
            <div className="bg-gray-50 dark:bg-zinc-950 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[400px] transition-colors">
                <div className="bg-gray-100 dark:bg-zinc-900 px-6 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400/40 dark:bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400/40 dark:bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400/40 dark:bg-green-500/50"></div>
                        </div>
                        <span className="ml-4 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">System Console</span>
                    </div>
                    <button onClick={handleClearLogs} className="text-[10px] font-bold text-gray-400 hover:text-blue-500 dark:text-zinc-600 dark:hover:text-zinc-400 uppercase tracking-tighter transition-colors">Clear</button>
                </div>
                <div 
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed space-y-1 custom-scrollbar-console"
                >
                    {logs.length === 0 && <div className="text-gray-400 dark:text-zinc-700 italic">No logs available...</div>}
                    {logs.map((log, i) => (
                        <div key={i} className="text-gray-700 dark:text-zinc-300">
                            <span className="text-gray-400 dark:text-zinc-600 mr-2 opacity-50">{log.substring(0, 10)}</span>
                            <span className={log.includes('[SYSTEM]') ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>
                                {log.substring(10)}
                            </span>
                        </div>
                    ))}
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