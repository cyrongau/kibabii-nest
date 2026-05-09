'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  XCircle, 
  X,
  Bell
} from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface AlertOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'danger' | 'warning' | 'error';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  showToast: (message: string, type?: ToastType) => void;
  showAlert: (options: AlertOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlert(options);
  }, []);

  const closeAlert = () => setAlert(null);

  return (
    <NotificationContext.Provider value={{ showToast, showAlert }}>
      {children}

      {/* Toasts Container */}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
          ))}
        </AnimatePresence>
      </div>

      {/* Global Alert Modal */}
      <AnimatePresence>
        {alert && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                  alert.type === 'danger' ? 'bg-red-50 text-red-500' :
                  alert.type === 'warning' ? 'bg-orange-50 text-orange-500' :
                  'bg-blue-50 text-primary'
                }`}>
                  {alert.type === 'danger' ? <XCircle size={32} /> :
                   alert.type === 'warning' ? <AlertCircle size={32} /> :
                   <Info size={32} />}
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{alert.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{alert.message}</p>
                
                <div className="flex gap-4 mt-10">
                  {alert.cancelText && (
                    <button 
                      onClick={() => { alert.onCancel?.(); closeAlert(); }}
                      className="flex-1 py-4 rounded-2xl text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                    >
                      {alert.cancelText}
                    </button>
                  )}
                  <button 
                    onClick={() => { alert.onConfirm?.(); closeAlert(); }}
                    className={`flex-1 py-4 rounded-2xl text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      alert.type === 'danger' ? 'bg-red-500 shadow-red-100' : 
                      alert.type === 'warning' ? 'bg-orange-500 shadow-orange-100' :
                      'bg-primary shadow-blue-100'
                    }`}
                  >
                    {alert.confirmText || 'Understand'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    warning: <AlertCircle className="text-orange-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-red-50 border-red-100',
    warning: 'bg-orange-50 border-orange-100',
    info: 'bg-blue-50 border-blue-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      className={`pointer-events-auto min-w-[320px] p-4 rounded-2xl border shadow-xl flex items-center gap-4 ${bgColors[toast.type]}`}
    >
      <div className="shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
        {icons[toast.type]}
      </div>
      <div className="flex-1 text-sm font-bold text-slate-900 leading-tight">
        {toast.message}
      </div>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-white/50 rounded-lg transition-all text-slate-400"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
