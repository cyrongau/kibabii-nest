'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Gavel, 
  Home, 
  Users, 
  Trash2, 
  Zap,
  ArrowLeft,
  Info,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function TenancyRulesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Header */}
      <div className="bg-card border-b border-border-subtle sticky top-0 z-50 backdrop-blur-xl bg-card/80">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/support"
              className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-sm font-black text-foreground uppercase tracking-widest">Tenancy Guidelines</h1>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Unified Rules & Obligations</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
            <ShieldCheck size={14} />
            Standardized Policy
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-16 px-6 space-y-16">
        {/* Intro */}
        <div className="space-y-6">
          <h2 className="text-4xl font-black tracking-tighter leading-none">Full Tenancy Rules & Obligations</h2>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl">
            This document outlines the standard operating procedures, rules, and legal obligations for all residents and landlords within the Kibabii Nest ecosystem.
          </p>
          <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex gap-5 items-start">
             <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                <Info size={24} />
             </div>
             <div>
                <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-1">Important Note</h4>
                <p className="text-sm text-foreground/70 font-medium leading-relaxed">
                   These rules are automatically incorporated into every digital tenancy agreement signed on our platform. Violation of these terms may lead to account suspension or eviction proceedings.
                </p>
             </div>
          </div>
        </div>

        {/* 1. Vacation Notice */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center font-black">01</div>
              <h3 className="text-2xl font-black tracking-tight">Vacation Notice & Move-Out</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card-premium p-8 space-y-4">
                 <div className="flex items-center gap-3 text-blue-500">
                    <Clock size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">30-Day Policy</span>
                 </div>
                 <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Tenants are required to provide a formal <strong>30-day notice</strong> via the Kibabii Nest app before vacating. The notice period begins the moment the digital request is submitted.
                 </p>
              </div>
              <div className="card-premium p-8 space-y-4">
                 <div className="flex items-center gap-3 text-blue-500">
                    <Trash2 size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Clearance</span>
                 </div>
                 <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Upon move-out, the unit must be cleared of all personal belongings and cleaned. Failure to do so will result in professional cleaning fees being deducted from the deposit.
                 </p>
              </div>
           </div>
        </section>

        {/* 2. Security Deposit */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center font-black">02</div>
              <h3 className="text-2xl font-black tracking-tight">Security Deposit & Refunds</h3>
           </div>
           <div className="card-premium p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-2">
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Refund Status</div>
                    <p className="text-sm font-bold">100% Refundable</p>
                    <p className="text-xs text-muted-foreground font-medium">Provided no damages occur.</p>
                 </div>
                 <div className="space-y-2">
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Processing Time</div>
                    <p className="text-sm font-bold">7 - 14 Days</p>
                    <p className="text-xs text-muted-foreground font-medium">Post inspection by landlord.</p>
                 </div>
                 <div className="space-y-2">
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Deduction Rule</div>
                    <p className="text-sm font-bold">Itemized List</p>
                    <p className="text-xs text-muted-foreground font-medium">Mandatory for all deductions.</p>
                 </div>
              </div>
              <div className="bg-muted/50 p-6 rounded-2xl border border-border-subtle">
                 <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">
                    "The security deposit is held to cover damages beyond normal wear and tear. It cannot be used as the final month's rent. Landlords must provide a digital 'Damage Assessment Report' within 48 hours of inspection if deductions are to be made."
                 </p>
              </div>
           </div>
        </section>

        {/* 3. Termination & Breach */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center font-black">03</div>
              <h3 className="text-2xl font-black tracking-tight">Termination & Breach of Contract</h3>
           </div>
           <div className="space-y-4">
              <p className="text-muted-foreground font-medium">The landlord may terminate the tenancy with 7 days notice if any of the following breaches occur:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   { icon: AlertTriangle, text: "Non-payment of rent beyond 15 days" },
                   { icon: Gavel, text: "Engaging in illegal activities on premises" },
                   { icon: Users, text: "Subletting without written consent" },
                   { icon: Zap, text: "Damage to utility or structural components" }
                 ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-card border border-border-subtle rounded-2xl shadow-sm">
                       <item.icon size={20} className="text-red-500 shrink-0" />
                       <span className="text-sm font-bold text-foreground/80">{item.text}</span>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 4. Residency Rules */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center font-black">04</div>
              <h3 className="text-2xl font-black tracking-tight">Rules of Residency</h3>
           </div>
           <div className="grid grid-cols-1 gap-6">
              {[
                { 
                  title: "Quiet Hours & Conduct", 
                  desc: "Quiet hours are observed from 10:00 PM to 6:00 AM. Loud music, parties, or any activities that disturb the peace of fellow students are strictly prohibited.",
                  color: "purple"
                },
                { 
                  title: "Visitors Policy", 
                  desc: "Visitors are allowed between 8:00 AM and 9:00 PM. Overnight guests must be registered with the landlord/caretaker (subject to host unit capacity rules).",
                  color: "emerald"
                },
                { 
                  title: "Substances & Safety", 
                  desc: "The use, possession, or distribution of illegal substances is grounds for immediate eviction. Smoking is only permitted in designated outdoor areas.",
                  color: "red"
                },
                { 
                  title: "Maintenance & Cleanliness", 
                  desc: "Tenants must maintain their units in a sanitary condition. Shared spaces (kitchens, bathrooms) must be cleaned immediately after use. Report any leaks or repairs via the support center.",
                  color: "blue"
                }
              ].map((rule, i) => (
                 <div key={i} className="group p-8 bg-card border border-border-subtle rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300">
                    <h4 className={`text-lg font-black mb-3 text-${rule.color}-500 flex items-center gap-3`}>
                       <Home size={20} />
                       {rule.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                       {rule.desc}
                    </p>
                 </div>
              ))}
           </div>
        </section>

        {/* Footer Info */}
        <div className="pt-20 border-t border-border-subtle text-center space-y-6">
           <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Kibabii Nest Policy · 2025 Edition</div>
           <Link 
              href="/support"
              className="inline-flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest hover:gap-4 transition-all"
           >
              Back to Support Center
              <ChevronRight size={18} />
           </Link>
        </div>
      </div>
    </div>
  );
}
