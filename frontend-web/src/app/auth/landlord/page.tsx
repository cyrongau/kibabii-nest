'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, Smartphone, Download, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useNotifications } from '@/context/NotificationContext';

function LandlordAuthContent() {
  const router = useRouter();
  const { showAlert } = useNotifications();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showMobileModal, setShowMobileModal] = useState(false);

  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  React.useEffect(() => {
    if (mode === 'register') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [mode]);

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
        
        // Strictly deny student/tenant login on web
        if (data.user?.role === 'STUDENT' || data.user?.role === 'TENANT') {
          setShowMobileModal(true);
          return;
        }

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard/landlord');
      } else {
        showAlert({
          title: 'Authentication Failed',
          message: 'Please check your email and password. Ensure you are registered as a landlord.',
          type: 'error'
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

            {/* Mobile App Warning Card */}
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-3xl flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                <Smartphone className="text-white" size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-wider mb-1">Student Portal</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-bold leading-relaxed">
                  Students and tenants should access registration and authentication exclusively via the mobile app.
                </p>
              </div>
            </div>

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
        </div>
      </div>

      {/* Mobile App Redirect Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowMobileModal(false)} />
          <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <button 
              onClick={() => setShowMobileModal(false)}
              className="absolute top-8 right-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Smartphone size={40} />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-4 uppercase italic">Mobile Required</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
                To provide the best student housing experience, including real-time maps and secure digital contracts, the Student Portal is exclusively available on our mobile application.
              </p>
              
              <div className="space-y-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Download Now</div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all group active:scale-95 shadow-xl">
                    <Download size={20} />
                    <div className="text-left">
                      <div className="text-[10px] opacity-60 leading-none uppercase">Available on</div>
                      <div className="text-lg leading-tight font-black">App Store</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all group active:scale-95 shadow-xl">
                    <Smartphone size={20} />
                    <div className="text-left">
                      <div className="text-[10px] opacity-60 leading-none uppercase">Get it on</div>
                      <div className="text-lg leading-tight font-black">Google Play</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 text-center border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kibabii Nest Ecosystem</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandlordAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    }>
      <LandlordAuthContent />
    </Suspense>
  );
}
