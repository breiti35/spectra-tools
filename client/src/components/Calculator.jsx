import React, { useState, useEffect } from 'react';

export default function Calculator({ t }) {
  const [baseRes, setBaseRes] = useState(1048576); // Standard: 1024x1024 (1MP)
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [orientation, setOrientation] = useState('landscape');
  const [activeRatio, setActiveRatio] = useState('1:1');
  const [rounding, setRounding] = useState(8);

  const standardRatios = {
    '1:1': 1,
    '4:3': 4/3,
    '3:2': 3/2,
    '16:9': 16/9,
    '21:9': 21/9
  };

  const socialRatios = {
    '9:16': 9/16,
    '4:5': 4/5,
    '5:4': 5/4,
    '2:3': 2/3
  };

  // Berechnung der Dimensionen basierend auf Ratio und Basis-Auflösung
  const calculateDimensions = (ratioStr, orient, base, roundVal) => {
    let r;
    if (standardRatios[ratioStr]) {
        r = standardRatios[ratioStr];
        if (orient === 'portrait') r = 1 / r;
    } else {
        r = socialRatios[ratioStr];
        // Social ratios are often already defined in their common orientation, 
        // but we'll respect the toggle if it's one of the standard-like ones.
    }

    const h = Math.round(Math.sqrt(base / r));
    const w = Math.round(h * r);

    // Auf Rundungswert anpassen
    const finalW = Math.round(w / roundVal) * roundVal;
    const finalH = Math.round(h / roundVal) * roundVal;

    setWidth(finalW);
    setHeight(finalH);
    setActiveRatio(ratioStr);
  };

  useEffect(() => {
    calculateDimensions(activeRatio, orientation, baseRes, rounding);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseRes, orientation, rounding]);

  const handleRatioClick = (r) => {
    calculateDimensions(r, orientation, baseRes, rounding);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`${t.copySuccess}: ${text}`);
  };

  // Berechnung für Vorschau-Skalierung
  const maxPrevSize = 200;
  const isWider = width >= height;
  const prevW = isWider ? maxPrevSize : (width / height) * maxPrevSize;
  const prevH = isWider ? (height / width) * maxPrevSize : maxPrevSize;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-20">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Basis Auswahl */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-4 tracking-widest">{t.modOptimization}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { label: 'SD 1.5 (512px)', val: 262144 },
                        { label: 'SD 2.1 (768px)', val: 589824 },
                        { label: 'SDXL / Flux (1MP)', val: 1048576 },
                    ].map(item => (
                        <button 
                            key={item.val}
                            onClick={() => setBaseRes(item.val)}
                            className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${baseRes === item.val ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Ratio Selection */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest">{t.standard}</label>
                        <div className="grid grid-cols-5 gap-2">
                            {Object.keys(standardRatios).map(r => (
                                <button 
                                    key={r}
                                    onClick={() => handleRatioClick(r)}
                                    className={`py-2.5 rounded-lg text-sm font-bold transition-all ${activeRatio === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest">{t.socialMedia}</label>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.keys(socialRatios).map(r => (
                                <button 
                                    key={r}
                                    onClick={() => handleRatioClick(r)}
                                    className={`py-2.5 rounded-lg text-sm font-bold transition-all ${activeRatio === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Advanced Settings */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-4 tracking-widest">{t.orientation}</label>
                    <div className="flex gap-2">
                        <button onClick={() => setOrientation('landscape')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orientation === 'landscape' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400'}`}>{t.horizontal}</button>
                        <button onClick={() => setOrientation('portrait')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${orientation === 'portrait' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400'}`}>{t.vertical}</button>
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-4 tracking-widest">{t.rounding}</label>
                    <div className="flex gap-2">
                        {[8, 16, 32, 64].map(v => (
                            <button key={v} onClick={() => setRounding(v)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${rounding === v ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400'}`}>{v}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW & RESULTS */}
        <div className="space-y-6">
            
            {/* Visual Preview */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors flex flex-col items-center">
                <label className="w-full block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-6 tracking-widest text-center">{t.visualPreview}</label>
                <div className="relative flex items-center justify-center bg-gray-50 dark:bg-zinc-950 rounded-2xl w-full aspect-square border border-gray-100 dark:border-zinc-800">
                    <div 
                        className="bg-blue-500/20 border-2 border-blue-500 rounded-lg transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400"
                        style={{ width: `${prevW}px`, height: `${prevH}px` }}
                    >
                        {activeRatio}
                    </div>
                </div>
            </div>

            {/* Results Card */}
            <div className="bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-500/20 text-white transition-colors">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="text-3xl font-black">{width}</div>
                            <div className="text-[10px] opacity-60 uppercase font-bold tracking-tighter">{t.width}</div>
                        </div>
                        <div className="text-xl opacity-30">×</div>
                        <div>
                            <div className="text-3xl font-black">{height}</div>
                            <div className="text-[10px] opacity-60 uppercase font-bold tracking-tighter">{t.height}</div>
                        </div>
                    </div>
                    <div className="text-xs font-mono opacity-50">
                         {(width * height).toLocaleString()} px (~{((width * height) / 1000000).toFixed(2)} MP)
                    </div>
                    <button 
                        onClick={() => copyToClipboard(`${width} x ${height}`)}
                        className="w-full bg-white text-zinc-900 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors active:scale-95 mt-2"
                    >
                        {t.copyWH}
                    </button>
                </div>
            </div>

            {/* Upscaling Card */}
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-4 tracking-widest">{t.upscaling}</label>
                <div className="space-y-3">
                    {[1.5, 2, 4].map(factor => (
                        <div key={factor} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl group cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors" onClick={() => copyToClipboard(`${Math.round(width * factor)} x ${Math.round(height * factor)}`)}>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{factor}x</span>
                            <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">{Math.round(width * factor)} × {Math.round(height * factor)}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>

    </div>
  );
}