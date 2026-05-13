'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Home, 
  CalendarCheck, 
  Plus,
  TrendingUp,
  Users,
  AlertCircle,
  MoreVertical,
  Search,
  Loader2
} from 'lucide-react';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

export default function LandlordDashboard() {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    balance: 0,
    activeBookingsCount: 0,
    pendingRequestsCount: 0,
    totalProperties: 0
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Fetch stats
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/stats/landlord`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        } else if (statsRes.status === 401) {
          localStorage.clear();
          window.location.href = '/auth/landlord';
          return;
        }

        // Fetch properties
        const propRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/landlord/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (propRes.ok) {
          const propData = await propRes.json();
          setProperties(Array.isArray(propData) ? propData : []);
        } else if (propRes.status === 401) {
          localStorage.clear();
          window.location.href = '/auth/landlord';
          return;
        }

        // Fetch recent bookings
        const bookingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/bookings/landlord`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setRecentBookings(Array.isArray(bookingsData) ? bookingsData.slice(0, 3) : []);
        } else if (bookingsRes.status === 401) {
          localStorage.clear();
          window.location.href = '/auth/landlord';
          return;
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, propertyId: '', propertyName: '' });

  const handleDeleteProperty = async () => {
    const { propertyId } = deleteModal;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (response.ok) {
        setProperties(properties.filter(p => p.id !== propertyId));
        setStats(prev => ({ ...prev, totalProperties: prev.totalProperties - 1 }));
        setDeleteModal({ isOpen: false, propertyId: '', propertyName: '' });
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  };

  return (
    <main className="p-8 lg:p-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Landlord Portal</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage your property portfolio and student applications.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
             <input 
               type="text" 
               placeholder="Search bookings..." 
               className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
             />
           </div>
           <Link 
             href="/dashboard/landlord/properties/new"
             className="bg-primary text-white px-6 py-3.5 rounded-2xl text-sm font-bold brand-shadow hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 whitespace-nowrap"
           >
             <Plus size={18} />
             Add New Property
           </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
        <StatCard 
          label="Wallet Balance" 
          value={`Ksh ${(stats.balance || 0).toLocaleString()}`} 
          icon={<TrendingUp size={20} />} 
          badgeClass="badge-blue"
        />
        <StatCard 
          label="Total Revenue" 
          value={`Ksh ${(stats.totalEarnings || 0).toLocaleString()}`} 
          icon={<TrendingUp size={20} className="rotate-90" />} 
          badgeClass="badge-emerald"
        />
        <StatCard 
          label="Properties" 
          value={stats.totalProperties.toString()} 
          icon={<Home size={20} />} 
          badgeClass="badge-emerald"
        />
        <StatCard 
          label="Active Bookings" 
          value={stats.activeBookingsCount.toString()} 
          icon={<CalendarCheck size={20} />} 
          badgeClass="badge-purple"
        />
        <StatCard 
          label="Pending Requests" 
          value={stats.pendingRequestsCount.toString()} 
          trend="+2" 
          icon={<AlertCircle size={20} />} 
          badgeClass="badge-orange"
        />
      </div>

      {/* Recent Bookings Section */}
      <section className="card-premium shadow-soft-md overflow-hidden mb-12">
        <div className="p-8 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="font-bold text-foreground text-lg">Recent Booking Applications</h3>
            <p className="text-xs text-muted-foreground font-medium">New student requests waiting for your review</p>
          </div>
          <Link href="/dashboard/landlord/bookings" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Manage All Bookings</Link>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentBookings.length === 0 ? (
              <div className="col-span-3 py-10 text-center text-slate-400 font-medium">
                No recent applications found.
              </div>
            ) : (
              recentBookings.map((b: any) => (
                <BookingSnippetCard 
                  key={b.id}
                  id={b.id}
                  studentId={b.student?.id}
                  name={b.student?.name || 'Unknown'} 
                  property={b.propertyUnit?.property?.name || 'Property'} 
                  date={new Date(b.createdAt).toLocaleDateString()} 
                  amount={b.amount?.toLocaleString() || '0'} 
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Properties Table */}
      <div className="card-premium shadow-soft-md mt-12 overflow-hidden">
        <div className="p-8 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="font-bold text-foreground text-lg">Your Properties</h3>
            <p className="text-xs text-muted-foreground font-medium">Real-time occupancy tracking</p>
          </div>
          <Link href="/dashboard/landlord/properties" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">View All Properties</Link>
        </div>
        <div className="overflow-x-auto overflow-y-visible min-h-[400px]">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" />
              <span>Loading properties...</span>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[11px] font-bold uppercase tracking-[0.1em]">
                  <th className="px-8 py-5">Property Details</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Occupancy</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {properties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">
                      No properties found. Start by adding your first listing!
                    </td>
                  </tr>
                ) : (
                  properties.map(prop => (
                    <PropertyRow 
                      key={prop.id}
                      id={prop.id}
                      name={prop.name} 
                      type={prop.type} 
                      occupancy={0} 
                      spots={`0/${prop.capacity}`} 
                      status={prop.verified ? 'Active' : 'Pending'} 
                      onDelete={(id, name) => setDeleteModal({ isOpen: true, propertyId: id, propertyName: name })}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteProperty}
        title="Delete Property?"
        message={`Are you sure you want to delete "${deleteModal.propertyName}"? This will remove all associated units and bookings. This action cannot be undone.`}
        confirmText="Delete Property"
        type="danger"
      />
    </main>
  );
}

function BookingSnippetCard({ id, studentId, name, property, date, amount }: { id: string, studentId?: string, name: string, property: string, date: string, amount: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-soft hover:shadow-soft-md transition-all group">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shadow-soft border border-primary/5 group-hover:scale-110 transition-transform">
          {name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-black text-foreground tracking-tight">{name}</div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{date}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-black text-emerald-500">Ksh {amount}</div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase">Per Month</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 flex-1 truncate">
          <Home size={12} className="text-muted-foreground/40" />
          {property}
        </div>
        <div className="flex gap-1">
          <Link 
            href={`/dashboard/landlord/bookings/${id}`}
            className="bg-foreground text-background text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-primary hover:text-white transition-colors"
          >
            Details
          </Link>
          {studentId && (
            <Link 
              href={`/dashboard/landlord/students/${studentId}`}
              className="bg-muted text-foreground border border-border shadow-soft text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest hover:border-primary hover:text-primary transition-colors"
            >
              Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon, badgeClass }: { label: string, value: string, trend?: string, icon: React.ReactNode, badgeClass: string }) {
  return (
    <div className="card-premium p-8 hover-card transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 ${badgeClass} rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        {trend && (
          <span className={`badge-tint ${badgeClass}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] mb-1">{label}</div>
      <div className="text-3xl font-extrabold text-foreground tracking-tight">{value}</div>
    </div>
  );
}

function PropertyRow({ id, name, type, occupancy, spots, status, onDelete }: { id: string, name: string, type: string, occupancy: number, spots: string, status: string, onDelete: (id: string, name: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <tr className="group hover:bg-muted/30 transition-all duration-200">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Home size={20} />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">{name}</div>
            <div className="text-xs text-muted-foreground font-medium">Kibabii University District</div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 text-sm font-semibold text-muted-foreground">{type}</td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                occupancy === 100 ? 'bg-primary' : 'bg-primary'
              }`} 
              style={{ width: `${occupancy}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-foreground">{spots}</span>
        </div>
      </td>
      <td className="px-8 py-6">
        <span className={`badge-tint ${
          status === 'Active' ? 'badge-emerald' : 
          status === 'Full' ? 'badge-blue' : 
          status === 'Pending' ? 'badge-orange' : 'bg-muted text-muted-foreground'
        }`}>
          {status}
        </span>
      </td>
      <td className="px-8 py-6 text-right relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-muted-foreground/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
        >
          <MoreVertical size={20} />
        </button>

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute right-8 mt-2 w-48 bg-popover rounded-2xl shadow-soft-lg border border-border py-2 z-20 animate-in fade-in zoom-in-95 duration-100 text-left backdrop-blur-xl">
              <Link 
                href={`/hostels/${id}`}
                target="_blank"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                <Search size={16} />
                View Public Listing
              </Link>
              <div className="h-px bg-border my-1" />
              <Link 
                href={`/dashboard/landlord/properties/${id}/edit`}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors"
              >
                <Plus size={16} className="rotate-45" />
                Edit Property
              </Link>
              <div className="h-px bg-border my-1" />
              <button 
                onClick={() => {
                  onDelete(id, name);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <AlertCircle size={16} />
                Delete Property
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}
