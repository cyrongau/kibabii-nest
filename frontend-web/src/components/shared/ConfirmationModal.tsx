'use client';

import React from 'react';
import { AlertCircle, X, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  type = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle className="text-red-600" size={32} />,
          bg: 'bg-red-50',
          button: 'bg-red-600 hover:bg-red-700 shadow-red-100',
          accent: 'border-red-100'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="text-orange-600" size={32} />,
          bg: 'bg-orange-50',
          button: 'bg-orange-600 hover:bg-orange-700 shadow-orange-100',
          accent: 'border-orange-100'
        };
      default:
        return {
          icon: <AlertCircle className="text-blue-600" size={32} />,
          bg: 'bg-blue-50',
          button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
          accent: 'border-blue-100'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md card-premium shadow-soft-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-16 h-16 ${styles.bg} rounded-2xl flex items-center justify-center`}>
              {styles.icon}
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">{title}</h3>
          <p className="text-muted-foreground font-medium leading-relaxed">{message}</p>
        </div>

        <div className="p-8 layer-2 border-t border-border-subtle flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-2 ${styles.button} disabled:opacity-70`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
