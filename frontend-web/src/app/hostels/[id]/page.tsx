'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, 
  Star, 
  ShieldCheck, 
  Wifi, 
  Coffee, 
  Users, 
  ArrowLeft, 
  Heart, 
  Share2, 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  Smartphone,
  ChevronRight
} from 'lucide-react';

export default function HostelDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookingStep, setBookingStep] = useState<'none' | 'details' | 'payment' | 'processing' | 'success'>('none');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [duration, setDuration] = useState('1 Semester (4 Months)');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`http://localhost:3000/properties/${id}`);
        if (!response.ok) throw new Error('Property not found');
        const data = await response.json();
        
        // Security check: If property is not verified, only owner or admin can view
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        if (!data.verified) {
          const isOwner = user && user.id === data.landlordId;
          const isAdmin = user && user.role === 'ADMIN';
          
          if (!isOwner && !isAdmin) {
            router.push('/hostels');
            return;
          }
        }
        
        setProperty(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id, router]);

  const handleStartBooking = () => setBookingStep('details');
  const handleProceedToPayment = () => setBookingStep('payment');
  
  const handleFinalizeBooking = () => {
    setBookingStep('processing');
    setTimeout(() => {
      setBookingStep('success');
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading Nest Details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="bg-card p-12 rounded-[3rem] shadow-xl text-center max-w-lg border border-border-subtle">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ArrowLeft size={40} />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Nest Not Found</h2>
          <p className="text-muted-foreground font-medium mb-8">The property you are looking for doesn't exist or is no longer available.</p>
          <button onClick={() => router.push('/hostels')} className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <button onClick={() => router.push('/hostels')} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Listings
        </button>
        <div className="flex gap-4">
          {!property.verified && (
            <div className="bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} />
              Preview Mode (Unapproved)
            </div>
          )}
          <button className="p-3 bg-card rounded-2xl text-muted-foreground hover:text-red-500 border border-border-subtle transition-colors">
            <Heart size={20} />
          </button>
          <button className="p-3 bg-card rounded-2xl text-muted-foreground hover:text-primary border border-border-subtle transition-colors">
            <Share2 size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Gallery */}
          <div className="space-y-6">
            <div className="aspect-[16/10] bg-muted rounded-[3rem] overflow-hidden shadow-2xl relative border-8 border-card">
              <img 
                src={property.images?.[0] || '/hostels/hostel-1.png'} 
                alt={property.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-8 left-8 bg-card/95 backdrop-blur px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-border-subtle">
                <div className={`w-10 h-10 ${property.verified ? 'bg-green-500' : 'bg-orange-500'} rounded-2xl flex items-center justify-center text-white`}>
                  {property.verified ? '✓' : '!'}
                </div>
                <div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kibabii Nest Verified</div>
                  <div className="text-sm font-black text-foreground leading-none mt-1">
                    {property.verified ? '100% Authentic' : 'Verification Pending'}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
               {(property.images?.slice(0, 3) || []).map((img: string, i: number) => (
                 <div key={i} className="aspect-square bg-muted rounded-3xl overflow-hidden border-4 border-card hover:border-primary cursor-pointer transition-all">
                   <img src={img} className="w-full h-full object-cover" />
                 </div>
               ))}
               {(!property.images || property.images.length === 0) && [1,2,3].map(i => (
                 <div key={i} className="aspect-square bg-muted rounded-3xl overflow-hidden border-4 border-card hover:border-primary cursor-pointer transition-all">
                   <img src={`/hostels/hostel-${i}.png`} className="w-full h-full object-cover" />
                 </div>
               ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-12">
            <div>
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                  <ShieldCheck size={14} className="text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {property.category?.name || 'Top Rated Choice'}
                  </span>
                </div>
                {property.maxDiscount > 0 && (
                  <div className="inline-flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
                    <CreditCard size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                      {property.maxDiscount}% Upfront Discount
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                {property.name}
              </h1>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <MapPin size={18} className="text-primary" />
                  {property.address}, {property.city}
                </div>
                <div className="w-px h-4 bg-border"></div>
                <div className="flex items-center gap-2 text-sm font-black text-amber-500">
                  <Star size={18} fill="currentColor" />
                  4.8 (Verified Nest)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
               {(property.amenities || []).map((amenity: string, idx: number) => (
                 <Amenity key={idx} icon={<CheckCircle2 className="text-primary" size={18} />} label={amenity} />
               ))}
               {(!property.amenities || property.amenities.length === 0) && (
                 <>
                   <Amenity icon={<Wifi />} label="Free Fiber Optic" />
                   <Amenity icon={<Coffee />} label="Shared Kitchen" />
                   <Amenity icon={<Users />} label="Study Lounge" />
                   <Amenity icon={<ShieldCheck />} label="24/7 Security" />
                 </>
               )}
            </div>

            <div className="p-10 bg-card rounded-[3rem] border border-border-subtle flex flex-col md:flex-row justify-between items-center gap-8">
               <div>
                 <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Monthly Starting At</div>
                 <div className="text-4xl font-black text-foreground tracking-tighter">
                   KES {(property.price || 0).toLocaleString()}
                   <span className="text-lg text-muted-foreground font-bold">/mo</span>
                 </div>
                 {property.maxDiscount > 0 && (
                   <div className="text-[10px] font-bold text-amber-500 mt-1">
                     * Up to {property.maxDiscount}% discount for long stays
                   </div>
                 )}
               </div>
               <button 
                 onClick={handleStartBooking}
                 className="w-full md:w-auto bg-primary text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
               >
                 Book This Room
               </button>
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-black text-foreground tracking-tight">About this hostel</h3>
               <p className="text-muted-foreground leading-relaxed font-medium">
                 {property.description}
               </p>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Flow Modal */}
      {bookingStep !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => bookingStep === 'success' ? setBookingStep('none') : null}></div>
          
          <div className="relative bg-card w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-border-subtle">
            {bookingStep === 'details' && (
              <div className="p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Booking Details</h2>
                    <p className="text-muted-foreground font-medium mt-1">Tell us a bit about your stay.</p>
                  </div>
                  <button onClick={() => setBookingStep('none')} className="p-2 hover:bg-muted rounded-xl transition-colors">✕</button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select Duration</label>
                    <select 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full p-4 bg-muted/30 border border-border-subtle rounded-2xl font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    >
                      <option>1 Semester (4 Months)</option>
                      <option>Full Year (8 Months)</option>
                      <option>Monthly (Rolling)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Phone Number (M-Pesa)</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                      <input 
                        type="tel" 
                        placeholder="0712 345 678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border-subtle rounded-2xl font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleProceedToPayment}
                    disabled={!phoneNumber}
                    className="w-full bg-primary text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    Confirm & Proceed
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 'payment' && (
              <div className="p-12 space-y-8 text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CreditCard className="text-emerald-500" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-foreground tracking-tight">Order Summary</h2>
                  <p className="text-muted-foreground font-medium mt-1">Final check before payment.</p>
                </div>

                <div className="bg-muted/20 rounded-[2rem] p-8 space-y-4 border border-border-subtle">
                  <div className="flex justify-between font-bold text-sm">
                    <span className="text-muted-foreground">Hostel</span>
                    <span className="text-foreground">{property.name}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground">{duration}</span>
                  </div>
                  <div className="h-px bg-border my-2"></div>
                  <div className="flex justify-between font-black text-lg">
                    <span className="text-foreground">Total to Pay</span>
                    <span className="text-primary underline decoration-2 underline-offset-8">KES {(property.price || 0).toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={handleFinalizeBooking}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all"
                >
                  Pay via M-Pesa
                </button>
                <button onClick={() => setBookingStep('details')} className="text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">Go Back</button>
              </div>
            )}

            {bookingStep === 'processing' && (
              <div className="p-24 text-center space-y-8">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <Smartphone className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">Requesting M-Pesa Payment</h2>
                  <p className="text-muted-foreground font-medium mt-2 max-w-xs mx-auto">Please check your phone for the M-Pesa STK push and enter your PIN.</p>
                </div>
                <div className="pt-4">
                  <Loader2 className="mx-auto text-slate-300 animate-spin" size={24} />
                </div>
              </div>
            )}

            {bookingStep === 'success' && (
              <div className="p-16 text-center space-y-10">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 animate-bounce">
                  <CheckCircle2 className="text-white" size={48} />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-foreground tracking-tight">Nest Secured!</h2>
                  <p className="text-muted-foreground font-medium mt-3 text-lg">Your booking at {property.name} has been confirmed. Welcome home!</p>
                </div>
                
                <div className="pt-4 flex flex-col gap-4">
                  <button 
                    onClick={() => router.push('/dashboard/student')}
                    className="w-full bg-primary text-white py-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all"
                  >
                    Go to Dashboard
                  </button>
                  <button onClick={() => setBookingStep('none')} className="text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Amenity({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-12 h-12 bg-card rounded-2xl border border-border-subtle flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary transition-all">
        {icon}
      </div>
      <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </div>
  );
}
