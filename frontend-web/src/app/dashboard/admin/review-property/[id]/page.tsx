'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle2, XCircle, MapPin, Image as ImageIcon, Video, 
  ShieldCheck, Loader2, Home, User, Mail, Phone, Calendar, Info, FileText
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

function DetailBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-6 bg-muted/20 rounded-2xl border border-border-subtle shadow-soft-sm group hover:border-primary/20 transition-all">
      <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mb-1.5 leading-none">Intelligence Data</div>
      <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{value}</div>
      <div className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-widest mt-1.5">{label}</div>
    </div>
  );
}

function ContactItem({ icon, value }: { icon: React.ReactNode, value: string }) {
  return (
    <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground group">
      <div className="p-2.5 bg-muted rounded-xl text-muted-foreground/40 group-hover:text-primary group-hover:bg-primary/5 transition-all">{icon}</div>
      <span className="group-hover:text-foreground transition-colors">{value}</span>
    </div>
  );
}

export default function PropertyReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useNotifications();
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`http://localhost:3000/properties/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (response.ok) {
        setProperty(await response.json());
      } else {
        showToast('Failed to load property', 'error');
        router.push('/dashboard/admin/properties');
      }
    } catch (error) {
      showToast('Error loading property', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (status: boolean) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:3000/properties/${id}/verify`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verified: status })
      });
      if (response.ok) {
        showToast(`Property ${status ? 'verified' : 'unverified'} successfully`, 'success');
        fetchProperty();
      }
    } catch (error) {
      showToast('Failed to update verification status', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center h-[70vh] gap-8 animate-in fade-in duration-1000">
        <Loader2 className="animate-spin text-primary" size={64} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">Initializing surveillance probe...</p>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-8 w-full md:w-auto">
          <button 
            onClick={() => router.back()} 
            className="p-5 bg-card border border-border-subtle rounded-[1.75rem] text-muted-foreground/40 hover:text-primary hover:bg-muted transition-all shadow-soft-sm group"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter">Asset Registry Scrutiny</h1>
            <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm mt-1.5 flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
              Detailed intelligence audit for sovereign platform verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto">
          <button 
            disabled={isProcessing || !property.verified}
            onClick={() => handleVerify(false)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-card border border-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.75rem] hover:bg-red-500/5 disabled:opacity-10 transition-all shadow-soft-sm"
          >
            <XCircle size={20} /> Revoke Auth
          </button>
          <button 
            disabled={isProcessing || property.verified}
            onClick={() => handleVerify(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-12 py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.75rem] shadow-2xl shadow-primary/20 brand-shadow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-10 transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <CheckCircle2 size={20} className="relative z-10" /> <span className="relative z-10">Authorize Node</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="card-premium p-12 rounded-[3.5rem] border-border-subtle shadow-soft-2xl space-y-10 relative bg-card/30 backdrop-blur-md overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-32 -translate-y-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>
            
            <div className="flex flex-col sm:flex-row items-start justify-between gap-8 relative z-10">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{property.name}</h2>
                <div className="flex items-center gap-3 text-muted-foreground/60 font-bold text-sm bg-muted/30 px-5 py-2.5 rounded-2xl border border-border-subtle w-max shadow-soft-sm">
                  <MapPin size={18} className="text-primary/40" /> {property.address}, {property.city}
                </div>
              </div>
              <span className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-soft-sm border border-white/5 flex items-center gap-3 ${property.verified ? 'badge-emerald' : 'badge-orange'}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${property.verified ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                {property.verified ? 'Authorized Node' : 'Awaiting Audit'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
              <DetailBox label="Registry Sector" value={property.category?.name || 'Standard'} />
              <DetailBox label="Base Valuation" value={`Ksh ${property.price?.toLocaleString()}`} />
              <DetailBox label="Node Proximity" value={`${property.distanceToCampus}m to Core`} />
            </div>

            <div className="relative z-10 bg-muted/10 p-8 rounded-[2.5rem] border border-border-subtle">
              <h3 className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                <div className="w-6 h-1 bg-primary rounded-full"></div> Intelligence Brief
              </h3>
              <p className="text-muted-foreground leading-relaxed font-bold text-sm">{property.description}</p>
            </div>
          </section>

          <section className="card-premium p-12 rounded-[3.5rem] border-border-subtle shadow-soft-2xl space-y-10 relative bg-card/30 backdrop-blur-md group">
             <div className="flex items-center gap-5 relative z-10">
               <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                 <ImageIcon className="text-primary" size={28} />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-foreground tracking-tighter">Visual Intelligence Artifacts</h3>
                 <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1.5 italic text-sm">Property photo gallery logs</p>
               </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                {property.images?.map((img: string, idx: number) => (
                  <div key={idx} className="aspect-square bg-muted rounded-[2.5rem] overflow-hidden border-2 border-border-subtle shadow-soft-sm hover:scale-[1.02] transition-all duration-500 cursor-zoom-in group/img relative">
                    <div className="absolute inset-0 bg-primary/0 group-hover/img:bg-primary/10 transition-colors z-10"></div>
                    <img src={img} alt={`Artifact ${idx}`} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" />
                  </div>
                ))}
             </div>
          </section>
        </div>

        <div className="space-y-12">
           <section className="card-premium p-12 rounded-[3.5rem] border-border-subtle shadow-soft-2xl space-y-10 relative bg-card/30 backdrop-blur-md group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full translate-x-24 -translate-y-24 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>

             <div className="flex items-center gap-5 relative z-10">
               <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                 <User className="text-primary" size={28} />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-foreground tracking-tighter">Guardian Node</h3>
                 <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1.5 italic text-sm">Asset ownership credentials</p>
               </div>
             </div>

             <div className="flex items-center gap-6 p-6 bg-muted/30 rounded-[2.5rem] border border-border-subtle relative z-10 group/guardian hover:border-primary/20 transition-all">
                <div className="w-16 h-16 bg-foreground text-background rounded-2xl overflow-hidden shadow-soft-sm flex items-center justify-center font-black text-2xl group-hover/guardian:scale-110 group-hover/guardian:bg-primary group-hover/guardian:text-white transition-all duration-500">
                  {property.landlord?.name ? property.landlord?.name[0].toUpperCase() : 'G'}
                </div>
                <div>
                  <div className="text-lg font-black text-foreground group-hover/guardian:text-primary transition-colors">{property.landlord?.name}</div>
                  <div className="text-[9px] font-black text-emerald-500 flex items-center gap-2 uppercase tracking-widest mt-1">
                    <ShieldCheck size={14} className="animate-pulse" /> Identity Verified
                  </div>
                </div>
             </div>
             
             <div className="space-y-6 px-4 relative z-10">
                <ContactItem icon={<Mail size={20} />} value={property.landlord?.email} />
                <ContactItem icon={<Phone size={20} />} value={property.landlord?.phone || 'SECURE DATA ENCRYPTED'} />
             </div>

             <button className="w-full py-5 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.75rem] hover:bg-primary hover:text-white transition-all duration-500 shadow-soft-xl relative overflow-hidden group/btn">
               <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
               Initialize Secure Comms
             </button>
           </section>

           <section className="bg-primary/5 p-12 rounded-[3.5rem] border border-primary/10 space-y-6 relative overflow-hidden group">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div> Compliance Matrix
              </div>
              <p className="text-xs font-bold text-muted-foreground/60 leading-relaxed">System-level verification ensures the node adheres to all Kibabii Nest sovereign protocols. Proceed with authorization only after visual confirmation.</p>
           </section>
        </div>
      </div>
    </div>
  );
}

// Component removed as it is now defined within the main component scope for better design system integration.
