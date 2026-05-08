'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Shield, 
  Loader2,
  Save
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function AdminProfilePage() {
  const { showToast } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    avatar: '',
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setFormData(prev => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
    }));
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/uploads/image?folder=avatars', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const { url } = await response.json();
      setFormData(prev => ({ ...prev, avatar: url }));
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await fetch(`http://localhost:3000/users/${user.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: url }),
      });

      const updatedUser = { ...user, avatar: url };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch an event so layout can potentially listen or just show toast
      window.dispatchEvent(new Event('storage'));
      
      showToast('Profile picture updated!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(`http://localhost:3000/users/${user.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Update failed');

      const updatedUser = { ...user, ...payload };
      delete updatedUser.password;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      window.dispatchEvent(new Event('storage'));
      showToast('Profile saved successfully!', 'success');
      
      // Clear password fields
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-8 lg:p-12 max-w-4xl bg-background">
      <header className="mb-12">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Admin Profile</h1>
        <p className="text-muted-foreground font-medium mt-1">Manage your account credentials and personal information.</p>
      </header>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="card-premium p-10 shadow-soft-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="relative group">
              <div className="w-32 h-32 bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-300 overflow-hidden border-4 border-card shadow-xl relative">
                {formData.avatar ? (
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <User size={64} />
                )}
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={handleAvatarClick}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Camera size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-8 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                    <input 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                    <input 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                    <input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+254 7..."
                      className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-50" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                    <input 
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Confirm Password</label>
                  <div className="relative">
                    <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                    <input 
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-white px-10 py-4 rounded-2xl text-sm font-bold shadow-xl hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 brand-shadow"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
