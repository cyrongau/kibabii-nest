'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Loader2,
  FileText,
  BadgeCheck,
  Calendar,
  History
} from 'lucide-react';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/users/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setStudent(data);
      } catch (error) {
        console.error('Error fetching student:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="animate-spin mb-4 text-primary" size={32} />
        <span className="font-bold uppercase tracking-widest text-[10px]">Loading profile...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-12 text-center bg-background min-h-screen">
        <h2 className="text-xl font-bold text-foreground">Student not found</h2>
        <button onClick={() => router.back()} className="mt-4 text-primary font-bold">Go Back</button>
      </div>
    );
  }

  const identity = student.studentIdentity;

  return (
    <main className="p-8 lg:p-12 max-w-4xl mx-auto">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <div className="space-y-8">
        {/* Profile Header */}
        <section className="bg-card p-10 rounded-[3rem] border border-border-subtle shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-32 h-32 bg-foreground rounded-[2.5rem] flex items-center justify-center text-background text-5xl font-black border-8 border-card shadow-xl overflow-hidden">
              {student.avatar ? (
                <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                student.name.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-4xl font-black text-foreground tracking-tight">{student.name}</h2>
                {identity?.verified && (
                  <BadgeCheck className="text-blue-500" size={32} />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                 <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                   <Mail size={16} className="text-muted-foreground/30" /> {student.email}
                 </span>
                 <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                   <Phone size={16} className="text-muted-foreground/30" /> {student.phone || 'No phone number'}
                 </span>
              </div>
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-4 py-1.5 bg-muted text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest">
                   Student Member
                </span>
                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest">
                   Joined {new Date(student.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Identity & KYC Verification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              Verification Status
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${identity?.verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    <User size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Identity Check</div>
                    <div className="text-sm font-black text-foreground">{identity?.verified ? 'Verified' : 'Pending Verification'}</div>
                  </div>
                </div>
                {identity?.verified && <BadgeCheck className="text-emerald-500" size={24} />}
              </div>

              {identity && (
                <div className="space-y-4">
                  <InfoRow label="Full Name" value={identity.fullName || 'N/A'} />
                  <InfoRow label="ID / Passport No." value={identity.idNumber || 'N/A'} />
                  <InfoRow label="Registration No." value={identity.universityRegNo || 'N/A'} />
                  <InfoRow label="Date of Birth" value={identity.dateOfBirth || 'N/A'} />
                  <InfoRow label="Document Type" value={identity.documentType?.replace('_', ' ') || 'N/A'} />
                </div>
              )}
            </div>
          </section>

          <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
              <History size={20} className="text-primary" />
              Activity Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
               <StatCard label="Bookings" value={student._count?.bookings || 0} />
               <StatCard label="Tenancies" value={student._count?.tenancies || 0} />
               <StatCard label="Reviews" value={student._count?.reviews || 0} />
               <StatCard label="Requests" value={student._count?.serviceRequests || 0} />
            </div>

            <div className="mt-8 p-6 bg-muted/20 rounded-3xl border border-border-subtle">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-muted-foreground/30" size={20} />
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Document Evidence</span>
              </div>
              {identity?.documentUrl ? (
                <a 
                  href={identity.documentUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-card border border-border-subtle rounded-2xl text-xs font-black text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  View Scanned ID
                </a>
              ) : (
                <p className="text-[10px] font-bold text-muted-foreground/40 text-center py-2 italic">No document evidence uploaded yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border-subtle last:border-0">
      <span className="text-xs font-bold text-muted-foreground/60">{label}</span>
      <span className="text-xs font-black text-foreground">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-muted/20 p-4 rounded-2xl border border-border-subtle flex flex-col items-center justify-center">
       <div className="text-2xl font-black text-foreground">{value}</div>
       <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}
