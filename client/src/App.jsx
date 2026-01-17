import React, { useState, useEffect } from 'react';
import { DB } from './lib/db';
import { translations } from './lib/i18n';
import logo from './assets/logo.png';
import Home from './components/Home';
import Generator from './components/Generator';
import Gallery from './components/Gallery';
import Metadata from './components/Metadata';
import Calculator from './components/Calculator';
import Library from './components/Library';
import Settings from './components/Settings';
import ComfyManager from './components/ComfyManager';

function Sidebar({ activeTab, setActiveTab, isDark, toggleDark, t, appMode, hasComfy }) {
  const menuItems = [
    { id: 'home', label: t.home, icon: '🏠' },
    { id: 'generator', label: t.generator, icon: '⚡' },
    { id: 'metadata', label: t.metadata, icon: '🔍' },
    { id: 'calculator', label: t.calculator, icon: '🧮' },
    ...(appMode === 'local' ? [{ id: 'gallery', label: t.gallery, icon: '🖼️' }] : []),
    ...(hasComfy ? [{ id: 'comfyui', label: t.comfyui, icon: '🧩' }] : []),
    { id: 'library', label: t.library, icon: '📚' },
    { id: 'settings', label: t.settings, icon: '⚙️' },
  ];

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
            <img src={logo} alt="Spectra Logo" className="w-11 h-11 object-contain" />
            <h1 className="text-xl font-bold tracking-tight text-white">Spectra Tools</h1>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 ml-14 font-mono uppercase tracking-widest opacity-70">{t.version} 0.1.5.1 Alpha</div>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
              : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 flex justify-center">
        <button 
            onClick={toggleDark}
            title={isDark ? t.lightMode : t.darkMode}
            className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
        >
          <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
        </button>
      </div>
    </aside>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState('de');
  const [appMode, setAppMode] = useState('local');
  const [comfyPath, setComfyPath] = useState(null);
  
  // Data Passing States
  const [loadedData, setLoadedData] = useState(null); // Gallery -> Generator (Prompt Data)
  const [analyzeUrl, setAnalyzeUrl] = useState(null); // Gallery -> Metadata (Image URL)
  
  const t = translations[lang];

  const changeLang = async (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    await DB.setConfig('lang', newLang);
  };

  useEffect(() => {
    const initApp = async () => {
        await DB.init().catch(err => console.error(t.backendOffline));
        
        // App Info laden (Mode)
        const info = await DB.getAppInfo();
        setAppMode(info.mode);

        const cPath = await DB.getConfig('comfyPath');
        setComfyPath(cPath);

        // Sprache laden (DB bevorzugt, dann LocalStorage, dann Fallback)
        const dbLang = await DB.getConfig('lang');
        const localLang = localStorage.getItem('lang');
        const initialLang = dbLang || localLang || 'de';
        setLang(initialLang);

        // Check gespeichertes Theme
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        }
    };
    initApp();
  }, []);

  const toggleDark = () => {
    if (isDark) {
        document.documentElement.classList.remove('dark');
        setIsDark(false);
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        setIsDark(true);
        localStorage.setItem('theme', 'dark');
    }
  };

  // Handlers
  const handleLoadPrompt = (item) => {
      setLoadedData(item);
      setActiveTab('generator');
  };

  const handleAnalyzeImage = (url) => {
      setAnalyzeUrl(url);
      setActiveTab('metadata');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDark={isDark} 
        toggleDark={toggleDark} 
        t={t}
        appMode={appMode}
        hasComfy={!!comfyPath}
      />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Bereich */}
          {activeTab !== 'home' && (
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white capitalize">
                  {t[activeTab]}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {t.studioSub}
                </p>
              </div>
            </header>
          )}

          {/* View Container */}
          <section className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none p-6 md:p-8 min-h-[calc(100vh-200px)] border border-gray-100 dark:border-zinc-800 relative overflow-hidden transition-colors duration-200">
            
            {activeTab === 'home' && (
              <Home 
                 setActiveTab={setActiveTab} 
                 t={t}
              />
            )}

            {activeTab === 'generator' && (
              <Generator 
                 initialData={loadedData} 
                 onDataLoaded={() => setLoadedData(null)} 
                 t={t}
              />
            )}
            
            {activeTab === 'metadata' && (
              <Metadata 
                initialImageUrl={analyzeUrl} 
                onUsePrompt={handleLoadPrompt}
                t={t} 
              />
            )}

            {activeTab === 'gallery' && (
              <Gallery 
                onAnalyzeImage={handleLoadPrompt} // Lokale Bilder gehen auch in den Generator
                t={t}
              />
            )}

            {activeTab === 'calculator' && <Calculator t={t} />}
            {activeTab === 'comfyui' && <ComfyManager comfyPath={comfyPath} t={t} />}
            {activeTab === 'library' && <Library onLoadItem={handleLoadPrompt} t={t} />}
            {activeTab === 'settings' && <Settings lang={lang} setLang={changeLang} t={t} appMode={appMode} onConfigChange={(key, val) => { if(key === 'comfyPath') setComfyPath(val); }} />}

          </section>

        </div>
      </main>
    </div>
  );
}

export default App;
