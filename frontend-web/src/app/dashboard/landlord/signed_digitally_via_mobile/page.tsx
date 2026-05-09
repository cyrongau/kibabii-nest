'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Printer, Download } from 'lucide-react';
import SystemAgreementTemplate from '@/components/SystemAgreementTemplate';

function AgreementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenancyId = searchParams.get('id');
  const [tenancy, setTenancy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenancyId) {
      setError('Tenancy ID is missing');
      setIsLoading(false);
      return;
    }

    const fetchTenancy = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/tenancy/${tenancyId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          setTenancy(await response.json());
        } else {
          setError('Failed to fetch tenancy details');
        }
      } catch (e) {
        setError('Connection error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenancy();
  }, [tenancyId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">Decrypting Secure Agreement...</p>
      </div>
    );
  }

  if (error || !tenancy) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-red-500 mb-8 shadow-soft">
          <ArrowLeft size={32} />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tighter mb-4">Agreement Unavailable</h1>
        <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-10 leading-relaxed">{error || 'The requested tenancy agreement could not be located.'}</p>
        <button 
          onClick={() => router.back()}
          className="px-10 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl brand-shadow"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Map backend data to template props
  const propertyData = {
    name: tenancy.propertyUnit?.property?.name || 'Kibabii Property',
    address: tenancy.propertyUnit?.property?.address || 'Kibabii Area',
    city: tenancy.propertyUnit?.property?.city || 'Bungoma',
    extraCharges: tenancy.propertyUnit?.property?.extraCharges || {},
  };

  const landlordData = {
    name: tenancy.propertyUnit?.property?.landlord?.name || 'Landlord',
    phone: tenancy.propertyUnit?.property?.landlord?.phone,
    email: tenancy.propertyUnit?.property?.landlord?.email,
  };

  const unitData = {
    name: tenancy.unitName || tenancy.propertyUnit?.type?.name || 'Standard Unit',
    price: tenancy.monthlyRent,
    type: tenancy.propertyUnit?.type?.name || 'Standard',
  };

  const tenantData = {
    name: tenancy.tenant?.name || 'N/A',
    idNumber: tenancy.tenant?.idNumber || 'N/A',
    university: 'Kibabii University', // Default as per requirement
    phone: tenancy.tenant?.phone || 'N/A',
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Top Navigation */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 print:hidden">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-sm font-black text-foreground uppercase tracking-widest">Digital Agreement</h1>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Tenant: {tenancy.tenant?.name}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all brand-shadow"
            >
              <Printer size={16} /> Print Copy
            </button>
          </div>
        </div>
      </div>

      {/* Agreement Display */}
      <div className="pt-12 px-4 sm:px-6">
        <SystemAgreementTemplate 
          property={propertyData}
          landlord={landlordData}
          selectedUnit={unitData}
          tenant={tenantData}
        />
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto mt-12 px-12 text-center space-y-4 opacity-40 print:hidden">
        <p className="text-[10px] font-bold uppercase tracking-widest">This is a legally binding document stored securely on the Kibabii Nest platform.</p>
        <p className="text-[9px] font-mono">HASH: {btoa(tenancy.id).substring(0, 32).toUpperCase()}</p>
      </div>
    </div>
  );
}

export default function DigitalAgreementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    }>
      <AgreementContent />
    </Suspense>
  );
}
