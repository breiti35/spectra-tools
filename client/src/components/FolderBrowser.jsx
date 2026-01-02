import React, { useEffect, useState } from 'react';
import { DB } from '../lib/db';

export default function FolderBrowser({ isOpen, onClose, onSelect, t }) {
    const [currentPath, setCurrentPath] = useState(""); 
    const [items, setItems] = useState([]);
    const [parent, setParent] = useState("");

    useEffect(() => {
        if(isOpen) loadPath("");
    }, [isOpen]);

    const loadPath = async (p) => {
        try {
            const data = await DB.browsePath(p);
            setItems(data.folders || []);
            setCurrentPath(data.currentPath || "");
            setParent(data.parentPath || "");
        } catch(e) { 
            console.error(e);
            alert(t.accessDenied);
        }
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] transition-colors">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200">{t.chooseFolder}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl leading-none">&times;</button>
                </div>
                
                <div className="p-2 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 text-xs font-mono truncate px-4 text-gray-500 dark:text-gray-400">
                    {currentPath || t.driveSelection}
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {/* Parent Link */}
                    {parent && parent !== currentPath && (
                         <div 
                            onClick={() => loadPath(parent)}
                            className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer flex items-center gap-3 text-gray-600 dark:text-gray-400 font-bold"
                         >
                            📁 .. ({t.levelUp})
                         </div>
                    )}

                    {items.map(folder => (
                        <div 
                            key={folder}
                            onClick={() => loadPath(currentPath ? (currentPath + (currentPath.endsWith('/') ? '' : '/') + folder) : folder)}
                            className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-zinc-800 last:border-0"
                        >
                            <span className="text-yellow-400">📁</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{folder}</span>
                        </div>
                    ))}
                    
                    {items.length === 0 && (
                         <div className="p-8 text-center text-gray-400 italic">{t.emptyDir}</div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3 bg-gray-50 dark:bg-zinc-950/50">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-sm font-bold">{t.cancel}</button>
                    <button 
                        onClick={() => { onSelect(currentPath); onClose(); }}
                        className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-600"
                        disabled={!currentPath}
                    >
                        {t.selectThisFolder}
                    </button>
                </div>
            </div>
        </div>
    );
}
