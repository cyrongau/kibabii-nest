'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  Search,
  Bell,
  Settings,
  LogOut,
  MapPin,
  Clock,
  Loader2,
  CalendarCheck,
  ChevronRight,
  Database,
  Cpu,
  Activity,
  Zap
} from 'lucide-react';

import { useSearchParams } from 'next/navigation';

export default function AdminDashboard() {
  return (
    <React.Suspense fallback={<div className="p-12 flex flex-col items-center justify-center min-h-screen gap-4"><Loader2 className="animate-spin text-primary" size={48} /><div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Loading admin overview...</div></div>}>
      <AdminDashboardContent />
    </React.Suspense>
  );
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/admin/stats/overview`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (response.ok) {
          setStats(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 min-h-screen flex flex-col items-center justify-center gap-6 text-muted-foreground/40 font-black">
        <Loader2 className="animate-spin text-primary" size={48} />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] italic">Loading platform data...</span>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-foreground tracking-tighter">Platform Overview</h1>
      </header>

      {activeTab === 'overview' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard 
              label="Pending Bookings" 
              value={stats?.bookings?.pending?.toString() || '0'} 
              trend={`${stats?.bookings?.total || 0} total`} 
              icon={<Zap size={20} />} 
              badgeClass="badge-blue"
            />
            <StatCard 
              label="Verified Properties" 
              value={stats?.properties?.verified?.toLocaleString() || '0'} 
              trend={`${stats?.properties?.total || 0} total`} 
              icon={<Building2 size={20} />} 
              badgeClass="badge-emerald"
            />
            <StatCard 
              label="Platform Revenue" 
              value={`KES ${(stats?.revenue?.total || 0).toLocaleString()}`} 
              trend={`${stats?.bookings?.approved || 0} approved`} 
              icon={<TrendingUp size={20} />} 
              badgeClass="badge-emerald"
            />
            <StatCard 
              label="Pending KYC" 
              value={stats?.kyc?.pending?.toString() || '0'} 
              trend="Action Required" 
              icon={<ShieldCheck size={20} />} 
              badgeClass="badge-orange"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <section className="lg:col-span-3 card-premium p-10 lg:p-12 border-border-subtle shadow-soft-xl overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none"></div>
               
               <div className="flex justify-between items-center mb-12 relative z-10">
                 <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-4">
                   <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-soft-sm">
                     <Building2 size={24} />
                   </div>
                   Pending Property Approvals
                 </h3>
                 <Link href="/dashboard/admin/properties" className="px-6 py-3 bg-muted/40 hover:bg-muted text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-border-subtle rounded-2xl transition-all">
                   View Registry
                 </Link>
               </div>
               
               <div className="space-y-5 relative z-10">
                  {stats?.pendingApprovals?.length > 0 ? (
                    stats.pendingApprovals.map((prop: any) => (
                      <ApprovalItem 
                        key={prop.id}
                        id={prop.id}
                        name={prop.name} 
                        landlord={prop.landlord?.name || 'Anonymous Landlord'} 
                        date={new Date(prop.createdAt).toLocaleDateString()} 
                        location={prop.address || 'Location Unspecified'} 
                      />
                    ))
                  ) : (
                    <div className="py-24 text-center space-y-6">
                      <div className="w-20 h-20 bg-muted/40 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 size={32} className="text-emerald-500/20" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-black text-foreground tracking-tight">Queue Empty</p>
                        <p className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest">No listings awaiting review</p>
                      </div>
                    </div>
                  )}
               </div>
            </section>

            <section className="lg:col-span-2 card-premium p-10 lg:p-12 border-border-subtle shadow-soft-xl bg-card/30 backdrop-blur-md">
               <div className="flex justify-between items-center mb-12">
                 <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-4">
                   <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-soft-sm">
                     <Activity size={24} />
                   </div>
                   Systems Health
                 </h3>
                 <ShieldCheck className="text-emerald-500" size={24} />
               </div>
               <div className="space-y-10">
                  <HealthBar label="System Speed" value={98} icon={<Cpu size={14} />} color="bg-emerald-500" />
                  <HealthBar label="Payment Connectivity" value={100} icon={<TrendingUp size={14} />} color="bg-emerald-500" />
                  <HealthBar label="Alert System" value={92} icon={<Bell size={14} />} color="bg-primary" />
                  <HealthBar label="File Storage" value={85} icon={<Database size={14} />} color="bg-orange-500" />
               </div>

               <div className="mt-16 pt-8 border-t border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-glow"></div>
                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest">All Systems Operational</span>
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground/40 italic uppercase">Refreshed 1m ago</span>
               </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <section className="card-premium p-10 lg:p-14 border-border-subtle shadow-soft-2xl animate-in fade-in zoom-in-95 duration-500">
           <div className="mb-12 space-y-2">
             <h2 className="text-3xl font-black text-foreground tracking-tighter">Property Approvals</h2>
             <p className="text-muted-foreground font-medium max-w-xl leading-relaxed text-sm">Reviewing and verifying new property listings before they are published.</p>
           </div>

           <div className="overflow-x-auto scrollbar-hide">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-muted/50 text-muted-foreground/60">
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Property Name</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Landlord</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Location</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Submission Date</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Review</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border-subtle">
                 <ApprovalRow name="Royal Plaza Residency" landlord="Alex Thompson" location="Bungoma" date="May 1, 2026" />
                 <ApprovalRow name="The Hive Elite" landlord="John Wamukota" location="Kanduyi" date="Apr 29, 2026" />
                 <ApprovalRow name="Azure Commons" landlord="Sarah Jenkins" location="Main Gate" date="Apr 28, 2026" />
               </tbody>
             </table>
           </div>
        </section>
      )}

      {activeTab === 'users' && (
        <section className="card-premium p-24 text-center space-y-8 border-border-subtle shadow-soft-xl animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-soft-sm group">
            <Users size={40} className="text-primary group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-foreground tracking-tighter">User Management</h2>
            <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-widest max-w-sm mx-auto leading-loose">
              Manage student and landlord accounts via the dedicated users module.
            </p>
          </div>
          <Link href="/dashboard/admin/users" className="inline-flex px-10 py-4.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all brand-shadow">
            Go to User Management
          </Link>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, icon, badgeClass }: { label: string, value: string, trend: string, icon: React.ReactNode, badgeClass: string }) {
  return (
    <div className="card-premium p-8 shadow-soft hover:shadow-soft-xl hover:scale-[1.02] transition-all duration-500 cursor-default group border-border-subtle">
      <div className="flex justify-between items-start mb-8">
        <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${badgeClass} shadow-soft-sm`}>
          {icon}
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest badge-tint ${badgeClass} shadow-inner`}>
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">{label}</div>
        <div className="text-3xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{value}</div>
      </div>
    </div>
  );
}

function ApprovalItem({ id, name, landlord, date, location }: { id: string, name: string, landlord: string, date: string, location: string }) {
  return (
    <Link 
      href={`/dashboard/admin/properties/${id}/review`}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-muted/20 hover:bg-primary/5 rounded-[2rem] border border-transparent hover:border-primary/20 transition-all duration-500 group relative overflow-hidden"
    >
       <div className="flex items-center gap-6 relative z-10">
          <div className="w-14 h-14 bg-card rounded-[1.25rem] overflow-hidden shrink-0 border border-border-subtle shadow-soft-sm transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2">
             <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/20">
                <Building2 size={24} />
             </div>
          </div>
          <div>
            <div className="text-base font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{name}</div>
            <div className="text-[10px] font-black text-muted-foreground/40 mt-1 uppercase tracking-widest">{landlord} <span className="mx-2 text-primary/30">•</span> {location}</div>
          </div>
       </div>
       <div className="mt-4 sm:mt-0 flex items-center gap-6 relative z-10">
          <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock size={12} />
            {date}
          </div>
          <ChevronRight className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
       </div>
    </Link>
  );
}

function HealthBar({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}/10 ${color.replace('bg-', 'text-')}`}>
            {icon}
          </div>
          <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">{label}</span>
        </div>
        <span className="text-xs font-black text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${color} transition-all duration-1000 shadow-glow`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function ApprovalRow({ name, landlord, location, date }: { name: string, landlord: string, location: string, date: string }) {
  return (
    <tr className="group hover:bg-muted/30 transition-all duration-300">
      <td className="px-8 py-7">
        <div className="font-black text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">{name}</div>
      </td>
      <td className="px-8 py-7">
        <div className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">{landlord}</div>
      </td>
      <td className="px-8 py-7">
        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/40">
           <MapPin size={14} className="text-primary/20" />
           {location}
        </div>
      </td>
      <td className="px-8 py-7">
        <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{date}</div>
      </td>
      <td className="px-8 py-7 text-right">
        <div className="flex items-center justify-end gap-3">
          <button className="p-3 text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all shadow-soft-sm border border-transparent hover:border-emerald-500/20" title="Approve">
            <CheckCircle2 size={18} />
          </button>
          <button className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all shadow-soft-sm border border-transparent hover:border-red-500/20" title="Reject">
            <XCircle size={18} />
          </button>
          <button className="p-3 text-muted-foreground/30 hover:text-foreground hover:bg-muted rounded-2xl transition-all" title="View Details">
            <MoreVertical size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
