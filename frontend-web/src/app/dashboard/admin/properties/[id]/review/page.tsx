'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle2, XCircle, MapPin, Image as ImageIcon, Video, 
  ShieldCheck, Loader2, Home, User, Mail, Phone, Calendar, Info, FileText,
  Save, Plus, Zap, Droplets, Wifi, Trash2, Shield, Brush
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function PropertyReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useNotifications();
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingUnits, setIsEditingUnits] = useState(false);
  const [isEditingUtilities, setIsEditingUtilities] = useState(false);
  const [hadNoUnitsOriginally, setHadNoUnitsOriginally] = useState(false);

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
        setHadNoUnitsOriginally(!data.units || data.units.length === 0);
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
        setHadNoUnitsOriginally(false);
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

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review Property</h1>
            <p className="text-slate-500 font-medium">Detailed scrutiny for platform verification.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            disabled={isProcessing || !property.verified}
            onClick={() => handleVerify(false)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-red-100 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-50 disabled:opacity-50 transition-all"
          >
            <XCircle size={18} /> Revoke Verification
          </button>
          <button 
            disabled={isProcessing || property.verified}
            onClick={() => handleVerify(true)}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-green-100 hover:bg-green-700 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 size={18} /> Approve & Verify
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-12">
          {/* Main Info */}
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">{property.name}</h2>
                <div className="flex items-center gap-2 text-slate-400 font-bold">
                  <MapPin size={16} /> {property.address}, {property.city}
                </div>
              </div>
              <span className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${property.verified ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                {property.verified ? 'Verified Listing' : 'Pending Verification'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <DetailBox label="Category" value={property.category?.name || 'Standard'} />
              <DetailBox label="Price Starts At" value={`Ksh ${property.price?.toLocaleString()}`} />
              <DetailBox label="Distance to Campus" value={`${property.distanceToCampus}m`} />
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Description</h3>
              <p className="text-slate-600 leading-relaxed font-medium">{property.description}</p>
            </div>
          </section>

          {/* Utilities & Services */}
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <Zap className="text-yellow-500" /> Utilities & Services
              </h3>
              <button 
                onClick={() => setIsEditingUtilities(!isEditingUtilities)}
                className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
              >
                {isEditingUtilities ? 'Cancel Editing' : 'Edit Utilities'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'water', label: 'Water Supply', icon: Droplets, color: 'text-blue-500' },
                { key: 'electricity', label: 'Electricity', icon: Zap, color: 'text-yellow-500' },
                { key: 'wifi', label: 'WiFi / Internet', icon: Wifi, color: 'text-indigo-500' },
                { key: 'garbage', label: 'Garbage Collection', icon: Trash2, color: 'text-emerald-500' },
                { key: 'security', label: '24/7 Security', icon: Shield, color: 'text-slate-700' },
                { key: 'cleaning', label: 'Cleaning Services', icon: Brush, color: 'text-pink-500' },
              ].map((item) => {
                const config = (property.utilityConfig as any)?.[item.key] || { included: false, details: '' };
                return (
                  <div key={item.key} className={`p-6 rounded-[2rem] border transition-all ${config.included ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-white shadow-sm ${item.color}`}>
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
                          className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none"
                        >
                          <option value="true">Included</option>
                          <option value="false">Tenant Paid</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${config.included ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {config.included ? 'Included' : 'Tenant Paid'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-black text-slate-900">{item.label}</div>
                      {isEditingUtilities ? (
                        <input 
                          type="text"
                          value={config.details}
                          onChange={(e) => {
                            const newConfig = { ...(property.utilityConfig || {}) };
                            newConfig[item.key] = { ...config, details: e.target.value };
                            setProperty({ ...property, utilityConfig: newConfig });
                          }}
                          placeholder="e.g. Fixed rate, Token based..."
                          className="w-full text-xs font-bold text-slate-600 bg-transparent border-b border-slate-200 focus:border-primary outline-none py-1"
                        />
                      ) : (
                        <div className="text-xs font-bold text-slate-400 line-clamp-1">{config.details || (config.included ? 'Standard service' : 'Managed by student')}</div>
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
                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Utilities Configuration
              </button>
            )}
          </section>

          {/* Media Review */}
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
             <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
               <ImageIcon className="text-blue-500" /> Photo & Video Gallery
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.images?.map((img: string, idx: number) => (
                  <div key={idx} className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-50">
                    <img src={img} alt={`Property ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {property.images?.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 font-bold">No photos uploaded</div>}
             </div>
             {property.videoUrl ? (
                <div className="mt-8">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Video size={14} /> Property Walkthrough</h4>
                  <div className="aspect-video bg-slate-100 rounded-[2.5rem] overflow-hidden border-2 border-slate-50">
                     <iframe className="w-full h-full" src={property.videoUrl.replace('watch?v=', 'embed/')} />
                  </div>
                </div>
              ) : (
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <Video className="mx-auto text-slate-200 mb-2" size={32} />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No video walkthrough provided</p>
                </div>
              )}
          </section>

          {/* Unit Types */}
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
             <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <Home className="text-purple-500" /> Unit Configurations
               </h3>
               <div className="flex items-center gap-4">
                 {isEditingUnits && hadNoUnitsOriginally && (
                   <button 
                     onClick={() => {
                       const newUnit = { 
                         id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
                         type: { name: 'Standard Room' }, 
                         price: 5000, 
                         capacity: 1, 
                         totalUnits: 1,
                         upfrontDiscountPct: 0,
                         unitNames: []
                       };
                       setProperty({ ...property, units: [...(property.units || []), newUnit] });
                     }}
                     className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all flex items-center gap-1"
                   >
                     <Plus size={12} /> Add Unit
                   </button>
                 )}
                 <button 
                   onClick={() => setIsEditingUnits(!isEditingUnits)}
                   className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                 >
                   {isEditingUnits ? 'Cancel Editing' : 'Edit Units'}
                 </button>
               </div>
             </div>
             
             <div className="space-y-4">
               {property.units && property.units.length > 0 ? (
                 property.units.map((unit: any, index: number) => (
                   <div key={unit.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative group/unit">
                      {isEditingUnits && hadNoUnitsOriginally && (
                        <button 
                          onClick={() => {
                            const newUnits = property.units.filter((_: any, i: number) => i !== index);
                            setProperty({ ...property, units: newUnits });
                          }}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-sm border border-slate-100 flex items-center justify-center opacity-0 group-hover/unit:opacity-100 transition-all hover:bg-red-50"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      
                      {isEditingUnits ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Type Name</label>
                                <input 
                                  type="text" 
                                  defaultValue={unit.type?.name || ''}
                                  onChange={(e) => {
                                    const newUnits = [...property.units];
                                    newUnits[index] = { ...newUnits[index], type: { ...newUnits[index].type, name: e.target.value } };
                                    setProperty({ ...property, units: newUnits });
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                                  placeholder="e.g. Bedsitter, Single Room"
                                />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (Ksh/Month)</label>
                                <input 
                                  type="number" 
                                  defaultValue={unit.price}
                                  onChange={(e) => {
                                    const newUnits = [...property.units];
                                    newUnits[index] = { ...newUnits[index], price: Number(e.target.value) };
                                    setProperty({ ...property, units: newUnits });
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                                />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Long-stay Discount (%)</label>
                                <input 
                                  type="number" 
                                  defaultValue={unit.upfrontDiscountPct || 0}
                                  onChange={(e) => {
                                    const newUnits = [...property.units];
                                    newUnits[index] = { ...newUnits[index], upfrontDiscountPct: Number(e.target.value) };
                                    setProperty({ ...property, units: newUnits });
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                                />
                             </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacity (Students)</label>
                                <input 
                                  type="number" 
                                  defaultValue={unit.capacity}
                                  onChange={(e) => {
                                    const newUnits = [...property.units];
                                    newUnits[index] = { ...newUnits[index], capacity: Number(e.target.value) };
                                    setProperty({ ...property, units: newUnits });
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                                />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Available Units</label>
                                <input 
                                  type="number" 
                                  defaultValue={unit.totalUnits}
                                  onChange={(e) => {
                                    const newUnits = [...property.units];
                                    newUnits[index] = { ...newUnits[index], totalUnits: Number(e.target.value) };
                                    setProperty({ ...property, units: newUnits });
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                                />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Labels (Comma Sep)</label>
                                <input 
                                  type="text" 
                                  defaultValue={unit.unitNames?.join(', ') || ''}
                                  onChange={(e) => {
                                    const newUnits = [...property.units];
                                    newUnits[index] = { ...newUnits[index], unitNames: e.target.value.split(',').map(s => s.trim()) };
                                    setProperty({ ...property, units: newUnits });
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                                  placeholder="e.g. 1A, 1B"
                                />
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-black text-slate-900">{unit.type?.name || 'Unit'}</div>
                            <div className="text-xs font-bold text-slate-400 mt-1 uppercase flex items-center gap-2">
                              Capacity: {unit.capacity} Students · Total Units: {unit.totalUnits}
                              {unit.upfrontDiscountPct > 0 && (
                                <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] lowercase">
                                  {unit.upfrontDiscountPct}% long-stay discount
                                </span>
                              )}
                            </div>
                            {unit.unitNames?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {unit.unitNames.map((name: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black text-primary">Ksh {unit.price?.toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Per Month</div>
                          </div>
                        </div>
                      )}
                   </div>
                 ))
               ) : (
                 <div className="p-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                    <Home className="mx-auto text-slate-300 mb-4" size={40} />
                    <p className="text-slate-500 font-bold tracking-tight">No unit types defined for this property.</p>
                    <p className="text-slate-400 text-xs mt-1 mb-6">Units must be added before students can book.</p>
                    {isEditingUnits && (
                      <button 
                        onClick={() => {
                          const newUnit = { 
                            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
                            type: { name: 'Standard Room' }, 
                            price: 5000, 
                            capacity: 1, 
                            totalUnits: 1 
                          };
                          setProperty({ ...property, units: [newUnit] });
                        }}
                        className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all inline-flex items-center gap-2"
                      >
                        <Plus size={14} /> Add First Unit
                      </button>
                    )}
                 </div>
               )}
               
               {isEditingUnits && property.units?.length > 0 && (
                 <button 
                   onClick={handleSaveUnits}
                   disabled={isProcessing}
                   className="w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                 >
                   {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                   Save Unit Configurations
                 </button>
               )}
             </div>
          </section>
        </div>

        {/* Right Column: Landlord & Compliance */}
        <div className="space-y-12">
           {/* Landlord Info */}
           <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
             <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
               <User className="text-blue-500" /> Landlord Details
             </h3>
             <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                  <img src={`https://ui-avatars.com/api/?name=${property.landlord?.name}&background=random`} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">{property.landlord?.name}</div>
                  <div className="text-xs font-bold text-green-500 flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified Landlord
                  </div>
                </div>
             </div>
             <div className="space-y-4 px-2">
                <ContactItem icon={<Mail size={16} />} value={property.landlord?.email} />
                <ContactItem icon={<Phone size={16} />} value={property.landlord?.phone || 'No phone provided'} />
             </div>
           </section>

           {/* Agreement Template */}
           <section className="bg-gradient-to-br from-slate-900 to-indigo-950 p-10 rounded-[3rem] shadow-xl text-white space-y-6">
              <h3 className="text-xl font-black flex items-center gap-3">
                <FileText className="text-indigo-400" /> Agreement Template
              </h3>
              <p className="text-indigo-200 text-sm font-medium leading-relaxed">
                Review the tenancy agreement template that students will sign upon booking approval.
              </p>
              {property.agreementTemplateUrl ? (
                <a 
                  href={property.agreementTemplateUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block w-full bg-white text-slate-900 py-4 rounded-2xl text-center text-sm font-black hover:bg-indigo-50 transition-colors"
                >
                  View Full Agreement PDF
                </a>
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center text-sm font-bold text-red-300">
                  No agreement template uploaded!
                </div>
              )}
           </section>

           {/* Submission Meta */}
           <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Submitted On</span>
                  <span className="font-black text-slate-900">{new Date(property.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Last Updated</span>
                  <span className="font-black text-slate-900">{new Date(property.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Property ID</span>
                  <span className="font-mono text-slate-400 text-[10px]">{id}</span>
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
    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/50">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}

function ContactItem({ icon, value }: { icon: React.ReactNode, value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
      <div className="text-slate-300">{icon}</div>
      {value}
    </div>
  );
}
