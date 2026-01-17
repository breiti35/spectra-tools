import React, { useState } from 'react';
import { buildPrompt, enhancePrompt, resolveSeed } from '../lib/generator';
import { DB } from '../lib/db';
import { data } from '../lib/data';

const SectionTitle = ({ children, isOpen, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between text-left font-bold text-gray-700 dark:text-gray-300 mt-6 mb-3 hover:text-blue-500 transition-colors"
  >
    <span>{children}</span>
    <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
  </button>
);

const ControlCard = ({ label, children }) => (
  <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-400/30 transition-colors">
    {label && <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</label>}
    {children}
  </div>
);

const Select = ({ value, onChange, options, placeholder }) => (
  <select 
    value={value} 
    onChange={e => onChange(e.target.value)}
    className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-gray-100"
  >
    <option value="">{placeholder}</option>
    {options.map(opt => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
);

export default function Generator({ initialData, onDataLoaded, t }) {
  const [output, setOutput] = useState({ text: t.outputPlaceholder, tags: [], seed: null });
  const [isProMode, setIsProMode] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({ basic: true, camera: false, env: false, char: false });
  const [history, setHistory] = useState(JSON.parse(localStorage.getItem('prompt_history') || '[]'));
  const [wildcards, setWildcards] = useState({}); // Neu: Speicher für Wildcards
  
  const [formData, setFormData] = useState({
    promptIdea: "",
    seed: "",
    seedLock: false,
    preset: "",
    aspect: "3:2",
    realism: 8,
    randomness: 6,
    turboMode: true,
    sceneType: "",
    camera: "",
    lens: "",
    shot: "",
    aperture: "",
    iso: "",
    resolution: "",
    lighting: "",
    time: "",
    weather: "",
    locationType: "",
    localeType: "",
    season: "",
    gender: "",
    ageRange: "",
    ethnicity: "",
    clothing: "",
    accessory: "",
    detailLevel: 3,
    sentenceStyle: "",
    negative: ""
  });

  React.useEffect(() => {
    if (initialData) {
        setOutput({
            text: initialData.prompt,
            tags: initialData.tags || [],
            seed: initialData.seed
        });
        if (initialData.settings) {
            setFormData(prev => ({ ...prev, ...initialData.settings }));
            setIsProMode(true);
        } else {
            setFormData(prev => ({ ...prev, promptIdea: initialData.prompt, seed: initialData.seed }));
        }
        if(onDataLoaded) onDataLoaded();
    }
  }, [initialData, onDataLoaded]);

  // Wildcards laden
  React.useEffect(() => {
      DB.getWildcards().then(data => setWildcards(data));
  }, []);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const toggleSection = (sec) => setSectionsOpen(prev => ({ ...prev, [sec]: !prev[sec] }));

  // Helper: Wildcards auflösen (mit Tracking)
  const resolveWildcards = (text) => {
      // Wir bauen den String neu und merken uns die "Parts".
      const parts = [];
      let lastIndex = 0;
      const regex = /__(\w+)__/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
          // Text vor dem Match
          if (match.index > lastIndex) {
              parts.push({ type: 'text', value: text.substring(lastIndex, match.index) });
          }
          
          const key = match[1];
          const list = wildcards[key];
          let replacement = match[0]; // Fallback: __key__

          if (list && list.length > 0) {
              replacement = list[Math.floor(Math.random() * list.length)];
          }

          parts.push({ type: 'wildcard', value: replacement, original: `__${key}__` });
          lastIndex = regex.lastIndex;
      }
      
      // Restlicher Text
      if (lastIndex < text.length) {
          parts.push({ type: 'text', value: text.substring(lastIndex) });
      }

      // Zusammengebauter String für den Generator
      const finalString = parts.map(p => p.value).join('');
      
      return { finalString, parts };
  };

  const addToHistory = (item) => {
    const newHistory = [item, ...history.filter(h => h.text !== item.text)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('prompt_history', JSON.stringify(newHistory));
  };

  const generate = () => {
    // 1. Wildcards auflösen
    const { finalString, parts } = resolveWildcards(formData.promptIdea);
    
    // 2. Prompt bauen
    const finalSeed = resolveSeed(formData.seed, formData.seedLock);
    
    // Wir übergeben den REINEN Text an den Builder, damit Styles etc. angewendet werden
    const result = buildPrompt({ ...formData, promptIdea: finalString, seed: finalSeed });
    
    // VEREINFACHUNG FÜR UX:
    // Wir speichern das "parts" Array im Output.
    
    const newOutput = { 
        text: result.prompt, 
        tags: result.tags || [], 
        seed: result.seed,
        wildcardParts: parts // Speichern für Highlight
    };
    
    setOutput(newOutput);
    handleChange('seed', result.seed);
    addToHistory(newOutput);
  };

  const handleEnhance = () => {
    if(!formData.promptIdea) return alert(t.ideaError);
    const seed = resolveSeed(formData.seed, formData.seedLock);
    const enhanced = enhancePrompt(formData.promptIdea, { ...formData, seed });
    const newOutput = { text: enhanced, tags: ["Enhanced", "Magic"], seed: seed };
    setOutput(newOutput);
    handleChange('seed', seed);
    addToHistory(newOutput);
  };

  const handleSurprise = () => {
    const r = Math.floor(Math.random() * 1_000_000);
    setFormData(prev => ({ ...prev, seed: r, promptIdea: "", realism: Math.floor(Math.random()*10)+1, randomness: Math.floor(Math.random()*10)+1, preset: "", camera: "" }));
    setTimeout(() => {
        const result = buildPrompt({ ...formData, seed: r, promptIdea: "", realism: 5 }); 
        const newOutput = { text: result.prompt, tags: ["Surprise"], seed: r };
        setOutput(newOutput);
        addToHistory(newOutput);
    }, 50);
  };

  const handleDiceRoll = () => {
    const ideas = data.promptIdeas || [];
    if (ideas.length > 0) {
        const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
        handleChange('promptIdea', randomIdea);
    }
  };

  const loadFromHistory = (h) => {
    setOutput(h);
    if (h.seed) handleChange('seed', h.seed);
  };

  const handleSave = async () => {
    if(!output.text || output.text.includes(t.outputPlaceholder.substring(0, 10))) return;
    try {
        await DB.addItem({ id: Date.now().toString(), prompt: output.text, tags: output.tags, seed: output.seed, date: new Date().toISOString(), negative: formData.negative, settings: formData });
        alert(t.saved);
    } catch { alert(t.saveError); }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output.text);
    alert(t.copySuccess);
  };

  const renderOutputText = () => {
      const txt = output.text;
      if (!output.wildcardParts || !txt) return txt;

      // Wir bauen ein React-Element Array
      // Strategie: Wir nehmen den vollen Text und splitten ihn anhand der Wildcard-Werte
      // Das ist simpel und funktioniert meistens, solange Werte unique sind.
      
      let elements = [txt];

      output.wildcardParts.forEach(part => {
          if (part.type === 'wildcard') {
              const newElements = [];
              elements.forEach(el => {
                  if (typeof el === 'string') {
                      // Splitte String am Wildcard-Wert
                      const parts = el.split(part.value);
                      parts.forEach((p, i) => {
                          if (p) newElements.push(p);
                          if (i < parts.length - 1) {
                              // Füge Highlight ein
                              newElements.push(
                                  <span key={`${part.original}-${i}`} className="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/30 px-1 rounded cursor-help relative group/wc border-b border-purple-300 dark:border-purple-600 border-dashed" title={`Generiert aus ${part.original}`}>
                                      {part.value}
                                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/wc:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                          {part.original}
                                      </span>
                                  </span>
                              );
                          }
                      });
                  } else {
                      newElements.push(el);
                  }
              });
              elements = newElements;
          }
      });

      return elements;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. INPUT */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 transition-colors relative">
        <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-gray-500 dark:text-gray-400">{t.promptIdea}</label>
            <button 
                onClick={handleDiceRoll}
                title={t.randomIdea}
                className="p-1.5 bg-gray-50 dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-all border border-gray-100 dark:border-zinc-700 active:rotate-12"
            >
                🎲
            </button>
        </div>
        <textarea
          className="w-full p-4 bg-gray-50 dark:bg-zinc-900 border-2 border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-zinc-950 rounded-xl transition-all outline-none resize-none text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
          rows="2"
          placeholder={t.promptPlaceholder}
          value={formData.promptIdea}
          onChange={e => handleChange('promptIdea', e.target.value)}
        />
        
        {/* Wildcard Hints */}
        <div className="mt-3">
            <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    ✨ Wildcards 
                    <span className="group relative cursor-help">
                        <span className="text-blue-500/50">ⓘ</span>
                        <span className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 font-normal normal-case leading-relaxed">
                            {t.wildcardHint}
                        </span>
                    </span>
                </span>
            </div>
            {Object.keys(wildcards).length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {Object.keys(wildcards).map(wc => (
                        <button 
                            key={wc}
                            onClick={() => handleChange('promptIdea', formData.promptIdea + ` __${wc}__`)}
                            className="text-[10px] font-mono bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-2 py-1 rounded border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors whitespace-nowrap"
                            title={`Fügt __${wc}__ ein`}
                        >
                            __{wc}__
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-[10px] text-gray-400 italic px-1">{t.wildcardHint}</div>
            )}
        </div>

        <div className="flex justify-between items-center mt-4">
             <div className="flex items-center gap-2">
                 <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-zinc-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition">
                     <input type="checkbox" checked={formData.turboMode} onChange={e => handleChange('turboMode', e.target.checked)} className="accent-blue-500"/>
                     <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">⚡ {t.turboMode}</span>
                 </label>
             </div>
             <button onClick={() => setIsProMode(!isProMode)} className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline">
                {isProMode ? t.lessSettings : t.moreSettings}
             </button>
        </div>
      </div>

      {/* 2. OUTPUT */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg shadow-blue-500/5 border border-blue-500/10 dark:border-zinc-700 overflow-hidden relative group transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="p-8 pb-4">
              <div className="flex justify-between items-start mb-2">
                  <div className="min-h-[80px] text-lg leading-relaxed text-slate-700 dark:text-gray-200 font-medium whitespace-pre-wrap flex-1">
                      {renderOutputText()}
                  </div>
                  {output.text && !output.text.includes(t.outputPlaceholder.substring(0, 10)) && (
                      <div className="bg-gray-100 dark:bg-zinc-900 px-2 py-1 rounded text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-4 uppercase tracking-widest">
                          {output.text.split(/\s+/).filter(w => w.length > 0).length} {t.tokens}
                      </div>
                  )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                  {output.tags.map((t, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold rounded uppercase tracking-wide border border-blue-100 dark:border-blue-800">
                          {t}
                      </span>
                  ))}
                  {output.seed && <span className="px-2 py-1 bg-gray-50 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 text-xs border border-gray-200 dark:border-zinc-600 rounded">Seed: {output.seed}</span>}
              </div>
          </div>

          {/* History Snippet */}
          {history.length > 0 && (
              <div className="px-8 pb-4 flex items-center gap-3 overflow-x-auto custom-scrollbar">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{t.history}:</span>
                  {history.map((h, i) => (
                      <button 
                        key={i} 
                        onClick={() => loadFromHistory(h)}
                        title={h.text}
                        className="px-3 py-1 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-full text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap hover:border-blue-500 dark:hover:border-blue-500 transition-colors max-w-[120px] truncate"
                      >
                          {h.text}
                      </button>
                  ))}
              </div>
          )}

          <div className="bg-gray-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-gray-100 dark:border-zinc-700 flex items-center justify-between gap-4">
               <div className="flex gap-2">
                   <button onClick={generate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2">
                       <span>🚀</span> {t.generate}
                   </button>
                   <button onClick={handleSurprise} className="bg-white dark:bg-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-600 px-4 py-2.5 rounded-xl font-medium transition-colors">
                       🎲 {t.chaos}
                   </button>
               </div>
               <div className="flex gap-2">
                   <button onClick={handleEnhance} title="Magic Enhance" className="p-2.5 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors">✨</button>
                   <button onClick={copyToClipboard} title={t.copy} className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">📋</button>
                   <button onClick={handleSave} title={t.save} className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">💾</button>
               </div>
          </div>
      </div>

      {/* 3. SETTINGS */}
      {isProMode && (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-200 dark:border-zinc-700 animate-slide-down transition-colors">
            <SectionTitle isOpen={sectionsOpen.basic} onClick={() => toggleSection('basic')}>🎛️ {t.basisConfig}</SectionTitle>
            {sectionsOpen.basic && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ControlCard label={t.format}><Select value={formData.aspect} onChange={v => handleChange('aspect', v)} options={["1:1", "4:3", "3:2", "16:9", "21:9", "2:3", "9:16"]} placeholder="3:2" /></ControlCard>
                    <ControlCard label={t.preset}><Select value={formData.preset} onChange={v => handleChange('preset', v)} options={Object.keys(data.presets)} placeholder={t.random} /></ControlCard>
                    <ControlCard label={`${t.realism} (1-10)`}><input type="range" min="1" max="10" value={formData.realism} onChange={e => handleChange('realism', e.target.value)} className="w-full h-2 bg-gray-200 dark:bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-blue-500"/></ControlCard>
                    <ControlCard label={t.sceneType}><Select value={formData.sceneType} onChange={v => handleChange('sceneType', v)} options={["portrait", "landscape", "everyday"]} placeholder={t.random} /></ControlCard>
                    <div className="col-span-2 md:col-span-4">
                        <ControlCard label={t.seedLock}>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Random" value={formData.seed} onChange={e => handleChange('seed', e.target.value)} className="w-full text-sm bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:outline-none py-1 text-gray-700 dark:text-gray-200"/>
                                <label className="flex items-center gap-1 text-xs cursor-pointer select-none text-gray-600 dark:text-gray-400">
                                    <input type="checkbox" checked={formData.seedLock} onChange={e => handleChange('seedLock', e.target.checked)} /> Lock
                                </label>
                            </div>
                        </ControlCard>
                    </div>
                </div>
            )}
            <SectionTitle isOpen={sectionsOpen.camera} onClick={() => toggleSection('camera')}>📸 {t.cameraTech}</SectionTitle>
            {sectionsOpen.camera && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <ControlCard label={t.cameraType}><Select value={formData.camera} onChange={v => handleChange('camera', v)} options={["full-frame DSLR", "medium format film", "cinematic digital", "35mm film", "smartphone pro"]} placeholder={t.random} /></ControlCard>
                     <ControlCard label={t.lens}><Select value={formData.lens} onChange={v => handleChange('lens', v)} options={data.lenses} placeholder={t.random} /></ControlCard>
                     <ControlCard label={t.aperture}><Select value={formData.aperture} onChange={v => handleChange('aperture', v)} options={data.apertures} placeholder={t.random} /></ControlCard>
                </div>
            )}
            <SectionTitle isOpen={sectionsOpen.env} onClick={() => toggleSection('env')}>🌍 {t.envLight}</SectionTitle>
            {sectionsOpen.env && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <ControlCard label={t.light}><Select value={formData.lighting} onChange={v => handleChange('lighting', v)} options={["golden hour", "blue hour", "neon glow", "overcast", "studio light", "hard sunlight"]} placeholder={t.random} /></ControlCard>
                     <ControlCard label={t.weather}><Select value={formData.weather} onChange={v => handleChange('weather', v)} options={data.weather} placeholder={t.random} /></ControlCard>
                     <ControlCard label={t.time}><Select value={formData.time} onChange={v => handleChange('time', v)} options={data.times} placeholder={t.random} /></ControlCard>
                </div>
            )}
            <SectionTitle isOpen={sectionsOpen.char} onClick={() => toggleSection('char')}>👤 {t.character}</SectionTitle>
            {sectionsOpen.char && (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <ControlCard label={t.gender}><Select value={formData.gender} onChange={v => handleChange('gender', v)} options={["female", "male"]} placeholder={t.random} /></ControlCard>
                     <ControlCard label={t.age}><Select value={formData.ageRange} onChange={v => handleChange('ageRange', v)} options={["18-24", "25-34", "35-44", "45-60", "60+"]} placeholder={t.random} /></ControlCard>
                     <ControlCard label={t.clothing}><Select value={formData.clothing} onChange={v => handleChange('clothing', v)} options={["wool coat", "t-shirt", "suit", "dress", "cyberpunk gear"]} placeholder={t.random} /></ControlCard>
                </div>
            )}
             <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.negativePrompt}</label>
                    <div className="flex gap-1">
                        {Object.keys(data.negativePresets).map(p => (
                            <button 
                                key={p}
                                onClick={() => handleChange('negative', data.negativePresets[p])}
                                className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all border border-gray-200 dark:border-zinc-700 uppercase"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                <ControlCard>
                    <input type="text" value={formData.negative} onChange={e => handleChange('negative', e.target.value)} placeholder={t.negativePlaceholder} className="w-full text-sm py-1 bg-transparent focus:outline-none text-red-500 placeholder-red-200 dark:placeholder-red-900/50" />
                </ControlCard>
             </div>
        </div>
      )}
    </div>
  );
}