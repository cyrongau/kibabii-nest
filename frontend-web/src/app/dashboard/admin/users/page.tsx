'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  Ban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  ShieldX,
  Home
} from 'lucide-react';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import { useNotifications } from '@/context/NotificationContext';

export default function AdminUsersPage() {
  const { showToast } = useNotifications();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Selected User for Modal
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Confirmation Modal State
  const [confirmationConfig, setConfirmationConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'danger',
    onConfirm: () => {},
  });
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.append('search', search);
      if (roleFilter) queryParams.append('role', roleFilter);

      const response = await fetch(`http://localhost:3000/users?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      
      setUsers(data.users);
      setTotalUsers(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSuspend = (userId: string, isCurrentlySuspended: boolean, name: string) => {
    const action = isCurrentlySuspended ? 'activate' : 'suspend';
    setConfirmationConfig({
      isOpen: true,
      title: `${isCurrentlySuspended ? 'Activate' : 'Suspend'} User Account`,
      message: `Are you sure you want to ${action} ${name}'s account? ${isCurrentlySuspended ? 'They will regain access to the platform.' : 'They will be immediately logged out and blocked from accessing their account.'}`,
      confirmText: `${isCurrentlySuspended ? 'Activate' : 'Suspend'} User`,
      type: isCurrentlySuspended ? 'info' : 'warning',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          const response = await fetch(`http://localhost:3000/users/${userId}/${action}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
          });
          
          if (!response.ok) throw new Error(`Failed to ${action} user`);
          
          showToast(`User account ${action}d successfully`, 'success');
          fetchUsers();
          if (selectedUser && selectedUser.id === userId) {
            setSelectedUser({ ...selectedUser, isSuspended: !isCurrentlySuspended });
          }
        } catch (error) {
          showToast('Action failed', 'error');
        } finally {
          setIsActionLoading(false);
          setOpenMenuId(null);
          setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteUser = (userId: string, name: string) => {
    setConfirmationConfig({
      isOpen: true,
      title: 'Delete User Permanently',
      message: `Are you sure you want to permanently delete ${name}? This action cannot be undone and will remove all associated data.`,
      confirmText: 'Delete User',
      type: 'danger',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          const response = await fetch(`http://localhost:3000/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
          });
          
          if (!response.ok) throw new Error('Failed to delete user');
          
          showToast('User deleted successfully', 'success');
          fetchUsers();
        } catch (error) {
          showToast('Deletion failed', 'error');
        } finally {
          setIsActionLoading(false);
          setOpenMenuId(null);
          setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleVerifyLandlord = (userId: string, isCurrentlyVerified: boolean, name: string) => {
    setConfirmationConfig({
      isOpen: true,
      title: `${isCurrentlyVerified ? 'Unverify' : 'Verify'} Landlord`,
      message: `Are you sure you want to ${isCurrentlyVerified ? 'revoke verification for' : 'manually verify'} ${name}?`,
      confirmText: isCurrentlyVerified ? 'Unverify' : 'Verify',
      type: isCurrentlyVerified ? 'warning' : 'info',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          const response = await fetch(`http://localhost:3000/users/${userId}/verify-landlord`, {
            method: 'PATCH',
            headers: { 
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ verified: !isCurrentlyVerified })
          });
          
          if (!response.ok) throw new Error('Failed to verify landlord');
          
          showToast(`Landlord ${!isCurrentlyVerified ? 'verified' : 'unverified'} successfully`, 'success');
          fetchUsers();
        } catch (error) {
          showToast('Verification failed', 'error');
        } finally {
          setIsActionLoading(false);
          setOpenMenuId(null);
          setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const openUserDetails = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch user details');
      const data = await response.json();
      setSelectedUser(data);
      setIsModalOpen(true);
    } catch (error) {
      showToast('Failed to load user details', 'error');
    } finally {
      setIsLoading(false);
      setOpenMenuId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'badge-purple';
      case 'LANDLORD': return 'badge-emerald';
      case 'STUDENT': return 'badge-blue';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tighter">User Intelligence Terminal</h1>
          <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed text-sm lg:text-base">Strategic management of students, property owners, and administrative nodes.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-card/50 backdrop-blur-md px-8 py-4 rounded-[1.75rem] border border-border-subtle shadow-soft-xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-12 -translate-y-12 blur-2xl pointer-events-none"></div>
            <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1 relative z-10">Database Volume</div>
            <div className="text-2xl font-black text-foreground tracking-tighter relative z-10">
              <span className="text-primary">{totalUsers.toLocaleString()}</span> Entities
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="card-premium p-8 lg:p-10 shadow-soft-xl flex flex-wrap gap-8 items-center border-border-subtle relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-8 flex-1 w-full relative z-10">
          <div className="relative flex-1 w-full sm:max-w-md group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Search registry by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-muted/20 border border-transparent focus:border-primary/20 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] focus:outline-none focus:ring-4 focus:ring-primary/5 text-foreground placeholder:text-muted-foreground/20 transition-all shadow-soft-sm"
            />
          </div>
          <div className="relative w-full sm:w-72 group">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={22} />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-16 pr-12 py-5 bg-muted/20 border border-transparent focus:border-primary/20 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] appearance-none focus:outline-none focus:ring-4 focus:ring-primary/5 text-foreground transition-all cursor-pointer shadow-soft-sm"
            >
              <option value="">Global Roles</option>
              <option value="STUDENT">Student Matrix</option>
              <option value="LANDLORD">Entity Owners</option>
              <option value="ADMIN">Command Nodes</option>
            </select>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none rotate-90" size={18} />
          </div>
        </div>
      </section>

      {/* Users Table */}
      <section className="card-premium shadow-soft-2xl min-h-[500px] overflow-hidden border-border-subtle relative bg-card/30 backdrop-blur-md">
        {isLoading && !isModalOpen ? (
          <div className="flex flex-col items-center justify-center p-40 gap-8 text-muted-foreground/40 font-black">
            <Loader2 className="animate-spin text-primary" size={64} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Synchronizing user mainframe...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-40 text-center animate-in fade-in duration-700">
            <div className="w-28 h-28 bg-muted/40 rounded-[2.75rem] flex items-center justify-center mb-10 shadow-inner group">
              <Users size={56} className="text-muted-foreground/10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-foreground tracking-tighter">Null Search Results</h3>
              <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">No administrative records match the specified search parameters in current sector.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground/60">
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Entity Identity</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Security Clearance</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Protocol Status</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">Onboarding Log</th>
                  <th className="px-10 py-7 text-[10px] font-black uppercase tracking-widest border-b border-border-subtle text-right">Moderation Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-all duration-300 group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-muted rounded-[1.25rem] flex items-center justify-center text-muted-foreground/40 font-black overflow-hidden border-2 border-background shadow-soft-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative">
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name[0]}
                        </div>
                        <div>
                          <div className="font-black text-foreground text-base tracking-tight group-hover:text-primary transition-colors">{user.name}</div>
                          <div className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest mt-1">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-soft-sm badge-tint ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                        {user.role === 'LANDLORD' && (
                          <div className="shrink-0 transition-all duration-500 group-hover:scale-125">
                            {user.isVerifiedLandlord ? <ShieldCheck size={20} className="text-emerald-500 shadow-glow" /> : <AlertCircle size={20} className="text-orange-500" />}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      {user.isSuspended ? (
                        <span className="badge-tint badge-red flex items-center gap-2.5 w-max px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-soft-sm border border-red-500/10">
                          <Ban size={16} className="animate-pulse" /> Blacklisted Node
                        </span>
                      ) : (
                        <span className="badge-tint badge-emerald flex items-center gap-2.5 w-max px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-soft-sm border border-emerald-500/10">
                          <CheckCircle2 size={16} /> Verified Operational
                        </span>
                      )}
                    </td>
                    <td className="px-10 py-7 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button 
                          onClick={() => openUserDetails(user.id)}
                          className="p-4 text-muted-foreground/20 hover:text-primary hover:bg-primary/5 rounded-[1.25rem] transition-all shadow-soft-sm border border-transparent hover:border-primary/10"
                          title="View Intelligence"
                        >
                          <Eye size={22} />
                        </button>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className={`p-4 rounded-[1.25rem] transition-all shadow-soft-sm ${openMenuId === user.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-110' : 'text-muted-foreground/20 hover:bg-muted hover:text-foreground border border-transparent hover:border-border-subtle'}`}
                          >
                            <MoreVertical size={22} />
                          </button>

                          {openMenuId === user.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 mt-4 w-64 bg-popover/80 backdrop-blur-2xl rounded-[2rem] shadow-soft-2xl border border-border-subtle py-4 z-50 animate-in fade-in zoom-in-95 duration-300 text-left overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 -translate-y-16 blur-2xl pointer-events-none"></div>
                                
                                {user.role !== 'ADMIN' && (
                                  <button 
                                    onClick={() => handleToggleSuspend(user.id, user.isSuspended, user.name)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 ${user.isSuspended ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-red-500 hover:bg-red-500/10'}`}
                                  >
                                    {user.isSuspended ? <CheckCircle2 size={18} /> : <Ban size={18} />}
                                    {user.isSuspended ? 'Activate Node' : 'Blacklist Node'}
                                  </button>
                                )}
                                
                                {user.role === 'LANDLORD' && (
                                  <>
                                    <button 
                                      onClick={() => handleVerifyLandlord(user.id, user.isVerifiedLandlord, user.name)}
                                      className={`w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 ${user.isVerifiedLandlord ? 'text-orange-500 hover:bg-orange-500/10' : 'text-primary hover:bg-primary/10'}`}
                                    >
                                      {user.isVerifiedLandlord ? <ShieldX size={18} /> : <ShieldCheck size={18} />}
                                      {user.isVerifiedLandlord ? 'Revoke Status' : 'Grant Verified'}
                                    </button>
                                    
                                    <Link 
                                      href={`/dashboard/admin/properties?landlordId=${user.id}`}
                                      className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-all relative z-10"
                                    >
                                      <Home size={18} />
                                      Assets Log
                                    </Link>
                                  </>
                                )}

                                <button 
                                  onClick={() => {
                                    const newPassword = prompt(`Enter new password for ${user.name}:`);
                                    if (newPassword) {
                                      showToast('Reset pulse sent', 'info');
                                    }
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-all relative z-10"
                                >
                                  <AlertCircle size={18} />
                                  Reset Cipher
                                </button>

                                <div className="h-px bg-border-subtle my-3 mx-6 relative z-10" />
                                
                                {user.role !== 'ADMIN' && (
                                  <button 
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500 hover:text-white transition-all relative z-10"
                                  >
                                    <Trash2 size={18} />
                                    Purge Entity
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-border-subtle p-10 flex flex-col sm:flex-row justify-between items-center bg-muted/10 backdrop-blur-xl gap-8">
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em]">
              Intelligence Matrix Page <span className="text-primary">{page}</span> / <span className="text-foreground">{totalPages}</span>
            </span>
            <div className="flex gap-6">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-4.5 rounded-[1.25rem] border border-border-subtle bg-card text-muted-foreground/40 hover:bg-muted hover:text-foreground disabled:opacity-10 transition-all shadow-soft-sm group"
              >
                <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-4.5 rounded-[1.25rem] border border-border-subtle bg-card text-muted-foreground/40 hover:bg-muted hover:text-foreground disabled:opacity-10 transition-all shadow-soft-sm group"
              >
                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/40 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card/80 backdrop-blur-md border border-border-subtle rounded-[4rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-soft-2xl animate-in zoom-in-95 duration-500 relative">
            <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-primary/5 rounded-full translate-x-16 -translate-y-16 blur-[8rem] pointer-events-none"></div>

            <div className="p-12 border-b border-border-subtle flex justify-between items-center bg-muted/10 relative z-10">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-primary/10 rounded-[1.75rem] flex items-center justify-center text-primary shadow-soft-sm relative overflow-hidden group/icon">
                  <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                  <Users size={40} className="relative z-10" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">Entity Intelligence</h2>
                  <span className={`mt-2 inline-block px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-soft-sm badge-tint ${getRoleBadgeColor(selectedUser.role)}`}>
                    {selectedUser.role} Protocol
                  </span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-6 text-muted-foreground/40 hover:text-foreground hover:bg-muted rounded-[1.5rem] transition-all shadow-soft-sm group">
                <XCircle size={28} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            
            <div className="p-12 overflow-y-auto space-y-12 flex-1 scrollbar-hide relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-10">
                <div className="w-32 h-32 bg-muted rounded-[3rem] flex items-center justify-center text-muted-foreground/20 font-black text-4xl overflow-hidden border-4 border-background shadow-soft-xl group/avatar relative">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-1000"></div>
                  {selectedUser.avatar ? <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-1000" /> : selectedUser.name[0]}
                </div>
                <div className="space-y-3 pt-2">
                  <h3 className="text-4xl font-black text-foreground tracking-tighter leading-none">{selectedUser.name}</h3>
                  <p className="text-muted-foreground/60 font-black text-sm uppercase tracking-widest">{selectedUser.email}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-glow"></div>
                    <p className="text-primary font-black text-[11px] tracking-[0.25em] uppercase">{selectedUser.phone || 'COMMS OFFLINE'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="p-8 bg-card p-10 rounded-[2.5rem] border border-border-subtle shadow-soft-xl relative overflow-hidden group/stat">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full translate-x-8 -translate-y-8 blur-xl pointer-events-none transition-all group-hover/stat:bg-primary/10"></div>
                  <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.25em] mb-4 relative z-10">Live Node Status</div>
                  <div className={`font-black text-sm flex items-center gap-3 relative z-10 ${selectedUser.isSuspended ? 'text-red-500' : 'text-emerald-500'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shadow-glow ${selectedUser.isSuspended ? 'bg-red-500 shadow-glow-red' : 'bg-emerald-500 animate-pulse'}`}></div>
                    {selectedUser.isSuspended ? 'TERMINATED' : 'ACTIVE'}
                  </div>
                </div>
                <div className="p-8 bg-card p-10 rounded-[2.5rem] border border-border-subtle shadow-soft-xl relative overflow-hidden group/stat">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full translate-x-8 -translate-y-8 blur-xl pointer-events-none transition-all group-hover/stat:bg-blue-500/10"></div>
                  <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.25em] mb-4 relative z-10">Registry Date</div>
                  <div className="font-black text-foreground text-sm tracking-tighter relative z-10">{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</div>
                </div>
                {selectedUser.role === 'LANDLORD' ? (
                  <div className="p-8 bg-card p-10 rounded-[2.5rem] border border-border-subtle shadow-soft-xl relative overflow-hidden group/stat">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 blur-xl pointer-events-none transition-all group-hover/stat:bg-emerald-500/10"></div>
                    <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.25em] mb-4 relative z-10">Global Assets</div>
                    <div className="font-black text-foreground text-sm relative z-10">{selectedUser._count?.properties || 0} Entities</div>
                  </div>
                ) : (
                  <div className="p-8 bg-card p-10 rounded-[2.5rem] border border-border-subtle shadow-soft-xl relative overflow-hidden group/stat">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 blur-xl pointer-events-none transition-all group-hover/stat:bg-emerald-500/10"></div>
                    <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.25em] mb-4 relative z-10">Traffic Log</div>
                    <div className="font-black text-foreground text-sm relative z-10">{selectedUser._count?.bookings || 0} Protocols</div>
                  </div>
                )}
              </div>

              {/* Identity/KYC Sections */}
              {selectedUser.role === 'STUDENT' && selectedUser.studentIdentity && (
                <div className="bg-muted/20 rounded-[3.5rem] p-10 border border-border-subtle space-y-10 relative overflow-hidden group/kyc">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-32 -translate-y-32 blur-3xl pointer-events-none group-hover/kyc:bg-primary/10 transition-colors"></div>
                  
                  <h4 className="text-2xl font-black text-foreground tracking-tighter flex items-center gap-5 relative z-10">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-soft-sm">
                      <ShieldCheck size={24} />
                    </div>
                    Authenticated Credentials
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                    <div className="space-y-3">
                      <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.25em] ml-2">Registry Name</p>
                      <div className="font-black text-foreground text-sm bg-card/50 px-6 py-4.5 rounded-[1.25rem] border border-border-subtle group-hover/kyc:border-primary/20 transition-all">{selectedUser.studentIdentity.fullName || 'DATA NULL'}</div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.25em] ml-2">National Identity</p>
                      <div className="font-black text-foreground text-sm bg-card/50 px-6 py-4.5 rounded-[1.25rem] border border-border-subtle group-hover/kyc:border-primary/20 transition-all">{selectedUser.studentIdentity.idNumber || 'DATA NULL'}</div>
                    </div>
                    {selectedUser.studentIdentity.universityRegNo && (
                      <div className="md:col-span-2 space-y-3">
                        <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.25em] ml-2">Academic Registration Node</p>
                        <div className="font-black text-primary text-sm bg-primary/5 px-6 py-4.5 rounded-[1.25rem] border border-primary/10 group-hover/kyc:border-primary/30 transition-all tracking-widest uppercase">{selectedUser.studentIdentity.universityRegNo}</div>
                      </div>
                    )}
                  </div>
                  {selectedUser.studentIdentity.documentUrl && (
                    <div className="mt-4 rounded-[2.5rem] overflow-hidden border border-border-subtle shadow-soft-xl group/img relative">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-1000"></div>
                      <img src={selectedUser.studentIdentity.documentUrl} alt="Identity Scan" className="w-full h-80 object-cover group-hover/img:scale-105 transition-transform duration-1000" />
                    </div>
                  )}
                </div>
              )}

              {selectedUser.role === 'LANDLORD' && selectedUser.kyc && (
                <div className="bg-muted/20 rounded-[3.5rem] p-10 border border-border-subtle space-y-10 relative overflow-hidden group/kyc">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full translate-x-32 -translate-y-32 blur-3xl pointer-events-none group-hover/kyc:bg-emerald-500/10 transition-colors"></div>
                  
                  <h4 className="text-2xl font-black text-foreground tracking-tighter flex items-center gap-5 relative z-10">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-soft-sm">
                      <ShieldCheck size={24} />
                    </div>
                    Compliance Protocols
                  </h4>
                  <div className="flex items-center justify-between bg-card/50 px-8 py-6 rounded-[2rem] border border-border-subtle shadow-soft-xl group-hover/kyc:border-emerald-500/20 transition-all relative z-10">
                    <span className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Affirmation Status</span>
                    <span className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] shadow-soft-sm badge-tint ${
                      selectedUser.kyc.status === 'APPROVED' ? 'badge-emerald' :
                      selectedUser.kyc.status === 'REJECTED' ? 'badge-red' :
                      'badge-orange'
                    }`}>
                      {selectedUser.kyc.status}
                    </span>
                  </div>
                  <Link 
                    href={`/dashboard/admin/kyc?userId=${selectedUser.id}`} 
                    className="flex items-center justify-center gap-4 w-full py-6 bg-primary text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10 group/btn brand-shadow"
                  >
                    Deploy Intelligence Manager <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>

            <div className="p-10 border-t border-border-subtle bg-muted/10 backdrop-blur-xl flex flex-col sm:flex-row justify-end gap-6 relative z-10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-10 py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all"
              >
                Exit Session
              </button>
              <button 
                onClick={() => handleToggleSuspend(selectedUser.id, selectedUser.isSuspended, selectedUser.name)}
                disabled={isActionLoading}
                className={`px-12 py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.3em] text-white flex items-center justify-center gap-4 transition-all shadow-2xl group ${
                  selectedUser.isSuspended ? 'bg-emerald-500 shadow-emerald-500/20 hover:scale-[1.05]' : 'bg-red-500 shadow-red-500/20 hover:scale-[1.05]'
                }`}
              >
                {isActionLoading ? <Loader2 size={20} className="animate-spin" /> : null}
                {selectedUser.isSuspended ? <CheckCircle2 size={22} className="group-hover:rotate-12 transition-transform" /> : <Ban size={22} className="group-hover:rotate-12 transition-transform" />}
                {selectedUser.isSuspended ? 'Protocol Activation' : 'Node Blacklist'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationConfig.isOpen}
        onClose={() => setConfirmationConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationConfig.onConfirm}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        confirmText={confirmationConfig.confirmText}
        type={confirmationConfig.type}
        isLoading={isActionLoading}
      />
    </div>
  );
}
