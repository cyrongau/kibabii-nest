'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';

interface EditUserPageProps {
  params: { id: string };
}

export default function EditAdminUserPage({ params }: EditUserPageProps) {
  const { showToast } = useNotifications();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/auth/admin');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/users/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.clear();
            router.push('/auth/admin');
            return;
          }
          throw new Error('Failed to load user');
        }

        const data = await response.json();
        setUser(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
      } catch (error) {
        showToast('Unable to load user details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id, router, showToast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/admin');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/users/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, phone }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to save user details');
      }

      showToast('Landlord details updated successfully', 'success');
      router.push('/dashboard/admin/users');
    } catch (error: any) {
      showToast(error.message || 'Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-slate-500">Loading landlord details...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto rounded-3xl border border-border-subtle bg-card p-10 text-center">
          <h1 className="text-2xl font-black text-foreground mb-4">Landlord not found</h1>
          <p className="text-sm text-muted-foreground mb-6">The requested landlord could not be loaded. Please return to the user registry and try again.</p>
          <Link href="/dashboard/admin/users" className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-primary text-white font-bold">Return to Users</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8 lg:p-12 max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row justify-between gap-6 items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Edit Landlord Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">Update the landlord&apos;s basic contact details and keep the registry accurate.</p>
        </div>
        <Link href="/dashboard/admin/users" className="inline-flex items-center justify-center rounded-2xl border border-border-subtle bg-card px-6 py-3 text-sm font-bold text-foreground hover:bg-muted transition">Back to Users</Link>
      </div>

      <div className="rounded-[2.5rem] border border-border-subtle bg-card p-10 shadow-soft-xl">
        <div className="grid gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-border-subtle bg-background px-5 py-4 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-border-subtle bg-background px-5 py-4 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-border-subtle bg-background px-5 py-4 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Role</label>
            <div className="rounded-2xl border border-border-subtle bg-background px-5 py-4 text-sm text-foreground">{user.role}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-7 py-4 text-sm font-black text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/dashboard/admin/users" className="inline-flex items-center justify-center rounded-2xl border border-border-subtle bg-card px-7 py-4 text-sm font-black text-foreground transition hover:bg-muted">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
