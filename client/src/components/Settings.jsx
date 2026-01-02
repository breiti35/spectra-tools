import React, { useState, useEffect } from 'react';
import { DB } from '../lib/db';
import FolderBrowser from './FolderBrowser';

export default function Settings({ lang, setLang, t, appMode, onConfigChange }) {

  const [folders, setFolders] = useState([]);

  const [showBrowser, setShowBrowser] = useState(false);

  const [comfyPath, setComfyPath] = useState('');

      const [comfyArgs, setComfyArgs] = useState('');

      const [comfyAdmin, setComfyAdmin] = useState(false);

      const [comfyMethod, setComfyMethod] = useState('default');

    

      useEffect(() => {

        if (appMode === 'local') {

            loadFolders();

            loadComfyConfig();

        }

      }, [appMode]);

    

      const loadComfyConfig = async () => {

        const p = await DB.getConfig('comfyPath');

        const a = await DB.getConfig('comfyArgs');

        const adm = await DB.getConfig('comfyAdmin');

        const meth = await DB.getConfig('comfyMethod');

        if(p) setComfyPath(p);

        if(a) setComfyArgs(a);

        if(adm) setComfyAdmin(adm === 'true');

        if(meth) setComfyMethod(meth);

      };

    

      const handleSaveComfy = async () => {

          await DB.setConfig('comfyPath', comfyPath);

          await DB.setConfig('comfyArgs', comfyArgs);

          await DB.setConfig('comfyAdmin', comfyAdmin ? 'true' : 'false');

          await DB.setConfig('comfyMethod', comfyMethod);

          if(onConfigChange) onConfigChange('comfyPath', comfyPath);

          alert(t.saved);

      };

    

  







  const loadFolders = async () => {

      const f = await DB.getFolders();

      setFolders(f);

  };



  const handleAddFolder = async (path) => {

      if(!path) return;

      // Name extrahieren (sicherer Regex)

      const parts = path.split(/[/\\]/);

      const label = parts[parts.length - 1] || path;



      await DB.addFolder(path, label);

      loadFolders();

  };



  const handleDeleteFolder = async (id) => {

      if(!confirm(t.removeFolder)) return;

      await DB.deleteFolder(id);

      loadFolders();

  };



  const handleExport = async () => {

    try {

      const data = await DB.getAllItems();

      const json = JSON.stringify(data, null, 2);

      const blob = new Blob([json], { type: 'application/json' });

      const url = URL.createObjectURL(blob);

      

      const a = document.createElement('a');

      a.href = url;

      a.download = `spectra_backup_${new Date().toISOString().slice(0,10)}.json`;

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

    } catch (e) {

      alert("Error: " + e.message);

    }

  };



  const handleReset = async () => {

    if (!window.confirm(t.resetWarning)) return;

    if (!window.confirm(t.resetConfirm)) return;



    try {

       const data = await DB.getAllItems();

       for (const item of data) {

           await DB.deleteItem(item.id);

       }

       alert(t.dbCleared);

    } catch(e) {

       alert("Error resetting database.");

    }

  };



  return (

    <div className="max-w-3xl mx-auto animate-fade-in space-y-8 pb-20">

       

       <FolderBrowser 

          isOpen={showBrowser} 

          onClose={() => setShowBrowser(false)}

          onSelect={handleAddFolder}

          t={t}

       />



       {/* LANGUAGE SETTINGS */}

       <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">

           <div className="flex items-center gap-4 mb-6">

               <span className="text-3xl">🌐</span>

               <div>

                   <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.language}</h3>

                   <p className="text-gray-500 dark:text-gray-400 text-sm">{t.languageSub}</p>

               </div>

           </div>

           

           <div className="flex gap-3">

               {[

                   { id: 'de', label: 'Deutsch', flag: '🇩🇪' },

                   { id: 'en', label: 'English', flag: '🇺🇸' }

               ].map(l => (

                   <button

                       key={l.id}

                       onClick={() => setLang(l.id)}

                       className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all border ${

                           lang === l.id 

                           ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' 

                           : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'

                       }`}

                   >

                       <span className="text-xl">{l.flag}</span>

                       {l.label}

                   </button>

               ))}

           </div>

       </div>



              {/* FOLDER MANAGEMENT */}



              {appMode === 'local' && (



                  <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">



                      <div className="flex items-center justify-between mb-6">



                          <div className="flex items-center gap-4">



                              <span className="text-3xl">📂</span>



                              <div>



                                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.localFolders}</h3>



                                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t.manageSources}</p>



                              </div>



                          </div>



                          <button 



                             onClick={() => setShowBrowser(true)}



                             className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"



                          >



                              + {t.addFolder}



                          </button>



                      </div>



       



                      <div className="space-y-3">



                          {folders.length === 0 ? (



                              <div className="text-center p-8 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 text-gray-400">



                                  {t.noFoldersLinked}



                              </div>



                          ) : (



                              folders.map(folder => (



                                  <div key={folder.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 group">



                                      <div className="flex items-center gap-3 overflow-hidden">



                                          <span className="text-xl text-yellow-400">📁</span>



                                          <div className="min-w-0">



                                              <div className="font-bold text-gray-700 dark:text-gray-200 truncate">{folder.label}</div>



                                              <div className="text-xs text-gray-400 font-mono truncate max-w-md" title={folder.path}>{folder.path}</div>



                                          </div>



                                      </div>



                                      <button 



                                         onClick={() => handleDeleteFolder(folder.id)}



                                         className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"



                                         title="Entfernen"



                                      >



                                          🗑️



                                      </button>



                                  </div>



                              ))



                                                    )}



                          



                                                </div>



                          



                                            </div>



                          



                                        )}



                          



                          



                          



                                 {/* COMFYUI CONFIG */}



                          
       {appMode === 'local' && (
           <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">
               <div className="flex items-center gap-4 mb-6">
                   <span className="text-3xl">🧩</span>
                   <div>
                       <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.comfyui}</h3>
                       <p className="text-gray-500 dark:text-gray-400 text-sm">{t.comfyDesc}</p>
                   </div>
               </div>

               <div className="space-y-4">
                   <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.comfyPath}</label>
                       <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={comfyPath}
                                onChange={e => setComfyPath(e.target.value)}
                                placeholder={t.comfyPathPlaceholder}
                                className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                            />
                       </div>
                   </div>

                   <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.comfyMethod}</label>
                       <select 
                           value={comfyMethod}
                           onChange={e => setComfyMethod(e.target.value)}
                           className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                       >
                           <option value="default">{t.methodDefault}</option>
                           <option value="nvidia">run_nvidia_gpu.bat</option>
                           <option value="nvidia_fast">run_nvidia_gpu_fast_fp16_accumulation.bat</option>
                       </select>
                   </div>

                   <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.comfyArgs}</label>
                       <input 
                           type="text" 
                           value={comfyArgs}
                           onChange={e => setComfyArgs(e.target.value)}
                           placeholder="--highvram --preview-method auto"
                           className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white"
                       />
                   </div>

                   <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-700">
                        <input 
                            type="checkbox" 
                            id="comfyAdmin"
                            checked={comfyAdmin}
                            onChange={e => setComfyAdmin(e.target.checked)}
                            className="w-5 h-5 accent-blue-600"
                        />
                        <label htmlFor="comfyAdmin" className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer select-none">
                            🛡️ {t.runAsAdmin}
                        </label>
                   </div>

                   <button 
                       onClick={handleSaveComfy}
                       className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                   >
                       {t.save}
                   </button>
               </div>
           </div>
       )}

       {/* BACKUP */}

       <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm transition-colors">

           <div className="flex items-center gap-4 mb-6">

               <span className="text-3xl">💾</span>

               <div>

                   <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.dbBackup}</h3>

                   <p className="text-gray-500 dark:text-gray-400 text-sm">{t.savePrompts}</p>

               </div>

           </div>



           <div className="space-y-4">

               <button 

                  onClick={handleExport}

                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors group"

               >

                   <div className="text-left">

                       <div className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors">{t.createBackup}</div>

                       <div className="text-xs text-gray-400">{t.backupSub}</div>

                   </div>

                   <span className="text-2xl">📥</span>

               </button>



               <div className="pt-6 border-t border-gray-100 dark:border-zinc-700">

                   <button 

                      onClick={handleReset}

                      className="w-full text-center p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/40"

                   >

                       ⚠️ {t.resetDb}

                   </button>

               </div>

           </div>

       </div>



    </div>

  );

}
