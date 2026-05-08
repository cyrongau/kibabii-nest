'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  CalendarCheck, 
  Banknote,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

function StatCard({ label, value, subValue, icon, bgColor }: any) {
  return (
    <div className="card-premium p-8 shadow-soft-xl hover:shadow-soft-2xl transition-all duration-500 border-border-subtle group relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 -translate-y-16 blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000"></div>
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`p-4 rounded-2xl ${bgColor} shadow-soft-sm group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.25em]">Metric</div>
      </div>
      
      <div className="relative z-10">
        <div className="text-3xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{value}</div>
        <div className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1 leading-none">{label}</div>
        <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-4 flex items-center gap-2 italic">
          <TrendingUp size={10} className="text-primary" /> {subValue}
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { showToast } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [growth, setGrowth] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` };
      const [overviewRes, growthRes] = await Promise.all([
        fetch('http://localhost:3000/admin/stats/overview', { headers }),
        fetch('http://localhost:3000/admin/stats/growth', { headers })
      ]);

      if (!overviewRes.ok || !growthRes.ok) throw new Error('Failed to fetch analytics');

      setOverview(await overviewRes.json());
      setGrowth(await growthRes.json());
    } catch (error) {
      showToast('Failed to load analytics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center h-[70vh] gap-8 animate-in fade-in duration-1000">
        <Loader2 className="animate-spin text-primary" size={64} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">Loading analytics data...</p>
      </div>
    );
  }

  if (!overview || !growth) return null;

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="space-y-3">
        <h1 className="text-4xl font-black text-foreground tracking-tighter">Performance Analytics</h1>
        <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm lg:text-base">Real-time monitoring of platform performance, user growth, and revenue trends.</p>
      </header>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <StatCard 
          label="Total Users" 
          value={overview.users.total.toLocaleString()} 
          subValue={`${overview.users.students} Students / ${overview.users.landlords} Landlords`}
          icon={<Users className="text-primary" size={24} />} 
          bgColor="bg-primary/10"
        />
        <StatCard 
          label="Managed Assets" 
          value={overview.properties.total.toLocaleString()} 
          subValue={`${overview.properties.verified} Verified Properties`}
          icon={<Building2 className="text-purple-500" size={24} />} 
          bgColor="bg-purple-500/10"
        />
        <StatCard 
          label="Total Bookings" 
          value={overview.bookings.total.toLocaleString()} 
          subValue={`${overview.bookings.approved} Confirmed`}
          icon={<CalendarCheck className="text-orange-500" size={24} />} 
          bgColor="bg-orange-500/10"
        />
        <StatCard 
          label="Active Tenancies" 
          value={overview.tenancies.active.toLocaleString()} 
          subValue="Active Rental Agreements"
          icon={<ShieldCheck className="text-emerald-500" size={24} />} 
          bgColor="bg-emerald-500/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Monthly User Growth Table */}
        <section className="card-premium shadow-soft-2xl p-10 border-border-subtle relative bg-card/30 backdrop-blur-md overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full translate-x-24 -translate-y-24 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>
          
          <div className="flex items-center gap-5 mb-10 relative z-10">
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-soft-sm">
              <TrendingUp className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter">User Growth</h3>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1 italic">User registration trends</p>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-hide relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground/60">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Month</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Students</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Landlords</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">New Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {Object.entries(growth.monthlyUsers).reverse().slice(0, 6).map(([month, stats]: [string, any]) => (
                  <tr key={month} className="hover:bg-muted/30 transition-all duration-300 group/row">
                    <td className="px-6 py-5 font-black text-foreground/80 text-sm group-hover/row:text-primary transition-colors">{month}</td>
                    <td className="px-6 py-5 text-right font-bold text-muted-foreground/60 text-xs">{stats.students.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right font-bold text-muted-foreground/60 text-xs">{stats.landlords.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right font-black text-primary text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <ArrowUpRight size={14} className="opacity-40" />
                        +{stats.total.toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Monthly Booking & Revenue Table */}
        <section className="card-premium shadow-soft-2xl p-10 border-border-subtle relative bg-card/30 backdrop-blur-md overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full translate-x-24 -translate-y-24 blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-1000"></div>

          <div className="flex items-center gap-5 mb-10 relative z-10">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-soft-sm">
              <Banknote className="text-emerald-500" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter">Revenue Trends</h3>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1 italic">Booking volume and revenue metrics</p>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-hide relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground/60">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Month</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Bookings</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Approved</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {Object.entries(growth.monthlyBookings).reverse().slice(0, 6).map(([month, stats]: [string, any]) => (
                  <tr key={month} className="hover:bg-muted/30 transition-all duration-300 group/row">
                    <td className="px-6 py-5 font-black text-foreground/80 text-sm group-hover/row:text-emerald-500 transition-colors">{month}</td>
                    <td className="px-6 py-5 text-right font-bold text-muted-foreground/60 text-xs">{stats.total.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right font-black text-emerald-500 text-xs">{stats.approved.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right font-black text-foreground text-sm tracking-tight italic">
                      Ksh {stats.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top Properties */}
        <section className="card-premium shadow-soft-2xl p-12 border-border-subtle xl:col-span-2 relative bg-card/30 backdrop-blur-md overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
          
          <div className="flex items-center gap-5 mb-12 relative z-10">
            <div className="p-5 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 shadow-soft-sm">
              <Building2 className="text-indigo-500" size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter">Top Performing Properties</h3>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] mt-1.5 flex items-center gap-3 italic">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                Top properties by booking activity
              </p>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-hide relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground/60">
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Property Name</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Landlord</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Unit Count</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {growth.topProperties.map((prop: any) => (
                  <tr key={prop.id} className="hover:bg-muted/30 transition-all duration-500 group/row">
                    <td className="px-10 py-7 font-black text-foreground text-base tracking-tighter group-hover/row:text-primary transition-colors">{prop.name}</td>
                    <td className="px-10 py-7">
                      <div className="font-bold text-muted-foreground/60 text-xs flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-muted-foreground/20 rounded-full"></div>
                        {prop.landlord?.name || 'ANONYMOUS'}
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right font-black text-foreground/80 text-sm">{prop._count?.units || 0} Modules</td>
                    <td className="px-10 py-7 text-right text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest italic">{new Date(prop.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// Component removed as it is now defined within the main component scope for better design system integration.
