'use client';

import React, { useState } from 'react';
import { Upload, X, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function KycModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useNotifications();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    idDocumentUrl: '',
    ownershipProofUrl: '',
    certificateUrl: '',
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/uploads/document`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Upload failed');

      setFormData(prev => ({ ...prev, [field]: result.url }));
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/kyc/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Failed to submit KYC');
      }

      showToast('Verification documents submitted successfully! Our team will review them shortly.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-card rounded-[2rem] max-w-lg w-full p-8 shadow-2xl shadow-foreground/10 relative overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground/60 hover:text-foreground transition-colors">
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-inner">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight">Verify Your Identity</h2>
            <p className="text-sm font-medium text-muted-foreground">Step {step} of 3</p>
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-4">National ID / Passport</h3>
              <p className="text-sm text-muted-foreground mb-4 font-medium">Please upload a clear, legible copy of your national identity card or passport. This is required for background checks.</p>
              
              <label className="block w-full border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:bg-muted hover:border-primary transition-all">
                {isLoading ? <Loader2 className="animate-spin mx-auto text-primary" size={32} /> : (
                  formData.idDocumentUrl ? (
                    <div className="flex flex-col items-center text-emerald-500">
                      <ShieldCheck size={32} className="mb-2" />
                      <span className="font-bold">Document Uploaded</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground/60">
                      <Upload size={32} className="mb-2" />
                      <span className="font-bold">Click to Upload</span>
                    </div>
                  )
                )}
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleUpload(e, 'idDocumentUrl')} disabled={isLoading} />
              </label>

              <button 
                onClick={() => setStep(2)}
                disabled={!formData.idDocumentUrl}
                className="w-full mt-6 bg-primary text-white py-4 rounded-xl font-black disabled:opacity-50 transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-4">Proof of Ownership</h3>
              <p className="text-sm text-muted-foreground mb-4 font-medium">Upload a title deed, recent utility bill (water/electricity), or property tax receipt bearing your name.</p>
              
              <label className="block w-full border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:bg-muted hover:border-primary transition-all">
                {isLoading ? <Loader2 className="animate-spin mx-auto text-primary" size={32} /> : (
                  formData.ownershipProofUrl ? (
                    <div className="flex flex-col items-center text-emerald-500">
                      <ShieldCheck size={32} className="mb-2" />
                      <span className="font-bold">Document Uploaded</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground/60">
                      <FileText size={32} className="mb-2" />
                      <span className="font-bold">Click to Upload</span>
                    </div>
                  )
                )}
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleUpload(e, 'ownershipProofUrl')} disabled={isLoading} />
              </label>

              <div className="flex gap-4 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 bg-muted text-foreground py-4 rounded-xl font-black hover:bg-muted/80 transition-all">Back</button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={!formData.ownershipProofUrl}
                  className="flex-[2] bg-primary text-white py-4 rounded-xl font-black disabled:opacity-50 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-4">Management Certificate (Optional)</h3>
              <p className="text-sm text-muted-foreground mb-4 font-medium">If you are a property manager or agency, please upload your management certificate or letter of authorization from the owner.</p>
              
              <label className="block w-full border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:bg-muted hover:border-primary transition-all">
                {isLoading ? <Loader2 className="animate-spin mx-auto text-primary" size={32} /> : (
                  formData.certificateUrl ? (
                    <div className="flex flex-col items-center text-emerald-500">
                      <ShieldCheck size={32} className="mb-2" />
                      <span className="font-bold">Document Uploaded</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground/60">
                      <Upload size={32} className="mb-2" />
                      <span className="font-bold">Click to Upload (Optional)</span>
                    </div>
                  )
                )}
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleUpload(e, 'certificateUrl')} disabled={isLoading} />
              </label>

              <div className="flex gap-4 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 bg-muted text-foreground py-4 rounded-xl font-black hover:bg-muted/80 transition-all">Back</button>
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-[2] bg-emerald-500 text-white py-4 rounded-xl font-black hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="animate-spin" size={16} />}
                  Submit Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
