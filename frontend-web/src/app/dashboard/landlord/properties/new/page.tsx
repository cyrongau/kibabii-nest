'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  MapPin, 
  Image as ImageIcon, 
  Video, 
  ListChecks, 
  ShieldAlert, 
  Sparkles,
  Loader2,
  Check,
  Trash2,
  FileText,
  Home,
  ShieldCheck,
  Zap,
  Droplets,
  Wifi,
  Shield,
  Brush,
  Eye,
  FileCheck
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import SystemAgreementTemplate from '@/components/SystemAgreementTemplate';

const AMENITY_OPTIONS = [
  'WiFi', 'Hot Water', 'Security', 'Laundry', 'Gym', 
  'Study Area', 'Borehole', 'Token Meter', 'CCTV'
];
const SERVICE_OPTIONS = [
  'Cleaning', 'Maintenance', 'Waste Collection', 'Parking'
];

export default function NewPropertyPage() {
  const router = useRouter();
  const { showToast, showAlert } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [showAgreementPreview, setShowAgreementPreview] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Bungoma',
    category: '',
    distanceToCampus: '',
    videoUrl: '',
    videoType: 'URL' as 'URL' | 'UPLOAD',
    lat: '',
    lng: '',
    amenities: [] as string[],
    services: [] as string[],
    rules: [] as string[],
    images: [] as string[],
    agreementUrl: '',
    agreementExtracted: null as any,
    useSystemAgreement: true,
    utilityConfig: {
      water: { included: true, details: 'Fixed monthly rate' },
      electricity: { included: false, details: 'Prepaid token meter' },
      wifi: { included: true, details: 'Included in rent' },
      garbage: { included: true, details: 'Weekly collection' },
      security: { included: true, details: '24/7 guarded' },
      cleaning: { included: false, details: 'Managed by student' },
    },
    units: [
      { id: Date.now().toString(), typeId: '', type: '', price: '', capacity: '1', totalUnits: '1', unitNames: '', upfrontDiscountPct: '0' }
    ],
    extraCharges: {
      serviceFee: '150',
      securityDeposit: '0',
    }
  });

  const [newRule, setNewRule] = useState('');

  // Fetch dynamic categories and types
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/taxonomy/types`).then(r => r.json()).then(setPropertyTypes).catch(console.error);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/taxonomy/categories`).then(r => r.json()).then(setCategories).catch(console.error);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUnitChange = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.map(u => {
        if (u.id === id) {
          // If setting type, update both type and typeId based on selection
          if (field === 'type') {
            const pt = propertyTypes.find(t => t.name === value);
            return { ...u, type: value, typeId: pt ? pt.id : '' };
          }
          return { ...u, [field]: value };
        }
        return u;
      })
    }));
  };

  const addUnit = () => {
    setFormData(prev => ({
      ...prev,
      units: [...prev.units, { id: Date.now().toString(), typeId: '', type: '', price: '', capacity: '1', totalUnits: '1', unitNames: '', upfrontDiscountPct: '0' }]
    }));
  };

  const removeUnit = (id: string) => {
    if (formData.units.length <= 1) {
      showToast('You must have at least one unit type.', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      units: prev.units.filter(u => u.id !== id)
    }));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 240) { // 4 minutes
        showToast('Video is too long. Please keep it under 4 minutes.', 'error');
        return;
      }
      performVideoUpload(file);
    };
    video.src = URL.createObjectURL(file);
  };

  const performVideoUpload = async (file: File) => {
    setIsLoading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/uploads/video`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: data,
      });
      const result = await response.json();
      setFormData(prev => ({ ...prev, videoUrl: result.url }));
      showToast('Video uploaded successfully!', 'success');
    } catch (error) {
      showToast('Video upload failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/uploads/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: data,
      });
      const result = await response.json();
      setFormData(prev => ({ ...prev, images: [...prev.images, result.url] }));
    } catch (error) {
      showToast('Image upload failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleAgreementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/contracts/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: data,
      });
      const result = await response.json();
      const extracted = result.extractedData;
      
      setFormData(prev => {
        // Pre-fill the first unit's price if extracted
        const newUnits = [...prev.units];
        if (extracted?.rent > 0) {
          newUnits[0].price = extracted.rent.toString();
        }

        return {
          ...prev, 
          agreementUrl: result.url,
          agreementExtracted: extracted,
          rules: extracted?.rules?.length > 0 ? extracted.rules : prev.rules,
          name: extracted?.suggestedName || prev.name,
          description: extracted?.suggestedDescription || prev.description,
          units: newUnits
        };
      });
      showToast('Agreement processed by AI! Details extracted.', 'success');
    } catch (error) {
      showToast('Contract upload or AI extraction failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (listName: 'amenities' | 'services', item: string) => {
    setFormData(prev => {
      const list = prev[listName];
      if (list.includes(item)) {
        return { ...prev, [listName]: list.filter(i => i !== item) };
      } else {
        return { ...prev, [listName]: [...list, item] };
      }
    });
  };

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({ ...prev, rules: [...prev.rules, newRule.trim()] }));
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  const generateAIContent = async () => {
    if (!formData.name) {
      showToast('Please enter a property name first.', 'warning');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/generate-description`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.units[0]?.type || 'Hostel',
          amenities: formData.amenities,
          distance: parseFloat(formData.distanceToCampus) || 0
        }),
      });

      const data = await response.json();
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        showToast('AI description generated!', 'success');
      }
    } catch (error) {
      showToast('Failed to generate description', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.images.length || formData.units.some(u => !u.type || !u.price)) {
      showToast('Please fill all required fields, unit types, and upload at least one image.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const { videoType, agreementUrl, agreementExtracted, units, ...cleanData } = formData;
      
      const parsedUnits = units.map(u => ({
        ...u,
        price: parseFloat(u.price),
        capacity: parseInt(u.capacity),
        totalUnits: parseInt(u.totalUnits),
        unitNames: u.unitNames ? u.unitNames.split(',').map(n => n.trim()).filter(n => n) : []
      }));

      const payload = {
        ...cleanData,
        distanceToCampus: formData.distanceToCampus ? parseFloat(formData.distanceToCampus) : null,
        lat: parseFloat(formData.lat) || null,
        lng: parseFloat(formData.lng) || null,
        landlordId: user.id,
        agreementTemplateUrl: formData.useSystemAgreement ? null : (formData.agreementUrl || null),
        useSystemAgreement: formData.useSystemAgreement,
        units: parsedUnits
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create property');
      }

      showToast('Property published successfully!', 'success');
      setTimeout(() => router.push('/dashboard/landlord/properties'), 1500);
    } catch (error: any) {
      showToast(error.message || 'Failed to create property. Please check your inputs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-8 lg:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-muted-foreground hover:text-primary border border-border-subtle shadow-sm transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Add New Property</h1>
              <p className="text-muted-foreground font-medium mt-1">List your hostel or apartment on Kibabii Nest.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => router.back()}
               className="px-6 py-3.5 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all"
             >
               Cancel
             </button>
             <button 
               onClick={handleSubmit}
               disabled={isLoading}
               className="bg-primary text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70"
             >
               {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
               Publish Listing
             </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Basic Information */}
            <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
                  <Plus size={18} />
                </div>
                Property Compound Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Compound / Building Name</label>
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Kibabii Orange House"
                    className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Category</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all appearance-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Distance to Campus (Meters)</label>
                  <input 
                    name="distanceToCampus"
                    type="number"
                    value={formData.distanceToCampus}
                    onChange={handleInputChange}
                    placeholder="e.g. 500"
                    className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Sub-Units Configuration */}
            <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
                    <Home size={18} />
                  </div>
                  Unit Types & Availability
                </h3>
                <button 
                  type="button" 
                  onClick={addUnit}
                  className="text-sm font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Plus size={16} /> Add Unit Type
                </button>
              </div>

              <div className="space-y-6">
                {formData.units.map((unit, index) => (
                  <div key={unit.id} className="p-6 border border-border-subtle rounded-2xl bg-muted/20 relative group">
                    {formData.units.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeUnit(unit.id)}
                        className="absolute top-4 right-4 text-muted-foreground/30 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <h4 className="text-sm font-bold text-foreground/70 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">{index + 1}</span>
                      Unit Configuration
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Room Type</label>
                        <select 
                          value={unit.type}
                          onChange={(e) => handleUnitChange(unit.id, 'type', e.target.value)}
                          className="w-full px-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                        >
                          <option value="">Select Type</option>
                          {propertyTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (Ksh/Mo)</label>
                        <input 
                          type="number"
                          value={unit.price}
                          onChange={(e) => handleUnitChange(unit.id, 'price', e.target.value)}
                          placeholder="e.g. 4500"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Long-stay Disc (%)</label>
                        <input 
                          type="number"
                          value={unit.upfrontDiscountPct}
                          onChange={(e) => handleUnitChange(unit.id, 'upfrontDiscountPct', e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacity</label>
                        <input 
                          type="number"
                          value={unit.capacity}
                          onChange={(e) => handleUnitChange(unit.id, 'capacity', e.target.value)}
                          placeholder="1"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Units</label>
                        <input 
                          type="number"
                          value={unit.totalUnits}
                          onChange={(e) => handleUnitChange(unit.id, 'totalUnits', e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Labels (Comma Separated)</label>
                        <input 
                          value={unit.unitNames}
                          onChange={(e) => handleUnitChange(unit.id, 'unitNames', e.target.value)}
                          placeholder="e.g. 101, 102, 103"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Utilities & Services */}
            <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-500">
                  <Zap size={18} />
                </div>
                Utilities & Services
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'water', label: 'Water Supply', icon: Droplets, color: 'text-blue-500' },
                  { key: 'electricity', label: 'Electricity', icon: Zap, color: 'text-yellow-500' },
                  { key: 'wifi', label: 'WiFi / Internet', icon: Wifi, color: 'text-indigo-500' },
                  { key: 'garbage', label: 'Garbage Collection', icon: Trash2, color: 'text-emerald-500' },
                  { key: 'security', label: '24/7 Security', icon: Shield, color: 'text-slate-700' },
                  { key: 'cleaning', label: 'Cleaning Services', icon: Brush, color: 'text-pink-500' },
                ].map((item) => {
                  const config = (formData.utilityConfig as any)[item.key];
                  return (
                    <div key={item.key} className={`p-5 rounded-2xl border transition-all ${config.included ? 'bg-muted/30 border-border' : 'bg-card border-border-subtle opacity-70'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <item.icon size={18} className={item.color} />
                          <span className="text-sm font-bold text-foreground">{item.label}</span>
                        </div>
                        <select 
                          value={config.included ? 'true' : 'false'}
                          onChange={(e) => {
                            const newConfig = { ...formData.utilityConfig };
                            (newConfig as any)[item.key] = { ...config, included: e.target.value === 'true' };
                            setFormData(prev => ({ ...prev, utilityConfig: newConfig }));
                          }}
                          className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-surface-1 border border-border-subtle rounded-lg outline-none"
                        >
                          <option value="true">Included</option>
                          <option value="false">Tenant Paid</option>
                        </select>
                      </div>
                      <input 
                        type="text"
                        value={config.details}
                        onChange={(e) => {
                          const newConfig = { ...formData.utilityConfig };
                          (newConfig as any)[item.key] = { ...config, details: e.target.value };
                          setFormData(prev => ({ ...prev, utilityConfig: newConfig }));
                        }}
                        placeholder="e.g. Fixed rate, Token based..."
                        className="w-full text-xs font-semibold text-slate-500 bg-transparent border-b border-slate-100 focus:border-primary outline-none py-1"
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Extra Charges */}
            <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-primary">
                  <Plus size={18} />
                </div>
                Extra Charges & Deposits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Service Fee (One-time)</label>
                  <input 
                    type="number"
                    value={formData.extraCharges.serviceFee}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      extraCharges: { ...prev.extraCharges, serviceFee: e.target.value } 
                    }))}
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Security Deposit (Refundable)</label>
                  <input 
                    type="number"
                    value={formData.extraCharges.securityDeposit}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      extraCharges: { ...prev.extraCharges, securityDeposit: e.target.value } 
                    }))}
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                  <MapPin size={18} />
                </div>
                Location Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                  <input 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street name, landmark..."
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                  <input 
                    name="lat"
                    value={formData.lat}
                    onChange={handleInputChange}
                    placeholder="-0.6123..."
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                  <input 
                    name="lng"
                    value={formData.lng}
                    onChange={handleInputChange}
                    placeholder="34.5123..."
                    className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Description & AI */}
            <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10" />
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-primary">
                    <FileText size={18} />
                  </div>
                  Description
                </h3>
                <button 
                  type="button"
                  onClick={generateAIContent}
                  disabled={isGenerating}
                  className="flex items-center gap-2 text-sm font-bold text-primary bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  Auto-write with AI
                </button>
              </div>

              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                placeholder="Describe your property..."
                className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all resize-none"
              />
            </section>

            {/* Amenities & Services */}
            <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                  <ListChecks size={18} />
                </div>
                Features & Services
              </h3>

              <div className="space-y-8">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Included Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleSelection('amenities', amenity)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                          formData.amenities.includes(amenity) 
                            ? 'bg-foreground text-background' 
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {formData.amenities.includes(amenity) && <Check size={14} />}
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Available Services</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map(service => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleSelection('services', service)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                          formData.services.includes(service) 
                            ? 'bg-foreground text-background' 
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {formData.services.includes(service) && <Check size={14} />}
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Rules */}
            <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                  <ShieldAlert size={18} />
                </div>
                House Rules
              </h3>

              <div className="flex gap-2 mb-6">
                <input 
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                  placeholder="e.g. No loud music after 10 PM"
                  className="flex-1 px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                />
                <button 
                  type="button"
                  onClick={addRule}
                  className="bg-foreground text-background px-6 py-4 rounded-2xl text-sm font-bold hover:bg-foreground/90 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} /> Add
                </button>
              </div>

              {formData.rules.length > 0 && (
                <ul className="space-y-3">
                  {formData.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border-subtle">
                      <span className="text-sm font-semibold text-foreground/80">{rule}</span>
                      <button 
                        type="button" 
                        onClick={() => removeRule(idx)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right Column: Media */}
          <div className="space-y-8">
            
            {/* Platform Requirements */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                  <ShieldCheck size={18} />
                </div>
                Platform Requirements
              </h3>
              <ul className="space-y-4">
                <RequirementItem title="High Quality Photos" desc="Min. 3 clear photos of interior/exterior." />
                <RequirementItem title="Max Video Length" desc="Videos must be under 60 seconds." />
                <RequirementItem title="Accurate Map" desc="Pinpoint exact coordinates on the map." />
                <RequirementItem title="Review Time" desc="Approval or feedback within 24-48 hours." />
                <RequirementItem title="Edit Frequency" desc="Max 3 property edits allowed per month." />
                <RequirementItem title="Agreement Notice" desc="30-day notice for tenancy rule updates." />
              </ul>
              <div className="mt-8 pt-6 border-t border-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  Verified by Platform Oversight
                </div>
              </div>
            </section>

            {/* Tenancy Agreement Choice */}
            <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm overflow-hidden">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-primary">
                  <FileText size={18} />
                </div>
                Tenancy Agreement
              </h3>

              <div className="flex bg-muted/30 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, useSystemAgreement: true }))}
                  className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${formData.useSystemAgreement ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Sparkles size={14} className={formData.useSystemAgreement ? 'text-blue-500' : ''} />
                  System Generated
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, useSystemAgreement: false }))}
                  className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!formData.useSystemAgreement ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <FileText size={14} />
                  Custom Upload
                </button>
              </div>

              {formData.useSystemAgreement ? (
                <div className="space-y-4">
                  <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
                    <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <ShieldCheck size={16} />
                      Premium System Template
                    </p>
                    <p className="text-xs text-blue-700 leading-relaxed mb-4">
                      Our system will auto-generate a professional tenancy agreement using your property details, unit pricing, and rules. Ready for instant digital signing.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAgreementPreview(true)}
                      className="w-full py-3 bg-white border border-blue-200 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Eye size={14} />
                      Preview Agreement
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                   <p className="text-xs text-muted-foreground mb-4">
                    Upload your own tenancy agreement. Our AI will extract rules and pricing automatically.
                   </p>
                   <label className="block w-full border-2 border-dashed border-border-subtle hover:border-primary bg-muted/10 hover:bg-muted/20 rounded-2xl p-6 text-center cursor-pointer transition-all">
                    <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleAgreementUpload} className="hidden" />
                    <FileText size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                    <span className="text-sm font-bold text-foreground block">Upload Custom File</span>
                    <span className="text-xs text-muted-foreground mt-1 block">PDF, Word, or Image</span>
                  </label>

                  {formData.agreementUrl && (
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <FileCheck size={16} className="text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-700">Agreement Uploaded</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, agreementUrl: '' }))}
                        className="text-emerald-700 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Images Upload */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                  <ImageIcon size={18} />
                </div>
                Photos
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {formData.images.length < 5 && (
                <label className="block w-full border-2 border-dashed border-slate-200 hover:border-primary bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-8 text-center cursor-pointer transition-all">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <ImageIcon size={32} className="mx-auto text-slate-400 mb-3" />
                  <span className="text-sm font-bold text-slate-700 block">Add Photo</span>
                  <span className="text-xs text-slate-400 font-medium mt-1 block">Up to 5 images, Max 5MB</span>
                </label>
              )}
            </section>

            {/* Video Upload */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center text-sky-500">
                  <Video size={18} />
                </div>
                Virtual Tour
              </h3>
              
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, videoType: 'URL', videoUrl: '' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.videoType === 'URL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  YouTube Link
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, videoType: 'UPLOAD', videoUrl: '' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.videoType === 'UPLOAD' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  Direct Upload
                </button>
              </div>

              {formData.videoType === 'URL' ? (
                <input 
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  name="videoUrl"
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary transition-all"
                />
              ) : (
                <div className="space-y-4">
                  {formData.videoUrl ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900">
                      <video src={formData.videoUrl} controls className="w-full h-full object-contain" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 transition-all hover:bg-red-500 hover:text-white shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full border-2 border-dashed border-slate-200 hover:border-primary bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-8 text-center cursor-pointer transition-all">
                      <input type="file" accept="video/*" capture="environment" onChange={handleVideoUpload} className="hidden" />
                      <Video size={32} className="mx-auto text-slate-400 mb-3" />
                      <span className="text-sm font-bold text-slate-700 block">Upload Video Tour</span>
                      <span className="text-xs text-slate-400 font-medium mt-1 block">MP4 or MOV, max 4 mins (50MB)</span>
                    </label>
                  )}
                </div>
              )}
            </section>
          </div>
        </form>

        {/* Agreement Preview Modal */}
        {showAgreementPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-5xl h-[90vh] rounded-[2.5rem] border border-border-subtle shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-primary">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Agreement Preview</h3>
                    <p className="text-xs text-muted-foreground">This is how your tenancy agreement will look to students.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAgreementPreview(false)}
                  className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-muted/10">
                <SystemAgreementTemplate 
                  property={formData as any} 
                  landlord={user || { name: 'Landlord Name' }} 
                />
              </div>
              <div className="p-6 border-t border-border-subtle flex justify-end gap-3 bg-muted/20">
                <button 
                  onClick={() => setShowAgreementPreview(false)}
                  className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function RequirementItem({ title, desc }: { title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0 mt-0.5">
        <Check size={12} />
      </div>
      <div>
        <div className="text-xs font-black text-slate-900">{title}</div>
        <div className="text-[10px] text-slate-400 font-medium">{desc}</div>
      </div>
    </li>
  );
}
