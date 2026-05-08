'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  AlertCircle,
  Eye,
  Filter,
  MoreVertical,
  ChevronRight,
  User,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  seller: {
    name: string;
    avatar?: string;
  };
}

export default function AdminMarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/marketplace/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching marketplace items:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedItem) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/marketplace/${selectedItem.id}/review`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, rejectionReason })
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== selectedItem.id));
        setSelectedItem(null);
        setRejectionReason('');
      }
    } catch (e) {
      console.error('Error reviewing item:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background">
      {/* Items List */}
      <aside className="w-full max-w-[450px] border-r border-border-subtle bg-card flex flex-col shadow-soft-xl">
        <div className="p-10 border-b border-border-subtle bg-muted/10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-4 tracking-tighter">
              <ShoppingBag className="text-primary" size={32} />
              Marketplace Management
            </h1>
            <div className="bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-soft-sm">
              {items.length} Pending
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search pending listings..." 
              className="w-full pl-14 pr-6 py-4.5 bg-background border border-transparent focus:border-primary/20 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-soft-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground/40 font-bold">
               <Loader2 className="animate-spin text-primary" size={32} />
               <span className="text-[10px] font-black uppercase tracking-widest italic">Loading items...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-32 text-muted-foreground/30 font-black">
               <ShieldCheck size={64} className="mx-auto mb-6 opacity-10" />
               <div className="text-xs uppercase tracking-[0.2em]">Queue Empty</div>
               <div className="text-[9px] mt-2 opacity-60">No items awaiting review</div>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-6 rounded-[2.25rem] border-2 transition-all cursor-pointer group relative overflow-hidden ${
                  selectedItem?.id === item.id 
                  ? 'bg-primary/5 border-primary shadow-soft-xl scale-[1.02]' 
                  : 'bg-muted/20 border-transparent hover:border-primary/20 hover:bg-muted/40'
                }`}
              >
                <div className="flex gap-6">
                  <div className="w-24 h-24 bg-muted rounded-[1.5rem] relative overflow-hidden shrink-0 border border-border-subtle shadow-soft-sm group-hover:scale-105 transition-transform">
                    {item.images[0] && <Image src={item.images[0]} alt="" fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors truncate mb-1.5 tracking-tight">{item.title}</h3>
                    <div className="text-xs font-black text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="opacity-40 font-bold">KES</span> {item.price.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-6 h-6 rounded-xl bg-muted relative overflow-hidden border border-border-subtle shadow-inner">
                         {item.seller.avatar && <Image src={item.seller.avatar} alt="" fill className="object-cover" />}
                       </div>
                       <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest truncate">{item.seller.name}</span>
                    </div>
                  </div>
                </div>
                {selectedItem?.id === item.id && (
                  <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-glow"></div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Item Details & Review */}
      <main className="flex-1 flex flex-col bg-background overflow-y-auto scrollbar-hide">
        {selectedItem ? (
          <div className="p-10 lg:p-16 max-w-5xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-soft-xl gap-8">
               <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.25rem] flex items-center justify-center shadow-soft-sm">
                    <AlertCircle size={32} />
                 </div>
                 <div>
                    <div className="text-xl font-black text-foreground tracking-tight">Manual Review Required</div>
                    <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mt-1">Submitted: {new Date(selectedItem.createdAt).toLocaleString()}</div>
                 </div>
               </div>
               <div className="flex items-center gap-5 w-full md:w-auto">
                  <button 
                    onClick={() => handleReview('REJECTED')}
                    disabled={isProcessing}
                    className="flex-1 md:flex-none px-10 py-4.5 bg-muted text-foreground border border-border-subtle rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50"
                  >
                    Reject Item
                  </button>
                  <button 
                    onClick={() => handleReview('APPROVED')}
                    disabled={isProcessing}
                    className="flex-1 md:flex-none px-10 py-4.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 brand-shadow"
                  >
                    Approve Listing
                  </button>
               </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
               {/* Left: Images */}
               <div className="space-y-8">
                  <div className="aspect-square bg-card rounded-[3.5rem] border border-border-subtle overflow-hidden relative shadow-soft-2xl group">
                    {selectedItem.images[0] && <Image src={selectedItem.images[0]} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />}
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {selectedItem.images.slice(1).map((img, i) => (
                      <div key={i} className="aspect-square bg-muted rounded-[1.5rem] border border-border-subtle overflow-hidden relative shadow-soft-sm group">
                        <Image src={img} alt="" fill className="object-cover group-hover:scale-125 transition-transform duration-1000" />
                      </div>
                    ))}
                  </div>
               </div>

               {/* Right: Details */}
               <div className="space-y-10">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-foreground tracking-tighter leading-none">{selectedItem.title}</h2>
                    <div className="text-3xl font-black text-primary tracking-tight">KES {selectedItem.price.toLocaleString()}</div>
                  </div>

                  <div className="bg-muted/20 p-10 rounded-[3rem] border border-border-subtle shadow-inner">
                    <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-6">Item Details</h4>
                    <p className="text-base text-foreground/80 leading-relaxed font-medium">
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center gap-6 bg-foreground text-background p-8 rounded-[2.5rem] shadow-soft-2xl">
                     <div className="w-16 h-16 rounded-[1.25rem] bg-background/10 relative overflow-hidden border border-background/20 shadow-inner">
                        {selectedItem.seller.avatar && <Image src={selectedItem.seller.avatar} alt="" fill className="object-cover" />}
                     </div>
                     <div>
                        <div className="text-base font-black tracking-tight">{selectedItem.seller.name}</div>
                        <div className="text-[10px] text-background/40 font-black uppercase tracking-widest mt-1">Verified Student</div>
                     </div>
                     <div className="ml-auto flex items-center gap-3 px-4 py-2 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/20">
                        <ShieldCheck size={14} />
                        Active
                     </div>
                  </div>

                  {/* Rejection Input */}
                  <div className="space-y-4 pt-10 border-t border-border-subtle">
                     <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] ml-2">Reviewer Notes</label>
                     <textarea 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. Prohibited item, image violation, etc."
                        className="w-full p-8 bg-muted/20 border border-transparent focus:border-red-500/20 rounded-[2rem] text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-red-500/5 transition-all resize-none shadow-soft-sm"
                        rows={4}
                     />
                  </div>
               </div>
            </div>

            {/* Policy Reminder */}
            <div className="bg-red-500/5 p-10 rounded-[3rem] border border-red-500/10 flex gap-8 items-start shadow-soft-sm">
               <ShieldAlert className="text-red-500 shrink-0 mt-1" size={32} />
               <div className="space-y-2">
                  <h4 className="text-sm font-black text-red-500 uppercase tracking-widest">Marketplace Policy</h4>
                  <p className="text-xs text-muted-foreground font-bold leading-relaxed max-w-2xl">
                    Kibabii Nest maintains a zero-tolerance policy for illegal substances or prohibited items. 
                    Ensure all item details comply with student safety standards before approving the listing for public view.
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-700">
            <div className="w-40 h-40 rounded-[3rem] bg-card border border-border-subtle flex items-center justify-center mb-12 shadow-soft-xl group">
              <ShoppingBag size={64} className="text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h2 className="text-3xl font-black text-foreground mb-4 tracking-tighter">No Item Selected</h2>
            <p className="text-sm font-black text-muted-foreground/40 max-w-sm uppercase tracking-widest leading-loose">
              Select a pending listing from the directory to review.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
