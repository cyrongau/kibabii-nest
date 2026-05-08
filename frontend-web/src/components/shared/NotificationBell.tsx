'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { showToast } = useNotifications();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3000/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch (error) {
      // Quietly fail to prevent Next.js error overlays during polling
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:3000/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      // Quietly fail
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:3000/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        showToast('All notifications marked as read', 'success');
      }
    } catch (error) {
      // Quietly fail
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-muted-foreground hover:text-primary border border-border card-shadow transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 border-2 border-card rounded-full flex items-center justify-center text-[8px] font-black text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[40]" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-96 bg-popover rounded-3xl shadow-soft-lg border border-border z-[50] overflow-hidden backdrop-blur-xl"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground">Notifications</h3>
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground/30 mx-auto mb-4">
                      <Bell size={32} />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id}
                        onClick={() => {
                          if ((notification as any).link) {
                            router.push((notification as any).link);
                            setIsOpen(false);
                          }
                          if (!notification.isRead) {
                            markAsRead(notification.id);
                          }
                        }}
                        className={`p-6 transition-all cursor-pointer hover:bg-muted/50 flex gap-4 ${!notification.isRead ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          notification.type === 'booking' ? 'bg-emerald-500/10 text-emerald-500' :
                          notification.type === 'message' ? 'bg-primary/10 text-primary' :
                          'bg-orange-500/10 text-orange-500'
                        }`}>
                          {notification.type === 'booking' ? <Check size={20} /> : <Circle size={10} fill="currentColor" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-foreground mb-1">{notification.title}</div>
                          <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">{notification.message}</p>
                          <div className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tight">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {!notification.isRead && (
                          <div className="shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted text-center border-t border-border">
                <button className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
                  View All Activity
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
