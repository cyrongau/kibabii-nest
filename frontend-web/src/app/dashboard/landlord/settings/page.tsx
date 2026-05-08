'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Camera, 
  Check, 
  Shield, 
  Loader2,
  Trash2,
  Save
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    avatar: '',
    emailNotifications: true,
    smsAlerts: false,
    bookingAlerts: true,
    twoFactorEnabled: false,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setFormData(prev => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      twoFactorEnabled: user.twoFactorEnabled || false,
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

  const toggleSwitch = (name: keyof typeof formData) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
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
      
      showToast('Settings saved successfully!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-8 lg:p-12 max-w-4xl bg-background">
      <header className="mb-12">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground font-medium mt-1">Manage your account preferences and profile.</p>
      </header>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="card-premium p-10 shadow-soft-lg relative overflow-hidden">

          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="relative group">
              <div className="w-32 h-32 bg-muted rounded-[2rem] flex items-center justify-center text-muted-foreground/30 overflow-hidden border-4 border-card shadow-xl relative">
                {formData.avatar ? (
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <User size={64} />
                )}
                {isLoading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" />
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
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-transform"
              >
                <Camera size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 space-y-8 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
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
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
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
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
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

              <hr className="border-border" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
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
                    <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Visual Preference Section */}
        <section className="card-premium p-10 shadow-soft">
          <h3 className="text-lg font-bold text-foreground mb-8 flex items-center gap-3">
            <Monitor size={20} className="text-primary" />
            Visual Preference
          </h3>
          
          <div className="space-y-4">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Interface Theme</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ThemeButton 
                themeName="light" 
                label="Light Mode" 
                description="High contrast visibility"
                icon={<Sun size={24} />} 
                active={theme === 'light'} 
                onClick={() => setTheme('light')} 
              />
              <ThemeButton 
                themeName="dark" 
                label="Dark Mode" 
                description="Reduced eye strain"
                icon={<Moon size={24} />} 
                active={theme === 'dark'} 
                onClick={() => setTheme('dark')} 
              />
              <ThemeButton 
                themeName="system" 
                label="System" 
                description="Follows device settings"
                icon={<Monitor size={24} />} 
                active={theme === 'system'} 
                onClick={() => setTheme('system')} 
              />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="card-premium p-10 shadow-soft">
          <h3 className="text-lg font-bold text-foreground mb-8 flex items-center gap-3">
            <Bell size={20} className="text-primary" />
            Notifications
          </h3>
          
          <div className="space-y-6">
            <NotificationToggle 
              label="Email Notifications" 
              description="Receive updates about your bookings and inquiries via email."
              active={formData.emailNotifications}
              onToggle={() => toggleSwitch('emailNotifications')}
            />
            <NotificationToggle 
              label="SMS Alerts" 
              description="Get instant text messages for urgent student requests."
              active={formData.smsAlerts}
              onToggle={() => toggleSwitch('smsAlerts')}
            />
            <NotificationToggle 
              label="New Booking Alerts" 
              description="Be notified immediately when a student books your property."
              active={formData.bookingAlerts}
              onToggle={() => toggleSwitch('bookingAlerts')}
            />
            <hr className="border-border-subtle" />
            <NotificationToggle 
              label="Two-Factor Authentication (2FA)" 
              description="Add an extra layer of security. Receive a 6-digit code on your phone when logging in."
              active={formData.twoFactorEnabled}
              onToggle={() => toggleSwitch('twoFactorEnabled')}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function ThemeButton({ themeName, label, description, icon, active, onClick }: { themeName: string, label: string, description: string, icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-3 ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
      <div className={active ? 'text-primary' : 'text-muted-foreground/40'}>
        {icon}
      </div>
      <div className="text-left">
        <div className="text-sm font-black text-foreground">{label}</div>
        <div className="text-[10px] font-bold text-muted-foreground mt-1">{description}</div>
      </div>
    </button>
  );
}

function NotificationToggle({ label, description, active, onToggle }: { label: string, description: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="font-bold text-foreground text-sm">{label}</div>
        <div className="text-xs text-muted-foreground font-medium max-w-md">{description}</div>
      </div>
      <button 
        onClick={onToggle}
        className={`w-14 h-8 rounded-full transition-all duration-300 relative ${active ? 'bg-primary' : 'bg-muted'}`}
      >
        <div className={`absolute top-1 w-6 h-6 bg-background rounded-full transition-all duration-300 ${active ? 'left-7 shadow-md' : 'left-1'}`} />
      </button>
    </div>
  );
}
