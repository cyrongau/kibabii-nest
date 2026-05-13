'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, FileText, CheckCircle, Eye, AlertTriangle, Loader2, Search } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AdminKycPage() {
  const { showToast } = useNotifications();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState<any>(null);

  const fetchKyc = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        status: activeTab,
        search: search
      });
      const userId = searchParams.get('userId');
      if (userId) params.append('userId', userId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/kyc/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/auth/admin';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setKycRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching KYC:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
  }, [activeTab, search]);

  const handleVerify = async (id: string, approved: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/kyc/admin/${id}/verify`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ approved })
      });

      if (!response.ok) throw new Error('Verification failed');
      
      showToast(approved ? 'Landlord verified successfully' : 'KYC rejected', approved ? 'success' : 'info');
      setSelectedKyc(null);
      fetchKyc();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <main className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Landlord Verification</h1>
          <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm lg:text-base">Review and verification of landlord identity documents and property ownership proof.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
          {searchParams.get('userId') && (
            <button 
              onClick={() => router.push('/dashboard/admin/kyc')}
              className="px-6 py-3.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-3 shadow-soft-sm"
            >
              <XCircle size={16} /> Clear Filter
            </button>
          )}
          <div className="relative group w-full md:w-72">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Filter Registry..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-12 py-4.5 bg-muted/20 border border-transparent focus:border-primary/20 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] focus:outline-none focus:ring-4 focus:ring-primary/5 text-foreground placeholder:text-muted-foreground/20 transition-all shadow-soft-sm"
            />
          </div>
          <div className="bg-card/50 backdrop-blur-md border border-border-subtle p-2 rounded-[1.5rem] flex gap-1 shadow-soft-xl">
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] transition-all ${
                  activeTab === tab 
                    ? 'bg-primary text-white shadow-soft-xl shadow-primary/20 scale-[1.05] relative z-10' 
                    : 'text-muted-foreground/40 hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {kycRequests.length === 0 ? (
        <div className="card-premium p-32 shadow-soft-2xl flex flex-col items-center justify-center text-center border-border-subtle relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-32 -translate-y-32 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000"></div>
          <div className="w-24 h-24 bg-muted/40 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 transition-transform duration-500">
             <ShieldCheck size={48} className="text-muted-foreground/10 group-hover:text-primary/20 transition-colors" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">All Requests Processed</h2>
            <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">No {activeTab.toLowerCase()} verification requests found.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {kycRequests.map((kyc) => (
            <div key={kyc.id} className="card-premium p-10 shadow-soft-xl hover:shadow-soft-2xl transition-all duration-500 border-border-subtle group relative overflow-hidden flex flex-col hover:scale-[1.02]">
              {kyc.status !== 'PENDING' && (
                <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-[2rem] text-[10px] font-black uppercase tracking-[0.25em] shadow-soft-sm ${
                  kyc.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {kyc.status}
                </div>
              )}
              
              <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 bg-muted/40 text-primary rounded-[1.5rem] flex items-center justify-center font-black text-2xl border border-border-subtle group-hover:scale-110 transition-all duration-500 shadow-inner">
                  {kyc.user.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-foreground text-xl tracking-tighter group-hover:text-primary transition-colors">{kyc.user.name}</h3>
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">{kyc.user.email}</p>
                </div>
              </div>
              
              <div className="space-y-5 mb-12 flex-1">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="text-muted-foreground/30">Phone</span>
                  <span className="text-foreground">{kyc.user.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="text-muted-foreground/30">Submission Date</span>
                  <span className="text-foreground">{new Date(kyc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="text-muted-foreground/30">AI Assessment</span>
                  <span className={`px-4 py-1.5 rounded-xl border ${kyc.aiAnalysis?.confidence > 0.8 ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' : 'text-amber-500 bg-amber-500/5 border-amber-500/10'}`}>
                    {kyc.aiAnalysis?.confidence ? `${(kyc.aiAnalysis.confidence * 100).toFixed(0)}% Match` : 'ANALYZING...'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedKyc(kyc)}
                className="w-full bg-foreground text-background py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.25em] hover:bg-primary hover:text-white transition-all duration-500 flex items-center justify-center gap-4 shadow-soft-xl brand-shadow"
              >
                <Eye size={20} /> Review Application
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-background/40 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card/80 backdrop-blur-md border border-border-subtle rounded-[4rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-soft-2xl animate-in zoom-in-95 duration-500 relative">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full translate-x-32 -translate-y-32 blur-[10rem] pointer-events-none"></div>

            <div className="px-12 py-10 border-b border-border-subtle flex justify-between items-center bg-muted/10 relative z-10">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-primary/10 rounded-[1.75rem] flex items-center justify-center text-primary shadow-soft-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                  <ShieldCheck size={40} className="relative z-10" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">Security Review: {selectedKyc.user.name}</h2>
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em]">Entity Intelligence Authorization Protocol</p>
                </div>
              </div>
              <button onClick={() => setSelectedKyc(null)} className="p-6 text-muted-foreground/40 hover:text-foreground hover:bg-muted rounded-[1.5rem] transition-all shadow-soft-sm group">
                <XCircle size={28} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 lg:grid-cols-3 gap-12 scrollbar-hide relative z-10">
              {/* Documents Column */}
              <div className="lg:col-span-2 space-y-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 ml-4 flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <FileText size={16} />
                    </div>
                    Identity Document
                  </h3>
                  <div className="bg-muted/40 rounded-[3.5rem] overflow-hidden border border-border-subtle shadow-soft-2xl group relative">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                    {selectedKyc.idDocumentUrl.endsWith('.pdf') ? (
                       <embed src={selectedKyc.idDocumentUrl} type="application/pdf" className="w-full h-[40rem]" />
                    ) : (
                       <img src={selectedKyc.idDocumentUrl} alt="ID Document" className="w-full h-[40rem] object-contain group-hover:scale-[1.02] transition-transform duration-1000" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 ml-4 flex items-center gap-4">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                      <FileText size={16} />
                    </div>
                    Ownership Proof
                  </h3>
                  <div className="bg-muted/40 rounded-[3.5rem] overflow-hidden border border-border-subtle shadow-soft-2xl group relative">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                    {selectedKyc.ownershipProofUrl.endsWith('.pdf') ? (
                       <embed src={selectedKyc.ownershipProofUrl} type="application/pdf" className="w-full h-[40rem]" />
                    ) : (
                       <img src={selectedKyc.ownershipProofUrl} alt="Ownership Proof" className="w-full h-[40rem] object-contain group-hover:scale-[1.02] transition-transform duration-1000" />
                    )}
                  </div>
                </div>
              </div>

              {/* AI Analysis Column */}
              <div className="space-y-10">
                <div className="sticky top-0 space-y-10">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-4">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-glow"></div>
                    AI Verification Engine
                  </h3>
                  
                  <div className="bg-card p-10 rounded-[3.5rem] border border-border-subtle space-y-10 shadow-soft-xl relative overflow-hidden group/card">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 -translate-y-16 blur-2xl pointer-events-none transition-colors group-hover/card:bg-primary/10"></div>
                    
                    <div className="space-y-8 relative z-10">
                       <div className="space-y-3">
                         <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30 block ml-1">Name on ID</span>
                         <div className="font-black text-foreground text-sm bg-muted/30 px-6 py-4.5 rounded-2xl border border-border-subtle group-hover/card:border-primary/20 transition-all">{selectedKyc.aiAnalysis?.idName || 'PENDING'}</div>
                       </div>
                       <div className="space-y-3">
                         <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30 block ml-1">ID Number</span>
                         <div className="font-black text-foreground text-sm bg-muted/30 px-6 py-4.5 rounded-2xl border border-border-subtle group-hover/card:border-primary/20 transition-all">{selectedKyc.aiAnalysis?.idNumber || 'PENDING'}</div>
                       </div>
                       <div className="space-y-3">
                         <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30 block ml-1">Ownership Name</span>
                         <div className="font-black text-foreground text-sm bg-muted/30 px-6 py-4.5 rounded-2xl border border-border-subtle group-hover/card:border-primary/20 transition-all">{selectedKyc.aiAnalysis?.ownershipName || 'PENDING'}</div>
                       </div>
                       <div className="flex items-center justify-between bg-muted/30 px-7 py-5 rounded-[1.5rem] border border-border-subtle group-hover/card:border-primary/20 transition-all">
                         <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">Verification Status</span>
                         <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-soft-sm ${selectedKyc.aiAnalysis?.namesMatch ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                           {selectedKyc.aiAnalysis?.namesMatch ? 'MATCHED' : 'NO MATCH'}
                         </span>
                       </div>
                    </div>

                    {selectedKyc.aiAnalysis?.flags && selectedKyc.aiAnalysis.flags.length > 0 && (
                      <div className="bg-red-500/5 p-8 rounded-[2.5rem] border border-red-500/10 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-4">
                          <AlertTriangle size={18} /> Potential Issues
                        </div>
                        <ul className="space-y-3">
                          {selectedKyc.aiAnalysis.flags.map((flag: string, i: number) => (
                            <li key={i} className="text-[11px] font-bold text-red-900/60 dark:text-red-200/60 leading-relaxed flex items-start gap-3">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0 shadow-glow-red"></span>
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-6 pt-10 border-t border-border-subtle">
                    <button 
                      onClick={() => handleVerify(selectedKyc.id, true)}
                      className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                    >
                      <CheckCircle size={22} className="group-hover:rotate-12 transition-transform" /> Approve Verification
                    </button>
                    <button 
                      onClick={() => handleVerify(selectedKyc.id, false)}
                      className="w-full bg-muted text-foreground py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] border border-border-subtle hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                    >
                      <XCircle size={22} className="group-hover:rotate-12 transition-transform" /> Reject Application
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
