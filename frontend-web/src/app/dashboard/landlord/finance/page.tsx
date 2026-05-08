'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Clock, AlertTriangle, CheckCircle, XCircle, Eye, FileText, ArrowLeft } from 'lucide-react';

export default function LandlordFinancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('BANK');
  const [filter, setFilter] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        const [summaryRes, paymentsRes, balanceRes, withdrawalsRes] = await Promise.all([
          fetch('http://localhost:3000/payments/landlord/summary', { headers }),
          fetch('http://localhost:3000/payments/landlord', { headers }),
          fetch('http://localhost:3000/wallet/balance', { headers }),
          fetch('http://localhost:3000/wallet/history', { headers }),
        ]);

        if (summaryRes.ok) setSummary(await summaryRes.json());
        if (paymentsRes.ok) setPayments(await paymentsRes.json());
        if (balanceRes.ok) {
          const b = await balanceRes.json();
          setBalance(b.balance);
        }
        if (withdrawalsRes.ok) {
          const history = await withdrawalsRes.json();
          setWithdrawals(history.filter((t: any) => t.type === 'WITHDRAWAL'));
        }
      } catch (error) {
        console.error('Failed to fetch finance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleWithdrawRequest = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    setIsWithdrawing(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/wallet/withdraw', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          amount: parseFloat(withdrawAmount), 
          method: withdrawMethod 
        }),
      });
      if (res.ok) {
        setBalance(prev => prev - parseFloat(withdrawAmount));
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        // Refresh history
        const histRes = await fetch('http://localhost:3000/wallet/history', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (histRes.ok) {
          const history = await histRes.json();
          setWithdrawals(history.filter((t: any) => t.type === 'WITHDRAWAL'));
        }
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleVerify = async (paymentId: string, approved: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:3000/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      if (res.ok) {
        setPayments(prev => prev.map(p =>
          p.id === paymentId ? { ...p, status: approved ? 'VERIFIED' : 'REJECTED' } : p
        ));
        setSelectedReceipt(null);
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const filteredPayments = filter === 'ALL' ? payments : payments.filter(p => p.status === filter);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'badge-orange',
      SUBMITTED: 'badge-blue',
      VERIFIED: 'badge-emerald',
      PAID: 'badge-emerald',
      OVERDUE: 'badge-red',
      REJECTED: 'badge-red opacity-50',
    };
    return (
      <span className={`badge-tint px-3 py-1.5 ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <div className="bg-card border-b border-border px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard/landlord" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </a>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Finance Dashboard</h1>
              <p className="text-muted-foreground text-sm font-medium">Track payments, revenue, and tenant finances</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* WALLET CARD - PROMINENT */}
          <div className="lg:col-span-2 card-premium p-10 bg-foreground text-background shadow-soft-2xl border-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-background/50">Liquidity Matrix / Wallet Balance</div>
                <div className="text-5xl font-black tracking-tighter">Ksh {balance.toLocaleString()}</div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  <CheckCircle size={12} /> System Secured & Verified
                </div>
              </div>
              
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="bg-primary text-white px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/btn"
              >
                Initiate Payout
                <TrendingUp size={18} className="group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <SummaryCard
            icon={<DollarSign size={22} />}
            label="Total Ecosystem Revenue"
            value={`Ksh ${(summary?.totalRevenue || 0).toLocaleString()}`}
            color="badge-emerald"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <SummaryCard
            icon={<TrendingUp size={22} />}
            label="Current Month Performance"
            value={`Ksh ${(summary?.thisMonthRevenue || 0).toLocaleString()}`}
            color="badge-blue"
          />
          <SummaryCard
            icon={<AlertTriangle size={22} />}
            label="Outstanding Arrears"
            value={`Ksh ${(summary?.overdueAmount || 0).toLocaleString()}`}
            color="badge-red"
            subtitle={`${summary?.overdueCount || 0} overdue payments`}
          />
          <SummaryCard
            icon={<Clock size={22} />}
            label="Receipts Under Review"
            value={summary?.submittedCount || 0}
            color="badge-orange"
            subtitle="receipts awaiting verification"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mb-10 flex-wrap">
          {['ALL', 'WITHDRAWALS', 'PENDING', 'SUBMITTED', 'VERIFIED', 'PAID', 'OVERDUE', 'REJECTED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-card text-muted-foreground border border-border-subtle hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {f === 'ALL' ? `All Ledger (${payments.length + withdrawals.length})` : 
               f === 'WITHDRAWALS' ? `Withdrawals (${withdrawals.length})` :
               `${f} (${payments.filter(p => p.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Payments Table */}
        <div className="card-premium shadow-soft-md overflow-hidden">
          {filter === 'WITHDRAWALS' ? (
            withdrawals.length === 0 ? (
              <div className="p-24 text-center">
                <TrendingUp className="mx-auto text-muted-foreground/20 mb-6" size={64} />
                <h3 className="text-xl font-black text-foreground">No withdrawals yet</h3>
                <p className="text-muted-foreground font-medium mt-2">Your payout history will appear here once you initiate a request.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                      <th className="text-left px-8 py-6">Date</th>
                      <th className="text-left px-8 py-6">Reference</th>
                      <th className="text-left px-8 py-6">Method</th>
                      <th className="text-right px-8 py-6">Amount</th>
                      <th className="text-center px-8 py-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawals.map(tx => (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-all">
                        <td className="px-8 py-6 text-sm font-bold text-foreground">{new Date(tx.createdAt).toLocaleDateString('en-GB')}</td>
                        <td className="px-8 py-6 text-[10px] font-mono text-muted-foreground">{tx.reference}</td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-muted rounded-lg border border-border-subtle">{tx.metadata?.method || 'BANK'}</span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-red-500">Ksh {Math.abs(tx.amount).toLocaleString()}</td>
                        <td className="px-8 py-6 text-center">
                          <span className={`badge-tint px-3 py-1.5 ${tx.status === 'COMPLETED' ? 'badge-emerald' : tx.status === 'PENDING' ? 'badge-orange' : 'badge-red'}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            filteredPayments.length === 0 ? (
              <div className="p-24 text-center">
                <FileText className="mx-auto text-muted-foreground/20 mb-6" size={64} />
                <h3 className="text-xl font-black text-foreground">No payments found</h3>
                <p className="text-muted-foreground font-medium mt-2">
                  {filter === 'ALL' ? 'No payment records yet.' : `No ${filter.toLowerCase()} payments.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                      <th className="text-left px-8 py-6">Tenant</th>
                      <th className="text-left px-8 py-6">Property</th>
                      <th className="text-left px-8 py-6">Period</th>
                      <th className="text-right px-8 py-6">Amount Due</th>
                      <th className="text-right px-8 py-6">Penalty</th>
                      <th className="text-center px-8 py-6">Status</th>
                      <th className="text-center px-8 py-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPayments.map(payment => (
                      <tr key={payment.id} className="hover:bg-muted/30 transition-all">
                        <td className="px-8 py-6">
                          <div className="font-bold text-foreground text-sm tracking-tight">{payment.tenancy?.tenant?.name || '—'}</div>
                          <div className="text-xs text-muted-foreground font-medium">{payment.tenancy?.tenant?.email || ''}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-foreground/80 text-sm tracking-tight">{payment.tenancy?.propertyUnit?.property?.name || '—'}</div>
                          <div className="text-xs text-muted-foreground font-medium">{payment.tenancy?.propertyUnit?.type?.name || ''}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-bold text-foreground text-sm tracking-tight">
                              {['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][payment.month]} {payment.year}
                            </div>
                            {(payment.status === 'PAID' || payment.status === 'VERIFIED') && (
                              new Date(payment.year, payment.month - 1) > new Date()
                            ) && (
                              <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-emerald-500/10">
                                Advance
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={10} /> Due: {new Date(payment.dueDate).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="font-black text-foreground text-sm tracking-tight">Ksh {payment.amountDue.toLocaleString()}</div>
                          {payment.discountAmount > 0 && (
                            <div className="text-xs text-emerald-500 font-bold">-Ksh {payment.discountAmount.toLocaleString()} discount</div>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          {payment.penaltyAmount > 0 ? (
                            <span className="font-bold text-red-500 text-sm">+Ksh {payment.penaltyAmount.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-center">
                          {statusBadge(payment.status)}
                        </td>
                        <td className="px-8 py-6 text-center">
                          {payment.status === 'SUBMITTED' && payment.receipt ? (
                            <button
                              onClick={() => setSelectedReceipt(payment)}
                              className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all brand-shadow"
                            >
                              <Eye size={14} className="inline mr-1" /> Review
                            </button>
                          ) : payment.receipt ? (
                            <button
                              onClick={() => setSelectedReceipt(payment)}
                              className="bg-card text-foreground border border-border-subtle shadow-soft px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                            >
                              <Eye size={14} className="inline mr-1" /> View
                            </button>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs font-bold">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-popover border border-border rounded-[2.5rem] max-w-md w-full shadow-soft-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="bg-foreground text-background p-10 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-background/40">Neural Payout Initiation</div>
              <h2 className="text-3xl font-black tracking-tighter">Initiate Payout</h2>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Transfer Amount (Ksh)</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-foreground">Ksh</div>
                  <input 
                    type="number" 
                    value={withdrawAmount} 
                    onChange={e => setWithdrawAmount(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full pl-16 pr-8 py-5 bg-muted/20 border border-border-subtle rounded-2xl text-xl font-black text-foreground focus:outline-none focus:border-primary transition-all" 
                  />
                </div>
                <div className="text-[10px] font-bold text-muted-foreground/40 ml-1">Maximum available: Ksh {balance.toLocaleString()}</div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Destination Protocol</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setWithdrawMethod('MPESA')} 
                    className={`p-5 rounded-2xl border-2 transition-all text-center ${withdrawMethod === 'MPESA' ? 'border-primary bg-primary/5' : 'border-border-subtle bg-muted/20'}`}
                  >
                    <div className="text-xs font-black uppercase tracking-widest">M-Pesa Mobile</div>
                  </button>
                  <button 
                    onClick={() => setWithdrawMethod('BANK')} 
                    className={`p-5 rounded-2xl border-2 transition-all text-center ${withdrawMethod === 'BANK' ? 'border-primary bg-primary/5' : 'border-border-subtle bg-muted/20'}`}
                  >
                    <div className="text-xs font-black uppercase tracking-widest">Bank Ledger</div>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-8 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                >
                  Abort
                </button>
                <button 
                  onClick={handleWithdrawRequest}
                  disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) > balance}
                  className="flex-1 bg-primary text-white py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isWithdrawing ? 'Processing...' : 'Confirm Payout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Review Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-popover border border-border rounded-[2.5rem] max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-soft-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-foreground tracking-tight">Payment Receipt</h2>
                <button onClick={() => setSelectedReceipt(null)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all">✕</button>
              </div>

              {/* AI Extracted Data */}
              {selectedReceipt.receipt && (
                <div className="space-y-6 mb-10">
                  <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">AI-Extracted Verification</div>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Transaction ID</span>
                        <div className="font-black text-foreground mt-1">{selectedReceipt.receipt.aiTransactionId || '—'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Amount</span>
                        <div className="font-black text-foreground mt-1">
                          {selectedReceipt.receipt.aiAmount ? `Ksh ${selectedReceipt.receipt.aiAmount.toLocaleString()}` : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Date</span>
                        <div className="font-black text-foreground mt-1">{selectedReceipt.receipt.aiDate || '—'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Confidence</span>
                        <div className="font-black text-primary mt-1">
                          {selectedReceipt.receipt.aiConfidence ? `${(selectedReceipt.receipt.aiConfidence * 100).toFixed(0)}% Match` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedReceipt.receipt.fileUrl && (
                    <div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 ml-1">Receipt Image</div>
                      <div className="rounded-2xl border border-border overflow-hidden shadow-soft-sm bg-muted/20">
                        <img src={selectedReceipt.receipt.fileUrl} alt="Receipt" className="w-full object-contain max-h-[300px]" />
                      </div>
                    </div>
                  )}

                  {selectedReceipt.receipt.rawText && (
                    <div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 ml-1">SMS Evidence</div>
                      <div className="bg-muted p-5 rounded-2xl text-sm text-foreground/80 font-mono leading-relaxed break-words border border-border-subtle">
                        {selectedReceipt.receipt.rawText}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedReceipt.status === 'SUBMITTED' && (
                <div className="flex gap-4 pt-6 border-t border-border">
                  <button
                    onClick={() => handleVerify(selectedReceipt.id, true)}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button
                    onClick={() => handleVerify(selectedReceipt.id, false)}
                    className="flex-1 bg-red-500/10 text-red-500 py-4 rounded-2xl font-black border border-red-500/20 hover:bg-red-500 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color, subtitle }: { icon: React.ReactNode; label: string; value: any; color: string; subtitle?: string }) {
  return (
    <div className="card-premium p-8 shadow-soft hover:shadow-soft-lg transition-all group">
      <div className={`w-14 h-14 badge-tint ${color} rounded-[1.25rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon as React.ReactElement, { size: 28 })}
      </div>
      <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2 ml-1">{label}</div>
      <div className="text-3xl font-black text-foreground tracking-tight">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground font-bold mt-2 ml-1">{subtitle}</div>}
    </div>
  );
}
