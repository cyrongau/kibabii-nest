'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Bell, Clock, Trash2, Send, Home, Loader2, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function LandlordNoticesPage() {
  const { showToast } = useNotifications();
  const [notices, setNotices] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    propertyId: '',
    title: '',
    content: '',
    type: 'GENERAL',
    expiresAt: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const propsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/landlord/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (propsRes.ok) {
        const props = await propsRes.json();
        setProperties(props);
        if (props.length > 0) {
          setFormData(prev => ({ ...prev, propertyId: props[0].id }));
          
          // Fetch notices for all properties
          const allNotices = await Promise.all(props.map(async (p: any) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/notices/property/${p.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.ok ? await res.json() : [];
          }));
          setNotices(allNotices.flat().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/notices/property/${formData.propertyId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast('Notice sent to all active tenants', 'success');
        setIsModalOpen(false);
        setFormData({ propertyId: properties[0]?.id || '', title: '', content: '', type: 'GENERAL', expiresAt: '' });
        fetchData();
      }
    } catch (e) {
      showToast('Failed to send notice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (response.ok) {
        showToast('Notice deleted', 'success');
        fetchData();
      }
    } catch (e) {
      showToast('Failed to delete', 'error');
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'MAINTENANCE': return 'bg-amber-50 text-amber-600 border-amber-100 icon-amber';
      case 'RULES_UPDATE': return 'bg-purple-50 text-purple-600 border-purple-100 icon-purple';
      case 'AGREEMENT_UPDATE': return 'bg-blue-50 text-blue-600 border-blue-100 icon-blue';
      default: return 'bg-slate-50 text-slate-600 border-slate-100 icon-slate';
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-12 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Broadcast Notices</h1>
          <p className="text-muted-foreground font-medium mt-1">Send important updates to your tenants across all properties.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 brand-shadow"
        >
          <Plus size={20} /> Create New Broadcast
        </button>
      </header>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 text-muted-foreground/40 font-bold">
          <Loader2 className="animate-spin text-primary" size={40} />
          <span className="text-[10px] font-black uppercase tracking-widest">Scanning network...</span>
        </div>
      ) : notices.length === 0 ? (
        <div className="card-premium p-24 text-center shadow-soft">
          <Megaphone className="mx-auto text-muted-foreground/10 mb-8" size={80} />
          <h2 className="text-2xl font-black text-foreground tracking-tight">No broadcasts yet</h2>
          <p className="text-muted-foreground font-medium mt-2 max-w-sm mx-auto leading-relaxed">Communicate maintenance, rule changes, or events to your tenants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {notices.map((notice) => (
            <div key={notice.id} className="card-premium p-8 shadow-soft hover:shadow-soft-lg transition-all group relative border-border-subtle overflow-hidden">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 border-background shadow-soft-sm ${
                    notice.type === 'MAINTENANCE' ? 'badge-orange text-orange-500' :
                    notice.type === 'RULES_UPDATE' ? 'badge-red text-red-500' :
                    notice.type === 'AGREEMENT_UPDATE' ? 'badge-blue text-blue-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {notice.type === 'MAINTENANCE' && <Clock size={28} />}
                    {notice.type === 'RULES_UPDATE' && <AlertTriangle size={28} />}
                    {notice.type === 'AGREEMENT_UPDATE' && <ShieldCheck size={28} />}
                    {notice.type === 'GENERAL' && <Megaphone size={28} />}
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <h3 className="text-2xl font-black text-foreground tracking-tight">{notice.title}</h3>
                      <span className={`badge-tint px-3 py-1 ${
                        notice.type === 'MAINTENANCE' ? 'badge-orange' :
                        notice.type === 'RULES_UPDATE' ? 'badge-red' :
                        notice.type === 'AGREEMENT_UPDATE' ? 'badge-blue' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {notice.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-foreground/70 font-medium leading-relaxed max-w-4xl text-lg">{notice.content}</p>
                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border-subtle">
                      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground/60 uppercase tracking-widest">
                        <Home size={14} /> {properties.find(p => p.id === notice.propertyId)?.name || 'Property'}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground/60 uppercase tracking-widest">
                        <Bell size={14} /> Sent {new Date(notice.createdAt).toLocaleDateString()}
                      </div>
                      {notice.expiresAt && (
                        <div className="flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest">
                          <Clock size={14} /> Expires {new Date(notice.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(notice.id)}
                  className="p-3 text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all shrink-0"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-popover border border-border rounded-[3rem] w-full max-w-2xl shadow-soft-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <header className="p-10 border-b border-border-subtle flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-soft-sm">
                  <Megaphone size={24} />
                </div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Create Broadcast</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all">✕</button>
            </header>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Target Property</label>
                  <select 
                    required
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    className="w-full px-7 py-4.5 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                  >
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Category</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-7 py-4.5 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                    >
                      <option value="GENERAL">General Announcement</option>
                      <option value="MAINTENANCE">Maintenance Notice</option>
                      <option value="RULES_UPDATE">Rule Update</option>
                      <option value="AGREEMENT_UPDATE">Agreement Update</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Expiry Date (Optional)</label>
                    <input 
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full px-7 py-4.5 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Subject Line</label>
                  <input 
                    required
                    placeholder="e.g. Scheduled Water Maintenance"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-7 py-4.5 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-muted-foreground/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Detailed Message</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Provide details about the notice. This will be sent as a push notification to all active tenants."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-7 py-4.5 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all resize-none placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-4.5 bg-muted text-muted-foreground rounded-2xl font-black hover:bg-muted/80 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-8 py-4.5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] brand-shadow"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Transmit Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
