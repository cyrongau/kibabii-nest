'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Save, Plus, X, MapPin, Image as ImageIcon, Video, 
  ListChecks, ShieldAlert, Sparkles, Loader2, Check, Trash2, Home, FileText, ShieldCheck,
  Zap, Droplets, Wifi, Shield, Brush, Eye, FileCheck
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useNotifications } from '@/context/NotificationContext';
import SystemAgreementTemplate from '@/components/SystemAgreementTemplate';

const getPublicUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/${normalizedPath}`;
};

const AMENITY_OPTIONS = [
  'WiFi', 'Hot Water', 'Security', 'Laundry', 'Gym', 
  'Study Area', 'Borehole', 'Token Meter', 'CCTV'
];
const SERVICE_OPTIONS = [
  'Cleaning', 'Maintenance', 'Waste Collection', 'Parking'
];

export default function EditPropertyPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [showAgreementPreview, setShowAgreementPreview] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

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
          amenities: formData.amenities,
          category: formData.category
        }),
      });
      const data = await response.json();
      setFormData(prev => ({ ...prev, description: data.description }));
      showToast('AI Description generated!', 'success');
    } catch (error) {
      showToast('AI Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };
  
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
    agreementUrl: '',
    useSystemAgreement: true,
    extraCharges: {
      serviceFee: '150',
      securityDeposit: '0',
    }
  });

  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/taxonomy/types`).then(r => r.json()).then(setPropertyTypes).catch(console.error);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/taxonomy/categories`).then(r => r.json()).then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchProperty = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (!response.ok) throw new Error('Property not found');
        const data = await response.json();
        
        setFormData({
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          city: data.city || 'Bungoma',
          category: data.category?.name || '',
          distanceToCampus: data.distanceToCampus?.toString() || '',
          videoUrl: data.videoUrl || '',
          videoType: data.videoUrl?.includes('youtube') ? 'URL' : (data.videoUrl ? 'UPLOAD' : 'URL'),
          lat: data.lat?.toString() || '',
          lng: data.lng?.toString() || '',
          amenities: data.amenities || [],
          services: data.services || [],
          rules: data.rules || [],
          images: data.images || [],
          utilityConfig: data.utilityConfig || {
            water: { included: true, details: 'Fixed monthly rate' },
            electricity: { included: false, details: 'Prepaid token meter' },
            wifi: { included: true, details: 'Included in rent' },
            garbage: { included: true, details: 'Weekly collection' },
            security: { included: true, details: '24/7 guarded' },
            cleaning: { included: false, details: 'Managed by student' },
          },
          units: data.units?.map((u: any) => ({
            id: u.id,
            typeId: u.typeId || '',
            type: u.type?.name || '',
            price: u.price?.toString() || '',
            capacity: u.capacity?.toString() || '1',
            totalUnits: u.totalUnits?.toString() || '1',
            unitNames: u.unitNames?.join(', ') || '',
            upfrontDiscountPct: (u.upfrontDiscountPct || 0).toString()
          })) || [],
          agreementUrl: data.agreementTemplateUrl || '',
          useSystemAgreement: data.useSystemAgreement ?? true,
          extraCharges: data.extraCharges || {
            serviceFee: '150',
            securityDeposit: '0',
          }
        });
      } catch (error) {
        showToast('Failed to load property details', 'error');
        router.push('/dashboard/landlord/properties');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProperty();
  }, [id, router, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUnitChange = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.map(u => {
        if (u.id === id) {
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

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 240) {
        showToast('Video is too long. Please keep it under 4 minutes.', 'error');
        return;
      }
      performVideoUpload(file);
    };
    video.src = URL.createObjectURL(file);
  };

  const performVideoUpload = async (file: File) => {
    setIsSaving(true);
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
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    
    try {
      // Image Compression Options
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };

      showToast('Optimizing image...', 'info');
      const compressedFile = await imageCompression(file, options);
      
      const data = new FormData();
      data.append('file', compressedFile, compressedFile.name);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/uploads/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: data,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      setFormData(prev => ({ ...prev, images: [...prev.images, result.url] }));
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Image compression/upload error:', error);
      showToast('Image upload failed. Please try a smaller image.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleAgreementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
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
      
      setFormData(prev => ({ 
        ...prev, 
        agreementUrl: result.url,
        rules: extracted?.rules?.length > 0 ? [...new Set([...prev.rules, ...extracted.rules])] : prev.rules,
        description: extracted?.suggestedDescription || prev.description
      }));
      showToast('Agreement processed by AI!', 'success');
    } catch (error) {
      showToast('Agreement upload failed', 'error');
    } finally {
      setIsSaving(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.images.length) {
      showToast('Please fill all required fields and upload at least one image.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const { videoType, units, ...cleanData } = formData;
      
      const parsedUnits = units.map(u => ({
        ...u,
        price: parseFloat(u.price.toString()),
        capacity: parseInt(u.capacity.toString()),
        totalUnits: parseInt(u.totalUnits.toString()),
        unitNames: u.unitNames ? u.unitNames.split(',').map((n: string) => n.trim()).filter((n: string) => n) : []
      }));

      const payload = {
        ...cleanData,
        distanceToCampus: formData.distanceToCampus ? parseFloat(formData.distanceToCampus) : null,
        lat: parseFloat(formData.lat) || null,
        lng: parseFloat(formData.lng) || null,
        agreementTemplateUrl: formData.useSystemAgreement ? null : (formData.agreementUrl || null),
        useSystemAgreement: formData.useSystemAgreement,
        units: parsedUnits
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update property');

      showToast('Property updated successfully!', 'success');
      setTimeout(() => router.push('/dashboard/landlord/properties'), 1500);
    } catch (error: any) {
      showToast(error.message || 'Failed to update property.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Property Details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Edit Property</h1>
                <p className="text-muted-foreground font-medium mt-1">Update details for {formData.name}</p>
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
                 disabled={isSaving}
                 className="bg-primary text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70"
               >
                 {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                 Save Changes
               </button>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
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
                      name="name" value={formData.name} onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Category</label>
                    <select 
                      name="category" value={formData.category} onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Distance to Campus (Meters)</label>
                    <input 
                      name="distanceToCampus" type="number" value={formData.distanceToCampus} onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Units Section */}
              <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                        <Home size={18} />
                      </div>
                      Manage Unit Types
                    </h3>
                  <button 
                    type="button" onClick={addUnit}
                    className="text-xs font-black text-white uppercase tracking-widest bg-primary px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    <Plus size={18} /> Add Unit Type
                  </button>
                </div>
                
                {JSON.parse(localStorage.getItem('user') || '{}').role !== 'ADMIN' && (
                  <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-amber-800 font-medium">
                      Note: Changes to unit types may affect existing bookings. Please ensure all details are accurate before saving.
                    </p>
                  </div>
                )}
                  
                  <div className="space-y-6">
                    {formData.units.map((unit, index) => (
                      <div key={unit.id} className="p-6 bg-muted/20 border border-border-subtle rounded-[2rem] relative group/unit">
                        <button 
                          type="button" onClick={() => removeUnit(unit.id)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-card text-red-500 rounded-full shadow-sm border border-border-subtle flex items-center justify-center opacity-0 group/unit:hover:opacity-100 transition-all hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Type</label>
                            <select 
                              value={unit.type} onChange={(e) => handleUnitChange(unit.id, 'type', e.target.value)}
                              className="w-full px-4 py-3 bg-surface-1 border border-border-subtle rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-primary appearance-none"
                            >
                              <option value="">Select Type</option>
                              {propertyTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Price</label>
                            <input 
                              type="number" value={unit.price} onChange={(e) => handleUnitChange(unit.id, 'price', e.target.value)}
                              placeholder="Ksh"
                              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Long-stay Disc (%)</label>
                            <input 
                              type="number" value={unit.upfrontDiscountPct || '0'} onChange={(e) => handleUnitChange(unit.id, 'upfrontDiscountPct', e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacity</label>
                            <select 
                              value={unit.capacity || '1'} onChange={(e) => handleUnitChange(unit.id, 'capacity', e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary appearance-none"
                            >
                              {[1,2,3,4,6,8].map(n => <option key={n} value={n}>{n} Student{n > 1 ? 's' : ''}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Units</label>
                            <input 
                              type="number" value={unit.totalUnits || '1'} onChange={(e) => handleUnitChange(unit.id, 'totalUnits', e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Labels</label>
                            <input 
                              value={unit.unitNames} onChange={(e) => handleUnitChange(unit.id, 'unitNames', e.target.value)}
                              placeholder="e.g. 101, 102"
                              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary"
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
                    const config = (formData.utilityConfig as any)[item.key] || { included: false, details: '' };
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
              
              {/* Financials & Deposits */}
              <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                    <FileText size={18} />
                  </div>
                  Financials & Deposits
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Security Deposit (Ksh)</label>
                    <input 
                      type="number"
                      value={formData.extraCharges.securityDeposit}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        extraCharges: { ...prev.extraCharges, securityDeposit: e.target.value }
                      }))}
                      placeholder="e.g. 5000"
                      className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground ml-1">Refundable amount paid once upon move-in.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Service Fee (Ksh)</label>
                    <input 
                      type="number"
                      value={formData.extraCharges.serviceFee}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        extraCharges: { ...prev.extraCharges, serviceFee: e.target.value }
                      }))}
                      placeholder="e.g. 150"
                      className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground ml-1">Extra charges for shared services (Security, Garbage, etc).</p>
                  </div>
                </div>
              </section>

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
                      name="address" value={formData.address} onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                    <input 
                      name="lat" value={formData.lat} onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                    <input 
                      name="lng" value={formData.lng} onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </section>

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
                  name="description" value={formData.description} onChange={handleInputChange} rows={5}
                  placeholder="Describe your property..."
                  className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                />
              </section>

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
                          key={amenity} type="button" onClick={() => toggleSelection('amenities', amenity)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                            formData.amenities.includes(amenity) ? 'bg-foreground text-background' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          {formData.amenities.includes(amenity) && <Check size={14} />} {amenity}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 block">Available Services</label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_OPTIONS.map(service => (
                        <button
                          key={service} type="button" onClick={() => toggleSelection('services', service)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                            formData.services.includes(service) ? 'bg-foreground text-background' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          {formData.services.includes(service) && <Check size={14} />} {service}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                    <ShieldAlert size={18} />
                  </div>
                  House Rules
                </h3>
                <div className="flex gap-2 mb-6">
                  <input 
                    value={newRule} onChange={(e) => setNewRule(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                    placeholder="e.g. No loud music after 10 PM"
                    className="flex-1 px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                  <button type="button" onClick={addRule} className="bg-foreground text-background px-6 py-4 rounded-2xl text-sm font-bold hover:bg-foreground/90 flex items-center gap-2 transition-colors">
                    <Plus size={18} /> Add
                  </button>
                </div>
                {formData.rules.length > 0 && (
                  <ul className="space-y-3">
                    {formData.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border-subtle">
                        <span className="text-sm font-semibold text-foreground/80">{rule}</span>
                        <button type="button" onClick={() => removeRule(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <X size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="space-y-8">
              {/* Platform Requirements */}
              <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
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

              {/* Tenancy Agreement Selector */}
              <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm relative overflow-hidden">
                 <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
                      <FileText size={18} />
                    </div>
                    Tenancy Agreement
                  </h3>
                  {formData.useSystemAgreement && (
                    <button 
                      type="button"
                      onClick={() => setShowAgreementPreview(true)}
                      className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:bg-primary/5 px-3 py-2 rounded-xl transition-all"
                    >
                      <Eye size={14} /> Preview Agreement
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, useSystemAgreement: true }))}
                    className={`p-6 rounded-2xl border-2 text-left transition-all relative ${
                      formData.useSystemAgreement 
                        ? 'border-primary bg-primary/5 ring-4 ring-primary/5' 
                        : 'border-border-subtle bg-muted/20 grayscale opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <ShieldCheck size={24} />
                      </div>
                      {formData.useSystemAgreement && <Check size={20} className="text-primary" />}
                    </div>
                    <h4 className="font-black text-sm text-foreground">Kibabii Nest Standard</h4>
                    <p className="text-[10px] font-medium text-muted-foreground mt-1 leading-relaxed">
                      Auto-generated, legally vetted agreement. Recommended for most landlords.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, useSystemAgreement: false }))}
                    className={`p-6 rounded-2xl border-2 text-left transition-all relative ${
                      !formData.useSystemAgreement 
                        ? 'border-primary bg-primary/5 ring-4 ring-primary/5' 
                        : 'border-border-subtle bg-muted/20 grayscale opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                        <FileText size={24} />
                      </div>
                      {!formData.useSystemAgreement && <Check size={20} className="text-primary" />}
                    </div>
                    <h4 className="font-black text-sm text-foreground">Custom Upload</h4>
                    <p className="text-[10px] font-medium text-muted-foreground mt-1 leading-relaxed">
                      Upload your own PDF/Image. Requires AI extraction & admin verification.
                    </p>
                  </button>
                </div>

                {!formData.useSystemAgreement && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <label className="block w-full border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 bg-muted/20 rounded-2xl p-8 text-center cursor-pointer transition-all">
                      <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleAgreementUpload} className="hidden" />
                      <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4">
                        <ImageIcon size={32} />
                      </div>
                      <span className="text-sm font-black text-foreground block">Upload Agreement</span>
                      <span className="text-xs text-muted-foreground font-medium mt-1 block">PDF, Word, or Image</span>
                    </label>
                    
                    {formData.agreementUrl && (
                      <div className="mt-4 flex items-center gap-3 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                          <FileCheck size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-foreground truncate">Agreement Uploaded</div>
                          <div className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest">Active Document</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                    <ImageIcon size={18} />
                  </div>
                  Photos
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                      <img src={getPublicUrl(img)} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-8 h-8 bg-card text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                {formData.images.length < 5 && (
                  <label className="block w-full border-2 border-dashed border-border-subtle hover:border-primary bg-muted/20 hover:bg-primary/5 rounded-2xl p-8 text-center cursor-pointer transition-all">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <ImageIcon size={32} className="mx-auto text-muted-foreground mb-3" />
                    <span className="text-sm font-black text-foreground block">Add Photo</span>
                    <span className="text-xs text-muted-foreground font-medium mt-1 block">Up to 5 images, Max 5MB</span>
                  </label>
                )}
              </section>

              {/* Video Upload */}
              <section className="bg-card p-8 rounded-[2.5rem] border border-border-subtle shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center text-sky-500">
                    <Video size={18} />
                  </div>
                  Virtual Tour
                </h3>
                
                <div className="flex bg-muted p-1 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, videoType: 'URL', videoUrl: '' }))}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.videoType === 'URL' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                  >
                    YouTube Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, videoType: 'UPLOAD', videoUrl: '' }))}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.videoType === 'UPLOAD' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
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
                    className="w-full px-6 py-4 bg-muted/30 border border-border-subtle rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                ) : (
                  <div className="space-y-4">
                    {formData.videoUrl ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900">
                        <video src={formData.videoUrl} controls className="w-full h-full object-contain" />
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                          className="absolute top-2 right-2 w-8 h-8 bg-card rounded-full flex items-center justify-center text-red-500 transition-all hover:bg-red-50 shadow-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="block w-full border-2 border-dashed border-border-subtle hover:border-primary bg-muted/20 hover:bg-primary/5 rounded-2xl p-8 text-center cursor-pointer transition-all">
                        <input type="file" accept="video/*" capture="environment" onChange={handleVideoUpload} className="hidden" />
                        <Video size={32} className="mx-auto text-muted-foreground mb-3" />
                        <span className="text-sm font-black text-foreground block">Upload Video Tour</span>
                        <span className="text-xs text-muted-foreground font-medium mt-1 block">MP4 or MOV, max 4 mins (50MB)</span>
                      </label>
                    )}
                  </div>
                )}
              </section>
            </div>
          </form>
        </div>
      </main>

      {/* Agreement Preview Modal */}
      {showAgreementPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setShowAgreementPreview(false)} />
          <div className="relative w-full max-w-5xl h-full bg-card border border-border-subtle rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b border-border-subtle flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">Agreement Preview</h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">System Generated Standard Template</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAgreementPreview(false)}
                className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-muted-foreground hover:text-red-500 border border-border-subtle transition-all"
              >
                <X size={20} />
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-12 bg-white/5">
              <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-slate-100">
                <SystemAgreementTemplate 
                  property={{
                    name: formData.name,
                    address: formData.address,
                    city: formData.city,
                    units: formData.units.map(u => ({
                      ...u,
                      price: parseFloat(u.price),
                      type: { name: u.type }
                    }))
                  }}
                  landlord={user}
                />
              </div>
            </div>

            <footer className="p-8 border-t border-border-subtle bg-muted/20 flex justify-end gap-4">
              <button 
                onClick={() => setShowAgreementPreview(false)}
                className="px-8 py-4 bg-card border border-border-subtle text-foreground rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-muted/50 transition-all"
              >
                Close Preview
              </button>
              <button 
                onClick={() => setShowAgreementPreview(false)}
                className="px-8 py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Accept Template
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
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
