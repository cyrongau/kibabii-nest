'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  User,
  Send,
  MoreVertical,
  LifeBuoy,
  Loader2,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  conversation?: {
    id: string;
    messages: any[];
  };
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/support/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/auth/admin';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching tickets:', e);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/support/tickets/${ticket.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/auth/admin';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedTicket(data);
    } catch (e) {
      console.error('Error fetching ticket details:', e);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/support/tickets/respond`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          text: reply,
          receiverId: selectedTicket.user.id
        })
      });

      if (response.ok) {
        setReply('');
        handleSelectTicket(selectedTicket);
      }
    } catch (e) {
      console.error('Error sending reply:', e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background overflow-hidden">
      {/* Tickets List */}
      <div className="w-[420px] border-r border-border-subtle bg-card/20 backdrop-blur-xl flex flex-col relative z-20">
        <div className="p-10 border-b border-border-subtle space-y-8 bg-muted/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tighter flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-soft-sm border border-primary/20">
                  <LifeBuoy size={24} />
                </div>
                Support Center
              </h1>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em] mt-1.5 flex items-center gap-3 italic">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                Support Inbox
              </p>
            </div>
            <div className="px-4 py-1.5 rounded-full badge-tint badge-red text-[9px] font-black uppercase tracking-widest shadow-soft-sm border border-white/5">
              {Array.isArray(tickets) ? tickets.filter(t => t.status === 'OPEN').length : 0} Priority
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="w-full pl-16 pr-6 py-4.5 bg-background/50 border border-transparent focus:border-primary/20 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.15em] text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-soft-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3 bg-muted/5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-muted-foreground/30 font-black animate-in fade-in duration-1000">
              <Loader2 className="animate-spin text-primary" size={48} />
              <span className="text-[9px] uppercase tracking-[0.3em] italic">Loading support tickets...</span>
            </div>
          ) : Array.isArray(tickets) && tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div 
                key={ticket.id}
                onClick={() => handleSelectTicket(ticket)}
                className={`p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer group relative overflow-hidden ${
                  selectedTicket?.id === ticket.id 
                  ? 'bg-card border-primary/20 shadow-soft-xl' 
                  : 'bg-transparent border-transparent hover:bg-muted/30'
                }`}
              >
                {selectedTicket?.id === ticket.id && <div className="absolute left-0 top-0 w-1 h-full bg-primary animate-pulse"></div>}
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className={`px-4 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-soft-sm border border-white/5 badge-tint ${
                    ticket.status === 'OPEN' ? 'badge-red' : 
                    ticket.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-emerald'
                  }`}>
                    {ticket.status}
                  </span>
                  <span className="text-[9px] text-muted-foreground/30 font-black uppercase tracking-widest italic">
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(ticket.createdAt))}
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-foreground mb-2 truncate tracking-tight group-hover:text-primary transition-colors">{ticket.subject}</h3>
                <p className="text-[11px] text-muted-foreground/60 font-medium line-clamp-2 leading-relaxed">{ticket.description}</p>
                
                <div className="mt-6 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted border border-border-subtle overflow-hidden flex items-center justify-center font-black text-xs text-muted-foreground/40 shadow-soft-sm relative">
                      {ticket.user.avatar ? (
                        <Image src={ticket.user.avatar} alt="" fill className="object-cover" />
                      ) : ticket.user.name ? ticket.user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{ticket.user.name}</span>
                  </div>
                  <ChevronRight size={14} className={`text-muted-foreground/20 transition-transform duration-500 ${selectedTicket?.id === ticket.id ? 'translate-x-1 text-primary' : 'group-hover:translate-x-1'}`} />
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-6 opacity-30">
               <LifeBuoy className="mx-auto" size={40} />
               <p className="text-[10px] font-black uppercase tracking-widest">No active tickets found</p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details & Chat */}
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary-color),transparent)] opacity-[0.03] pointer-events-none"></div>
        
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="bg-card/40 backdrop-blur-xl p-10 border-b border-border-subtle flex justify-between items-center relative z-10">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-soft-sm border border-primary/20 transition-all hover:scale-105 duration-500">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tighter group-hover:text-primary transition-colors">{selectedTicket.subject}</h2>
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-3 italic">
                    Ticket Signature: {selectedTicket.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button className="px-8 py-4 bg-muted/50 text-muted-foreground/60 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 border border-transparent transition-all shadow-soft-sm">
                  Deactivate Archive
                </button>
                <button className="p-4 text-muted-foreground/20 hover:text-foreground hover:bg-muted rounded-2xl transition-all shadow-soft-sm">
                  <MoreVertical size={24} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-12 space-y-12 relative z-10">
              {/* Initial Request Bubble */}
              <div className="flex gap-6 max-w-3xl animate-in fade-in slide-in-from-left-6 duration-700">
                <div className="w-10 h-10 rounded-2xl bg-muted border border-border-subtle shrink-0 relative overflow-hidden flex items-center justify-center font-black text-xs text-muted-foreground/40 shadow-soft-sm">
                   {selectedTicket.user.avatar ? <Image src={selectedTicket.user.avatar} alt="" fill className="object-cover" /> : selectedTicket.user.name ? selectedTicket.user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="bg-card/40 backdrop-blur-md p-8 rounded-[2.5rem] rounded-tl-none border border-border-subtle shadow-soft-xl relative group">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-16 -translate-y-16 blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000"></div>
                  <p className="text-sm font-bold text-foreground leading-relaxed relative z-10">{selectedTicket.description}</p>
                  <div className="mt-4 text-[9px] font-black text-muted-foreground/20 uppercase tracking-widest italic relative z-10">Transmission Inception</div>
                </div>
              </div>

              {/* Chat Messages */}
              {selectedTicket.conversation?.messages.map((msg: any) => (
                <div key={msg.id} className={`flex gap-6 max-w-3xl ${msg.sender.role === 'ADMIN' ? 'ml-auto flex-row-reverse animate-in fade-in slide-in-from-right-6 duration-700' : 'animate-in fade-in slide-in-from-left-6 duration-700'}`}>
                  <div className="w-10 h-10 rounded-2xl bg-muted border border-border-subtle shrink-0 relative overflow-hidden flex items-center justify-center font-black text-xs text-muted-foreground/40 shadow-soft-sm">
                    {msg.sender.avatar ? <Image src={msg.sender.avatar} alt="" fill className="object-cover" /> : msg.sender.name ? msg.sender.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className={`p-8 rounded-[2.5rem] border shadow-soft-2xl relative group ${
                    msg.sender.role === 'ADMIN' 
                    ? 'bg-primary text-white border-primary/20 rounded-tr-none brand-shadow' 
                    : 'bg-card/40 backdrop-blur-md text-foreground border-border-subtle rounded-tl-none shadow-soft-xl'
                  }`}>
                    {msg.sender.role === 'ADMIN' && <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-x-16 -translate-y-16 blur-2xl pointer-events-none group-hover:bg-white/10 transition-colors duration-1000"></div>}
                    <p className="text-sm font-bold leading-relaxed relative z-10">{msg.text}</p>
                    <div className={`mt-4 text-[9px] font-black uppercase tracking-widest italic relative z-10 ${msg.sender.role === 'ADMIN' ? 'text-white/40' : 'text-muted-foreground/20'}`}>
                      {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.createdAt))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Area */}
            <div className="p-10 bg-card/40 backdrop-blur-xl border-t border-border-subtle relative z-20">
              <div className="flex gap-6 max-w-5xl mx-auto items-center">
                <div className="flex-1 relative group">
                  <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={22} />
                  <input 
                    type="text" 
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full pl-16 pr-6 py-6 bg-background/50 border border-transparent focus:border-primary/20 rounded-[2rem] text-sm font-bold text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-soft-sm"
                  />
                </div>
                <button 
                  onClick={handleReply}
                  className="bg-primary text-white p-6 rounded-[2rem] shadow-2xl shadow-primary/20 brand-shadow hover:scale-110 active:scale-95 transition-all duration-500 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Send size={24} className="relative z-10 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 space-y-12 animate-in fade-in zoom-in duration-1000">
            <div className="w-32 h-32 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary group hover:scale-110 hover:rotate-3 transition-all duration-700 shadow-soft-2xl border border-primary/20">
              <MessageSquare size={64} className="group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-black text-foreground tracking-tighter">Select a Ticket</h2>
              <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-[0.25em] max-w-sm mx-auto leading-relaxed">Select a support ticket from the list to start a conversation.</p>
            </div>

            {/* Classification Guidelines Card */}
            <div className="mt-16 w-full max-w-2xl bg-card/50 border border-border-subtle rounded-[2.5rem] p-10 shadow-soft-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full translate-x-24 -translate-y-24 blur-3xl"></div>
              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="p-4 bg-primary/10 rounded-2xl">
                  <BookOpen className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground tracking-tight">Property Classifications</h3>
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-1 italic">Standardized Guidelines</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <ClassificationItem 
                  title="Hostels" 
                  desc="Dedicated student living. Single/Double rooms with shared amenities." 
                />
                <ClassificationItem 
                  title="Bedsitters" 
                  desc="Self-contained single room with private kitchen/bath." 
                />
                <ClassificationItem 
                  title="Single Rooms" 
                  desc="Private bedroom, shared kitchen/bath. Affordable option." 
                />
                <ClassificationItem 
                  title="Apartments" 
                  desc="Residential units (1-3BR). Higher tier, more space." 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassificationItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-5 rounded-2xl bg-muted/20 border border-border-subtle hover:border-primary/20 transition-all group/item">
      <h4 className="text-sm font-black text-foreground group-hover/item:text-primary transition-colors">{title}</h4>
      <p className="text-[11px] text-muted-foreground/60 mt-1.5 leading-relaxed font-bold">{desc}</p>
    </div>
  );
}
