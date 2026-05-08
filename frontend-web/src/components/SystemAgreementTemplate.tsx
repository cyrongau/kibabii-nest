'use client';

import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Printer,
  PenLine
} from 'lucide-react';
import Link from 'next/link';

interface SystemAgreementTemplateProps {
  property: {
    name: string;
    address: string;
    city: string;
    distanceToCampus?: number;
    extraCharges?: {
      serviceFee?: string;
      securityDeposit?: string;
    };
    units?: any[];
  };
  landlord: {
    name: string;
    phone?: string;
    email?: string;
  };
  selectedUnit?: {
    name: string;
    price: number;
    type: string;
  };
  tenant?: {
    name: string;
    idNumber: string;
    university: string;
    phone: string;
  };
  onSign?: () => void;
  isPdf?: boolean;
}

export default function SystemAgreementTemplate({ 
  property, 
  landlord, 
  selectedUnit,
  tenant,
  onSign,
  isPdf = false 
}: SystemAgreementTemplateProps) {
  const docId = `KN-TA-2025-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const unitToUse = selectedUnit || property.units?.[0] || {};
  const monthlyRent = unitToUse.price || '0';
  const securityDeposit = property.extraCharges?.securityDeposit || monthlyRent;
  const serviceFee = property.extraCharges?.serviceFee || '150';
  const totalDue = parseFloat(monthlyRent.toString()) + parseFloat(securityDeposit.toString()) + parseFloat(serviceFee.toString());

  return (
    <div className={`agreement-container max-w-4xl mx-auto bg-white ${!isPdf ? 'shadow-2xl' : ''} rounded-none sm:rounded-xl overflow-hidden relative border-2 border-[#1e3a8a]/20 font-sans text-gray-800 antialiased`}>
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] text-[8rem] font-extrabold text-[#1e3a8a]/[0.03] pointer-events-none z-0 whitespace-nowrap tracking-[0.3em] font-serif">
        KIBABII NEST
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#1e3a8a] text-white px-8 sm:px-12 py-8 sm:py-10">
        <div className="absolute top-0 right-0 w-64 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,89.1,-0.5C88.2,15.2,83.8,30.5,74.4,41.8C65,53.2,50.7,60.7,36.3,66.4C21.8,72.2,7.3,76.2,-6.2,74.6C-19.8,73,-39.5,65.8,-53.2,54.3C-66.9,42.7,-74.6,26.8,-77.9,10.1C-81.2,-6.6,-80.2,-24.1,-71.8,-37.1C-63.5,-50.2,-47.8,-58.7,-33.1,-65.9C-18.4,-73.1,-4.7,-79,9.1,-76.6C22.8,-74.2,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Building2 size={20} />
              </div>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">KIBABII NEST</h1>
                <p className="text-xs text-blue-200 tracking-widest uppercase">Student Housing Ecosystem</p>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-blue-100">
            <p className="font-semibold text-white text-base uppercase">Tenancy Agreement</p>
            <p className="text-xs">Document Ref: <span className="font-mono text-blue-200">{docId}</span></p>
            <p className="text-xs">Version 2.4 · Secure Digital Document</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap gap-4 text-xs text-blue-200">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Digitally Verifiable</span>
          <span className="flex items-center gap-1.5"><Lock size={14} /> AES-256 Encrypted</span>
          <span className="flex items-center gap-1.5"><Clock size={14} /> Timestamped</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="relative z-10 px-8 sm:px-12 py-8 sm:py-10 space-y-8 text-sm leading-relaxed">
        
        {/* Section 1: Parties */}
        <section>
          <h2 className="font-serif text-xl font-bold text-[#1e3a8a] border-b-2 border-blue-100 pb-2 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-[#1e3a8a] text-sm font-bold">1</span>
            PARTIES TO THIS AGREEMENT
          </h2>
          <div className="bg-blue-50/30 border border-blue-100 rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#2563eb] font-semibold mb-2">Landlord / Agent</p>
              <p className="font-semibold text-gray-900">{landlord.name}</p>
              <p className="text-gray-600">{property.address}</p>
              <p className="text-gray-600">{property.city}, Kenya</p>
              <p className="text-gray-600">Phone: {landlord.phone || '+254 XXX XXX XXX'}</p>
              <p className="text-gray-600">Email: {landlord.email || 'landlord@kibabiinest.com'}</p>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-blue-100 pt-4 md:pt-0 md:pl-6">
              <p className="text-xs uppercase tracking-widest text-[#2563eb] font-semibold mb-2">Tenant / Student</p>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{tenant?.name || '_________________________________'}</p>
                <p className="text-xs text-gray-400">Full Name (as per Student ID)</p>
                <p className="text-gray-600 mt-2">Student ID: {tenant?.idNumber || '____________________________'}</p>
                <p className="text-gray-600">University: {tenant?.university || 'Kibabii University'}</p>
                <p className="text-gray-600">Phone: {tenant?.phone || '____________________________'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Property Details */}
        <section>
          <h2 className="font-serif text-xl font-bold text-[#1e3a8a] border-b-2 border-blue-100 pb-2 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-[#1e3a8a] text-sm font-bold">2</span>
            PROPERTY & TERM DETAILS
          </h2>
          <div className="bg-amber-50/30 border border-amber-100 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-700 font-semibold">Property Name</p>
              <p className="font-semibold text-gray-900">{property.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-700 font-semibold">Room / Unit No.</p>
              <p className="font-semibold text-gray-900">{unitToUse.name || '___________________________'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-700 font-semibold">Academic Year</p>
              <p className="font-semibold text-gray-900">2025 / 2026</p>
            </div>
          </div>
        </section>

        {/* Section 3: Payment Terms */}
        <section>
          <h2 className="font-serif text-xl font-bold text-[#1e3a8a] border-b-2 border-blue-100 pb-2 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-[#1e3a8a] text-sm font-bold">3</span>
            PAYMENT TERMS
          </h2>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#1e3a8a] text-white">
                  <th className="px-4 py-3 text-left font-semibold">Item</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount (KES)</th>
                  <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-blue-50/30">
                  <td className="px-4 py-3 font-medium">Monthly Rent</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{parseFloat(monthlyRent.toString()).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 italic">5th of each month</td>
                </tr>
                <tr className="hover:bg-blue-50/30 bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">Security Deposit (Refundable)</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">{parseFloat(securityDeposit.toString()).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 italic">Upon signing</td>
                </tr>
                <tr className="hover:bg-blue-50/30">
                  <td className="px-4 py-3 font-medium">Registration / Admin Fee</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">{parseFloat(serviceFee.toString()).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 italic">Upon signing</td>
                </tr>
                <tr className="bg-[#1e3a8a]/5 font-bold">
                  <td className="px-4 py-3 text-[#1e3a8a]">Total Initial Payment</td>
                  <td className="px-4 py-3 text-right font-mono text-[#1d4ed8] text-base">KES {totalDue.toLocaleString()}</td>
                  <td className="px-4 py-3">Immediate</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-red-50/60 border border-red-200 rounded-lg text-xs text-red-800">
            <p className="font-semibold flex items-center gap-1.5"><AlertTriangle size={14} /> Late Payment Policy:</p>
            <p className="mt-1">A late fee of <strong>KES 500</strong> applies for payments received after the 10th of the month. Continued non-payment beyond 30 days may result in eviction proceedings.</p>
          </div>
        </section>

        {/* Section 5: Rules of Residency (Excerpt) */}
        <section>
          <h2 className="font-serif text-xl font-bold text-[#1e3a8a] border-b-2 border-blue-100 pb-2 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-[#1e3a8a] text-sm font-bold">4</span>
            RULES OF RESIDENCY (EXCERPT)
          </h2>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-[#1e3a8a] text-xs uppercase mb-1">Quiet Hours</p>
                <p className="text-gray-700 text-xs">Observed from <strong>10:00 PM to 6:00 AM</strong> daily.</p>
              </div>
              <div>
                <p className="font-bold text-[#1e3a8a] text-xs uppercase mb-1">Visitors</p>
                <p className="text-gray-700 text-xs">Permitted between <strong>8:00 AM and 9:00 PM</strong> only.</p>
              </div>
              <div>
                <p className="font-bold text-[#1e3a8a] text-xs uppercase mb-1">Substances</p>
                <p className="text-gray-700 text-xs">Alcohol and illegal substances are strictly prohibited.</p>
              </div>
              <div>
                <p className="font-bold text-[#1e3a8a] text-xs uppercase mb-1">Cleanliness</p>
                <p className="text-gray-700 text-xs">Tenants must maintain shared spaces in sanitary condition.</p>
              </div>
            </div>
            <Link href="/support/tenancy-rules" className="text-[10px] text-primary hover:underline italic mt-2 inline-block">
              * See full rules and obligations on the Kibabii Nest platform.
            </Link>
          </div>
        </section>

        {/* Signature Blocks */}
        <section className="pt-8 border-t border-gray-100">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Landlord Signature - Pre-signed for system agreement */}
              <div className="bg-white border-2 border-amber-400/30 rounded-xl p-6 relative">
                  <div className="absolute -top-4 left-6 bg-[#b8942e] text-white text-[10px] font-bold px-4 py-1 rounded-full tracking-wider uppercase">
                    Landlord / Management
                  </div>
                  <div className="mt-4 min-h-[80px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                    <p className="font-serif text-2xl text-[#1e3a8a] opacity-60 italic">{landlord.name}</p>
                    <div className="h-px w-2/3 bg-gray-300 mt-2"></div>
                  </div>
                  <div className="mt-3 space-y-1 text-[10px] text-gray-500">
                    <p>Verified Landlord Signature</p>
                    <p>Date: {formattedDate}</p>
                  </div>
              </div>

              {/* Tenant Signature - Placeholder */}
              <div className="bg-white border-2 border-[#1e3a8a]/20 rounded-xl p-6 relative">
                  <div className="absolute -top-4 left-6 bg-[#1e3a8a] text-white text-[10px] font-bold px-4 py-1 rounded-full tracking-wider uppercase">
                    Tenant / Student
                  </div>
                  <div className="mt-4 min-h-[80px] flex items-center justify-center border-2 border-dashed border-[#1e3a8a]/20 rounded-lg bg-blue-50/10">
                    <p className="text-[#1e3a8a]/40 text-xs font-medium">Pending Tenant Signature</p>
                  </div>
                  <div className="mt-3 space-y-1 text-[10px] text-gray-500">
                    <p>Digitally Signed via Kibabii Nest</p>
                    <p>Date: Pending...</p>
                  </div>
              </div>
           </div>
        </section>

        {/* Footer Info */}
        <div className="pt-6 border-t-2 border-dotted border-gray-200 flex items-center justify-between">
          <div className="text-[10px] text-gray-400">
            <p>Ref: {docId}</p>
            <p>Generated: {now.toLocaleString()}</p>
          </div>
          <div className="bg-slate-100 p-2 rounded flex gap-2 items-center">
            <div className="w-8 h-8 bg-white border border-gray-200 rounded flex items-center justify-center text-[8px] text-gray-300 text-center leading-tight">
              QR CODE<br/>VERIFY
            </div>
            <div className="text-[9px] text-gray-500 font-mono">
              SECURE DOCUMENT<br/>VERIFIED PLATFORM
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar Overlay (If not PDF) */}
      {!isPdf && (
        <div className="bg-[#1e3a8a] text-white px-8 py-4 flex items-center justify-between">
          <p className="text-xs font-medium opacity-80 italic">This is a preview of the system-generated tenancy agreement.</p>
          <div className="flex gap-3">
             <button type="button" onClick={() => window.print()} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-all">
                <Printer size={14} /> Print
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
