'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      
      if (!storedUser || !token) {
        router.push('/auth/login');
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'STUDENT') {
        const role = parsedUser.role;
        if (role === 'ADMIN') router.push('/dashboard/admin');
        else if (role === 'LANDLORD') router.push('/dashboard/landlord');
        else router.push('/');
        return;
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-400 font-bold text-sm font-sans">
        <Loader2 className="animate-spin" size={18} />
        Securing session...
      </div>
    );
  }

  return <>{children}</>;
}
