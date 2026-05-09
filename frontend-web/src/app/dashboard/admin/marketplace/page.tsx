'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye,
  Filter,
  User,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Calendar,
  Phone,
  Mail,
  Tag,
  Package,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isSold: boolean;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    isVerifiedLandlord: boolean;
    createdAt: string;
    _count: { marketplaceItems: number };
  };
}

export default function AdminMarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<MarketplaceItem['seller'] | null>(null);
  const [sellerItems, setSellerItems] = useState<MarketplaceItem[]>([]);
  const [isLoadingSellerItems, setIsLoadingSellerItems] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const limit = 25;

  useEffect(() => {
    fetchItems();
  }, [page, status, search]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: status,
        search: search
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/marketplace/admin/all?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Error fetching marketplace items:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSellerItems = async (sellerId: string) => {
    setIsLoadingSellerItems(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/marketplace/admin/all?sellerId=${sellerId}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSellerItems(data.items || []);
    } catch (e) {
      console.error('Error fetching seller items:', e);
    } finally {
      setIsLoadingSellerItems(false);
    }
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/marketplace/admin/${itemId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, rejectionReason })
      });

      if (response.ok) {
        fetchItems();
        setSelectedItem(null);
        setRejectionReason('');
      }
    } catch (e) {
      console.error('Error updating status:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background p-8 lg:p-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h1 className="text-4xl font-black text-foreground flex items-center gap-4 tracking-tighter">
            <ShoppingBag className="text-primary" size={40} />
            Marketplace Inventory
          </h1>
          <p className="text-muted-foreground/60 font-bold mt-2 uppercase tracking-widest text-xs">Manage community listings and verified sellers</p>
        </div>
        
        <div className="flex items-center gap-4 bg-card p-2 rounded-[2rem] border border-border-subtle shadow-soft-xl w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={18} />
            <input 
              type="text" 
              placeholder="Search products or sellers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-transparent text-sm font-bold focus:outline-none"
            />
          </div>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-muted/40 border-none rounded-[1.5rem] px-6 py-3 text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/10 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-card rounded-[3rem] border border-border-subtle shadow-soft-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/20 border-b border-border-subtle">
                <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Product Name</th>
                <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Seller</th>
                <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Price</th>
                <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Verification</th>
                <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Listing Status</th>
                <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Date Posted</th>
                <th className="px-8 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 italic">Loading marketplace products...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <Package className="mx-auto mb-6 opacity-10 text-foreground" size={64} />
                    <div className="text-sm font-black text-muted-foreground/40 uppercase tracking-widest">No listings found</div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-muted rounded-2xl relative overflow-hidden border border-border-subtle shadow-soft-sm group-hover:scale-105 transition-transform">
                          {item.images[0] && <Image src={item.images[0]} alt="" fill className="object-cover" />}
                        </div>
                        <div>
                          <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors tracking-tight">{item.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <button 
                        onClick={() => {
                          setSelectedSeller(item.seller);
                          fetchSellerItems(item.seller.id);
                        }}
                        className="flex items-center gap-3 group/seller"
                      >
                        <div className="w-10 h-10 rounded-xl bg-muted relative overflow-hidden border border-border-subtle group-hover/seller:ring-4 group-hover/seller:ring-primary/10 transition-all">
                          {item.seller.avatar && <Image src={item.seller.avatar} alt="" fill className="object-cover" />}
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-black text-foreground group-hover/seller:text-primary transition-colors">{item.seller.name}</div>
                          <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Seller Profile</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-8 py-8">
                      <div className="text-sm font-black text-foreground">
                        <span className="text-[10px] opacity-40 mr-1 font-bold">KES</span>
                        {item.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        item.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {item.status === 'PENDING' && <Clock size={12} className="mr-2" />}
                        {item.status === 'APPROVED' && <CheckCircle2 size={12} className="mr-2" />}
                        {item.status === 'REJECTED' && <XCircle size={12} className="mr-2" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        item.isSold ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {item.isSold ? 'Sold' : 'Available'}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <div className="text-xs font-bold text-muted-foreground/60">{new Date(item.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <button 
                        onClick={() => setSelectedItem(item)}
                        className="p-3 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all shadow-soft-sm bg-card border border-border-subtle"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-8 border-t border-border-subtle flex items-center justify-between bg-muted/5">
            <div className="text-xs font-black text-muted-foreground/40 uppercase tracking-widest">
              Showing <span className="text-foreground">{(page - 1) * limit + 1}</span> to <span className="text-foreground">{Math.min(page * limit, total)}</span> of <span className="text-foreground">{total}</span> items
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-3 rounded-2xl bg-card border border-border-subtle text-foreground disabled:opacity-30 hover:bg-muted/50 transition-all shadow-soft-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      page === i + 1 ? 'bg-primary text-white shadow-glow' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </button>
                )).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-3 rounded-2xl bg-card border border-border-subtle text-foreground disabled:opacity-30 hover:bg-muted/50 transition-all shadow-soft-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-24 bg-foreground/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-background w-full max-w-6xl max-h-full rounded-[4rem] border border-border-subtle shadow-soft-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex-1 overflow-y-auto p-12 lg:p-20 scrollbar-hide">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-8">
                  <div className="aspect-square bg-card rounded-[3rem] border border-border-subtle overflow-hidden relative shadow-soft-xl">
                    {selectedItem.images[0] && <Image src={selectedItem.images[0]} alt="" fill className="object-cover" />}
                  </div>
                  <div className="grid grid-cols-4 gap-6">
                    {selectedItem.images.slice(1).map((img, i) => (
                      <div key={i} className="aspect-square bg-muted rounded-2xl relative overflow-hidden border border-border-subtle">
                        <Image src={img} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-4xl font-black text-foreground tracking-tighter leading-none">{selectedItem.title}</h2>
                      <div className="text-3xl font-black text-primary tracking-tight mt-4">KES {selectedItem.price.toLocaleString()}</div>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="p-4 bg-muted hover:bg-muted/60 rounded-3xl transition-colors shadow-soft-sm">
                      <XCircle size={24} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div className="bg-muted/20 p-10 rounded-[3rem] border border-border-subtle shadow-inner">
                    <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">Description</h4>
                    <p className="text-sm font-medium leading-relaxed text-foreground/80">{selectedItem.description}</p>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Listing Actions</h4>
                     <div className="flex gap-4">
                        {selectedItem.status !== 'APPROVED' && (
                          <button 
                            disabled={isProcessing}
                            onClick={() => handleUpdateStatus(selectedItem.id, 'APPROVED')}
                            className="flex-1 py-5 bg-primary text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all brand-shadow"
                          >
                            Approve Listing
                          </button>
                        )}
                        {selectedItem.status !== 'REJECTED' && (
                          <button 
                            disabled={isProcessing}
                            onClick={() => handleUpdateStatus(selectedItem.id, 'REJECTED')}
                            className="flex-1 py-5 bg-muted text-foreground border border-border-subtle rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                          >
                            Reject Listing
                          </button>
                        )}
                     </div>
                     {selectedItem.status !== 'APPROVED' && (
                        <textarea 
                          placeholder="Rejection reason (required for rejection)"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full p-6 bg-muted/40 border border-transparent focus:border-red-500/20 rounded-[1.5rem] text-sm font-bold resize-none h-32 focus:outline-none focus:ring-4 focus:ring-red-500/5 transition-all"
                        />
                     )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seller Profile Drawer */}
      {selectedSeller && (
        <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-2xl bg-background border-l border-border-subtle shadow-soft-2xl animate-in slide-in-from-right duration-500 flex flex-col">
          <div className="p-12 lg:p-16 flex-1 overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-12">
              <button onClick={() => setSelectedSeller(null)} className="p-4 bg-muted hover:bg-muted/60 rounded-3xl transition-colors">
                <ChevronRight size={24} className="text-muted-foreground" />
              </button>
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-4 py-2 bg-primary/10 rounded-full border border-primary/20">Seller Profile</div>
            </div>

            <div className="flex flex-col items-center text-center space-y-8 mb-16">
              <div className="w-40 h-40 rounded-[3.5rem] bg-muted relative overflow-hidden border-4 border-card shadow-soft-2xl">
                {selectedSeller.avatar && <Image src={selectedSeller.avatar} alt="" fill className="object-cover" />}
              </div>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tighter">{selectedSeller.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <ShieldCheck size={16} className="text-primary" />
                  <span className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest">
                    {selectedSeller.isVerifiedLandlord ? 'Verified Partner' : 'Community Member'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-muted/20 p-6 rounded-[2rem] border border-border-subtle text-left">
                   <div className="flex items-center gap-3 text-muted-foreground mb-1">
                      <Calendar size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Joined</span>
                   </div>
                   <div className="text-xs font-black text-foreground">{new Date(selectedSeller.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="bg-muted/20 p-6 rounded-[2rem] border border-border-subtle text-left">
                   <div className="flex items-center gap-3 text-muted-foreground mb-1">
                      <Tag size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Listings</span>
                   </div>
                   <div className="text-xs font-black text-foreground">{selectedSeller._count.marketplaceItems} Total Items</div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                  <Package className="text-primary" size={24} />
                  Other Products
                </h3>
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{sellerItems.length} Recent</span>
              </div>

              {isLoadingSellerItems ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary opacity-20" size={32} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {sellerItems.map(item => (
                    <div key={item.id} className="p-4 bg-muted/10 border border-border-subtle rounded-[2rem] flex gap-4 hover:bg-muted/20 transition-all cursor-pointer group">
                      <div className="w-20 h-20 bg-muted rounded-2xl relative overflow-hidden border border-border-subtle shrink-0 shadow-soft-sm">
                        {item.images[0] && <Image src={item.images[0]} alt="" fill className="object-cover" />}
                      </div>
                      <div className="flex-1 py-2">
                        <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors tracking-tight">{item.title}</div>
                        <div className="text-xs font-black text-primary mt-1">KES {item.price.toLocaleString()}</div>
                        <div className={`text-[8px] font-black uppercase tracking-[0.2em] mt-3 px-2 py-0.5 inline-block rounded border ${
                          item.status === 'APPROVED' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-amber-500/5 text-amber-500 border-amber-500/10'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                      <div className="flex items-center pr-4">
                        <ArrowRight size={16} className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                  {sellerItems.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground/30 font-bold text-xs italic">No other products found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
