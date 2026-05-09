'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Banknote, 
  CalendarCheck, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Download,
  Building2,
  Users,
  CreditCard
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

function StatCard({ label, value, trend, icon, positive, badgeClass }: any) {
  return (
    <div className="card-premium p-8 shadow-soft-xl hover:shadow-soft-2xl transition-all duration-500 border-border-subtle group relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 -translate-y-16 blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000"></div>
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`p-4 rounded-2xl badge-tint ${badgeClass} shadow-soft-sm group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-soft-sm badge-tint ${badgeClass} border border-white/5`}>
          {positive ? <ArrowUpRight size={12} className="animate-bounce" /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.25em] mb-1.5">Financial Node</div>
        <div className="text-3xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{value}</div>
        <div className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1 leading-none">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string, icon: any, label: string }> = {
    'VERIFIED': { color: 'badge-emerald', icon: CheckCircle2, label: 'Verified' },
    'PAID': { color: 'badge-emerald', icon: Banknote, label: 'Settled' },
    'PENDING': { color: 'badge-slate', icon: Clock, label: 'Awaiting Audit' },
    'OVERDUE': { color: 'badge-red', icon: AlertCircle, label: 'Risk Exposure' },
    'SUBMITTED': { color: 'badge-orange', icon: Clock, label: 'Submitted' },
    'REJECTED': { color: 'badge-red', icon: XCircle, label: 'Declined' }
  };

  const { color, icon: Icon, label } = config[status] || { color: 'badge-slate', icon: Clock, label: status };

  return (
    <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 w-max shadow-soft-sm badge-tint ${color} border border-white/5`}>
      <Icon size={14} className={(status === 'OVERDUE' || status === 'PENDING') ? 'animate-pulse' : ''} /> {label}
    </span>
  );
}

function WithdrawalStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string, icon: any, label: string }> = {
    'COMPLETED': { color: 'badge-emerald', icon: CheckCircle2, label: 'Liquidated' },
    'PENDING': { color: 'badge-orange', icon: Clock, label: 'Pending Audit' },
    'REJECTED': { color: 'badge-red', icon: XCircle, label: 'Denied' }
  };

  const { color, icon: Icon, label } = config[status] || { color: 'badge-slate', icon: Clock, label: status };

  return (
    <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 w-max shadow-soft-sm badge-tint ${color} border border-white/5`}>
      <Icon size={14} className={status === 'PENDING' ? 'animate-pulse' : ''} /> {label}
    </span>
  );
}

export default function AdminFinanceOverwatch() {
  const { showToast } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'revenue' | 'payouts' | 'wallet'>('revenue');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` };
      const [summaryRes, historyRes, withdrawalsRes, transactionsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/payments/admin/summary`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/payments/admin/history`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/wallet/admin/withdrawals`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/wallet/admin/transactions`, { headers })
      ]);

      if (!summaryRes.ok || !historyRes.ok || !withdrawalsRes.ok || !transactionsRes.ok) throw new Error('Failed to fetch finance data');

      setSummary(await summaryRes.json());
      setHistory(await historyRes.json());
      setWithdrawals(await withdrawalsRes.json());
      setTransactions(await transactionsRes.json());
    } catch (error) {
      showToast('Failed to load finance data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter(p => 
    p.tenancy?.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tenancy?.propertyUnit?.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mpesaReceiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWithdrawals = withdrawals.filter(w => 
    w.landlord?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.landlord?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => 
    t.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/wallet/admin/withdrawals/${selectedWithdrawal.id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!res.ok) throw new Error('Approval failed');
      showToast('Payout liquidated successfully', 'success');
      fetchData();
      setIsApproveOpen(false);
    } catch (error) {
      showToast('Action failed', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      showToast('Please provide a reason', 'warning');
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/wallet/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (!res.ok) throw new Error('Rejection failed');
      showToast('Withdrawal rejected and funds refunded', 'info');
      fetchData();
      setIsRejectOpen(false);
      setRejectReason('');
    } catch (error) {
      showToast('Action failed', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center h-[70vh] gap-8 animate-in fade-in duration-1000">
        <Loader2 className="animate-spin text-primary" size={64} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">Aggregating platform revenue flows...</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Finance Overwatch Matrix</h1>
          <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm lg:text-base">Audit global revenue flows, payout distributions, and cross-sector transaction integrity.</p>
        </div>
        <div className="flex gap-6 w-full md:w-auto">
           <button className="flex-1 md:flex-none px-10 py-5 bg-foreground text-background rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-primary hover:text-white transition-all duration-500 shadow-soft-2xl brand-shadow group">
             <Download size={20} className="group-hover:translate-y-1 transition-transform" />
             Export Financial Intelligence
           </button>
        </div>
      </header>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          label="Cumulative Revenue" 
          value={`Ksh ${(summary?.totalRevenue || 0).toLocaleString()}`} 
          trend="+12% VS PREV" 
          positive={true}
          icon={<TrendingUp size={24} />} 
          badgeClass="badge-emerald"
        />
        <StatCard 
          label="Risk Exposure" 
          value={`Ksh ${(summary?.overdueAmount || 0).toLocaleString()}`} 
          trend={summary?.overdueCount > 0 ? `${summary?.overdueCount} INCIDENTS` : 'SECURE'}
          positive={false}
          icon={<AlertCircle size={24} />} 
          badgeClass="badge-red"
        />
        <StatCard 
          label="Awaiting Audit" 
          value={summary?.submittedCount?.toString() || '0'} 
          trend="PRIORITY ALPHA" 
          positive={false}
          icon={<Clock size={24} />} 
          badgeClass="badge-orange"
        />
        <StatCard 
          label="Settled Payouts" 
          value={`Ksh ${(withdrawals.filter(w => w.status === 'COMPLETED').reduce((s, w) => s + w.amount, 0)).toLocaleString()}`} 
          trend="SYSTEM LIQUIDITY" 
          positive={true}
          icon={<CreditCard size={24} />} 
          badgeClass="badge-blue"
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 p-2 bg-muted/20 rounded-[2.5rem] w-max border border-border-subtle backdrop-blur-sm self-center mx-auto shadow-soft-sm">
        <button 
          onClick={() => setActiveTab('revenue')}
          className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'revenue' ? 'bg-foreground text-background shadow-soft-xl' : 'text-muted-foreground/40 hover:text-foreground'}`}
        >
          Revenue Ledger
        </button>
        <button 
          onClick={() => setActiveTab('payouts')}
          className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'payouts' ? 'bg-foreground text-background shadow-soft-xl' : 'text-muted-foreground/40 hover:text-foreground'}`}
        >
          Payout Liquidation
          {withdrawals.filter(w => w.status === 'PENDING').length > 0 && (
            <span className="ml-3 px-2 py-0.5 bg-primary text-white rounded-full text-[8px] animate-pulse">
              {withdrawals.filter(w => w.status === 'PENDING').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('wallet')}
          className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'wallet' ? 'bg-foreground text-background shadow-soft-xl' : 'text-muted-foreground/40 hover:text-foreground'}`}
        >
          Wallet Surveillance
        </button>
      </div>

      {/* Transaction Log */}
      <section className="card-premium shadow-soft-2xl overflow-hidden border-border-subtle relative bg-card/30 backdrop-blur-md animate-in slide-in-from-bottom-10 duration-1000">
        <div className="p-12 border-b border-border-subtle bg-muted/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-soft-sm border border-primary/20">
              {activeTab === 'revenue' ? <Banknote size={32} /> : <CreditCard size={32} />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter">
                {activeTab === 'revenue' ? 'Global Transaction Ledger' : activeTab === 'payouts' ? 'Payout Settlement Matrix' : 'Wallet Surveillance Registry'}
              </h3>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] mt-1.5 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                {activeTab === 'revenue' ? 'Real-time registry surveillance' : 'Asset Liquidation Protocol'}
              </p>
            </div>
          </div>
          
          <div className="relative w-full lg:w-[32rem] group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={22} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'revenue' ? "Search entity, asset or receipt signature..." : activeTab === 'payouts' ? "Search landlord or node identifier..." : "Search user, reference or signature..."} 
              className="w-full pl-20 pr-10 py-5 bg-background border border-transparent focus:border-primary/20 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.15em] text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-soft-sm" 
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          {activeTab === 'revenue' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground/60">
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Sovereign Entity / Node</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Accounting Cycle</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Valuation Matrix</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Credential Signature</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Integrity Status</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Surveillance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredHistory.map((p) => (
                  <tr key={p.id} className="group hover:bg-muted/30 transition-all duration-300">
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-muted rounded-[1.5rem] flex items-center justify-center shrink-0 border border-border-subtle shadow-soft-sm group-hover:scale-110 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-500">
                           <Users size={24} className="text-muted-foreground/20 group-hover:text-primary/60 transition-colors" />
                        </div>
                        <div>
                          <div className="text-base font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{p.tenancy?.tenant?.name || 'ANONYMOUS NODE'}</div>
                          <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                            <Building2 size={12} className="text-muted-foreground/20" /> {p.tenancy?.propertyUnit?.property?.name || 'Standard Accommodation'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-8 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em]">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(p.year, p.month - 1))}
                    </td>
                    <td className="px-12 py-8">
                      <div className="text-base font-black text-foreground tracking-tight group-hover:text-primary transition-colors">Ksh {(p.amountPaid || p.amountDue).toLocaleString()}</div>
                      <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1 italic">Due: {new Date(p.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-12 py-8 font-mono text-[11px] text-muted-foreground/40 font-black uppercase tracking-[0.2em]">
                      {p.mpesaReceiptNumber || p.receipt?.aiTransactionId || 'LEGACY_TRANS'}
                    </td>
                    <td className="px-12 py-8">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-12 py-8 text-right">
                      <button className="p-4 text-muted-foreground/20 hover:text-foreground hover:bg-muted rounded-[1.25rem] transition-all shadow-soft-sm border border-transparent hover:border-border-subtle">
                        <MoreVertical size={24} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'payouts' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground/60">
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Asset Provider / Landlord</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Liquidation Details</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Target Valuation</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Status</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Liquidation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="group hover:bg-muted/30 transition-all duration-300">
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-muted rounded-[1.5rem] flex items-center justify-center shrink-0 border border-border-subtle shadow-soft-sm group-hover:scale-110 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-500">
                           <Building2 size={24} className="text-muted-foreground/20 group-hover:text-primary/60 transition-colors" />
                        </div>
                        <div>
                          <div className="text-base font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{w.landlord?.name}</div>
                          <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1.5">{w.landlord?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-8">
                       <div className="text-[11px] font-black text-foreground tracking-tighter uppercase">{w.method} / {w.landlord?.bankName || 'BANK_UNSET'}</div>
                       <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1">{w.landlord?.accountNumber || 'ACCOUNT_UNSET'}</div>
                    </td>
                    <td className="px-12 py-8">
                      <div className="text-base font-black text-foreground tracking-tight group-hover:text-primary transition-colors">Ksh {w.amount.toLocaleString()}</div>
                      <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1 italic">{new Date(w.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-12 py-8">
                      <WithdrawalStatusBadge status={w.status} />
                    </td>
                    <td className="px-12 py-8 text-right">
                      {w.status === 'PENDING' ? (
                        <div className="flex justify-end gap-4">
                          <button 
                            onClick={() => { setSelectedWithdrawal(w); setIsRejectOpen(true); }}
                            className="p-4 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 rounded-[1.25rem] transition-all border border-transparent hover:border-red-500/20"
                          >
                            <XCircle size={22} />
                          </button>
                          <button 
                            onClick={() => { setSelectedWithdrawal(w); setIsApproveOpen(true); }}
                            className="p-4 text-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/5 rounded-[1.25rem] transition-all border border-transparent hover:border-emerald-500/20 shadow-soft-sm"
                          >
                            <CheckCircle2 size={22} />
                          </button>
                        </div>
                      ) : (
                         <div className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">PROCESSED</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground/60">
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">User Node</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Transaction Registry</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Valuation</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Type / Signature</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="group hover:bg-muted/30 transition-all duration-300">
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-muted rounded-[1.5rem] flex items-center justify-center shrink-0 border border-border-subtle shadow-soft-sm group-hover:scale-110 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-500">
                           <Users size={24} className="text-muted-foreground/20 group-hover:text-primary/60 transition-colors" />
                        </div>
                        <div>
                          <div className="text-base font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{t.user?.name}</div>
                          <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1.5">{t.user?.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-8">
                       <div className="text-[11px] font-black text-foreground tracking-tighter uppercase max-w-[200px] truncate">{t.description}</div>
                       <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1">{new Date(t.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="px-12 py-8">
                      <div className={`text-base font-black tracking-tight ${t.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t.amount >= 0 ? '+' : ''}Ksh {t.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-12 py-8">
                       <div className="text-[10px] font-black text-foreground tracking-widest uppercase">{t.type}</div>
                       <div className="text-[10px] font-mono text-muted-foreground/30 mt-1 truncate max-w-[150px]">{t.reference || 'SYSTEM_GEN'}</div>
                    </td>
                    <td className="px-12 py-8">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {((activeTab === 'revenue' && filteredHistory.length === 0) || (activeTab === 'payouts' && filteredWithdrawals.length === 0)) && (
            <div className="py-40 text-center space-y-10 animate-in fade-in duration-700">
              <div className="w-28 h-28 bg-muted/40 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner border-2 border-dashed border-border-subtle group">
                <Banknote className="text-muted-foreground/10 group-hover:scale-110 transition-transform duration-500" size={56} />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-foreground tracking-tighter">Zero Ledger Artifacts</h3>
                <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-[0.25em] max-w-sm mx-auto leading-relaxed">No records match the specified surveillance parameters in the registry matrix.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Approval Modal */}
      {isApproveOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="sm:max-w-[500px] w-full bg-background border border-border-subtle rounded-[2.5rem] shadow-soft-2xl overflow-hidden p-0 relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl pointer-events-none"></div>
            
            <div className="p-10 space-y-8 relative z-10 text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-soft-sm border border-emerald-500/20 mx-auto">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-foreground tracking-tighter">Confirm Payout Liquidation</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
                  Authorized asset distribution protocol
                </p>
              </div>

              <div className="bg-muted/30 rounded-[2rem] p-8 border border-border-subtle space-y-6 text-left">
                <div className="flex justify-between items-center pb-6 border-b border-border-subtle">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Amount to Transfer</span>
                  <span className="text-2xl font-black text-emerald-500 tracking-tighter">Ksh {selectedWithdrawal?.amount?.toLocaleString()}</span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-muted-foreground/40 uppercase tracking-widest">Recipient Node</span>
                    <span className="text-foreground tracking-tight">{selectedWithdrawal?.landlord?.name}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-muted-foreground/40 uppercase tracking-widest">Target Account</span>
                    <span className="text-foreground tracking-tight">{selectedWithdrawal?.landlord?.bankName} - {selectedWithdrawal?.landlord?.accountNumber}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium">
                By approving this, you confirm that manual payment has been initiated to the landlord's account via the specified method. This action is irreversible in the ledger.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setIsApproveOpen(false)}
                  className="flex-1 rounded-[1.5rem] py-4 bg-muted/20 border border-border-subtle text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted/50 transition-all"
                >
                  Cancel Protocol
                </button>
                <button 
                  onClick={handleApprove}
                  className="flex-1 rounded-[1.5rem] py-4 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all duration-500 shadow-soft-xl"
                >
                  Liquidate Assets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="sm:max-w-[500px] w-full bg-background border border-border-subtle rounded-[2.5rem] shadow-soft-2xl overflow-hidden p-0 relative">
            <div className="p-10 space-y-8 text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 shadow-soft-sm border border-red-500/20 mx-auto">
                  <XCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-foreground tracking-tighter">Deny Withdrawal Request</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
                  Asset retention & refund protocol
                </p>
              </div>

              <div className="space-y-4 text-left">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-4">Audit Rejection Reason</label>
                <input 
                  placeholder="e.g., Discrepancy in bank credentials..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-muted/30 border border-border-subtle rounded-[1.5rem] p-6 h-16 text-[11px] font-black placeholder:text-muted-foreground/20 focus:ring-4 focus:ring-red-500/5 focus:border-red-500/40 focus:outline-none transition-all"
                />
              </div>

              <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium">
                Denying this request will automatically refund the Ksh {selectedWithdrawal?.amount?.toLocaleString()} back to the landlord's wallet balance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setIsRejectOpen(false)}
                  className="flex-1 rounded-[1.5rem] py-4 bg-muted/20 border border-border-subtle text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted/50 transition-all"
                >
                  Abort Rejection
                </button>
                <button 
                  onClick={handleReject}
                  className="flex-1 rounded-[1.5rem] py-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all duration-500 shadow-soft-xl"
                >
                  Execute Denial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
