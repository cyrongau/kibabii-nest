'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle2, XCircle, MapPin, Image as ImageIcon, Video, 
  ShieldCheck, Loader2, Home, User, Mail, Phone, Calendar, Info, FileText,
  Save, Plus, Zap, Droplets, Wifi, Trash2, Shield, Brush, Package
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { usePropertyTaxonomy } from '@/hooks/use-property-taxonomy';
import Image from 'next/image';

const getPublicUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/${normalizedPath}`;
};

export default function PropertyReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useNotifications();
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingUnits, setIsEditingUnits] = useState(false);
  const [isEditingUtilities, setIsEditingUtilities] = useState(false);
  const { propertyTypes, categories } = usePropertyTaxonomy();

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProperty(data);
      } else {
        showToast('Failed to load property', 'error');
        router.push('/dashboard/admin/properties');
      }
    } catch (error) {
      showToast('Error loading property', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUnits = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ units: property.units })
      });
      if (response.ok) {
        showToast('Units updated successfully', 'success');
        setIsEditingUnits(false);
        fetchProperty();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.message || 'Failed to update units', 'error');
      }
    } catch (error) {
      showToast('Error saving units', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveUtilities = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ utilityConfig: property.utilityConfig })
      });
      if (response.ok) {
        showToast('Utilities updated successfully', 'success');
        setIsEditingUtilities(false);
        fetchProperty();
      } else {
        showToast('Failed to update utilities', 'error');
      }
    } catch (error) {
      showToast('Error saving utilities', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async (status: boolean) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000"}/properties/${id}/verify`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        showToast(`Property ${status ? 'verified' : 'unverified'} successfully`, 'success');
        fetchProperty();
      }
    } catch (error) {
      showToast('Failed to update verification status', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const addUnit = () => {
    const newUnit = { 
      id: `temp-${Date.now()}`, 
      typeId: propertyTypes[0]?.id || '',
      type: propertyTypes[0] || { name: 'Standard Room' }, 
      price: 5000, 
      capacity: 1, 
      totalUnits: 1,
      upfrontDiscountPct: 0,
      unitNames: []
    };
    setProperty({ ...property, units: [...(property.units || []), newUnit] });
  };

  const removeUnit = (index: number) => {
    const newUnits = property.units.filter((_: any, i: number) => i !== index);
    setProperty({ ...property, units: newUnits });
  };

  const handleUnitChange = (index: number, field: string, value: any) => {
    const newUnits = [...property.units];
    if (field === 'typeId') {
      const selectedType = propertyTypes.find(t => t.id === value);
      newUnits[index] = { ...newUnits[index], typeId: value, type: selectedType };
    } else {
      newUnits[index] = { ...newUnits[index], [field]: value };
    }
    setProperty({ ...property, units: newUnits });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background p-12 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 italic">Retrieving property details...</span>
    </div>
  );

  const landlord = property.landlord || property.owner;

  return (
    <div className="min-h-screen bg-background p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-4 bg-card border border-border-subtle rounded-[1.5rem] text-muted-foreground hover:text-primary transition-all shadow-soft-xl group">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter leading-none">Review Property</h1>
            <p className="text-muted-foreground/60 font-bold mt-2 uppercase tracking-widest text-xs">Administrative verification & configuration</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            disabled={isProcessing || !property.verified}
            onClick={() => handleVerify(false)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-card border border-red-500/20 text-red-500 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white disabled:opacity-30 transition-all shadow-soft-lg"
          >
            <XCircle size={18} /> Revoke
          </button>
          <button 
            disabled={isProcessing || property.verified}
            onClick={() => handleVerify(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-primary text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-glow hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
          >
            <CheckCircle2 size={18} /> Verify
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-12">
          {/* Main Info */}
          <section className="bg-card p-10 lg:p-12 rounded-[3.5rem] border border-border-subtle shadow-soft-2xl space-y-10">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-foreground tracking-tighter leading-tight">{property.name}</h2>
                <div className="flex items-center gap-3 text-muted-foreground/60 font-bold text-sm bg-muted/20 px-6 py-3 rounded-full w-fit">
                  <MapPin size={18} className="text-primary" /> {property.address}, {property.city}
                </div>
              </div>
              <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-soft-sm ${
                property.verified 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
              }`}>
                {property.verified ? 'Verified Listing' : 'Pending Verification'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DetailBox label="Category" value={property.category?.name || 'Standard'} />
              <DetailBox label="Base Price" value={`Ksh ${property.price?.toLocaleString()}`} />
              <DetailBox label="Proximity" value={`${property.distanceToCampus}m to Campus`} />
            </div>

            <div className="bg-muted/10 p-8 lg:p-10 rounded-[2.5rem] border border-border-subtle shadow-inner">
              <h4 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-4">Property Bio</h4>
              <p className="text-base font-medium leading-relaxed text-foreground/80">{property.description}</p>
            </div>
          </section>

          {/* Utilities & Services */}
          <section className="bg-card p-10 lg:p-12 rounded-[3.5rem] border border-border-subtle shadow-soft-2xl space-y-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-4 leading-none">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 shadow-soft-sm">
                    <Zap size={24} />
                  </div>
                  Utility Framework
                </h3>
              </div>
              <button 
                onClick={() => setIsEditingUtilities(!isEditingUtilities)}
                className="px-6 py-2.5 bg-muted hover:bg-muted/60 rounded-full text-[10px] font-black text-foreground uppercase tracking-widest transition-all border border-border-subtle shadow-soft-sm"
              >
                {isEditingUtilities ? 'Discard Changes' : 'Modify Config'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'water', label: 'Water Supply', icon: Droplets, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
                { key: 'electricity', label: 'Electricity', icon: Zap, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
                { key: 'wifi', label: 'WiFi Access', icon: Wifi, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },
                { key: 'garbage', label: 'Garbage', icon: Trash2, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
                { key: 'security', label: '24/7 Guards', icon: Shield, color: 'text-foreground', bgColor: 'bg-muted', borderColor: 'border-border' },
                { key: 'cleaning', label: 'Janitorial', icon: Brush, color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
              ].map((item) => {
                const config = (property.utilityConfig as any)?.[item.key] || { included: false, details: '' };
                return (
                  <div key={item.key} className={`p-6 rounded-[2.5rem] border transition-all ${config.included ? 'bg-card border-border-subtle shadow-soft-lg ring-1 ring-primary/5' : 'bg-muted/20 border-transparent opacity-40 hover:opacity-100'}`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-2xl shadow-soft-sm border ${item.bgColor} ${item.borderColor} ${item.color}`}>
                        <item.icon size={20} />
                      </div>
                      {isEditingUtilities ? (
                        <select 
                          value={config.included ? 'true' : 'false'}
                          onChange={(e) => {
                            const newConfig = { ...(property.utilityConfig || {}) };
                            newConfig[item.key] = { ...config, included: e.target.value === 'true' };
                            setProperty({ ...property, utilityConfig: newConfig });
                          }}
                          className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-muted border border-border-subtle rounded-xl outline-none focus:ring-4 focus:ring-primary/10"
                        >
                          <option value="true">Included</option>
                          <option value="false">Paid</option>
                        </select>
                      ) : (
                        <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                          config.included 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-muted text-muted-foreground border-border-subtle'
                        }`}>
                          {config.included ? 'Free' : 'Paid'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-black text-foreground tracking-tight">{item.label}</div>
                      {isEditingUtilities ? (
                        <input 
                          type="text"
                          value={config.details}
                          onChange={(e) => {
                            const newConfig = { ...(property.utilityConfig || {}) };
                            newConfig[item.key] = { ...config, details: e.target.value };
                            setProperty({ ...property, utilityConfig: newConfig });
                          }}
                          placeholder="Rate/Details..."
                          className="w-full text-xs font-bold text-muted-foreground bg-muted/40 border border-border-subtle focus:border-primary rounded-xl outline-none px-4 py-2 transition-all"
                        />
                      ) : (
                        <div className="text-xs font-bold text-muted-foreground/60 line-clamp-1 italic">{config.details || (config.included ? 'Platform standard' : 'Tenant responsibility')}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isEditingUtilities && (
              <button 
                onClick={handleSaveUtilities}
                disabled={isProcessing}
                className="w-full bg-primary text-white py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Synchronize Utility Configuration
              </button>
            )}
          </section>

          {/* Media Review */}
          <section className="bg-card p-10 lg:p-12 rounded-[3.5rem] border border-border-subtle shadow-soft-2xl space-y-10">
             <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-4 leading-none">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20 shadow-soft-sm">
                  <ImageIcon size={24} />
                </div>
                Asset Inspection
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {property.images?.map((img: string, idx: number) => (
                  <div key={idx} className="aspect-square bg-muted rounded-[2.5rem] overflow-hidden border border-border-subtle shadow-soft-lg group cursor-zoom-in relative">
                    <img src={getPublicUrl(img)} alt={`Property ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Image #{idx + 1}</span>
                    </div>
                  </div>
                ))}
                {property.images?.length === 0 && (
                  <div className="col-span-full py-24 text-center bg-muted/20 rounded-[3rem] border border-dashed border-border-subtle">
                    <ImageIcon className="mx-auto text-muted-foreground/10 mb-4" size={64} />
                    <div className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest italic">Zero visual assets uploaded</div>
                  </div>
                )}
             </div>
             {property.videoUrl ? (
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-8 h-[2px] bg-primary/20 rounded-full" />
                    Video Audit
                    <div className="w-8 h-[2px] bg-primary/20 rounded-full" />
                  </h4>
                  <div className="aspect-video bg-muted rounded-[3rem] overflow-hidden border border-border-subtle shadow-soft-2xl relative group">
                     <iframe className="w-full h-full" src={property.videoUrl.replace('watch?v=', 'embed/')} />
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-muted/10 rounded-[2.5rem] border border-border-subtle flex flex-col items-center text-center">
                  <div className="p-4 bg-card rounded-2xl shadow-soft-sm border border-border-subtle mb-4 text-muted-foreground/20">
                    <Video size={24} />
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">Walkthrough video unavailable</p>
                </div>
              )}
          </section>

          {/* Unit Types */}
          <section className="bg-card p-10 lg:p-12 rounded-[3.5rem] border border-border-subtle shadow-soft-2xl space-y-10">
             <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-4 leading-none">
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20 shadow-soft-sm">
                    <Home size={24} />
                  </div>
                  Inventory Control
               </h3>
               <div className="flex items-center gap-4">
                 {isEditingUnits && (
                   <button 
                     onClick={addUnit}
                     className="px-5 py-2.5 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-glow-emerald hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                   >
                      <Plus size={14} /> Add Prototype
                   </button>
                 )}
                 <button 
                   onClick={() => setIsEditingUnits(!isEditingUnits)}
                   className="px-6 py-2.5 bg-muted hover:bg-muted/60 rounded-full text-[10px] font-black text-foreground uppercase tracking-widest transition-all border border-border-subtle shadow-soft-sm"
                 >
                   {isEditingUnits ? 'Stop Audit' : 'Manage Units'}
                 </button>
               </div>
             </div>
             
             <div className="space-y-6">
               {property.units && property.units.length > 0 ? (
                 property.units.map((unit: any, index: number) => (
                    <div key={unit.id} className="p-8 bg-muted/10 rounded-[2.5rem] border border-border-subtle relative group/unit hover:bg-muted/20 transition-all">
                       {isEditingUnits && (
                         <button 
                           onClick={() => removeUnit(index)}
                           className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-full shadow-glow-red flex items-center justify-center opacity-0 group-hover/unit:opacity-100 transition-all hover:scale-110 z-10"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                       
                       {isEditingUnits ? (
                         <div className="space-y-8">
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">Classification</label>
                                 {propertyTypes?.length > 0 ? (
                                   <select 
                                     value={unit.typeId || ''}
                                     onChange={(e) => handleUnitChange(index, 'typeId', e.target.value)}
                                     className="w-full px-6 py-4 bg-card border border-border-subtle rounded-2xl text-sm font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                   >
                                     <option value="">Select Prototype</option>
                                     {propertyTypes.map(t => (
                                       <option key={t.id} value={t.id}>{t.name}</option>
                                     ))}
                                   </select>
                                 ) : (
                                   <input 
                                     type="text" 
                                     defaultValue={unit.type?.name || ''}
                                     onChange={(e) => {
                                       const newUnits = [...property.units];
                                       newUnits[index] = { ...newUnits[index], type: { ...newUnits[index].type, name: e.target.value } };
                                       setProperty({ ...property, units: newUnits });
                                     }}
                                     className="w-full px-6 py-4 bg-card border border-border-subtle rounded-2xl text-sm font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                     placeholder="e.g. Deluxe Suite"
                                   />
                                 )}
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">Rate (KES/Cycle)</label>
                                 <input 
                                   type="number" 
                                   value={unit.price}
                                   onChange={(e) => handleUnitChange(index, 'price', Number(e.target.value))}
                                   className="w-full px-6 py-4 bg-card border border-border-subtle rounded-2xl text-sm font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">Upfront Credit (%)</label>
                                 <input 
                                   type="number" 
                                   value={unit.upfrontDiscountPct || 0}
                                   onChange={(e) => handleUnitChange(index, 'upfrontDiscountPct', Number(e.target.value))}
                                   className="w-full px-6 py-4 bg-card border border-border-subtle rounded-2xl text-sm font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                 />
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">Occupancy Limit</label>
                                 <input 
                                   type="number" 
                                   value={unit.capacity}
                                   onChange={(e) => handleUnitChange(index, 'capacity', Number(e.target.value))}
                                   className="w-full px-6 py-4 bg-card border border-border-subtle rounded-2xl text-sm font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">Total Unit Slots</label>
                                 <input 
                                   type="number" 
                                   value={unit.totalUnits}
                                   onChange={(e) => handleUnitChange(index, 'totalUnits', Number(e.target.value))}
                                   className="w-full px-6 py-4 bg-card border border-border-subtle rounded-2xl text-sm font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">Slot Identifiers</label>
                                 <input 
                                   type="text" 
                                   value={unit.unitNames?.join(', ') || ''}
                                   onChange={(e) => handleUnitChange(index, 'unitNames', e.target.value.split(',').map(s => s.trim()))}
                                   className="w-full px-6 py-4 bg-card border border-border-subtle rounded-2xl text-sm font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                   placeholder="e.g. A01, A02, B05"
                                 />
                              </div>
                           </div>
                         </div>
                       ) : (
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                          <div className="space-y-4">
                            <div className="text-xl font-black text-foreground tracking-tight">{unit.type?.name || 'Standard Unit'}</div>
                            <div className="flex flex-wrap items-center gap-3">
                               <div className="px-4 py-1.5 bg-card border border-border-subtle rounded-full text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  <User size={12} /> {unit.capacity} Students
                               </div>
                               <div className="px-4 py-1.5 bg-card border border-border-subtle rounded-full text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  <Package size={12} /> {unit.totalUnits} Total Slots
                               </div>
                               {unit.upfrontDiscountPct > 0 && (
                                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                  {unit.upfrontDiscountPct}% Long-stay Perk
                                </div>
                              )}
                            </div>
                            {unit.unitNames?.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {unit.unitNames.map((name: string, i: number) => (
                                  <span key={i} className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-lg text-[8px] font-black text-primary uppercase tracking-widest">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-left md:text-right shrink-0">
                            <div className="text-3xl font-black text-primary tracking-tighter leading-none">
                               <span className="text-sm font-bold opacity-30 mr-1">KES</span>
                               {unit.price?.toLocaleString()}
                            </div>
                            <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-2">Billing Cycle / Monthly</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
               ) : (
                 <div className="py-24 bg-muted/10 rounded-[3.5rem] border border-dashed border-border-subtle text-center flex flex-col items-center">
                    <div className="p-6 bg-card rounded-[2rem] shadow-soft-xl border border-border-subtle mb-6 text-muted-foreground/20">
                       <Home size={48} />
                    </div>
                    <p className="text-lg font-black text-foreground tracking-tight">Empty Inventory Registry</p>
                    <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest mt-2 max-w-xs">Define unit types to enable platform bookings and revenue generation.</p>
                    {isEditingUnits && (
                      <button 
                        onClick={addUnit}
                        className="mt-8 bg-primary text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow hover:scale-105 transition-all flex items-center gap-3"
                      >
                        <Plus size={18} /> Initialize Unit Type
                      </button>
                    )}
                 </div>
               )}
               
               {isEditingUnits && property.units?.length > 0 && (
                 <div className="flex flex-col gap-4 mt-8">
                    <button 
                      onClick={handleSaveUnits}
                      disabled={isProcessing}
                      className="w-full bg-primary text-white py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      Commit Unit Specifications
                    </button>
                    <button 
                      onClick={addUnit}
                      className="w-full py-6 border border-dashed border-border-subtle rounded-[2rem] text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest"
                    >
                      <Plus size={16} /> Append Unit Variation
                    </button>
                 </div>
               )}
             </div>
          </section>
        </div>

        {/* Right Column: Landlord & Compliance */}
        <div className="space-y-12">
           {/* Landlord Info */}
           <section className="bg-card p-10 rounded-[3.5rem] border border-border-subtle shadow-soft-2xl space-y-8 sticky top-8">
             <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20 shadow-soft-sm">
                  <User size={24} />
                </div>
                Landlord Auth
             </h3>
             
             <div className="p-8 bg-muted/10 rounded-[3rem] border border-border-subtle text-center space-y-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-32 h-32 mx-auto bg-card rounded-[3rem] overflow-hidden border-4 border-card shadow-soft-2xl relative z-10">
                  {landlord?.avatar ? (
                    <img src={getPublicUrl(landlord.avatar)} alt={landlord?.name} className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(landlord?.name || 'User')}&background=random&size=256&bold=true`} className="w-full h-full object-cover" alt="" />
                  )}
                </div>
                
                <div className="relative z-10">
                  <div className="text-2xl font-black text-foreground tracking-tighter leading-none">{landlord?.name}</div>
                  <div className="inline-flex mt-4 items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-500">
                    <ShieldCheck size={12} /> Identity Verified
                  </div>
                </div>
             </div>

             <div className="space-y-4 px-2">
                <ContactItem icon={<Mail size={18} />} value={landlord?.email} label="E-Mail Address" />
                <ContactItem icon={<Phone size={18} />} value={landlord?.phone || 'Private Registry'} label="Direct Phone Line" />
             </div>

             {/* Agreement Template */}
             <div className="pt-8 space-y-6 border-t border-border-subtle">
                <h4 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] flex items-center gap-3">
                  <FileText size={14} className="text-primary" /> Compliance
                </h4>
                {property.agreementTemplateUrl ? (
                  <a 
                    href={getPublicUrl(property.agreementTemplateUrl)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-6 bg-muted/10 border border-border-subtle rounded-3xl hover:bg-muted/30 transition-all group"
                  >
                    <div>
                       <div className="text-xs font-black text-foreground uppercase tracking-tight">Tenancy Agreement</div>
                       <div className="text-[9px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-widest">Digital Template PDF</div>
                    </div>
                    <ArrowRight size={18} className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </a>
                ) : (
                  <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl text-center">
                    <div className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Warning: Missing Documentation</div>
                    <div className="text-[8px] font-bold text-red-500/60 uppercase tracking-widest">Agreement template not found</div>
                  </div>
                )}
             </div>

             {/* Metadata */}
             <div className="pt-8 space-y-4 border-t border-border-subtle">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-black text-muted-foreground/40 uppercase tracking-widest">Entry Date</span>
                  <span className="font-bold text-foreground">{new Date(property.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-black text-muted-foreground/40 uppercase tracking-widest">Last Sync</span>
                  <span className="font-bold text-foreground">{new Date(property.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-black text-muted-foreground/40 uppercase tracking-widest">System Hash</span>
                  <span className="font-mono text-muted-foreground/40 uppercase text-[8px]">{id?.toString().substring(0, 16)}...</span>
                </div>
             </div>
           </section>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-8 bg-muted/20 rounded-[2.5rem] border border-border-subtle shadow-inner group hover:bg-muted/30 transition-all">
      <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-2 leading-none">{label}</div>
      <div className="text-base font-black text-foreground tracking-tight">{value}</div>
    </div>
  );
}

function ContactItem({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-muted/20 transition-all group">
      <div className="text-muted-foreground/20 group-hover:text-primary transition-colors">{icon}</div>
      <div>
         <div className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] leading-none mb-1">{label}</div>
         <div className="text-sm font-bold text-foreground tracking-tight">{value}</div>
      </div>
    </div>
  );
}

function ArrowRight({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
