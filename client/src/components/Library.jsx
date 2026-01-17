import React, { useEffect, useState } from 'react';
import { DB } from '../lib/db';

const PromptCard = ({ item, onDelete, onCopy, onLoad, onToggleFavorite, t }) => {
  return (
    <div className={`bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border ${item.isFavorite ? 'border-yellow-400 dark:border-yellow-500/50' : 'border-gray-100 dark:border-zinc-700'} overflow-hidden hover:shadow-md transition-all group animate-fade-in flex flex-col relative`}>
      {/* Favorite Star */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, !item.isFavorite); }}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${item.isFavorite ? 'bg-yellow-400 text-white' : 'bg-gray-100/50 dark:bg-zinc-700/50 text-gray-400 hover:text-yellow-500'}`}
      >
        ⭐
      </button>

      <div className="p-5 flex-1 flex flex-col pt-12">
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags && item.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-gray-100 dark:border-zinc-700">
              {tag}
            </span>
          ))}
        </div>
        
        <p 
            className="text-sm text-secondary dark:text-gray-200 font-medium line-clamp-4 mb-6 leading-relaxed cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
            title={item.prompt}
            onClick={() => onLoad(item)}
        >
          {item.prompt}
        </p>

        {item.negative && (
          <div className="mb-6 p-3 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20">
            <span className="text-[10px] uppercase font-black text-red-400 dark:text-red-500/70 block mb-1">{t.negativePrompt}</span>
            <p className="text-xs text-red-700/70 dark:text-red-400/60 line-clamp-2 italic leading-relaxed">
              {item.negative}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-50 dark:border-zinc-700/50 pt-4 mt-auto">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            {new Date(item.date).toLocaleDateString()}
          </span>
          <div className="flex gap-1">
            <button onClick={() => { onLoad(item); }} title={t.openInGenerator} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-xs font-bold uppercase tracking-tighter">🚀</button>
            <button onClick={() => onCopy(item.prompt)} title={t.copy} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-xs font-bold uppercase tracking-tighter">📋</button>
            <button onClick={() => onDelete(item.id)} title="Delete" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs font-bold uppercase tracking-tighter">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Library({ onLoadItem, t }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, favorites

  const loadData = async () => {
    setLoading(true);
    const data = await DB.getAllItems();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if(!window.confirm(t.deleteConfirm)) return;
    await DB.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClearAll = async () => {
    if (!window.confirm(t.clearConfirm)) return;
    const success = await DB.deleteAllItems();
    if (success) {
        setItems([]);
    }
  };

  const handleToggleFavorite = async (id, status) => {
    await DB.toggleFavorite(id, status);
    setItems(prev => prev.map(item => item.id === id ? { ...item, isFavorite: status } : item));
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [newNegative, setNewNegative] = useState("");
  const [newTags, setNewTags] = useState("");

  const handleSaveNew = async () => {
    if (!newPrompt.trim()) return alert(t.ideaError);
    
    const newItem = {
        prompt: newPrompt,
        negative: newNegative,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
        date: new Date().toISOString(),
        isFavorite: false,
        settings: {}
    };

    try {
        await DB.addItem(newItem);
        // Refresh to get the ID from DB (re-loading is safer to sync IDs)
        loadData();
        setShowAddModal(false);
        setNewPrompt("");
        setNewNegative("");
        setNewTags("");
    } catch {
        alert(t.saveError);
    }
  };

  const filteredAndSortedItems = items
    .filter(i => 
      i.prompt.toLowerCase().includes(search.toLowerCase()) || 
      (i.tags && i.tags.join(" ").toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "favorites") {
          if (a.isFavorite === b.isFavorite) return new Date(b.date) - new Date(a.date);
          return a.isFavorite ? -1 : 1;
      }
      if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
      return new Date(b.date) - new Date(a.date); // newest
    });

  return (
    <div className="h-full flex flex-col animate-fade-in">
       
       {/* Toolbar */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div className="flex items-center gap-4 self-start">
               <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.promptLib} ({filteredAndSortedItems.length})</h3>
               {items.length > 0 && (
                   <button 
                    onClick={handleClearAll}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/20 transition-all"
                   >
                       {t.clearLibrary}
                   </button>
               )}
               <button 
                onClick={() => setShowAddModal(true)}
                className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/20 transition-all"
               >
                   + {t.addPrompt}
               </button>
           </div>
           
           <div className="flex w-full md:w-auto gap-3">
               <div className="relative flex-1 md:w-64">
                   <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                   <input 
                     type="text" 
                     placeholder={t.search} 
                     className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 outline-none text-sm transition-all"
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                   />
               </div>

               <select 
                 className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 outline-none focus:border-blue-500"
                 value={sortBy}
                 onChange={e => setSortBy(e.target.value)}
               >
                   <option value="newest">{t.newest}</option>
                   <option value="oldest">{t.oldest}</option>
                   <option value="favorites">{t.favorites}</option>
               </select>
           </div>
       </div>

       {/* Grid Content */}
       <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
           {loading ? (
               <div className="text-center py-20 text-gray-400 animate-pulse">{t.loadingLib}</div>
           ) : filteredAndSortedItems.length === 0 ? (
               <div className="text-center py-20 bg-gray-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-700">
                   <span className="text-4xl block mb-2">📭</span>
                   <p className="text-gray-500 dark:text-gray-400">{t.nothingFound}</p>
               </div>
           ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                   {filteredAndSortedItems.map(item => (
                       <PromptCard 
                           key={item.id} 
                           item={item} 
                           onDelete={handleDelete}
                           onCopy={(text) => { navigator.clipboard.writeText(text); alert(t.copySuccess); }}
                           onLoad={onLoadItem}
                           onToggleFavorite={handleToggleFavorite}
                           t={t}
                       />
                   ))}
               </div>
           )}
       </div>

       {/* Add Modal */}
       {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-zinc-700 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{t.addPrompt}</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.promptIdea}</label>
                        <textarea 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none h-32"
                            placeholder={t.enterPrompt}
                            value={newPrompt}
                            onChange={e => setNewPrompt(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.negativePrompt}</label>
                        <textarea 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none h-24"
                            placeholder={t.enterNegative}
                            value={newNegative}
                            onChange={e => setNewNegative(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tags</label>
                        <input 
                            type="text"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:border-blue-500 outline-none transition-all"
                            placeholder={t.enterTags}
                            value={newTags}
                            onChange={e => setNewTags(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-zinc-700 flex justify-end gap-2 bg-gray-50/50 dark:bg-zinc-900/50">
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        onClick={handleSaveNew}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform active:scale-95"
                    >
                        {t.save}
                    </button>
                </div>
            </div>
        </div>
       )}
    </div>
  );
}
