'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useNotifications } from '@/context/NotificationContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showAlert } = useNotifications();
  const [isMounted, setIsMounted] = React.useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, requiredRole: 'ADMIN' }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Strictly allow only ADMINs
        if (data.user?.role !== 'ADMIN') {
          showAlert({
            title: 'Unauthorized',
            message: 'This portal is restricted to system administrators only.',
            type: 'danger'
          });
          return;
        }

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard/admin');
      } else {
        const data = await response.json();
        showAlert({
          title: 'Access Denied',
          message: data.message || 'Invalid admin credentials or unauthorized access.',
          type: 'danger'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert({
        title: 'Login Error',
        message: 'An error occurred during login. Please verify the backend connection.',
        type: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden" suppressHydrationWarning>
      {/* Abstract Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-32 h-32 mb-6">
              <Image 
                src="/images/logo_full.svg" 
                alt="Kibabii Nest Logo" 
                width={128}
                height={128}
                className="object-contain opacity-90 mx-auto"
                priority
              />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Admin Login</h1>
            <p className="text-slate-400 font-medium mt-2">Administrative Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kibabiinest.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 !pl-16 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 !pl-16 pr-6 text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-black py-5 rounded-2xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">© 2026 Kibabii Nest</span>
            <a href="#" className="text-emerald-500 font-black hover:underline uppercase tracking-widest">Forgot Access?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
