'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Home, 
  CalendarCheck, 
  MessageSquare, 
  Settings, 
  LogOut,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Users,
  Megaphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import KycModal from './KycModal';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { NotificationBell } from '@/components/shared/NotificationBell';

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      
      if (!storedUser || !token) {
        window.location.href = '/auth/landlord';
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'LANDLORD') {
        // Redirect non-landlords to their respective dashboards
        const role = parsedUser.role;
        if (role === 'ADMIN') window.location.href = '/dashboard/admin';
        else if (role === 'STUDENT') window.location.href = '/dashboard/student';
        else window.location.href = '/';
        return;
      }

      // Fetch fresh user data to ensure verification status is up to date
      try {
        const userResponse = await fetch(`http://localhost:3000/users/${parsedUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userResponse.ok) {
          const freshUser = await userResponse.json();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } else {
          setUser(parsedUser);
        }
      } catch (e) {
        setUser(parsedUser);
      }

      setIsCheckingAuth(false);
      
      // Fetch stats once authenticated
      try {
        const response = await fetch('http://localhost:3000/properties/stats/landlord', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setPendingCount(data.pendingRequestsCount || 0);
        }
      } catch (error) {
        console.error('Error fetching sidebar stats:', error);
      }
    };

    checkAuth();
    // Refresh stats and user data every 30 seconds
    const interval = setInterval(async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const [statsRes, userRes] = await Promise.all([
            fetch('http://localhost:3000/properties/stats/landlord', {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`http://localhost:3000/users/${parsed.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);
          
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setPendingCount(statsData.pendingRequestsCount || 0);
          }
          if (userRes.ok) {
            const freshUser = await userRes.json();
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (e) {}
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth/landlord';
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
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
        <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm">
          <Loader2 className="animate-spin" size={18} />
          Securing session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex font-sans transition-all duration-300">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-24' : 'w-72'} sidebar-bg border-r border-border-subtle hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 z-50 shadow-sm`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-50 border-2 border-sidebar-bg"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.href = '/'}>
            <div className="relative w-10 h-10 shrink-0 group-hover:scale-105 transition-transform">
              <Image 
                src="/images/logo_full.svg" 
                alt="Kibabii Nest Logo" 
                fill 
                className="object-contain"
              />
            </div>
            {!isCollapsed && (
              <span className="text-2xl font-black text-foreground tracking-tight animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">Kibabii Nest</span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            href="/dashboard/landlord" 
            active={pathname === '/dashboard/landlord'} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<Home size={20} />} 
            label="My Properties" 
            href="/dashboard/landlord/properties" 
            active={pathname === '/dashboard/landlord/properties'} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<CalendarCheck size={20} />} 
            label="Bookings" 
            href="/dashboard/landlord/bookings" 
            badge={pendingCount > 0 ? pendingCount.toString() : undefined} 
            active={pathname === '/dashboard/landlord/bookings'} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="My Tenants" 
            href="/dashboard/landlord/tenants" 
            active={pathname === '/dashboard/landlord/tenants'} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<DollarSign size={20} />} 
            label="Finance" 
            href="/dashboard/landlord/finance" 
            active={pathname === '/dashboard/landlord/finance'} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<MessageSquare size={20} />} 
            label="Messages" 
            href="/dashboard/landlord/messages" 
            active={pathname === '/dashboard/landlord/messages'} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<Megaphone size={20} />} 
            label="Broadcasts" 
            href="/dashboard/landlord/notices" 
            active={pathname === '/dashboard/landlord/notices'} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            href="/dashboard/landlord/settings" 
            active={pathname === '/dashboard/landlord/settings'} 
            isCollapsed={isCollapsed}
          />
        </nav>

        <div className={`p-6 border-t border-border-subtle ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-2xl transition-all duration-200 group text-left">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300 font-bold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-card border-b border-border flex items-center justify-end px-8 gap-6 sticky top-0 z-[100]">
           <NotificationBell />
           
           <div className="relative">
             <button 
               onClick={() => setShowDropdown(!showDropdown)}
               className="flex items-center gap-4 pl-6 border-l border-border hover:opacity-80 transition-all outline-none"
             >
               <div className="text-right hidden sm:block mr-2">
                 <div className="text-[13px] font-black text-foreground tracking-tight flex items-center gap-2 justify-end leading-tight">
                   {user?.name}
                   {user?.isVerifiedLandlord && (
                     <ShieldCheck size={14} className="text-emerald-500 fill-emerald-50" />
                   )}
                 </div>
                 <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 justify-end mt-0.5">
                   {user?.role} 
                   {user?.isVerifiedLandlord && (
                     <span className="text-emerald-500">· VERIFIED</span>
                   )}
                 </div>
               </div>
               <div className="w-10 h-10 bg-muted rounded-xl overflow-hidden border-2 border-background shadow-sm transition-transform active:scale-95 relative">
                 {user?.avatar ? (
                   <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                 ) : (
                   <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} alt="User" />
                 )}
                 {user?.isVerifiedLandlord && (
                   <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 shadow-sm">
                     <ShieldCheck size={10} className="text-emerald-500 fill-card" />
                   </div>
                 )}
               </div>
             </button>
             
             {/* Dropdown Menu */}
             {showDropdown && (
               <>
                 <div className="fixed inset-0 z-[90]" onClick={() => setShowDropdown(false)} />
                 <div className="absolute right-0 mt-3 w-56 bg-popover rounded-3xl shadow-soft-lg border border-border p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
                    <div className="p-4 border-b border-border mb-1">
                      <div className="text-xs font-black text-foreground tracking-tight">{user?.name}</div>
                      <div className="text-[10px] text-muted-foreground font-medium truncate">{user?.email}</div>
                    </div>
                    <a href="/dashboard/landlord/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-primary rounded-2xl transition-all">
                      <Settings size={18} />
                      <span>Account Settings</span>
                    </a>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-2xl transition-all">
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                 </div>
               </>
             )}
           </div>
        </header>

        {user?.role === 'LANDLORD' && !user?.isVerifiedLandlord && (
          <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 text-amber-700">
              <ShieldAlert size={20} />
              <span className="text-sm font-semibold">Your account is pending verification. You cannot post properties yet.</span>
            </div>
            <button 
              onClick={() => setShowKycModal(true)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
            >
              Complete Verification
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
      
      {showKycModal && <KycModal onClose={() => setShowKycModal(false)} />}
    </div>
  );
}

function NavItem({ icon, label, href = "#", active = false, badge, isCollapsed }: { icon: React.ReactNode, label: string, href?: string, active?: boolean, badge?: string, isCollapsed?: boolean }) {
  return (
    <a 
      href={href} 
      title={isCollapsed ? label : ''}
      className={`flex items-center rounded-2xl text-sm font-bold transition-all duration-200 group px-4 py-3.5 ${
        active 
        ? 'bg-primary text-white brand-shadow' 
        : 'sidebar-text hover:bg-muted hover:text-primary'
      } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`${active ? 'text-white' : 'text-muted-foreground/60 group-hover:text-primary'} transition-colors shrink-0 ${isCollapsed ? 'scale-110' : ''}`}>
          {icon}
        </span>
        {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-1 duration-300 whitespace-nowrap">{label}</span>}
      </div>
      {badge && !isCollapsed && (
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
        }`}>
          {badge}
        </span>
      )}
    </a>
  );
}
