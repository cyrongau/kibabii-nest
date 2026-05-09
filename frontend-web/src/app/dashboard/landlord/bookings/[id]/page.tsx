'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  User, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Home,
  Mail,
  Phone,
  ShieldCheck,
  Loader2,
  ExternalLink
} from 'lucide-react';

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/bookings/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [params.id]);

  const handleStatusUpdate = async (status: string) => {
    if (status === 'APPROVED' && !selectedUnit && booking.propertyUnit?.unitNames?.length > 0) {
      alert('Please select a unit number to assign to the student.');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/bookings/${params.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, unitName: selectedUnit }),
      });

      if (response.ok) {
        setBooking({ ...booking, status });
        router.push('/dashboard/landlord/bookings');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <span className="font-bold uppercase tracking-widest text-xs">Loading application details...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-slate-900">Booking not found</h2>
        <button onClick={() => router.back()} className="mt-4 text-primary font-bold">Go Back</button>
      </div>
    );
  }

  const student = booking.student;
  const property = booking.propertyUnit.property;
  const type = booking.propertyUnit.type;

  return (
    <main className="p-8 lg:p-12 max-w-6xl mx-auto">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors"
      >
        <ChevronLeft size={20} />
        Back to Bookings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Student Profile */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card p-8 rounded-[2.5rem] border border-border shadow-soft">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary text-3xl font-black">
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">{student.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                   <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                     <Mail size={14} /> {student.email}
                   </span>
                   <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                     <Phone size={14} /> {student.phone || 'No phone'}
                   </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
               <div className="space-y-1">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Status</div>
                 <div className="flex items-center gap-2">
                    <ShieldCheck className={student.studentIdentity?.verified ? "text-green-500" : "text-orange-500"} size={18} />
                    <span className="text-sm font-bold text-slate-700">
                      {student.studentIdentity?.verified ? 'Identity Verified' : 'Pending KYC'}
                    </span>
                 </div>
               </div>
               <div className="space-y-1">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration No.</div>
                 <div className="text-sm font-bold text-slate-700">{student.studentIdentity?.universityRegNo || 'Not provided'}</div>
               </div>
            </div>
          </section>

          <section className="bg-card p-8 rounded-[2.5rem] border border-border shadow-soft">
            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
              <Home size={20} className="text-primary" />
              Booking Details
            </h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <DetailItem label="Property" value={property.name} />
                <DetailItem label="Unit Type" value={type?.name || 'Unit'} />
                <DetailItem 
                  label="Monthly Rent" 
                  value={`Ksh ${booking.amount.toLocaleString()}`} 
                  warning={booking.amount !== booking.propertyUnit.price ? `Market Price: Ksh ${booking.propertyUnit.price.toLocaleString()}` : undefined}
                />
                <DetailItem label="Requested On" value={new Date(booking.createdAt).toLocaleDateString()} />
             </div>
          </section>

          {/* Unit Assignment */}
          {booking.status === 'PENDING' && (
            <section className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10">
              <h3 className="text-lg font-black text-foreground mb-4 tracking-tight">Assign Unit Number</h3>
              <p className="text-sm text-muted-foreground mb-6 font-medium">Select an available unit from your list to assign to this student upon approval.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {booking.propertyUnit.unitNames?.length > 0 ? (
                  booking.propertyUnit.unitNames.map((unit: string) => (
                    <button
                      key={unit}
                      onClick={() => setSelectedUnit(unit)}
                      className={`py-3 px-4 rounded-2xl text-xs font-black transition-all ${
                        selectedUnit === unit 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-card text-muted-foreground border border-border hover:border-primary'
                      }`}
                    >
                      {unit}
                    </button>
                  ))
                ) : (
                  <div className="col-span-full p-4 bg-card rounded-2xl border border-dashed border-border text-center text-muted-foreground text-xs font-bold">
                    No unit names configured for this property type.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-soft sticky top-8">
            <div className="mb-8">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Application Status</div>
              <span className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wider uppercase flex items-center gap-2 w-fit ${
                booking.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 
                booking.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
              }`}>
                {booking.status === 'APPROVED' ? <CheckCircle2 size={14} /> : 
                 booking.status === 'REJECTED' ? <XCircle size={14} /> : <Clock size={14} />}
                {booking.status}
              </span>
            </div>

            {booking.status === 'PENDING' ? (
              <div className="space-y-4">
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate('APPROVED')}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  Approve & Assign
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate('REJECTED')}
                  className="w-full bg-background text-red-500 border border-red-500/20 py-4 rounded-2xl font-black text-sm hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Reject Application
                </button>
              </div>
            ) : (
              <div className="p-6 bg-muted/50 rounded-3xl border border-border text-center">
                <p className="text-xs font-bold text-muted-foreground">This application has already been processed.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
             <h4 className="text-sm font-black mb-4 flex items-center gap-2">
               <ShieldCheck size={18} className="text-blue-400" />
               Compliance Note
             </h4>
             <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
               By approving this booking, you confirm that the selected unit is vacant and ready for occupancy. A tenancy agreement will be automatically generated and sent to the student for signing.
             </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailItem({ label, value, warning }: { label: string, value: string, warning?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</div>
      <div className="text-sm font-bold text-foreground">{value}</div>
      {warning && (
        <div className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md w-fit">
          {warning}
        </div>
      )}
    </div>
  );
}
