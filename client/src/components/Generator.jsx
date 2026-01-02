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
    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</label>
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

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const toggleSection = (sec) => setSectionsOpen(prev => ({ ...prev, [sec]: !prev[sec] }));

  const generate = () => {
    const finalSeed = resolveSeed(formData.seed, formData.seedLock);
    const result = buildPrompt({ ...formData, seed: finalSeed });
    setOutput({ text: result.prompt, tags: result.tags || [], seed: result.seed });
    handleChange('seed', result.seed);
  };

  const handleEnhance = () => {
    if(!formData.promptIdea) return alert(t.ideaError);
    const seed = resolveSeed(formData.seed, formData.seedLock);
    const enhanced = enhancePrompt(formData.promptIdea, { ...formData, seed });
    setOutput({ text: enhanced, tags: ["Enhanced", "Magic"], seed: seed });
    handleChange('seed', seed);
  };

  const handleSurprise = () => {
    const r = Math.floor(Math.random() * 1_000_000);
    setFormData(prev => ({ ...prev, seed: r, promptIdea: "", realism: Math.floor(Math.random()*10)+1, randomness: Math.floor(Math.random()*10)+1, preset: "", camera: "" }));
    setTimeout(() => {
        const result = buildPrompt({ ...formData, seed: r, promptIdea: "", realism: 5 }); 
        setOutput({ text: result.prompt, tags: ["Surprise"], seed: r });
    }, 50);
  };

  const handleSave = async () => {
    if(!output.text || output.text.includes(t.outputPlaceholder.substring(0, 10))) return;
    try {
        await DB.addItem({ id: Date.now().toString(), prompt: output.text, tags: output.tags, seed: output.seed, date: new Date().toISOString(), negative: formData.negative, settings: formData });
        alert(t.saved);
    } catch(e) { alert(t.saveError); }
  };

  const copyToClipboard = () => navigator.clipboard.writeText(output.text);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. INPUT */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 transition-colors">
        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">{t.promptIdea}</label>
        <textarea
          className="w-full p-4 bg-gray-50 dark:bg-zinc-900 border-2 border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-zinc-950 rounded-xl transition-all outline-none resize-none text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
          rows="2"
          placeholder={t.promptPlaceholder}
          value={formData.promptIdea}
          onChange={e => handleChange('promptIdea', e.target.value)}
        />
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
          <div className="p-8">
              <div className="min-h-[80px] text-lg leading-relaxed text-slate-700 dark:text-gray-200 font-medium whitespace-pre-wrap">
                  {output.text}
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
                <ControlCard label={t.negativePrompt}>
                    <input type="text" value={formData.negative} onChange={e => handleChange('negative', e.target.value)} placeholder={t.negativePlaceholder} className="w-full text-sm py-1 bg-transparent focus:outline-none text-red-500 placeholder-red-200 dark:placeholder-red-900/50" />
                </ControlCard>
             </div>
        </div>
      )}
    </div>
  );
}
