import React from 'react';
import logo from '../assets/logo.png';

export default function Home({ t }) {
  const highlights = [
    { label: t.generator, icon: '⚡', desc: t.generatorDesc, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
    { label: t.metadata, icon: '🔍', desc: t.metadataDesc, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
    { label: t.comfyui, icon: '🧩', desc: t.comfyDescShort, color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
    { label: t.gallery, icon: '🖼️', desc: t.galleryDesc, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] py-12 px-4 animate-fade-in text-center">
      
      {/* Hero / Logo Section */}
      <div className="mb-12">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 rounded-full"></div>
          <img src={logo} alt="Spectra Logo" className="w-28 h-28 object-contain relative z-10 drop-shadow-xl animate-float" />
        </div>
        <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
          Spectra <span className="text-blue-600">Tools</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          {t.welcomeSub}
        </p>
      </div>

      {/* Feature Highlights - Static Info List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 text-left max-w-4xl w-full mx-auto mt-8 px-6">
        {highlights.map((item, idx) => (
          <div key={idx} className="flex items-start gap-6 group">
            <div className={`flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl text-3xl shadow-sm border border-black/5 dark:border-white/5 ${item.color} transition-transform group-hover:scale-105 duration-300`}>
              {item.icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-100 text-lg mb-2">{item.label}</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Ready to Start hint */}
      <div className="mt-16 pt-8 border-t border-gray-100 dark:border-zinc-800/50 w-full max-w-lg text-xs text-slate-400 dark:text-zinc-600 font-medium tracking-wide flex justify-between items-center">
        <span>{t.version} 0.1.5.2 Alpha</span>
        <span>{t.readyToStart || "← WÄHLE EIN MODUL AUS DER NAVIGATION"}</span>
      </div>

    </div>
  );
}