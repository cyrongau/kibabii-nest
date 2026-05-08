'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import { useNotifications } from '@/context/NotificationContext';
import { Mail, Lock, User, Phone, ArrowRight, Building2, Smartphone, Loader2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useNotifications();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'LANDLORD'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store auth data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Landlords always redirect to landlord dashboard after signup
      router.push('/dashboard/landlord');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3000/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token, role: 'LANDLORD' }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error('Google registration failed');

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showToast(`Welcome, ${data.user.name}!`, 'success');
        router.push('/dashboard/landlord');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google Registration Failed'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans text-foreground">
      <div className="max-w-2xl w-full card-premium p-12 shadow-soft-lg">
        <div className="text-center mb-10">
          <div className="text-3xl font-black text-primary tracking-tighter mb-2">Kibabii Nest</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Become a Kibabii Nest Host</h2>
          <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Join the management platform trusted by Kibabii's premier landlords.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Info Banner for Students */}
        <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl mb-10 flex items-start gap-4">
           <div className="w-10 h-10 bg-background rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-sm border border-border-subtle">
             <Smartphone size={20} />
           </div>
           <div>
             <div className="text-sm font-black text-primary">Are you a Student?</div>
             <p className="text-xs font-bold text-muted-foreground mt-1 leading-relaxed">Student registration is handled strictly through our mobile app. Please download Kibabii Nest from the App Store or Google Play to start your search.</p>
           </div>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleRegister}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Full Name</label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
              <input 
                type="tel" 
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+254 7..."
                className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
              <input 
                type="password" 
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="md:col-span-2 mt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-5 rounded-2xl font-black shadow-xl hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 transition-all flex items-center justify-center gap-3 brand-shadow"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Building2 size={20} />
                  Register as Landlord
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="my-8 flex items-center gap-4 text-border">
          <div className="h-px bg-border-subtle flex-1"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Or continue with</span>
          <div className="h-px bg-border-subtle flex-1"></div>
        </div>

        <button
          type="button"
          onClick={() => googleLogin()}
          className="w-full bg-card border border-border-subtle text-foreground py-4 rounded-2xl font-bold hover:bg-muted/50 transition-all flex items-center justify-center gap-3 shadow-sm"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.47 18.63 12 18.63C9.16 18.63 6.75 16.71 5.88 14.15H2.21V16.99C4.01 20.57 7.7 23 12 23Z" fill="#34A853"/>
            <path d="M5.88 14.15C5.66 13.49 5.53 12.76 5.53 12C5.53 11.24 5.66 10.51 5.88 9.85V7.01H2.21C1.46 8.5 1 10.2 1 12C1 13.8 1.46 15.5 2.21 16.99L5.88 14.15Z" fill="#FBBC05"/>
            <path d="M12 5.38C13.62 5.38 15.06 5.93 16.2 7.02L19.35 3.87C17.45 2.09 14.97 1 12 1C7.7 1 4.01 3.43 2.21 7.01L5.88 9.85C6.75 7.29 9.16 5.38 12 5.38Z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Already have an account? <a href="/auth/login" className="text-primary font-bold hover:underline">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  );
}
