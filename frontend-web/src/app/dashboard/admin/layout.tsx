'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  TrendingUp, 
  Settings, 
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Banknote,
  Megaphone,
  CalendarCheck,
  Search,
  LifeBuoy
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { NotificationBell } from '@/components/shared/NotificationBell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      
      if (!storedUser || !token) {
        router.push('/auth/admin');
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'ADMIN') {
        // Redirect non-admins to their respective dashboards
        const role = parsedUser.role;
        if (role === 'LANDLORD') router.push('/dashboard/landlord');
        else if (role === 'STUDENT') router.push('/dashboard/student');
        else router.push('/');
        return;
      }

      setUser(parsedUser);
      setIsCheckingAuth(false);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth/admin';
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image 
              src="/images/logo_full.svg" 
              alt="Kibabii Nest Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <div className="text-2xl font-black text-primary tracking-tighter">Kibabii Nest</div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
          <Loader2 className="animate-spin" size={18} />
          Securing session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 font-sans flex transition-all duration-300">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-24' : 'w-72'} sidebar-bg flex flex-col p-6 sticky top-0 h-screen z-50 transition-all duration-300 border-r border-border-subtle shadow-sm`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-50 border-2 border-sidebar-bg"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={() => router.push('/')}>
          <div className="relative w-10 h-10 shrink-0 group-hover:scale-105 transition-transform">
            <Image 
              src="/images/logo_full.svg" 
              alt="Kibabii Nest Logo" 
              fill 
              className="object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="text-xl font-black text-foreground dark:text-white tracking-tighter truncate animate-in fade-in slide-in-from-left-2 duration-300">
              Kibabii Nest <span className="text-primary italic block text-[10px] -mt-1 uppercase tracking-widest font-black opacity-80">Admin Portal</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
          <AdminNavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            href="/dashboard/admin"
            active={pathname === '/dashboard/admin'} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<Building2 size={20} />} 
            label="Properties" 
            href="/dashboard/admin/properties"
            active={pathname.includes('/properties')} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<ShieldCheck size={20} />} 
            label="KYC Verifications" 
            href="/dashboard/admin/kyc"
            active={pathname.includes('/kyc')} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<CalendarCheck size={20} />} 
            label="Bookings" 
            href="/dashboard/admin/bookings"
            active={pathname.includes('/bookings')} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<Banknote size={20} />} 
            label="Finance Overwatch" 
            href="/dashboard/admin/finance"
            active={pathname.includes('/finance')} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<Megaphone size={20} />} 
            label="Announcements" 
            href="/dashboard/admin/announcements"
            active={pathname.includes('/announcements')} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<Users size={20} />} 
            label="User Management" 
            href="/dashboard/admin/users"
            active={pathname.includes('/users')} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<TrendingUp size={20} />} 
            label="Analytics" 
            href="/dashboard/admin/analytics"
            active={pathname.includes('/analytics')} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<Banknote size={20} />} 
            label="Marketplace" 
            href="/dashboard/admin/marketplace"
            active={pathname.includes('/marketplace')} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<Settings size={20} />} 
            label="System Settings" 
            href="/dashboard/admin/settings"
            active={pathname.includes('/settings')} 
            isCollapsed={isCollapsed}
          />
          <AdminNavItem 
            icon={<LifeBuoy size={20} />} 
            label="Support Inbox" 
            href="/dashboard/admin/support"
            active={pathname.includes('/support')} 
            isCollapsed={isCollapsed}
          />
        </nav>

        <button 
          onClick={handleLogout}
          className={`flex items-center gap-4 p-4 text-muted-foreground font-bold hover:text-red-400 transition-colors mt-auto ${isCollapsed ? 'justify-center p-2' : ''}`}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Sign Out</span>}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        {/* Top Header */}
        <header className="h-20 bg-card border-b border-border px-12 flex justify-between items-center sticky top-0 z-40 shrink-0">
           <div className="relative w-96 hidden md:block">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
             <input 
               type="text" 
               placeholder="Search properties, landlords..." 
               className="w-full pl-12 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 text-foreground"
             />
           </div>
           <div className="flex items-center gap-6 ml-auto">
              <NotificationBell />
              
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-4 pl-6 border-l border-border hover:opacity-80 transition-all outline-none"
                >
                  <div className="text-right hidden sm:block mr-2">
                    <div className="text-[13px] font-black text-foreground tracking-tight leading-tight">{user?.name || 'Kibabii Nest Admin'}</div>
                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{user?.role === 'ADMIN' ? 'Platform Overseer' : 'Admin'}</div>
                  </div>
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-foreground font-black text-xs border border-border shadow-sm overflow-hidden transition-transform active:scale-95">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Admin Avatar" className="w-full h-full object-cover" />
                    ) : (
                      'AD'
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-3 w-56 bg-popover rounded-3xl shadow-soft-lg border border-border p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
                      <div className="p-4 border-b border-border mb-1">
                        <div className="text-xs font-black text-foreground tracking-tight">{user?.name || 'Admin'}</div>
                        <div className="text-[10px] text-muted-foreground font-medium truncate">{user?.email || 'admin@kibabiinest.com'}</div>
                      </div>
                      <a href="/dashboard/admin/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-2xl transition-all">
                        <Settings size={18} />
                        <span>Profile Settings</span>
                      </a>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function AdminNavItem({ icon, label, href, active = false, count, isCollapsed }: { icon: React.ReactNode, label: string, href: string, active?: boolean, count?: number, isCollapsed?: boolean }) {
  const router = useRouter();
  
  return (
    <div 
      onClick={() => router.push(href)}
      title={isCollapsed ? label : ''}
      className={`flex items-center p-4 rounded-2xl cursor-pointer transition-all ${
        active 
        ? 'bg-primary text-white brand-shadow font-black' 
        : 'sidebar-text font-bold hover:bg-muted/50 hover:text-foreground'
      } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
    >
      <div className="flex items-center gap-4">
        <span className={isCollapsed ? 'scale-110' : ''}>{icon}</span>
        {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-1 duration-300 whitespace-nowrap">{label}</span>}
      </div>
      {count && !isCollapsed && (
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
          {count}
        </span>
      )}
    </div>
  );
}
