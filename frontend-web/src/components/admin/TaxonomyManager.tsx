'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Tag, 
  Home, 
  Loader2, 
  Search, 
  Settings2,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

type TaxonomyItem = {
  id: string;
  name: string;
  _count?: {
    properties?: number;
    units?: number;
  };
};

export default function TaxonomyManager() {
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<'types' | 'categories'>('types');
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'types' ? '/taxonomy/types' : '/taxonomy/categories';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
      const res = await fetch(`${baseUrl}${endpoint}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      showToast('Could not load taxonomy data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setIsSaving(true);
    try {
      const endpoint = activeTab === 'types' ? '/taxonomy/types' : '/taxonomy/categories';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName.trim() })
      });

      if (res.ok) {
        showToast(`${activeTab === 'types' ? 'Unit Type' : 'Category'} added successfully`, 'success');
        setNewItemName('');
        fetchItems();
      } else {
        const error = await res.json();
        showToast(error.message || 'Failed to save item', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure? This might affect existing properties.')) return;

    try {
      const endpoint = activeTab === 'types' ? `/taxonomy/types/${id}` : `/taxonomy/categories/${id}`;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
      const res = await fetch(`${baseUrl}${endpoint}`, { method: 'DELETE' });

      if (res.ok) {
        showToast('Item removed', 'success');
        fetchItems();
      } else {
        showToast('Cannot delete item in use', 'warning');
      }
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              Property Taxonomy
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md">
              Manage the classification system for properties and units. Changes here reflect across the entire platform.
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('types')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
                activeTab === 'types' 
                ? 'bg-white dark:bg-slate-900 text-primary shadow-lg shadow-primary/10' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Home size={18} />
              Unit Types
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
                activeTab === 'categories' 
                ? 'bg-white dark:bg-slate-900 text-primary shadow-lg shadow-primary/10' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Tag size={18} />
              Categories
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-lg">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="text-primary" size={20} />
              Add New {activeTab === 'types' ? 'Type' : 'Category'}
            </h3>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Display Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={activeTab === 'types' ? "e.g., Bed-Sitter" : "e.g., Luxury Studio"}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-4 px-5 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all font-bold placeholder:font-medium"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSaving || !newItemName.trim()}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Save {activeTab === 'types' ? 'Type' : 'Category'}
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex gap-3 text-slate-500 dark:text-slate-400">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-xs leading-relaxed font-medium">
                  Ensure names are concise and clear. This taxonomy is used by landlords when listing properties and by students during searches.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* List View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search taxonomy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 !pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">
                {filteredItems.length} Total
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                  <Loader2 className="animate-spin text-primary" size={32} />
                  <span className="font-bold uppercase tracking-widest text-[10px]">Synchronizing Catalog...</span>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="group bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 rounded-[1.5rem] hover:border-primary/30 hover:shadow-md transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-slate-800">
                          {activeTab === 'types' ? <Home size={18} /> : <Tag size={18} />}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 dark:text-white leading-tight">{item.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {activeTab === 'types' 
                              ? `${item._count?.units || 0} Units Assigned` 
                              : `${item._count?.properties || 0} Properties`
                            }
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-12">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
                    <Settings2 size={40} className="opacity-20" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No items found</h3>
                  <p className="text-sm font-medium max-w-xs">Try adjusting your search or add a new {activeTab === 'types' ? 'unit type' : 'category'} to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
