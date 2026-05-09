'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Key, 
  MessageSquare, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Settings as SettingsIcon,
  Globe,
  Database,
  Mail,
  Palette,
  Link as LinkIcon,
  Send
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Moon, Sun, Monitor } from 'lucide-react';

export default function AdminSettings() {
  const { showToast } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('messaging');
  const [testEmailTo, setTestEmailTo] = useState('');
  
  const [config, setConfig] = useState({
    // Messaging
    smsProvider: 'FIREBASE',
    twilioSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    firebaseConfig: '', 
    
    // SMTP
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    smtpFromEmail: '',
    smtpFromName: '',

    // Branding
    brandLogoUrl: '',
    brandPrimaryColor: '#3b82f6',
    brandName: 'Kibabii Nest',

    // Social Links
    socialFacebook: '',
    socialInstagram: '',
    socialTwitter: '',
    socialYoutube: '',
    socialTiktok: '',

    // M-Pesa
    mpesaConsumerKey: '',
    mpesaConsumerSecret: '',
    mpesaShortcode: '',
    mpesaPasskey: '',
    mpesaEnvironment: 'sandbox',
    mpesaCallbackUrl: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/notifications/config`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const data = await response.json();
      if (data) {
        setConfig({
          ...config,
          ...data,
          firebaseConfig: data.firebaseConfig ? JSON.stringify(data.firebaseConfig, null, 2) : ''
        });
      }
    } catch (error) {
      showToast('Failed to load system configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let parsedFirebase = null;
      if (config.firebaseConfig) {
        try {
          parsedFirebase = JSON.parse(config.firebaseConfig);
        } catch (e) {
          showToast('Invalid Firebase JSON format', 'error');
          setIsSaving(false);
          return;
        }
      }

      const payload = {
        ...config,
        smtpPort: parseInt(config.smtpPort.toString(), 10),
        firebaseConfig: parsedFirebase
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/notifications/config`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Update failed');
      showToast('System configuration updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to save configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) {
      showToast('Please enter an email address to test', 'error');
      return;
    }
    setIsTestingEmail(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/notifications/email/test`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
        },
        body: JSON.stringify({ to: testEmailTo }),
      });

      if (!response.ok) throw new Error('Test failed');
      showToast('Test email sent successfully! Check your inbox.', 'success');
    } catch (error) {
      showToast('Failed to send test email. Check SMTP credentials.', 'error');
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="space-y-2">
        <h1 className="text-4xl font-black text-foreground tracking-tighter">Command Center</h1>
        <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm lg:text-base">Configure global platform protocols, synchronize neural notification engines, and define visual brand identity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16">
        {/* Sidebar Nav for Settings */}
        <aside className="space-y-4">
          <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-4 mb-6">Configuration Modules</div>
          <div className="space-y-2">
            <SettingsTab icon={<Smartphone size={18} />} label="Messaging & SMS" active={activeTab === 'messaging'} onClick={() => setActiveTab('messaging')} />
            <SettingsTab icon={<Mail size={18} />} label="Email & SMTP" active={activeTab === 'smtp'} onClick={() => setActiveTab('smtp')} />
            <SettingsTab icon={<Palette size={18} />} label="Branding & Identity" active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} />
            <SettingsTab icon={<Moon size={18} />} label="Visual Preference" active={activeTab === 'theme'} onClick={() => setActiveTab('theme')} />
            <SettingsTab icon={<LinkIcon size={18} />} label="External Networks" active={activeTab === 'social'} onClick={() => setActiveTab('social')} />
            <SettingsTab icon={<Shield size={18} />} label="Payments & Ledger" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3 space-y-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-32 gap-6 text-muted-foreground/40 font-bold">
              <Loader2 className="animate-spin text-primary" size={48} />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Synchronizing registry...</span>
            </div>
          ) : (
            <section className="card-premium shadow-soft-xl overflow-hidden border-border-subtle animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="p-10 lg:p-14 space-y-12">
                {/* MESSAGING TAB */}
                {activeTab === 'messaging' && (
                  <div className="space-y-12 animate-in fade-in duration-300">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center text-primary shadow-soft-sm">
                        <MessageSquare size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">SMS Transmission Protocol</h3>
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Configure automated mobile outreach services</p>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Active Gateway</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <button 
                            onClick={() => setConfig(prev => ({ ...prev, smsProvider: 'FIREBASE' }))} 
                            className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col gap-5 text-left group ${config.smsProvider === 'FIREBASE' ? 'border-primary bg-primary/5 shadow-soft-lg' : 'border-border-subtle hover:border-primary/20 bg-muted/20'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${config.smsProvider === 'FIREBASE' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground/40 group-hover:text-primary/60'}`}>
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <div className="text-base font-black text-foreground tracking-tight">Firebase Cloud</div>
                              <div className="text-xs font-medium text-muted-foreground mt-1">Primary real-time engine for push & SMS logs.</div>
                            </div>
                          </button>
                          
                          <button 
                            onClick={() => setConfig(prev => ({ ...prev, smsProvider: 'TWILIO' }))} 
                            className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col gap-5 text-left group ${config.smsProvider === 'TWILIO' ? 'border-primary bg-primary/5 shadow-soft-lg' : 'border-border-subtle hover:border-primary/20 bg-muted/20'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${config.smsProvider === 'TWILIO' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground/40 group-hover:text-primary/60'}`}>
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <div className="text-base font-black text-foreground tracking-tight">Twilio Global</div>
                              <div className="text-xs font-medium text-muted-foreground mt-1">Secondary enterprise carrier for high-priority delivery.</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {config.smsProvider === 'TWILIO' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-muted/30 rounded-[2.5rem] border border-border-subtle animate-in zoom-in-95 duration-300">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Twilio SID Signature</label>
                            <input value={config.twilioSid} onChange={e => setConfig(prev => ({ ...prev, twilioSid: e.target.value }))} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx" className="w-full px-6 py-4.5 bg-background border border-transparent focus:border-primary/20 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-soft-sm" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Auth Token Credential</label>
                            <input type="password" value={config.twilioAuthToken} onChange={e => setConfig(prev => ({ ...prev, twilioAuthToken: e.target.value }))} placeholder="••••••••••••••••••••" className="w-full px-6 py-4.5 bg-background border border-transparent focus:border-primary/20 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-soft-sm" />
                          </div>
                          <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Assigned Virtual Number</label>
                            <input value={config.twilioPhoneNumber} onChange={e => setConfig(prev => ({ ...prev, twilioPhoneNumber: e.target.value }))} placeholder="+1234567890" className="w-full px-6 py-4.5 bg-background border border-transparent focus:border-primary/20 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-soft-sm" />
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 pt-10 border-t border-border-subtle">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Firebase Core Admin JSON (Secure)</label>
                        </div>
                        <textarea rows={8} value={config.firebaseConfig} onChange={e => setConfig(prev => ({ ...prev, firebaseConfig: e.target.value }))} placeholder='{ "type": "service_account", ... }' className="w-full px-8 py-6 bg-muted/40 border border-border-subtle rounded-[2rem] text-[11px] font-mono font-bold text-foreground focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all resize-none scrollbar-hide shadow-soft-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {/* SMTP TAB */}
                {activeTab === 'smtp' && (
                  <div className="space-y-12 animate-in fade-in duration-300">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center text-primary shadow-soft-sm">
                        <Mail size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">Email SMTP Matrix</h3>
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Registry of transactional mailing infrastructure</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">SMTP Host URL</label>
                          <input value={config.smtpHost} onChange={e => setConfig(prev => ({ ...prev, smtpHost: e.target.value }))} placeholder="smtp.yourserver.com" className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Communication Port</label>
                          <input type="number" value={config.smtpPort} onChange={e => setConfig(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 0 }))} placeholder="587" className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Master User Signature</label>
                          <input value={config.smtpUser} onChange={e => setConfig(prev => ({ ...prev, smtpUser: e.target.value }))} placeholder="admin@domain.com" className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Encrypted Access Token</label>
                          <input type="password" value={config.smtpPass} onChange={e => setConfig(prev => ({ ...prev, smtpPass: e.target.value }))} placeholder="••••••••••••••••" className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-primary/5 p-6 rounded-[1.5rem] border border-primary/10 group cursor-pointer transition-all hover:bg-primary/10">
                        <input type="checkbox" id="smtpSecure" checked={config.smtpSecure} onChange={e => setConfig(prev => ({ ...prev, smtpSecure: e.target.checked }))} className="w-6 h-6 rounded-lg text-primary focus:ring-primary border-primary/20 bg-background cursor-pointer" />
                        <label htmlFor="smtpSecure" className="text-xs font-black text-foreground/80 cursor-pointer uppercase tracking-widest select-none">Enforce SSL/TLS Protocol Cryptography</label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-border-subtle">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Outbound Entity Email</label>
                          <input value={config.smtpFromEmail} onChange={e => setConfig(prev => ({ ...prev, smtpFromEmail: e.target.value }))} placeholder="noreply@domain.com" className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Public Sender Signature</label>
                          <input value={config.smtpFromName} onChange={e => setConfig(prev => ({ ...prev, smtpFromName: e.target.value }))} placeholder="Kibabii Nest Ledger" className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" />
                        </div>
                      </div>

                      {/* Test Email Section */}
                      <div className="mt-12 bg-primary/5 p-8 rounded-[2rem] border border-primary/10 flex flex-col md:flex-row items-center gap-6 shadow-soft-sm">
                        <div className="relative flex-1 w-full">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/40" size={20} />
                          <input 
                            value={testEmailTo} 
                            onChange={e => setTestEmailTo(e.target.value)} 
                            placeholder="Enter test target email..." 
                            className="w-full pl-16 pr-8 py-4.5 bg-background border border-transparent focus:border-primary/20 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none transition-all shadow-soft-sm" 
                          />
                        </div>
                        <button 
                          onClick={handleTestEmail}
                          disabled={isTestingEmail}
                          className="w-full md:w-auto bg-primary text-white px-10 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                          {isTestingEmail ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                          Dispatch Test Signal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* BRANDING TAB */}
                {activeTab === 'branding' && (
                  <div className="space-y-12 animate-in fade-in duration-300">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center text-primary shadow-soft-sm">
                        <Palette size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">Visual Identity Suite</h3>
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Configure platform aesthetics and brand assets</p>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Platform Entity Name</label>
                        <input value={config.brandName} onChange={e => setConfig(prev => ({ ...prev, brandName: e.target.value }))} placeholder="e.g. Kibabii Nest" className="w-full px-8 py-5 bg-muted/20 border border-border-subtle rounded-[1.5rem] text-lg font-black text-foreground focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all shadow-soft-sm" />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Symbolic Brand Asset (Logo)</label>
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                          <div className="flex-1 w-full relative">
                            <input value={config.brandLogoUrl} onChange={e => setConfig(prev => ({ ...prev, brandLogoUrl: e.target.value }))} placeholder="https://external-resource.com/logo.png" className="w-full px-8 py-5 bg-muted/20 border border-border-subtle rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:border-primary/20 transition-all shadow-soft-sm" />
                          </div>
                          
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <input 
                              type="file" 
                              accept="image/*"
                              id="logo-upload"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  showToast('Dispatching asset to cloud...', 'success');
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/uploads/image`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
                                    body: formData
                                  });
                                  if (!response.ok) throw new Error('Upload failed');
                                  const data = await response.json();
                                  setConfig(prev => ({ ...prev, brandLogoUrl: data.url }));
                                  showToast('Neural asset synchronized', 'success');
                                } catch (error) {
                                  showToast('Asset synchronization failed', 'error');
                                }
                              }}
                            />
                            <label 
                              htmlFor="logo-upload"
                              className="flex-1 md:flex-none px-8 py-5 bg-card border border-border-subtle rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted cursor-pointer transition-all shadow-soft-sm whitespace-nowrap text-center"
                            >
                              Synchronize Local Asset
                            </label>

                            {config.brandLogoUrl && (
                              <div className="w-20 h-20 bg-muted/50 rounded-2xl border border-border-subtle flex items-center justify-center p-3 shrink-0 shadow-inner group">
                                <img src={config.brandLogoUrl} alt="Neural Preview" className="max-w-full max-h-full object-contain filter drop-shadow-lg group-hover:scale-110 transition-transform" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-10 border-t border-border-subtle">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Dominant Chromatic Token (Primary)</label>
                        <div className="flex gap-6 items-center">
                          <div className="relative group">
                            <input type="color" value={config.brandPrimaryColor} onChange={e => setConfig(prev => ({ ...prev, brandPrimaryColor: e.target.value }))} className="w-20 h-20 p-2 bg-muted/40 border border-border-subtle rounded-[1.5rem] cursor-pointer shadow-soft-sm group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 rounded-[1.5rem] pointer-events-none border border-white/10"></div>
                          </div>
                          <div className="flex-1 relative">
                            <input value={config.brandPrimaryColor} onChange={e => setConfig(prev => ({ ...prev, brandPrimaryColor: e.target.value }))} placeholder="#3b82f6" className="w-full px-8 py-5 bg-muted/20 border border-border-subtle rounded-[1.5rem] text-xl font-black text-foreground focus:outline-none focus:border-primary/20 transition-all uppercase shadow-soft-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* THEME TAB */}
                {activeTab === 'theme' && (
                  <div className="space-y-12 animate-in fade-in duration-300">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center text-primary shadow-soft-sm">
                        <Palette size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">Neural Interface Modes</h3>
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Select your preferred cognitive visualization style</p>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ThemeButton 
                          active={theme === 'light'} 
                          onClick={() => setTheme('light')} 
                          icon={<Sun size={28} />} 
                          label="Solaris Mode" 
                          desc="High luminosity visualization" 
                        />
                        <ThemeButton 
                          active={theme === 'dark'} 
                          onClick={() => setTheme('dark')} 
                          icon={<Moon size={28} />} 
                          label="Nebula Mode" 
                          desc="Low-fatigue administrative UI" 
                        />
                        <ThemeButton 
                          active={theme === 'system'} 
                          onClick={() => setTheme('system')} 
                          icon={<Monitor size={28} />} 
                          label="Neural Sync" 
                          desc="Automatic device calibration" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SOCIAL MEDIA TAB */}
                {activeTab === 'social' && (
                  <div className="space-y-12 animate-in fade-in duration-300">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center text-primary shadow-soft-sm">
                        <LinkIcon size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">External Data Nodes</h3>
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Connect global social networking credentials</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {[
                        { id: 'socialFacebook', label: 'Meta Network (Facebook)', icon: <Globe size={18} /> },
                        { id: 'socialInstagram', label: 'Instagram Protocol', icon: <Palette size={18} /> },
                        { id: 'socialTwitter', label: 'X Surveillance Feed', icon: <Database size={18} /> },
                        { id: 'socialYoutube', label: 'Broadcast Node (YouTube)', icon: <Smartphone size={18} /> },
                        { id: 'socialTiktok', label: 'TikTok Dynamic Matrix', icon: <MessageSquare size={18} /> },
                      ].map(social => (
                        <div key={social.id} className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">{social.label}</label>
                          <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                              {social.icon}
                            </div>
                            <input 
                              value={(config as any)[social.id] || ''} 
                              onChange={e => setConfig(prev => ({ ...prev, [social.id]: e.target.value }))} 
                              placeholder="https://social-network.com/auth-id" 
                              className="w-full pl-16 pr-8 py-5 bg-muted/20 border border-border-subtle rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-foreground focus:outline-none focus:border-primary/20 transition-all shadow-soft-sm" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PAYMENTS TAB */}
                {activeTab === 'payments' && (
                  <div className="space-y-12 animate-in fade-in duration-300">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center text-primary shadow-soft-sm">
                        <Shield size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">Financial Infrastructure</h3>
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">Configure M-Pesa Lipa Na M-Pesa API credentials</p>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">M-Pesa Consumer Key</label>
                          <input 
                            value={config.mpesaConsumerKey || ''} 
                            onChange={e => setConfig(prev => ({ ...prev, mpesaConsumerKey: e.target.value }))} 
                            placeholder="Enter Key" 
                            className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" 
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">M-Pesa Consumer Secret</label>
                          <input 
                            type="password"
                            value={config.mpesaConsumerSecret || ''} 
                            onChange={e => setConfig(prev => ({ ...prev, mpesaConsumerSecret: e.target.value }))} 
                            placeholder="••••••••••••••••" 
                            className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Business Shortcode</label>
                          <input 
                            value={config.mpesaShortcode || ''} 
                            onChange={e => setConfig(prev => ({ ...prev, mpesaShortcode: e.target.value }))} 
                            placeholder="174379" 
                            className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" 
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Online Passkey</label>
                          <input 
                            type="password"
                            value={config.mpesaPasskey || ''} 
                            onChange={e => setConfig(prev => ({ ...prev, mpesaPasskey: e.target.value }))} 
                            placeholder="••••••••••••••••" 
                            className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" 
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-1">Transmission Environment</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <button 
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, mpesaEnvironment: 'sandbox' }))} 
                            className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${config.mpesaEnvironment === 'sandbox' ? 'border-primary bg-primary/5 shadow-soft-sm' : 'border-border-subtle hover:border-primary/20 bg-muted/20'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.mpesaEnvironment === 'sandbox' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground/40'}`}>
                              <Database size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-black text-foreground tracking-tight uppercase">Sandbox / Testing</div>
                              <div className="text-[10px] font-medium text-muted-foreground">Development credentials and simulator.</div>
                            </div>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, mpesaEnvironment: 'production' }))} 
                            className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${config.mpesaEnvironment === 'production' ? 'border-primary bg-primary/5 shadow-soft-sm' : 'border-border-subtle hover:border-primary/20 bg-muted/20'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.mpesaEnvironment === 'production' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground/40'}`}>
                              <Globe size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-black text-foreground tracking-tight uppercase">Live Production</div>
                              <div className="text-[10px] font-medium text-muted-foreground">Active transactional gateway (Real Money).</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-border-subtle">
                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">M-Pesa Callback Endpoint (WebHook)</label>
                        <input 
                          value={config.mpesaCallbackUrl || ''} 
                          onChange={e => setConfig(prev => ({ ...prev, mpesaCallbackUrl: e.target.value }))} 
                          placeholder="https://api.kibabiinest.com/payments/mpesa/callback" 
                          className="w-full px-6 py-4.5 bg-muted/20 border border-border-subtle rounded-2xl text-[11px] font-black text-foreground focus:outline-none focus:border-primary transition-all shadow-soft-sm" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SAVE ACTION BAR */}
              <div className="px-10 py-10 lg:px-14 lg:py-12 bg-muted/40 border-t border-border-subtle flex justify-end items-center gap-8">
                <div className="hidden md:flex flex-col items-end gap-1">
                  <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Protocol Checksum</div>
                  <div className="text-[9px] font-bold text-muted-foreground/40 font-mono italic uppercase">Global registry sync required after modifications</div>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full md:w-auto bg-foreground text-background px-12 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70 group"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
                  Deploy Platform Configurations
                </button>
              </div>

            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function ThemeButton({ active, onClick, icon, label, desc }: any) {
  return (
    <button onClick={onClick} className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col gap-6 text-left group relative overflow-hidden ${active ? 'border-primary bg-primary/5 shadow-soft-xl' : 'border-border-subtle hover:border-primary/20 bg-muted/20'}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-primary text-white scale-110 rotate-3' : 'bg-muted text-muted-foreground/40 group-hover:scale-105 group-hover:text-primary/60'}`}>
        {icon}
      </div>
      <div>
        <div className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{label}</div>
        <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">{desc}</div>
      </div>
      {active && <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-pulse shadow-glow"></div>}
    </button>
  );
}

function SettingsTab({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick} 
      className={`p-5 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-4 relative group ${
        active 
        ? 'bg-primary text-white shadow-soft-lg brand-shadow' 
        : 'text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground'
      }`}
    >
      <div className={`transition-all duration-300 ${active ? "text-white scale-110" : "text-primary/60 group-hover:text-primary"}`}>
        {icon}
      </div>
      <span className={`text-[11px] font-black uppercase tracking-widest transition-all ${active ? "translate-x-1" : "group-hover:translate-x-0.5"}`}>{label}</span>
      {active && <div className="absolute right-4 w-1.5 h-1.5 bg-white/40 rounded-full"></div>}
    </div>
  );
}

