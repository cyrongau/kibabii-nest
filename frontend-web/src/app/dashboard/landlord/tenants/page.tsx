'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Mail, Phone, Home, Clock, FileText, ChevronRight, Loader2, UserCheck, History, Sliders, Calendar } from 'lucide-react';

export default function LandlordTenantsPage() {
  const [tenancies, setTenancies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [selectedTenancy, setSelectedTenancy] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isConfigSubmitting, setIsConfigSubmitting] = useState(false);
  const [configForm, setConfigForm] = useState({
    paymentDeadlineDay: 5,
    latePenaltyPerDay: 0,
    upfrontDiscountPct: 0,
    breakPeriodEnabled: false,
    breakPeriodRentPct: 50,
    breakPeriodStart: '',
    breakPeriodEnd: ''
  });

  const handleConfigureClick = (tenancy: any) => {
    setSelectedTenancy(tenancy);
    setConfigForm({
      paymentDeadlineDay: tenancy.paymentDeadlineDay ?? 5,
      latePenaltyPerDay: tenancy.latePenaltyPerDay ?? 0,
      upfrontDiscountPct: tenancy.upfrontDiscountPct ?? 0,
      breakPeriodEnabled: tenancy.breakPeriodEnabled ?? false,
      breakPeriodRentPct: tenancy.breakPeriodRentPct ?? 50,
      breakPeriodStart: tenancy.breakPeriodStart ? new Date(tenancy.breakPeriodStart).toISOString().split('T')[0] : '',
      breakPeriodEnd: tenancy.breakPeriodEnd ? new Date(tenancy.breakPeriodEnd).toISOString().split('T')[0] : ''
    });
    setIsConfigModalOpen(true);
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/tenancy/${selectedTenancy.id}/config`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentDeadlineDay: parseInt(configForm.paymentDeadlineDay.toString()),
          latePenaltyPerDay: parseFloat(configForm.latePenaltyPerDay.toString()),
          upfrontDiscountPct: parseFloat(configForm.upfrontDiscountPct.toString()),
          breakPeriodEnabled: configForm.breakPeriodEnabled,
          breakPeriodRentPct: parseFloat(configForm.breakPeriodRentPct.toString()),
          breakPeriodStart: configForm.breakPeriodStart ? new Date(configForm.breakPeriodStart).toISOString() : null,
          breakPeriodEnd: configForm.breakPeriodEnd ? new Date(configForm.breakPeriodEnd).toISOString() : null
        })
      });

      if (response.ok) {
        setIsConfigModalOpen(false);
        fetchTenancies();
      }
    } catch (e) {
      console.error('Failed to save config:', e);
    } finally {
      setIsConfigSubmitting(false);
    }
  };

  useEffect(() => {
    fetchTenancies();
  }, []);

  const fetchTenancies = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/tenancy/landlord`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/auth/landlord';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setTenancies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch tenancies', e);
      setTenancies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTenancies = tenancies.filter(t => {
    const matchesSearch = t.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.propertyUnit?.property?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'active' ? t.status !== 'VACATED' : t.status === 'VACATED';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-8 lg:p-12 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground font-medium mt-1">Track current occupancy and historical tenancy records.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
            <input 
              type="text" 
              placeholder="Search by tenant name or property..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground"
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border-subtle">
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-2 text-sm font-black transition-all relative ${activeTab === 'active' ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground'}`}
        >
          <span className="flex items-center gap-2">
            <UserCheck size={18} /> Active Tenants
            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === 'active' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {tenancies.filter(t => t.status !== 'VACATED').length}
            </span>
          </span>
          {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.3)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('archive')}
          className={`pb-4 px-2 text-sm font-black transition-all relative ${activeTab === 'archive' ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground'}`}
        >
          <span className="flex items-center gap-2">
            <History size={18} /> Tenancy Archive
            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === 'archive' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {tenancies.filter(t => t.status === 'VACATED').length}
            </span>
          </span>
          {activeTab === 'archive' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.3)]" />}
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground/60 font-bold">
          <Loader2 className="animate-spin text-primary" size={32} />
          Fetching tenant records...
        </div>
      ) : filteredTenancies.length === 0 ? (
        <div className="card-premium p-20 text-center shadow-soft">
          <Users className="mx-auto text-muted-foreground/20 mb-6" size={64} />
          <h2 className="text-xl font-black text-foreground">No tenants found</h2>
          <p className="text-muted-foreground font-medium mt-2">
            {searchTerm ? `No results for "${searchTerm}"` : activeTab === 'active' ? "You don't have any active tenants yet." : "Your tenancy archive is empty."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredTenancies.map((tenancy) => (
            <TenantCard key={tenancy.id} tenancy={tenancy} onConfigure={handleConfigureClick} />
          ))}
        </div>
      )}
      {/* Tenancy Config Modal */}
      {isConfigModalOpen && selectedTenancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-popover border border-border rounded-[3rem] w-full max-w-2xl shadow-soft-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <header className="p-10 border-b border-border-subtle flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-soft-sm">
                  <Sliders size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">Tenancy Config</h2>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">Configure parameters for {selectedTenancy.tenant?.name}</p>
                </div>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)} className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all">✕</button>
            </header>

            <form onSubmit={handleConfigSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Deadline Day</label>
                  <select 
                    value={configForm.paymentDeadlineDay}
                    onChange={(e) => setConfigForm({ ...configForm, paymentDeadlineDay: parseInt(e.target.value) })}
                    className="w-full px-5 py-4 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>Day {day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Late Penalty (Ksh/day)</label>
                  <input 
                    type="number"
                    value={configForm.latePenaltyPerDay}
                    onChange={(e) => setConfigForm({ ...configForm, latePenaltyPerDay: parseFloat(e.target.value || '0') })}
                    className="w-full px-5 py-4 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Upfront Discount %</label>
                  <input 
                    type="number"
                    value={configForm.upfrontDiscountPct}
                    onChange={(e) => setConfigForm({ ...configForm, upfrontDiscountPct: parseFloat(e.target.value || '0') })}
                    className="w-full px-5 py-4 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-border-subtle pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-foreground">Long Break Rent Hold</h3>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">Reduce rent during holiday periods</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={configForm.breakPeriodEnabled}
                      onChange={(e) => setConfigForm({ ...configForm, breakPeriodEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {configForm.breakPeriodEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-200">
                    <div>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Rent Percentage (e.g. 50)</label>
                      <input 
                        type="number"
                        value={configForm.breakPeriodRentPct}
                        onChange={(e) => setConfigForm({ ...configForm, breakPeriodRentPct: parseFloat(e.target.value || '0') })}
                        className="w-full px-5 py-4 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">Start Date</label>
                      <input 
                        type="date"
                        value={configForm.breakPeriodStart}
                        onChange={(e) => setConfigForm({ ...configForm, breakPeriodStart: e.target.value })}
                        className="w-full px-5 py-4 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-3 block">End Date</label>
                      <input 
                        type="date"
                        value={configForm.breakPeriodEnd}
                        onChange={(e) => setConfigForm({ ...configForm, breakPeriodEnd: e.target.value })}
                        className="w-full px-5 py-4 bg-muted/50 border border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="flex-1 px-8 py-4 bg-muted text-muted-foreground rounded-2xl font-black hover:bg-muted/80 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isConfigSubmitting}
                  className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] brand-shadow"
                >
                  {isConfigSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Save Config'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TenantCard({ tenancy, onConfigure }: { tenancy: any; onConfigure: (t: any) => void }) {
  const isArchive = tenancy.status === 'VACATED';

  return (
    <div className={`card-premium p-8 shadow-soft hover:shadow-soft-lg transition-all group ${isArchive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-muted rounded-2xl overflow-hidden border-2 border-background shadow-soft-sm shrink-0">
            <img 
              src={`https://ui-avatars.com/api/?name=${tenancy.tenant?.name}&background=random&size=128`} 
              alt={tenancy.tenant?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors tracking-tight">
              <a href={`/dashboard/landlord/students/${tenancy.tenantId || tenancy.tenant?.id}`} className="hover:underline">
                {tenancy.tenant?.name}
              </a>
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/60">
                <Mail size={12} /> {tenancy.tenant?.email}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/60">
                <Phone size={12} /> {tenancy.tenant?.phone || 'No phone'}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`badge-tint flex items-center gap-1 w-fit ${
            tenancy.status === 'ACTIVE' ? 'badge-emerald' :
            tenancy.status === 'VACATED' ? 'bg-muted text-muted-foreground' :
            'badge-orange'
          }`}>
            {tenancy.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-muted/30 rounded-2xl border border-border-subtle/50">
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2">
            <Home size={12} /> Property & Unit
          </div>
          <div className="text-sm font-black text-foreground truncate tracking-tight">
            {tenancy.propertyUnit?.property?.name}
          </div>
          <div className="text-[10px] font-bold text-muted-foreground mt-0.5">
            Unit: {tenancy.unitName || tenancy.propertyUnit?.type?.name || 'N/A'}
          </div>
        </div>
        <div className="p-4 bg-muted/30 rounded-2xl border border-border-subtle/50">
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-2">
            <Clock size={12} /> Tenancy Period
          </div>
          <div className="text-sm font-black text-foreground tracking-tight">
            {new Date(tenancy.moveInDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} - {isArchive ? new Date(tenancy.moveOutDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Present'}
          </div>
          <div className="text-[10px] font-bold text-muted-foreground mt-0.5">
            {isArchive ? 'Historical Record' : 'Active Occupancy'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-border-subtle flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">Monthly Rent</div>
            <div className="text-lg font-black text-foreground tracking-tight">Ksh {tenancy.monthlyRent?.toLocaleString()}</div>
          </div>
          <div className="w-px h-8 bg-border-subtle" />
          <div>
            <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">Signing Date</div>
            <div className="text-sm font-black text-muted-foreground/80">
              {tenancy.signedAt ? new Date(tenancy.signedAt).toLocaleDateString() : 'Pending Signature'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isArchive && (
            <button 
              onClick={() => onConfigure(tenancy)}
              className="flex items-center gap-2 bg-card text-foreground border border-border-subtle shadow-soft px-5 py-2.5 rounded-xl text-xs font-black hover:bg-muted hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Sliders size={14} />
              Configure
            </button>
          )}

          {(tenancy.agreementUrl || tenancy.propertyUnit?.property?.useSystemAgreement) ? (
            <a 
              href={tenancy.propertyUnit?.property?.useSystemAgreement 
                ? `/dashboard/landlord/signed_digitally_via_mobile?id=${tenancy.id}` 
                : tenancy.agreementUrl
              } 
              target={tenancy.propertyUnit?.property?.useSystemAgreement ? "_self" : "_blank"} 
              rel="noreferrer"
              className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-xs font-black shadow-soft hover:bg-primary hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <FileText size={16} />
              View Agreement
            </a>
          ) : (
            <div className="flex items-center gap-2 text-amber-500 text-xs font-black">
              <Clock size={16} />
              Waiting for Sign
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
