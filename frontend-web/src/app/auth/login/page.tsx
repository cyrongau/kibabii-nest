'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, User, ShieldCheck, Smartphone, X, Download, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function AuthLoginRedirect() {
  const router = useRouter();
  const { showAlert } = useNotifications();
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState<'LANDLORD' | 'ADMIN' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent, role: 'LANDLORD' | 'ADMIN') => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, requiredRole: role }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Deny student/tenant on web
        if (data.user?.role === 'STUDENT' || data.user?.role === 'TENANT') {
          setShowMobileModal(true);
          setShowLoginOverlay(null);
          return;
        }

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push(role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/landlord');
      } else {
        const data = await response.json();
        showAlert({
          title: 'Access Denied',
          message: data.message || 'Invalid credentials or unauthorized access.',
          type: 'error'
        });
      }
    } catch (error) {
      showAlert({ title: 'Connection Error', message: 'Failed to reach server.', type: 'warning' });
    } finally {
      setIsLoading(false);
    }
  };

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
      action: () => setShowLoginOverlay('LANDLORD'),
      color: 'bg-emerald-50'
    },
    {
      title: 'Admin Console',
      description: 'System-wide oversight & verifications',
      icon: <ShieldCheck className="text-slate-900" />,
      action: () => setShowLoginOverlay('ADMIN'),
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

      {/* Login Overlay */}
      {showLoginOverlay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowLoginOverlay(null)} />
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 fade-in duration-300 p-12">
            <button 
              onClick={() => setShowLoginOverlay(null)}
              className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                {showLoginOverlay === 'ADMIN' ? 'Admin Access' : 'Landlord Portal'}
              </h3>
              <p className="text-slate-500 font-medium">Verify your credentials to continue</p>
            </div>

            <form onSubmit={(e) => handleLogin(e, showLoginOverlay)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 !pl-16 pr-6 text-slate-900 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 !pl-16 pr-6 text-slate-900 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : (
                  <>Enter Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
