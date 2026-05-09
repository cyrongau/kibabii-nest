'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/bookings/landlord`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <main className="p-8 lg:p-12">
      <header className="mb-12">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Bookings</h1>
        <p className="text-muted-foreground font-medium mt-1">Track student applications and reservations.</p>
      </header>

      {isLoading ? (
        <div className="card-premium p-24 shadow-soft flex flex-col items-center justify-center text-center">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card-premium p-24 shadow-soft-lg flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
             <CalendarCheck size={40} />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">No Bookings Yet</h2>
          <p className="text-muted-foreground max-w-sm font-medium">When students book your properties, they will appear here for your review and approval.</p>
        </div>
      ) : (
        <div className="card-premium shadow-soft-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-6">Student</th>
                  <th className="px-8 py-6">Property</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Date</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-all">
                    <td className="px-8 py-6">
                      <div className="font-bold text-foreground text-sm tracking-tight">{booking.student.name}</div>
                      <div className="text-xs text-muted-foreground font-medium">{booking.student.email}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-foreground text-sm tracking-tight">{booking.propertyUnit?.property?.name || 'Property'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`badge-tint flex items-center gap-1.5 w-fit ${
                        booking.status === 'APPROVED' ? 'badge-emerald' : 
                        booking.status === 'REJECTED' ? 'badge-red' : 'badge-orange'
                      }`}>
                        {booking.status === 'APPROVED' ? <CheckCircle2 size={12} /> : 
                         booking.status === 'REJECTED' ? <XCircle size={12} /> : <Clock size={12} />}
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-muted-foreground">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`/dashboard/landlord/bookings/${booking.id}`}
                          className="px-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all"
                        >
                          Details
                        </a>
                        <a 
                          href={`/dashboard/landlord/students/${booking.student?.id || booking.studentId}`}
                          className="px-4 py-2 bg-card text-foreground border border-border-subtle shadow-soft text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-primary hover:text-primary transition-all"
                        >
                          Profile
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
