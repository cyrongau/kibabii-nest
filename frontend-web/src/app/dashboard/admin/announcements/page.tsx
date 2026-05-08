'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  Loader2, 
  Globe, 
  CheckCircle2,
  Bell,
  Clock,
  XCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function AdminAnnouncements() {
  const { showToast } = useNotifications();
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GENERAL',
    expiresAt: ''
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/notices/general', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch notices');
      setNotices(await response.json());
    } catch (error) {
      showToast('Failed to load announcements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch('http://localhost:3000/notices/general', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to post announcement');
      
      showToast('Announcement posted successfully!', 'success');
      setFormData({ title: '', content: '', type: 'GENERAL', expiresAt: '' });
      setShowForm(false);
      fetchNotices();
    } catch (error) {
      showToast('Failed to post. Ensure system property is configured.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete');
      showToast('Announcement deleted', 'success');
      fetchNotices();
    } catch (error) {
      showToast('Failed to delete announcement', 'error');
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Community Broadcast Matrix</h1>
          <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm lg:text-base">Synchronize critical updates and alert protocols across the student mobile network. Manage global announcements and security briefings.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all duration-500 flex items-center justify-center gap-4 group relative overflow-hidden ${
            showForm 
            ? 'bg-muted text-foreground border border-border-subtle hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 shadow-soft-sm' 
            : 'bg-primary text-white shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] brand-shadow'
          }`}
        >
          {showForm ? <XCircle size={20} className="group-hover:rotate-90 transition-transform" /> : <Plus size={20} className="group-hover:rotate-90 transition-transform" />}
          {showForm ? 'Abort Dispatch' : 'Initiate Broadcast'}
        </button>
      </header>

      {showForm && (
        <section className="card-premium p-10 lg:p-14 border-border-subtle shadow-soft-2xl animate-in fade-in slide-in-from-top-10 duration-700 overflow-hidden relative group bg-card/30 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000"></div>
          
          <form onSubmit={handlePost} className="space-y-12 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] ml-1">Transmission Headline</label>
                <div className="relative group/input">
                  <Megaphone className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" size={22} />
                  <input 
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Critical Facility Maintenance Notice" 
                    className="w-full pl-16 pr-10 py-5 bg-background/50 border border-transparent focus:border-primary/20 rounded-[2rem] text-sm font-black text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-soft-sm" 
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] ml-1">Dispatch Category</label>
                <div className="relative group/input">
                  <Bell className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" size={22} />
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full pl-16 pr-12 py-5 bg-background/50 border border-transparent focus:border-primary/20 rounded-[2rem] text-sm font-black text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer shadow-soft-sm"
                  >
                    <option value="GENERAL">Standard Intelligence</option>
                    <option value="URGENT">Immediate Alert</option>
                    <option value="EVENT">Community Gathering</option>
                    <option value="SECURITY">Safety Protocol</option>
                  </select>
                  <ChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground/30 rotate-90 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] ml-1">Intelligence Content</label>
              <textarea 
                rows={6}
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Synchronize detailed message parameters here. Be precise and professional..." 
                className="w-full px-10 py-8 bg-background/50 border border-transparent focus:border-primary/20 rounded-[2.5rem] text-sm font-bold text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none shadow-soft-sm" 
              />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-border-subtle/50">
              <div className="text-[9px] font-black text-muted-foreground/30 italic uppercase tracking-[0.3em] flex items-center gap-3">
                <ShieldCheck size={14} className="text-primary/40" />
                Authorized for global community transmission
              </div>
              <button 
                type="submit"
                disabled={isPosting}
                className="w-full md:w-auto bg-foreground text-background px-14 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.05] active:scale-[0.95] transition-all duration-500 flex items-center justify-center gap-4 disabled:opacity-70 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {isPosting ? <Loader2 className="animate-spin" size={20} /> : <Globe size={20} className="group-hover:rotate-12 transition-transform" />}
                Deploy Signal
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card-premium p-10 lg:p-14 border-border-subtle shadow-soft-2xl overflow-hidden min-h-[500px] relative bg-card/20 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-soft-sm border border-primary/20">
              <Bell size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter">Active Intelligence Stream</h3>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] mt-1.5 flex items-center gap-3 italic">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                Real-time transmission ledger
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] bg-muted/30 px-6 py-3 rounded-2xl border border-border-subtle shadow-soft-sm">
            History Archives
          </div>
        </div>

        {isLoading ? (
          <div className="py-40 flex flex-col items-center gap-8 text-muted-foreground/40 font-black animate-in fade-in duration-1000">
            <Loader2 className="animate-spin text-primary" size={64} />
            <span className="text-[10px] uppercase tracking-[0.4em] italic">Scanning transmission nodes...</span>
          </div>
        ) : notices.length > 0 ? (
          <div className="grid grid-cols-1 gap-10">
            {notices.map((notice) => (
              <div key={notice.id} className="flex flex-col md:flex-row items-start justify-between p-10 bg-muted/10 rounded-[3rem] border border-border-subtle group hover:border-primary/20 hover:bg-muted/20 transition-all duration-700 shadow-soft-sm relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 translate-y-16 blur-2xl group-hover:bg-primary/10 transition-colors duration-1000"></div>
                
                <div className="flex gap-8 items-start relative z-10">
                  <div className={`p-6 rounded-[2rem] shrink-0 shadow-soft-md transition-all duration-700 group-hover:scale-110 ${
                    notice.type === 'URGENT' ? 'badge-tint badge-red' : 
                    notice.type === 'SECURITY' ? 'badge-tint badge-orange' : 'badge-tint badge-blue'
                  }`}>
                    <Megaphone size={32} />
                  </div>
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-5">
                      <h4 className="text-2xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{notice.title}</h4>
                      <span className={`px-5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 shadow-soft-sm badge-tint ${
                        notice.type === 'URGENT' ? 'badge-red' : 
                        notice.type === 'SECURITY' ? 'badge-orange' : 'badge-blue'
                      }`}>{notice.type}</span>
                    </div>
                    <p className="text-muted-foreground font-bold text-sm leading-relaxed max-w-4xl">{notice.content}</p>
                    <div className="flex items-center gap-8 pt-4">
                      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.25em]">
                        <Clock size={16} className="text-primary/20" />
                        Dispatched {new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="w-1.5 h-1.5 bg-muted-foreground/20 rounded-full"></div>
                      <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.25em]">Global Nodes: Active</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-8 md:mt-0 relative z-10">
                  <button 
                    onClick={() => handleDelete(notice.id)}
                    className="p-5 text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 rounded-[1.5rem] transition-all duration-500 md:opacity-0 group-hover:opacity-100 shadow-soft-sm border border-transparent hover:border-red-500/20"
                    title="Purge Intelligence"
                  >
                    <Trash2 size={26} />
                  </button>
                </div>
                {notice.type === 'URGENT' && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500/40 animate-pulse"></div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-48 text-center space-y-10 animate-in fade-in duration-1000">
            <div className="w-32 h-32 bg-muted/20 rounded-[3.5rem] border border-dashed border-border-subtle flex items-center justify-center mx-auto shadow-inner group">
              <Megaphone className="text-muted-foreground/10 group-hover:scale-110 transition-transform duration-700" size={56} />
            </div>
            <div className="space-y-4">
              <p className="text-3xl font-black text-foreground tracking-tighter">Silent Transmission Ledger</p>
              <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">No active community broadcasts detected in the current accounting cycle.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
