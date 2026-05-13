'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  MapPin,
  Plus
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useSearchParams } from 'next/navigation';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="card-premium p-8 shadow-soft-xl hover:shadow-soft-2xl transition-all duration-500 border-border-subtle group relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 -translate-y-16 blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000"></div>
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-4 rounded-2xl ${color} shadow-soft-sm group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.25em]">Status</div>
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-black text-foreground tracking-tighter mb-1 group-hover:text-primary transition-colors">{value}</div>
        <div className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] leading-none">{label}</div>
      </div>
    </div>
  );
}

export default function AdminPropertiesPage() {
  const { showToast } = useNotifications();
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters and Pagination
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [landlordId, setLandlordId] = useState(searchParams.get('landlordId') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Selected Property for Modal
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Confirmation Modal State
  const [confirmationConfig, setConfirmationConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'danger',
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [page, verifiedFilter, search, landlordId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/properties/admin/stats`, {
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
      console.error('Failed to fetch property stats', error);
    }
  };

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.append('search', search);
      if (verifiedFilter) queryParams.append('verified', verifiedFilter);
      if (landlordId) queryParams.append('landlordId', landlordId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/properties/admin/all?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      
      setProperties(data.properties);
      setTotalPages(data.totalPages);
    } catch (error) {
      showToast('Failed to load properties', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = (propertyId: string, currentStatus: boolean, propertyName: string) => {
    setConfirmationConfig({
      isOpen: true,
      title: `${currentStatus ? 'Revoke' : 'Approve'} Property Listing`,
      message: `Are you sure you want to ${currentStatus ? 'revoke verification for' : 'approve'} "${propertyName}"? ${currentStatus ? 'It will no longer be visible to students.' : 'It will be immediately visible and bookable for students.'}`,
      confirmText: currentStatus ? 'Revoke Verification' : 'Verify Property',
      type: currentStatus ? 'warning' : 'info',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/properties/${propertyId}/verify`, {
            method: 'PATCH',
            headers: { 
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: !currentStatus })
          });
          
          if (!response.ok) throw new Error('Failed to update verification status');
          
          showToast(currentStatus ? 'Property unverified' : 'Property verified successfully', 'success');
          fetchProperties();
          fetchStats();
          if (selectedProperty && selectedProperty.id === propertyId) {
            setSelectedProperty({ ...selectedProperty, verified: !currentStatus });
          }
        } catch (error) {
          showToast('Action failed', 'error');
        } finally {
          setIsActionLoading(false);
          setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const openPropertyDetails = async (propertyId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/properties/${propertyId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch property details');
      const data = await response.json();
      setSelectedProperty(data);
      setIsModalOpen(true);
    } catch (error) {
      showToast('Failed to load property details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Property Management</h1>
          <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm lg:text-base">Management, verification, and review of student housing listings.</p>
        </div>
      </header>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard 
            label="Total Properties" 
            value={stats.totalProperties} 
            icon={<Building2 size={24} />} 
            color="bg-primary/10 text-primary"
          />
          <StatCard 
            label="Verified Properties" 
            value={stats.verifiedProperties} 
            icon={<ShieldCheck size={24} />} 
            color="bg-emerald-500/10 text-emerald-500"
          />
          <StatCard 
            label="Pending Review" 
            value={stats.totalProperties - stats.verifiedProperties} 
            icon={<AlertCircle size={24} />} 
            color="bg-orange-500/10 text-orange-500"
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
              placeholder="Search by name or landlord..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-muted/20 border border-transparent focus:border-primary/20 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] focus:outline-none focus:ring-4 focus:ring-primary/5 text-foreground placeholder:text-muted-foreground/20 transition-all shadow-soft-sm"
            />
          </div>
          <div className="relative w-full sm:w-72 group">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={22} />
            <select 
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="w-full pl-16 pr-12 py-5 bg-muted/20 border border-transparent focus:border-primary/20 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] appearance-none focus:outline-none focus:ring-4 focus:ring-primary/5 text-foreground transition-all cursor-pointer shadow-soft-sm"
            >
              <option value="">All Properties</option>
              <option value="true">Verified</option>
              <option value="false">Pending</option>
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none rotate-90" size={18} />
          </div>
        </div>
      </section>

      {/* Properties Table */}
      <section className="card-premium shadow-soft-2xl min-h-[500px] overflow-hidden border-border-subtle relative bg-card/30 backdrop-blur-md">
        {isLoading && !isModalOpen ? (
          <div className="flex flex-col items-center justify-center p-40 gap-8 text-muted-foreground/40 font-black">
            <Loader2 className="animate-spin text-primary" size={64} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Loading properties...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-40 text-center animate-in fade-in duration-700">
            <div className="w-28 h-28 bg-muted/40 rounded-[2.75rem] flex items-center justify-center mb-10 shadow-inner group">
              <Building2 size={56} className="text-muted-foreground/10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-foreground tracking-tighter">No Properties Found</h3>
              <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">No records match the specified filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground/60">
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Property Details</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Landlord</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Location</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Status</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Added Date</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-muted/30 transition-all duration-300 group">
                    <td className="px-10 py-7">
                      <div className="font-black text-foreground text-base tracking-tight group-hover:text-primary transition-colors">{property.name}</div>
                      <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                        <span className="w-1 h-1 bg-primary rounded-full"></span>
                        {property.category?.name || 'Standard'} • {property.units?.length || 0} Units
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="font-bold text-foreground/80 text-sm tracking-tighter flex items-center gap-3">
                        {property.landlord?.name || 'ANONYMOUS NODE'}
                        {property.landlord?.isVerifiedLandlord && (
                          <ShieldCheck size={16} className="text-emerald-500 shadow-glow" />
                        )}
                      </div>
                      <div className="text-[9px] text-muted-foreground/30 font-black uppercase tracking-[0.2em] mt-1">Verified Landlord</div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="text-xs font-black text-foreground flex items-center gap-2.5 uppercase tracking-widest">
                        <MapPin size={16} className="text-primary/40 group-hover:text-primary transition-colors" /> {property.city}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      {property.verified ? (
                        <span className="badge-tint badge-emerald px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 w-max shadow-soft-sm border border-emerald-500/10">
                          <CheckCircle2 size={16} /> Verified
                        </span>
                      ) : (
                        <span className="badge-tint badge-orange px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2.5 w-max shadow-soft-sm border border-orange-500/10">
                          <AlertCircle size={16} className="animate-pulse" /> Audit Required
                        </span>
                      )}
                    </td>
                    <td className="px-10 py-7 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                      {new Date(property.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-6">
                        <Link 
                          href={`/dashboard/admin/properties/${property.id}/review`}
                          className="flex items-center gap-3 px-8 py-3 bg-foreground text-background text-[9px] font-black uppercase tracking-[0.25em] rounded-xl hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all duration-500 shadow-soft-xl brand-shadow group/btn"
                        >
                          <Eye size={16} className="group-hover/btn:rotate-12 transition-transform" /> Review
                        </Link>
                        
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleVerify(property.id, property.verified, property.name)}
                            className={`p-4 rounded-[1.25rem] transition-all shadow-soft-sm border border-transparent hover:border-border-subtle ${property.verified ? 'text-orange-500 hover:bg-orange-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                            title={property.verified ? "Revoke Certification" : "Approve Listing"}
                            disabled={isActionLoading}
                          >
                            {property.verified ? <XCircle size={22} /> : <CheckCircle2 size={22} />}
                          </button>
                          
                          <Link 
                            href={`/dashboard/landlord/properties/${property.id}/edit`}
                            className="p-4 text-muted-foreground/20 hover:text-foreground hover:bg-muted rounded-[1.25rem] transition-all shadow-soft-sm border border-transparent hover:border-border-subtle"
                            title="Admin Override"
                          >
                            <Plus size={22} className="rotate-45" />
                          </Link>
                        </div>
                      </div>
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
              Property Management Page <span className="text-primary">{page}</span> / <span className="text-foreground">{totalPages}</span>
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationConfig.isOpen}
        onClose={() => setConfirmationConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationConfig.onConfirm}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        confirmText={confirmationConfig.confirmText}
        type={confirmationConfig.type}
        isLoading={isActionLoading}
      />
    </div>
  );
}
