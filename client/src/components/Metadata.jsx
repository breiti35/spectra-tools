import React, { useState, useCallback, useEffect } from 'react';
import { processImageFile } from '../lib/metadata';
import { DB } from '../lib/db';

export default function Metadata({ initialImageUrl, onUsePrompt, t }) {
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null); // { report, extracted, file }
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-Load Initial URL
  useEffect(() => {
      if (initialImageUrl) {
          processUrl(initialImageUrl);
      }
  }, [initialImageUrl]);

  // Global Paste Listener
  useEffect(() => {
    const handlePaste = (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                processFile(file);
                break;
            }
        }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processUrl = async (url) => {
      setIsProcessing(true);
      setResult(null);
      try {
          const res = await fetch(url);
          if(!res.ok) throw new Error("Bild konnte nicht geladen werden");
          const blob = await res.blob();
          const file = new File([blob], "local_image.png", { type: blob.type });
          const data = await processImageFile(file);
          setResult({ ...data, file, previewUrl: url });
      } catch(e) {
          alert(`${t.loadError}: ` + e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const data = await processImageFile(file);
      setResult({ ...data, file, previewUrl: URL.createObjectURL(file) });
    } catch (e) {
      alert(`${t.loadError}: ` + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }, []);
  const onFileSelect = (e) => processFile(e.target.files[0]);

  const getCleanPrompt = (text) => {
      if (!text) return "";
      // Entfernt <lora:...>, <hypernet:...> und Gewichte wie (word:1.2) -> word
      return text
        .replace(/<[^>]+>/g, '') // LoRA/Hypernet
        .replace(/\(([^:]+):[^)]+\)/g, '$1') // (word:1.2) -> word
        .replace(/\(([^:)]+)\)/g, '$1') // (word) -> word
        .replace(/\[([^:)]+)\]/g, '$1') // [word] -> word
        .replace(/\s+/g, ' ') // Doppelte Leerzeichen
        .trim();
  };

  const extractA1111Params = (raw) => {
      if (!raw) return null;
      const params = {};
      const pairs = {
          steps: /Steps:\s*(\d+)/,
          sampler: /Sampler:\s*([^,]+)/,
          cfg: /CFG scale:\s*([^,]+)/,
          seed: /Seed:\s*(\d+)/,
          model: /Model:\s*([^,]+)/
      };
      for (const [key, regex] of Object.entries(pairs)) {
          const match = raw.match(regex);
          if (match) params[key] = match[1];
      }
      return Object.keys(params).length > 0 ? params : null;
  };

  const handleAction = (type) => {
    if (!result || !result.extracted) return;
    const { extracted } = result;
    let prompt = "", negative = "", seed = "0";

    if (extracted.a1111) {
        prompt = extracted.a1111.positive;
        negative = extracted.a1111.negative;
        seed = extracted.a1111.raw.match(/Seed:\s*(\d+)/)?.[1] || "0";
    } else if (extracted.comfy) {
        prompt = extracted.comfy.positive.join(" ");
        negative = extracted.comfy.negative.join(" ");
    }

    if (type === 'send') {
        onUsePrompt({ prompt, seed, negative, tags: ["From Metadata"] });
    } else if (type === 'copyClean') {
        navigator.clipboard.writeText(getCleanPrompt(prompt));
        alert(t.copySuccess);
    }
  };

  const renderA1111 = (info) => {
    const params = extractA1111Params(info.raw);
    return (
        <div className="space-y-4 text-sm">
           <div>
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Prompt</h4>
             <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 text-gray-800 dark:text-gray-200 text-xs leading-relaxed font-medium">
               {info.positive}
             </div>
           </div>
           {info.negative && (
             <div>
               <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Negative</h4>
               <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-gray-700 dark:text-red-400 text-xs font-medium">
                 {info.negative}
               </div>
             </div>
           )}
           {params && (
               <div className="grid grid-cols-2 gap-2">
                   {Object.entries(params).map(([k, v]) => (
                       <div key={k} className="bg-gray-50 dark:bg-zinc-900 px-3 py-2 rounded-lg flex justify-between border border-gray-100 dark:border-zinc-800">
                           <span className="text-[10px] font-bold text-gray-400 uppercase">{t[k] || k}</span>
                           <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{v}</span>
                       </div>
                   ))}
               </div>
           )}
           <details className="text-[10px] text-gray-400">
               <summary className="cursor-pointer hover:text-blue-500 transition-colors uppercase font-bold tracking-tighter">{t.rawParams}</summary>
               <pre className="mt-2 p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-x-auto whitespace-pre-wrap">
                   {info.raw}
               </pre>
           </details>
        </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in h-[calc(100vh-200px)]">
      <div className="flex flex-col gap-6">
          <div 
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            className={`flex-1 border-3 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all duration-300 cursor-pointer relative overflow-hidden group ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 scale-[1.01]' : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-400/50'} ${result ? 'min-h-[300px]' : 'h-full'}`}
            onClick={() => document.getElementById('meta-file-input').click()}
          >
             <input type="file" id="meta-file-input" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={onFileSelect} />
             {result ? (
                 <div className="relative w-full h-full flex items-center justify-center">
                     <img src={result.previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                     <div className="absolute bottom-4 bg-white/90 dark:bg-zinc-800/90 px-6 py-2.5 rounded-full shadow-xl text-xs font-bold backdrop-blur-md dark:text-white border border-white/20">{t.newImage}</div>
                 </div>
             ) : (
                 <div className="text-center pointer-events-none space-y-4">
                     <span className="text-6xl block group-hover:scale-110 transition-transform">🖼️</span>
                     <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">{t.dropImage}</h3>
                     <div className="flex flex-col gap-1">
                        <p className="text-xs text-gray-400">{t.supports}</p>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-2">CTRL + V support</p>
                     </div>
                 </div>
             )}
          </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-zinc-800 p-8 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.analysisResult}</h3>
              {result && (
                  <div className="flex gap-2">
                      <button onClick={() => handleAction('copyClean')} title={t.copyClean} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">✨</button>
                      <button onClick={() => handleAction('send')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95">🚀 {t.sendToGenerator}</button>
                  </div>
              )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {!result && !isProcessing && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 space-y-4">
                      <span className="text-5xl">🔍</span>
                      <p className="font-medium">{t.waitingForImage}</p>
                  </div>
              )}
              {isProcessing && (
                  <div className="h-full flex flex-col items-center justify-center text-blue-500 animate-pulse space-y-4">
                      <span className="text-5xl">⏳</span>
                      <p className="font-bold tracking-widest uppercase text-xs">{t.analyzeMeta}</p>
                  </div>
              )}
              {result && (
                  <div className="space-y-6">
                      <div className="flex gap-2">
                          {result.extracted.a1111 && <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Automatic1111</span>}
                          {result.extracted.comfy && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-[10px] font-bold uppercase tracking-wider">ComfyUI</span>}
                          {!result.extracted.a1111 && !result.extracted.comfy && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-[10px] font-bold uppercase tracking-wider">{t.noAiDataFound}</span>}
                      </div>
                      {result.extracted.a1111 && renderA1111(result.extracted.a1111)}
                      {result.extracted.comfy && (
                          <div className="space-y-4">
                              <div>
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.foundPrompts}</h4>
                                  {result.extracted.comfy.positive.map((p, i) => (
                                      <div key={i} className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 text-gray-800 dark:text-gray-200 text-xs mb-2 font-medium">{p}</div>
                                  ))}
                              </div>
                              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 rounded-xl text-[10px] leading-relaxed border border-blue-100 dark:border-blue-900/30 italic">ℹ️ {t.comfyInfo}</div>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}