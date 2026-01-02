import React, { useEffect, useState } from 'react';
import { DB } from '../lib/db';
import { processImageFile } from '../lib/metadata';

const LocalImageCard = ({ file, onClick, t }) => {
    const imageUrl = `/api/image-view?path=${encodeURIComponent(file.fullPath)}`;
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden hover:shadow-md transition-shadow group animate-fade-in cursor-pointer" onClick={() => onClick(file, imageUrl)}>
            <div className="h-48 w-full relative overflow-hidden bg-gray-100 dark:bg-zinc-900">
                <img 
                    src={imageUrl} 
                    alt={file.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 dark:bg-zinc-800/90 text-xs font-bold px-3 py-1 rounded-full text-gray-700 dark:text-gray-200 shadow-sm">
                        🔍 {t.details}
                    </span>
                </div>
            </div>
            <div className="p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono" title={file.name}>{file.name}</p>
                <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">{new Date(file.mtime).toLocaleString()}</p>
            </div>
        </div>
    );
};

// --- LIGHTBOX (DETAIL MODAL) ---
const ImageDetailModal = ({ file, imageUrl, onClose, onUsePrompt, t }) => {
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        analyze();
    }, [file]);

    const analyze = async () => {
        setLoading(true);
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const f = new File([blob], file.name, { type: blob.type });
            const data = await processImageFile(f);
            setMeta(data);
        } catch(e) { console.error(e); } 
        finally { setLoading(false); }
    };

    if(!file) return null;
    const getPrompt = () => {
        if(!meta || !meta.extracted) return null;
        if(meta.extracted.a1111) return meta.extracted.a1111.positive;
        if(meta.extracted.comfy) return meta.extracted.comfy.positive.join(" ");
        return null;
    };
    const promptText = getPrompt();

    return (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center backdrop-blur-md animate-fade-in p-4 md:p-10" onClick={onClose}>
             <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                 <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
                     <img src={imageUrl} className="max-w-full max-h-full object-contain" alt="Full" />
                     <button onClick={onClose} className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 md:hidden">✕</button>
                 </div>
                 <div className="w-full md:w-[400px] lg:w-[450px] bg-white dark:bg-zinc-900 flex flex-col border-l border-gray-200 dark:border-zinc-800">
                     <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start">
                         <div>
                             <h3 className="font-bold text-gray-800 dark:text-white break-all line-clamp-1">{file.name}</h3>
                             <p className="text-xs text-gray-400 mt-1">{new Date(file.mtime).toLocaleString()}</p>
                         </div>
                         <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl leading-none ml-4">×</button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                         {loading ? <div className="text-center py-10 text-primary animate-pulse">{t.analyzeMeta}</div> : !promptText ? <div className="text-center py-10 text-gray-400"><div className="text-4xl mb-2">🤷‍♂️</div><p>{t.noAiData}</p></div> : (
                             <div className="space-y-6">
                                 <div>
                                     <div className="flex justify-between items-center mb-2">
                                         <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prompt</h4>
                                         {meta.extracted.a1111 ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">A1111</span> : <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">ComfyUI</span>}
                                     </div>
                                     <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed border border-gray-100 dark:border-zinc-700">{promptText}</div>
                                 </div>
                                 {(meta.extracted.a1111?.negative || (meta.extracted.comfy?.negative?.length > 0)) && (
                                     <div>
                                         <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Negative</h4>
                                         <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl text-xs text-gray-600 dark:text-red-400 font-mono border border-red-100 dark:border-red-900/30">{meta.extracted.a1111 ? meta.extracted.a1111.negative : meta.extracted.comfy.negative.join(" ")}</div>
                                     </div>
                                 )}
                             </div>
                         )}
                     </div>
                     <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950/50 space-y-3">
                         <button onClick={() => navigator.clipboard.writeText(promptText || "")} disabled={!promptText} className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-primary/50 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all disabled:opacity-50"><span>📋</span> {t.copyPrompt}</button>
                         <button onClick={() => { if(!promptText) return; const item = { prompt: promptText, seed: meta.extracted.a1111?.raw?.match(/Seed:\s*(\d+)/)?.[1] || "0", tags: ["From Gallery"] }; onUsePrompt(item); }} disabled={!promptText} className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"><span>🚀</span> {t.openInGenerator}</button>
                     </div>
                 </div>
             </div>
        </div>
    );
};

export default function Gallery({ onAnalyzeImage, t }) {
  const [localFiles, setLocalFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // States
  const [savedFolders, setSavedFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); 

  useEffect(() => { init(); }, []);

  // Wenn Dropdown gewechselt wird
  useEffect(() => {
      if(selectedFolderId) {
          const folder = savedFolders.find(f => f.id === parseInt(selectedFolderId));
          if(folder) loadFiles(folder.path);
      } else {
          setLocalFiles([]);
      }
  }, [selectedFolderId]);

  const init = async () => {
      const folders = await DB.getFolders();
      setSavedFolders(folders);
      // Wenn Ordner da sind, wähle den letzten aus (oder den ersten)
      if(folders.length > 0) setSelectedFolderId(folders[0].id);
  };

  const loadFiles = async (path) => {
      setLoading(true);
      const files = await DB.getLocalImages(path);
      setLocalFiles(files);
      setLoading(false);
  };

  const openLightbox = (file, url) => {
      setSelectedFile({ file, url });
  };

  return (
    <div className="animate-fade-in flex flex-col h-full relative">
       
       {/* Lightbox Overlay */}
       {selectedFile && (
           <ImageDetailModal 
               file={selectedFile.file} 
               imageUrl={selectedFile.url} 
               onClose={() => setSelectedFile(null)}
               onUsePrompt={(item) => onAnalyzeImage(item)}
               t={t}
           />
       )}

       {/* HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
           <div>
               <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.myImages}</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">
                   {savedFolders.length > 0 ? t.selectFolder : t.noFolders}
               </p>
           </div>
           
           {/* FOLDER SELECTION ONLY */}
           <div className="flex items-center gap-2 w-full md:w-auto bg-white dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
               {savedFolders.length > 0 ? (
                   <select 
                      className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-200 outline-none px-3 py-2 w-48 md:w-64"
                      value={selectedFolderId}
                      onChange={e => setSelectedFolderId(e.target.value)}
                   >
                       {savedFolders.map(f => (
                           <option key={f.id} value={f.id}>{f.label}</option>
                       ))}
                   </select>
               ) : (
                   <div className="px-4 py-2 text-sm text-gray-400 italic">{t.goToSettings}</div>
               )}
           </div>
       </div>

       {/* GRID */}
       <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
           {loading ? (
               <div className="text-center py-20 text-gray-400 animate-pulse">{t.scanning}</div>
           ) : localFiles.length === 0 ? (
               <div className="text-center py-20 text-gray-400 bg-gray-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-700">
                   <div className="text-4xl mb-2">📭</div>
                   <p>{savedFolders.length === 0 ? t.noFoldersConfig : t.emptyFolder}</p>
               </div>
           ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                   {localFiles.map((file, idx) => (
                       <LocalImageCard 
                           key={idx} 
                           file={file} 
                           onClick={openLightbox}
                           t={t}
                       />
                   ))}
               </div>
           )}
       </div>
    </div>
  );
}