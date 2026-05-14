'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Plus, MapPin, MoreVertical, Loader2, Trash2 } from 'lucide-react';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import { useNotifications } from '@/context/NotificationContext';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { showToast } = useNotifications();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    isOpen: false,
    onConfirm: () => {},
    title: '',
    message: '',
    confirmText: '',
    type: 'danger' as 'danger' | 'info'
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/properties/landlord/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/auth/landlord';
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleDeleteProperty = (id: string, name: string) => {
    setConfirmationConfig({
      isOpen: true,
      title: 'Purge Listing?',
      message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone and will fail if there are active tenancies.`,
      confirmText: 'Purge Property',
      type: 'danger',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/properties/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete property');
          }

          showToast('Property purged successfully', 'success');
          setProperties(prev => prev.filter(p => p.id !== id));
        } catch (error: any) {
          showToast(error.message || 'Failed to purge property', 'error');
        } finally {
          setIsDeleting(false);
          setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <main className="p-8 lg:p-12">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Properties</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage your hostel listings and details.</p>
        </div>
        {user?.isVerifiedLandlord ? (
          <Link 
            href="/dashboard/landlord/properties/new"
            className="bg-primary text-white px-6 py-3.5 rounded-2xl text-sm font-bold brand-shadow hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Add Property
          </Link>
        ) : (
          <button 
            disabled
            className="bg-slate-100 text-slate-400 px-6 py-3.5 rounded-2xl text-sm font-bold shadow-sm cursor-not-allowed flex items-center gap-2"
            title="Please complete KYC verification to add properties"
          >
            <Plus size={18} />
            Add Property
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="card-premium p-24 shadow-soft flex flex-col items-center justify-center text-center">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading your portfolio...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="card-premium p-24 shadow-soft-lg flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
             <Home size={40} />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">No Properties Yet</h2>
          <p className="text-muted-foreground max-w-sm mb-8 font-medium">You haven't added any properties to your portfolio. Start by creating your first listing!</p>
          {user?.isVerifiedLandlord ? (
            <Link 
              href="/dashboard/landlord/properties/new"
              className="bg-primary text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl hover:bg-primary/90 transition-all brand-shadow"
            >
              Create Your First Listing
            </Link>
          ) : (
            <button 
              disabled
              className="bg-muted text-muted-foreground/40 px-8 py-4 rounded-2xl text-sm font-bold cursor-not-allowed"
              title="Please complete KYC verification to add properties"
            >
              Create Your First Listing
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map(prop => (
            <div key={prop.id} className="card-premium overflow-visible group relative shadow-soft hover:shadow-soft-lg transition-all duration-300">
              <div className="aspect-video bg-muted relative rounded-t-[2rem] overflow-hidden border-b border-border-subtle">
                {prop.images && prop.images[0] ? (
                  <img src={prop.images[0]} alt={prop.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Home size={48} />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-wider uppercase shadow-sm ${
                    prop.verified ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {prop.verified ? 'Verified' : 'Pending'}
                  </span>
                  {prop.isFullyOccupied && (
                    <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-wider uppercase shadow-sm flex items-center gap-1">
                      Locked (Full)
                    </span>
                  )}
                  {prop.hasDiscount && (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
                      💰 {prop.maxDiscount}% Disc
                    </span>
                  )}
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-foreground text-lg group-hover:text-primary transition-colors tracking-tight">{prop.name}</h3>
                    <div className="flex items-center gap-1.5 text-muted-foreground/60 text-xs font-bold mt-1 uppercase tracking-widest">
                      <MapPin size={14} />
                      {prop.address}, {prop.city}
                    </div>
                  </div>
                  <div className="relative group/menu">
                    <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-xl transition-all">
                      <MoreVertical size={20} />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-2xl shadow-soft-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 p-2 backdrop-blur-xl">
                      <Link 
                        href={`/hostels/${prop.id}`}
                        target="_blank"
                        className="block px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition-colors"
                      >
                        View Public Listing
                      </Link>
                      <div className="h-px bg-border my-1" />
                      <button 
                        onClick={() => handleDeleteProperty(prop.id, prop.name)}
                        className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Purge Listing
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Starting At</span>
                    <span className="text-xl font-extrabold text-foreground">Ksh {(prop.price || 0).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Units</span>
                    <span className="text-sm font-bold text-foreground">{prop.units?.length || 0} Types</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmationConfig.isOpen}
        onClose={() => setConfirmationConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationConfig.onConfirm}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        confirmText={confirmationConfig.confirmText}
        type={confirmationConfig.type}
        isLoading={isDeleting}
      />
    </main>
  );
}
