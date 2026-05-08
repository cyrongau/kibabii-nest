'use client';

import React, { useState } from 'react';
import { 
  LifeBuoy, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/support/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subject, description, category })
      });

      if (response.ok) {
        setIsSuccess(true);
        setSubject('');
        setDescription('');
      }
    } catch (e) {
      console.error('Error submitting ticket:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card rounded-[40px] p-12 text-center shadow-2xl border border-border-subtle">
          <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-4 tracking-tight">Ticket Submitted!</h1>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Your support request has been received. Our admin team will review it and initiate a chat with you shortly.
          </p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            Go Back
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-20 px-6 text-foreground">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <LifeBuoy size={40} />
          </div>
          <h1 className="text-4xl font-black text-foreground mb-4 tracking-tighter">Unified Support Center</h1>
          <p className="text-muted-foreground font-medium max-w-md mx-auto">
            Need help? Submit a ticket below and an administrator will reach out to you via our secure in-app chat.
          </p>
        </div>

        {/* Support Card */}
        <div className="bg-card rounded-[40px] p-12 shadow-2xl border border-border-subtle relative overflow-hidden">
          {/* Security Badge */}
          <div className="absolute top-0 right-0 p-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-border-subtle">
              <ShieldCheck size={14} className="text-emerald-500" />
              Secure Channel
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-black text-muted-foreground mb-3 ml-2 uppercase tracking-widest opacity-60">Subject</label>
              <input 
                type="text" 
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Briefly describe your issue"
                className="w-full px-8 py-5 bg-muted border-none rounded-3xl text-foreground placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div>
                <label className="block text-sm font-black text-muted-foreground mb-3 ml-2 uppercase tracking-widest opacity-60">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-8 py-5 bg-muted border-none rounded-3xl text-foreground focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium appearance-none cursor-pointer"
                >
                  <option value="GENERAL">General Inquiry</option>
                  <option value="PAYMENT">Payment Issue</option>
                  <option value="BOOKING">Booking Help</option>
                  <option value="PROPERTY">Property Listing</option>
                  <option value="MAINTENANCE">Maintenance Request</option>
                  <option value="ACCOUNT">Account Access</option>
                </select>
              </div>
              <div className="flex flex-col justify-end pb-1">
                <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 flex items-start gap-3">
                  <AlertCircle size={18} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-primary/80 leading-tight font-bold">
                    Only admins can initiate chats to prevent communication abuse.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-muted-foreground mb-3 ml-2 uppercase tracking-widest opacity-60">Description</label>
              <textarea 
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide as much detail as possible..."
                className="w-full px-8 py-6 bg-muted border-none rounded-[40px] text-foreground placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-6 bg-primary text-white rounded-3xl font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Request...' : 'Send Support Request'}
              <Send size={24} />
            </button>
          </form>
        </div>

        {/* Guides Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-[40px] shadow-xl border border-border-subtle transition-all hover:scale-[1.02]">
            <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-xl font-black text-foreground mb-4">How to Book</h3>
            <ul className="space-y-3">
              {[
                'Browse verified student hostels',
                'Select your preferred room/unit',
                'Click "Book Now" and confirm dates',
                'Make payment via official channels',
                'Wait for landlord confirmation'
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground/40 shrink-0">{i+1}</div>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card p-8 rounded-[40px] shadow-xl border border-border-subtle transition-all hover:scale-[1.02]">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-xl font-black text-foreground mb-4">Marketplace Guide</h3>
            <ul className="space-y-3">
              {[
                'Search for student-sold items',
                'Review item details and photos',
                'Accept Marketplace Terms & Safety rules',
                'Contact seller via WhatsApp or Call',
                'Meet in safe public spots for pickup'
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground/40 shrink-0">{i+1}</div>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card p-8 rounded-[40px] shadow-xl border border-border-subtle transition-all hover:scale-[1.02] flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-black text-foreground mb-4">Tenancy & Rules</h3>
              <ul className="space-y-3 mb-8">
                {[
                  '30-day digital vacation notice',
                  'Security deposit refund policy',
                  'Residency rules & quiet hours',
                  'Submit maintenance via support',
                  'View full digital agreement'
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground/40 shrink-0">{i+1}</div>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
            <Link 
              href="/support/tenancy-rules"
              className="w-full py-4 bg-muted hover:bg-primary/10 text-foreground hover:text-primary rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              Full Rules & Obligations
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-12 flex items-center justify-center gap-8">
          <Link href="/legal/terms" className="text-xs font-black text-muted-foreground/40 hover:text-primary transition-all uppercase tracking-widest">Terms of Service</Link>
          <div className="w-1 h-1 bg-border rounded-full"></div>
          <Link href="/legal/privacy" className="text-xs font-black text-muted-foreground/40 hover:text-primary transition-all uppercase tracking-widest">Privacy Policy</Link>
        </div>

        {/* Footer Info */}
        <div className="mt-12 mb-20 flex items-center justify-center gap-12 grayscale opacity-40">
           <div className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter">
             <MessageSquare size={16} />
             In-App Chat
           </div>
           <div className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter">
             <Clock size={16} />
             24/7 Response
           </div>
        </div>
      </div>
    </div>
  );
}
