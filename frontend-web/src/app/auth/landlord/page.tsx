'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { useNotifications } from '@/context/NotificationContext';

export default function LandlordAuthPage() {
  const router = useRouter();
  const { showAlert } = useNotifications();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email, password, requiredRole: 'LANDLORD' }
        : { name, email, password, role: 'LANDLORD' };

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard/landlord');
      } else {
        showAlert({
          title: 'Authentication Failed',
          message: 'Please check your email and password. Ensure you are registered as a landlord.',
          type: 'danger'
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      showAlert({
        title: 'Connection Error',
        message: 'Could not reach the authentication server. Please check your internet connection.',
        type: 'warning'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Left Side: Illustration & Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-blue-600 dark:bg-blue-950 p-16 text-white relative overflow-hidden">
        {/* Subtle Background Image */}
        <div 
          className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: 'url("/images/landlord_auth_bg.png")' }}
        />
        
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-white/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="relative w-24 h-24">
              <Image 
                src="/images/logo_full.svg" 
                alt="Kibabii Nest Logo" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-3xl font-black tracking-tighter">Kibabii Nest</span>
          </div>
          
          <h1 className="text-6xl font-black leading-[0.9] tracking-tighter mb-8">
            Manage your <br />
            <span className="text-blue-200 dark:text-blue-300">property empire</span> <br />
            with precision.
          </h1>
          <p className="text-xl text-blue-100 dark:text-blue-200 font-medium max-w-md">
            Join hundreds of property owners providing high-quality student housing.
          </p>
        </div>

        <div className="z-10 bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2rem] max-w-sm">
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />)}
          </div>
          <p className="text-lg font-bold leading-tight mb-2 italic">
            "Kibabii Nest has completely transformed how I manage my rentals. The automated KYC is a lifesaver."
          </p>
          <p className="text-sm font-black text-blue-200 uppercase tracking-widest">Sarah Kamau, Property Owner</p>
        </div>
      </div>

      {/* Right Side: Auth Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-950 rounded-[3rem] p-12 shadow-xl border border-slate-100 dark:border-slate-800">
            <header className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {isLogin ? 'Welcome Back' : 'Join as Landlord'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                {isLogin ? 'Access your dashboard' : 'Start listing your properties today'}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Thompson"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 !pl-16 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 !pl-16 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Security Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 !pl-16 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <a href="#" className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest">Forgot Password?</a>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <footer className="mt-10 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                {isLogin ? "Don't have an account? Join now" : "Already have an account? Sign in"}
              </button>
            </footer>
          </div>

          <div className="mt-8 flex justify-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
            <a href="#" className="hover:text-slate-600">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
