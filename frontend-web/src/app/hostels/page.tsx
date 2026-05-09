'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Filter, Star, ShieldCheck } from 'lucide-react';

const ALL_HOSTELS = [
  { id: 1, name: 'Royal Plaza Residency', price: 4500, location: 'Near Main Gate', rating: '4.9', amenities: ['Fiber', '24/7'], budget: 'KES 3k - 5k' },
  { id: 2, name: 'The Hive Elite', price: 5200, location: 'Near Main Gate', rating: '4.7', amenities: ['Laundry', 'Backup Gen'], budget: 'KES 5k - 8k' },
  { id: 3, name: 'Azure Commons', price: 3800, location: 'Kanduyi Center', rating: '4.8', amenities: ['Gym', 'Shared Kitchen'], budget: 'KES 3k - 5k' },
  { id: 4, name: 'Lakeside Heights', price: 4200, location: 'University District', rating: '4.6', amenities: ['Parking', 'Security'], budget: 'KES 3k - 5k' },
  { id: 5, name: 'University Suites', price: 8500, location: 'Near Main Gate', rating: '5.0', amenities: ['AC', 'Single Room'], budget: 'KES 8k+' },
  { id: 6, name: 'Scholar Haven', price: 3500, location: 'Kanduyi Center', rating: '4.5', amenities: ['Wifi', 'Water'], budget: 'KES 3k - 5k' },
];

function HostelsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialLocation = searchParams.get('location') || '';
  const initialBudget = searchParams.get('budget') || '';

  const [search, setSearch] = useState(initialQuery);
  const [hostels, setHostels] = useState<any[]>([]);
  const [filteredHostels, setFilteredHostels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/properties`);
        const data = await response.json();
        if (response.ok) {
          setHostels(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch hostels', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHostels();
  }, []);

  useEffect(() => {
    let results = hostels;

    if (initialQuery) {
      results = results.filter(h => 
        h.name.toLowerCase().includes(initialQuery.toLowerCase()) || 
        (h.address && h.address.toLowerCase().includes(initialQuery.toLowerCase())) ||
        (h.city && h.city.toLowerCase().includes(initialQuery.toLowerCase()))
      );
    }

    if (initialLocation && initialLocation !== 'All Locations') {
       results = results.filter(h => h.city === initialLocation || h.address?.includes(initialLocation));
    }

    setFilteredHostels(results);
  }, [initialQuery, initialLocation, initialBudget, hostels]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Search Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-xl bg-card/80">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-6 items-center">
          <a href="/" className="text-2xl font-black text-primary tracking-tighter shrink-0">Kibabii Nest</a>
          <div className="flex-1 relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={20} />
            <input 
              type="text" 
              placeholder="Search hostels, locations, or amenities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full !pl-16 pr-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold focus:outline-none focus:border-primary transition-all text-foreground"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-card border border-border-subtle rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all">
              <Filter size={18} />
              Filters
            </button>
            <button className="flex-1 md:flex-none px-8 py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-xl hover:bg-primary/90 transition-all brand-shadow">
              Search
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              {initialQuery ? `Results for "${initialQuery}"` : 'Available Hostels'}
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
              {filteredHostels.length} verified listings found {initialLocation ? `in ${initialLocation}` : 'near Kibabii University'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredHostels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredHostels.map((item) => (
              <a 
                href={item.isFullyOccupied ? '#' : `/hostels/${item.id}`} 
                key={item.id} 
                className={`group card-premium overflow-hidden transition-all duration-500 relative ${item.isFullyOccupied ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-soft-lg'}`}
              >
                {item.isFullyOccupied && !item.hasUpcomingVacancy && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center">
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black tracking-widest shadow-2xl flex items-center gap-2">
                      <ShieldCheck size={20} className="text-red-400" />
                      FULLY OCCUPIED
                    </div>
                  </div>
                )}
                {item.hasUpcomingVacancy && (
                  <div className="absolute top-6 right-6 z-30 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg animate-pulse">
                    🔓 Available in {Math.min(...(item.units || []).flatMap((u: any) => (u.upcomingVacancies || []).map((v: any) => v.daysUntilAvailable)))} days
                  </div>
                )}
                {item.hasDiscount && !item.isFullyOccupied && (
                  <div className="absolute top-6 right-6 z-30 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg animate-bounce-subtle border border-emerald-400/20">
                    💎 UP TO {item.maxDiscount}% LONG-STAY DISCOUNT
                  </div>
                )}
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <div className="absolute top-6 left-6 bg-primary text-white text-xs font-black px-4 py-2 rounded-xl z-10 shadow-lg shadow-blue-500/20 tracking-wider">
                    KES {item.price}/mo
                  </div>
                  <img 
                    src={item.images?.[0] || `/hostels/hostel-1.png`} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-1.5 z-20">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{item.verified ? 'Verified' : 'Pending'}</span>
                  </div>
                </div>
                <div className="p-8 relative z-20">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors tracking-tight">{item.name}</h3>
                      <div className="flex items-center gap-1.5 text-muted-foreground/60 font-bold mt-2 uppercase tracking-widest text-[10px]">
                         <MapPin size={12} />
                         {item.address}, {item.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm bg-amber-50 px-3 py-1.5 rounded-xl">
                      <Star size={14} fill="currentColor" />
                      <span>{item.rating || '4.8'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(item.amenities || []).slice(0, 3).map((tag: string, j: number) => (
                      <span key={j} className="text-[10px] font-black text-primary bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-wider border border-blue-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="card-premium p-20 text-center shadow-soft border-dashed">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-muted-foreground/40" size={32} />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">No hostels found</h2>
            <p className="text-muted-foreground font-medium mt-2">Try adjusting your filters or search terms.</p>
            <button onClick={() => window.location.href='/hostels'} className="mt-8 text-primary font-black hover:underline underline-offset-8">Clear all filters</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HostelsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-primary">Loading Kibabii Nest...</div>}>
      <HostelsContent />
    </Suspense>
  );
}
