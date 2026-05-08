'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, User, ShieldCheck, Smartphone, X, Download } from 'lucide-react';

export default function AuthLoginRedirect() {
  const router = useRouter();
  const [showMobileModal, setShowMobileModal] = useState(false);

  const options = [
    {
      title: 'Student Portal',
      description: 'Access the Kibabii Nest app for discovery',
      icon: <User className="text-indigo-600" />,
      action: () => setShowMobileModal(true),
      color: 'bg-indigo-50'
    },
    {
      title: 'Landlord Portal',
      description: 'Manage your hostels and bookings',
      icon: <Building2 className="text-emerald-600" />,
      action: () => router.push('/auth/landlord'),
      color: 'bg-emerald-50'
    },
    {
      title: 'Admin Console',
      description: 'System-wide oversight & verifications',
      icon: <ShieldCheck className="text-slate-900" />,
      action: () => router.push('/auth/admin'),
      color: 'bg-slate-100'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-5xl">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-4 italic uppercase">Kibabii Nest</h1>
          <p className="text-xl text-slate-500 font-bold uppercase tracking-widest">Select your portal to continue</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {options.map((opt, i) => (
            <button 
              key={i}
              onClick={opt.action}
              className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:border-primary/30 transition-all group text-left flex flex-col h-full hover:-translate-y-2 duration-300"
            >
              <div className={`w-16 h-16 ${opt.color} rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110`}>
                {opt.icon}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">{opt.title}</h2>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">{opt.description}</p>
              <div className="mt-auto flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest group-hover:translate-x-2 transition-transform">
                Enter Portal <LayoutDashboard size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile App Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowMobileModal(false)} />
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <button 
              onClick={() => setShowMobileModal(false)}
              className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Smartphone size={40} />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Discovery on Mobile</h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-10">
                To provide the best discovery experience including real-time maps and secure bookings, the Student Portal is exclusively available on our mobile application.
              </p>
              
              <div className="space-y-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Available Now On</div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all group active:scale-95">
                    <Download size={20} />
                    <div className="text-left">
                      <div className="text-[10px] opacity-60 leading-none">Download on</div>
                      <div className="text-lg leading-tight">App Store</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all group active:scale-95">
                    <Smartphone size={20} />
                    <div className="text-left">
                      <div className="text-[10px] opacity-60 leading-none">Get it on</div>
                      <div className="text-lg leading-tight">Google Play</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 text-center">
              <p className="text-xs text-slate-400 font-medium">Already have the app? Open it to sign in as a student.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
