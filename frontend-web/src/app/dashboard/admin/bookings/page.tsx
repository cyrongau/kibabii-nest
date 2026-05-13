'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building,
  Ban
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="card-premium p-8 shadow-soft-xl hover:shadow-soft-2xl transition-all duration-500 border-border-subtle group relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 -translate-y-16 blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000"></div>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-4 rounded-2xl ${color} shadow-soft-sm group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.25em]">Ledger Node</div>
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-black text-foreground tracking-tighter mb-1 group-hover:text-primary transition-colors">{value}</div>
        <div className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] leading-none">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string, color: string, icon: any }> = {
    'APPROVED': { label: 'Authorized', color: 'badge-emerald', icon: CheckCircle2 },
    'REJECTED': { label: 'Declined', color: 'badge-red', icon: XCircle },
    'PENDING': { label: 'Awaiting Audit', color: 'badge-orange', icon: Clock },
    'CANCELLED': { label: 'Terminated', color: 'badge-slate', icon: Ban },
  };

  const { label, color, icon: Icon } = config[status] || { label: status, color: 'badge-slate', icon: Clock };

  return (
    <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 w-max shadow-soft-sm badge-tint ${color}`}>
      <Icon size={14} /> {label}
    </span>
  );
}

export default function AdminBookingsPage() {
  const { showToast } = useNotifications();
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Selected Booking for Modal
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, search]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/bookings/admin/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
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
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch booking stats', error);
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.append('search', search);
      if (statusFilter) queryParams.append('status', statusFilter);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/bookings/admin/all?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/auth/admin';
          return;
        }
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
    } catch (error) {
      showToast('Failed to load bookings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      showToast(`Booking status updated to ${newStatus}`, 'success');
      fetchBookings();
      fetchStats();
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (error) {
      showToast('Action failed', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Transaction Oversight</h1>
          <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm lg:text-base">Audit platform ledger, resolve administrative disputes, and authorize sovereign transactions.</p>
        </div>
      </header>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard 
            label="Global Ledger" 
            value={stats.total} 
            icon={<CalendarCheck size={24} />} 
            color="bg-primary/10 text-primary"
          />
          <StatCard 
            label="Audit Queue" 
            value={stats.pending} 
            icon={<Clock size={24} />} 
            color="bg-orange-500/10 text-orange-500"
          />
          <StatCard 
            label="Authorized" 
            value={stats.approved} 
            icon={<CheckCircle2 size={24} />} 
            color="bg-emerald-500/10 text-emerald-500"
          />
          <StatCard 
            label="Declined" 
            value={stats.rejected} 
            icon={<XCircle size={24} />} 
            color="bg-red-500/10 text-red-500"
          />
        </div>
      )}

      {/* Filters */}
      <section className="card-premium p-8 lg:p-10 shadow-soft-xl flex flex-wrap gap-8 items-center border-border-subtle relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-8 flex-1 w-full relative z-10">
          <div className="relative flex-1 w-full sm:max-w-md group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Search registry by student or property signature..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-muted/20 border border-transparent focus:border-primary/20 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] focus:outline-none focus:ring-4 focus:ring-primary/5 text-foreground placeholder:text-muted-foreground/20 transition-all shadow-soft-sm"
            />
          </div>
          <div className="relative w-full sm:w-72 group">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={22} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-16 pr-12 py-5 bg-muted/20 border border-transparent focus:border-primary/20 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] appearance-none focus:outline-none focus:ring-4 focus:ring-primary/5 text-foreground transition-all cursor-pointer shadow-soft-sm"
            >
              <option value="">Global Transactions</option>
              <option value="PENDING">Audit Queue</option>
              <option value="APPROVED">Authorized</option>
              <option value="REJECTED">Declined</option>
              <option value="CANCELLED">Terminated</option>
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none rotate-90" size={18} />
          </div>
        </div>
      </section>

      {/* Bookings Table */}
      <section className="card-premium shadow-soft-2xl min-h-[500px] overflow-hidden border-border-subtle relative bg-card/30 backdrop-blur-md">
        {isLoading && !isModalOpen ? (
          <div className="flex flex-col items-center justify-center p-40 gap-8 text-muted-foreground/40 font-black">
            <Loader2 className="animate-spin text-primary" size={64} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Auditing ledger mainframe...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-40 text-center animate-in fade-in duration-700">
            <div className="w-28 h-28 bg-muted/40 rounded-[2.75rem] flex items-center justify-center mb-10 shadow-inner group">
              <CalendarCheck size={56} className="text-muted-foreground/10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-foreground tracking-tighter">Null Ledger Records</h3>
              <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">No administrative transactions match the specified surveillance filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground/60">
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Student Entity</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Asset Mapping</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Compliance Status</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Financial Value</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Registry Log</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Surveillance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-all duration-300 group">
                    <td className="px-10 py-7">
                      <div className="font-black text-foreground text-base tracking-tight group-hover:text-primary transition-colors">{booking.student?.name || 'ANONYMOUS NODE'}</div>
                      <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1.5">{booking.student?.email}</div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary/40 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                          <Building size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-foreground/80 text-sm tracking-tighter">{booking.propertyUnit?.property?.name || 'UNKNOWN ASSET'}</div>
                          <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">{booking.propertyUnit?.type?.name || 'Standard Module'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-10 py-7">
                      <div className="font-black text-foreground text-base tracking-tight">Ksh {booking.amount.toLocaleString()}</div>
                      <div className="text-[9px] text-muted-foreground/30 font-black uppercase tracking-[0.2em] mt-1">Sovereign Tender</div>
                    </td>
                    <td className="px-10 py-7 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                      {new Date(booking.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-10 py-7 text-right">
                      <button 
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsModalOpen(true);
                        }}
                        className="px-8 py-3 bg-foreground text-background text-[9px] font-black uppercase tracking-[0.25em] rounded-xl hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all duration-500 shadow-soft-xl brand-shadow group/btn"
                      >
                        <Eye size={16} className="group-hover/btn:rotate-12 transition-transform inline mr-3" /> Intelligence
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-border-subtle p-10 flex flex-col sm:flex-row justify-between items-center bg-muted/10 backdrop-blur-xl gap-8">
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em]">
              Intelligence Matrix Page <span className="text-primary">{page}</span> / <span className="text-foreground">{totalPages}</span>
            </span>
            <div className="flex gap-6">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-4.5 rounded-[1.25rem] border border-border-subtle bg-card text-muted-foreground/40 hover:bg-muted hover:text-foreground disabled:opacity-10 transition-all shadow-soft-sm group"
              >
                <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-4.5 rounded-[1.25rem] border border-border-subtle bg-card text-muted-foreground/40 hover:bg-muted hover:text-foreground disabled:opacity-10 transition-all shadow-soft-sm group"
              >
                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Booking Details Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-popover border border-border-subtle rounded-[4rem] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-soft-2xl animate-in zoom-in-95 duration-500 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-32 -translate-y-32 blur-3xl pointer-events-none"></div>
            
            <div className="p-12 border-b border-border-subtle flex justify-between items-center bg-muted/10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary shadow-soft-sm border border-primary/20">
                  <CalendarCheck size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-foreground tracking-tighter">Ledger Registry</h2>
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] mt-1.5 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                    Reference Node: <span className="text-foreground">{selectedBooking.id.split('-')[0].toUpperCase()}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-muted-foreground/40 hover:text-foreground hover:bg-muted rounded-2xl transition-all">✕</button>
            </div>
            
            <div className="p-12 overflow-y-auto space-y-12 flex-1 scrollbar-hide relative z-10">
              <div className="flex items-center justify-between bg-card/50 p-8 rounded-[2.5rem] border border-border-subtle shadow-soft-sm backdrop-blur-md">
                <StatusBadge status={selectedBooking.status} />
                <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic">
                  Registry Timestamp: <span className="text-foreground not-italic ml-2">{new Date(selectedBooking.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-10 bg-muted/20 rounded-[3rem] border border-border-subtle shadow-soft-sm space-y-6 group hover:border-primary/20 transition-all">
                  <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div> Student Entity
                  </div>
                  <div className="space-y-4">
                    <div className="font-black text-foreground text-2xl tracking-tighter group-hover:text-primary transition-colors">{selectedBooking.student?.name}</div>
                    <div className="space-y-2 text-xs font-bold text-muted-foreground/60 tracking-tight">
                      <p className="flex items-center gap-3"><span className="w-1 h-1 bg-muted-foreground/20 rounded-full"></span> {selectedBooking.student?.email}</p>
                      <p className="flex items-center gap-3"><span className="w-1 h-1 bg-muted-foreground/20 rounded-full"></span> {selectedBooking.student?.phone || 'SECURE DATA ENCRYPTED'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-10 bg-muted/20 rounded-[3rem] border border-border-subtle shadow-soft-sm space-y-6 group hover:border-primary/20 transition-all">
                  <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div> Asset Mapping
                  </div>
                  <div className="space-y-4">
                    <div className="font-black text-foreground text-2xl tracking-tighter group-hover:text-primary transition-colors">{selectedBooking.propertyUnit?.property?.name}</div>
                    <div className="text-xs font-bold text-muted-foreground/60 tracking-tight leading-relaxed">
                      {selectedBooking.propertyUnit?.property?.address}<br/>
                      <div className="mt-4 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 w-max text-[10px] font-black text-primary uppercase tracking-widest italic">
                        Guardian: {selectedBooking.propertyUnit?.property?.landlord?.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-primary text-white rounded-[3rem] flex justify-between items-center shadow-2xl shadow-primary/20 brand-shadow relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative z-10">
                  <div className="font-black text-white text-xl tracking-tighter">{selectedBooking.propertyUnit?.type?.name}</div>
                  <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mt-2">Sovereign Transaction Value</div>
                </div>
                <div className="relative z-10 text-4xl font-black text-white tracking-tighter">Ksh {selectedBooking.amount.toLocaleString()}</div>
              </div>

              <div className="bg-red-500/5 p-12 rounded-[3.5rem] border border-red-500/10 space-y-10 relative overflow-hidden group/override">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full translate-x-24 -translate-y-24 blur-3xl group-hover/override:bg-red-500/10 transition-colors"></div>
                
                <div className="space-y-3 relative z-10">
                  <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.25em] flex items-center gap-4">
                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <Ban size={16} />
                    </div>
                    Protocol Manual Override
                  </h4>
                  <p className="text-xs font-bold text-muted-foreground/60 leading-relaxed max-w-xl">Initiate a manual registry state shift. This action bypasses standard automated flows and should only be deployed during verified disputes or non-responsive guardian events.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                  <button 
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'APPROVED')}
                    disabled={isActionLoading || selectedBooking.status === 'APPROVED'}
                    className="py-5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-emerald-600 disabled:opacity-20 transition-all shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Authorize
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'REJECTED')}
                    disabled={isActionLoading || selectedBooking.status === 'REJECTED'}
                    className="py-5 bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-red-600 disabled:opacity-20 transition-all shadow-2xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CANCELLED')}
                    disabled={isActionLoading || selectedBooking.status === 'CANCELLED'}
                    className="py-5 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:opacity-90 disabled:opacity-20 transition-all shadow-2xl shadow-foreground/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Terminate
                  </button>
                </div>
              </div>
            </div>

            <div className="p-12 border-t border-border-subtle bg-muted/20 flex justify-center relative z-10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-12 py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"
              >
                Exit Registry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
