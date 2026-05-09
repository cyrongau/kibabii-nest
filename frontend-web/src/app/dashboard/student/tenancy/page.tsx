'use client';

import React, { useState, useEffect } from 'react';
import { Home, Calendar, Clock, AlertTriangle, Upload, FileText, ArrowLeft, Bell, Send, Camera, Wrench, ShieldCheck, Check, Loader2, Megaphone, Info } from 'lucide-react';

export default function StudentTenancyPage() {
  const [tenancies, setTenancies] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenancy' | 'payments' | 'services' | 'notices'>('tenancy');
  const [showReceiptModal, setShowReceiptModal] = useState<string | null>(null);
  const [showVacationModal, setShowVacationModal] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [serviceForm, setServiceForm] = useState({ title: '', description: '', priority: 'MEDIUM', propertyId: '' });
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: any = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tenancyRes, srRes, noticesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/tenancy/my-tenancies`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/service-requests/my-requests`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/notices/my-notices`, { headers }),
      ]);
      if (tenancyRes.ok) setTenancies(await tenancyRes.json());
      if (srRes.ok) setServiceRequests(await srRes.json());
      if (noticesRes.ok) setNotices(await noticesRes.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleVacationNotice = async (tenancyId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/tenancy/${tenancyId}/vacation-notice`, { method: 'POST', headers });
    if (res.ok) { setShowVacationModal(null); fetchData(); }
  };

  const handleReceiptSubmit = async (paymentId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/payments/${paymentId}/receipt`, {
      method: 'POST', headers,
      body: JSON.stringify({ rawText: receiptText }),
    });
    if (res.ok) { setShowReceiptModal(null); setReceiptText(''); fetchData(); }
  };

  const handleServiceSubmit = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/service-requests`, {
      method: 'POST', headers,
      body: JSON.stringify(serviceForm),
    });
    if (res.ok) { setShowServiceModal(false); setServiceForm({ title: '', description: '', priority: 'MEDIUM', propertyId: '' }); fetchData(); }
  };

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-600 border-green-100',
    NOTICE_GIVEN: 'bg-amber-50 text-amber-600 border-amber-100',
    BREAK_HOLD: 'bg-blue-50 text-blue-600 border-blue-100',
    VACATED: 'bg-slate-100 text-slate-500 border-slate-200',
    PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
    SUBMITTED: 'bg-blue-50 text-blue-600 border-blue-100',
    VERIFIED: 'bg-green-50 text-green-600 border-green-100',
    PAID: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    OVERDUE: 'bg-red-50 text-red-600 border-red-100',
    OPEN: 'bg-amber-50 text-amber-600 border-amber-100',
    IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
    RESOLVED: 'bg-green-50 text-green-600 border-green-100',
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  const activeTenancies = tenancies.filter(t => t.status !== 'VACATED');
  const pastTenancies = tenancies.filter(t => t.status === 'VACATED');
  const allPayments = tenancies.flatMap(t => (t.payments || []).map((p: any) => ({ ...p, tenancy: t })));

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <a href="/dashboard/student" className="text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></a>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Tenancy</h1>
            <p className="text-slate-500 text-sm font-medium">Manage your housing, payments & services</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { key: 'tenancy', label: 'Tenancy', icon: <Home size={16} /> },
            { key: 'notices', label: 'Notices', icon: <Megaphone size={16} />, badge: notices.length > 0 ? notices.length : null },
            { key: 'payments', label: 'Payments', icon: <Calendar size={16} /> },
            { key: 'services', label: 'Service Requests', icon: <Wrench size={16} /> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all shrink-0 ${
                activeTab === tab.key ? 'bg-primary text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-500 border border-slate-100'
              }`}>
              {tab.icon} {tab.label}
              {tab.badge && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? 'bg-white text-primary' : 'bg-primary text-white'}`}>{tab.badge}</span>}
            </button>
          ))}
        </div>

        {/* Tenancy Tab */}
        {activeTab === 'tenancy' && (
          <div className="space-y-12">
            {activeTenancies.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100">
                <Home className="mx-auto text-slate-300 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900">No active tenancy</h2>
                <p className="text-slate-500 font-medium mt-2">Book a property to start your tenancy.</p>
                <a href="/hostels" className="inline-block mt-6 bg-primary text-white px-8 py-3 rounded-xl font-black">Browse Hostels</a>
              </div>
            ) : (
              <div className="space-y-6">
                {activeTenancies.map(t => (
                  <TenancyCard 
                    key={t.id} 
                    t={t} 
                    statusColor={statusColor} 
                    headers={headers}
                    onVacation={setShowVacationModal}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            )}

            {/* Tenancy History */}
            {pastTenancies.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 ml-4">Tenancy History</h3>
                <div className="space-y-4">
                  {pastTenancies.map(t => (
                    <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-100 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          <Clock size={20} />
                        </div>
                        <div>
                          <div className="font-black text-slate-900">{t.propertyUnit?.property?.name}</div>
                          <div className="text-xs text-slate-400 font-medium">
                            {new Date(t.moveInDate).toLocaleDateString()} - {t.moveOutDate ? new Date(t.moveOutDate).toLocaleDateString() : 'Vacated'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {t.agreementUrl && (
                          <a href={t.agreementUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black text-primary hover:underline">
                            <FileText size={14} /> Agreement
                          </a>
                        )}
                        <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-3 py-1 rounded-lg">Vacated</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notices Tab */}
        {activeTab === 'notices' && (
          <div className="space-y-6">
            {notices.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100">
                <Megaphone className="mx-auto text-slate-300 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900">No active notices</h2>
                <p className="text-slate-500 font-medium mt-2">Important updates from your landlord will appear here.</p>
              </div>
            ) : notices.map((notice: any) => (
              <div key={notice.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                     notice.type === 'MAINTENANCE' ? 'bg-amber-50 text-amber-600' :
                     notice.type === 'RULES_UPDATE' ? 'bg-purple-50 text-purple-600' :
                     notice.type === 'AGREEMENT_UPDATE' ? 'bg-blue-50 text-blue-600' :
                     'bg-slate-50 text-slate-600'
                   }`}>
                      {notice.type === 'MAINTENANCE' ? <Clock size={24} /> : 
                       notice.type === 'RULES_UPDATE' ? <AlertTriangle size={24} /> :
                       notice.type === 'AGREEMENT_UPDATE' ? <ShieldCheck size={24} /> :
                       <Megaphone size={24} />}
                   </div>
                   <div>
                     <div className="flex items-center gap-3">
                       <h3 className="text-lg font-black text-slate-900">{notice.title}</h3>
                       <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-500">{notice.type.replace('_', ' ')}</span>
                     </div>
                     <div className="text-xs font-bold text-slate-400">{notice.property?.name} · {new Date(notice.createdAt).toLocaleDateString()}</div>
                   </div>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">{notice.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {allPayments.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100">
                <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900">No payment records</h2>
                <p className="text-slate-500 font-medium mt-2">Payment records will appear here once generated.</p>
              </div>
            ) : allPayments.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl p-6 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm">
                    {['','J','F','M','A','M','J','J','A','S','O','N','D'][p.month]}
                  </div>
                  <div>
                    <div className="font-black text-slate-900">
                      {['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][p.month]} {p.year}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Due: {new Date(p.dueDate).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <div className="font-black text-slate-900">Ksh {p.amountDue.toLocaleString()}</div>
                    {p.penaltyAmount > 0 && <div className="text-xs text-red-600 font-bold">+Ksh {p.penaltyAmount.toLocaleString()} penalty</div>}
                    {p.discountAmount > 0 && <div className="text-xs text-green-600 font-bold">-Ksh {p.discountAmount.toLocaleString()} discount</div>}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${statusColor[p.status] || ''}`}>{p.status}</span>
                  {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                    <button onClick={() => setShowReceiptModal(p.id)} className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition-colors">
                      <Upload size={14} className="inline mr-1" /> Upload Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <button onClick={() => { setServiceForm(f => ({ ...f, propertyId: activeTenancies[0]?.propertyUnit?.property?.id || '' })); setShowServiceModal(true); }}
              className="bg-primary text-white px-6 py-3 rounded-xl font-black text-sm mb-4">
              + New Service Request
            </button>
            {serviceRequests.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100">
                <Wrench className="mx-auto text-slate-300 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900">No service requests</h2>
              </div>
            ) : serviceRequests.map((sr: any) => (
              <div key={sr.id} className="bg-white rounded-2xl p-6 border border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-900">{sr.title}</h3>
                    <p className="text-slate-500 text-sm mt-1">{sr.description}</p>
                    <div className="text-xs text-slate-400 font-medium mt-2">{sr.property?.name} · {new Date(sr.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${statusColor[sr.status] || ''}`}>{sr.status.replace('_', ' ')}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 text-slate-500">{sr.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vacation Notice Confirmation Modal */}
      {showVacationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl">
            <AlertTriangle className="text-amber-500 mb-4" size={40} />
            <h2 className="text-xl font-black text-slate-900 mb-2">Confirm 30-Day Vacation Notice</h2>
            <p className="text-slate-500 text-sm mb-6">This action is irreversible. Your unit will be advertised as "Available Soon" with a countdown timer.</p>
            <div className="flex gap-4">
              <button onClick={() => handleVacationNotice(showVacationModal)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black">Confirm Notice</button>
              <button onClick={() => setShowVacationModal(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900 mb-4">Upload Payment Receipt</h2>
            <p className="text-slate-500 text-sm mb-6">Paste your M-Pesa SMS or bank transaction message below. Our AI will extract the payment details automatically.</p>
            <textarea value={receiptText} onChange={e => setReceiptText(e.target.value)} rows={5} placeholder="Paste SMS or transaction text here..."
              className="w-full p-4 rounded-xl border border-slate-200 text-sm font-mono mb-4 focus:outline-none focus:border-primary" />
            <div className="flex gap-4">
              <button onClick={() => handleReceiptSubmit(showReceiptModal)} disabled={!receiptText.trim()}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-black disabled:opacity-50"><Send size={16} className="inline mr-2" />Submit</button>
              <button onClick={() => { setShowReceiptModal(null); setReceiptText(''); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900 mb-4">New Service Request</h2>
            <div className="space-y-4">
              <input value={serviceForm.title} onChange={e => setServiceForm(f => ({ ...f, title: e.target.value }))} placeholder="Issue title (e.g. Broken tap)"
                className="w-full p-4 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-primary" />
              <textarea value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the issue in detail..."
                className="w-full p-4 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-primary" />
              <select value={serviceForm.priority} onChange={e => setServiceForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full p-4 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-primary">
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={handleServiceSubmit} disabled={!serviceForm.title.trim()} className="flex-1 bg-primary text-white py-3 rounded-xl font-black disabled:opacity-50">Submit Request</button>
              <button onClick={() => setShowServiceModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TenancyCard({ t, statusColor, onVacation, headers, onRefresh }: { t: any, statusColor: any, onVacation: (id: string) => void, headers: any, onRefresh: () => void }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleSignAgreement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);
    try {
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/contracts/upload`, {
        method: 'POST',
        headers: { 'Authorization': headers.Authorization },
        body: data,
      });
      const uploadResult = await uploadRes.json();
      
      const signRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/tenancy/${t.id}/sign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ agreementUrl: uploadResult.url }),
      });
      if (signRes.ok) {
        onRefresh();
      }
    } catch (e) { console.error(e); }
    finally { setIsUploading(false); }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-900">{t.propertyUnit?.property?.name}</h3>
          <p className="text-slate-500 font-medium text-sm">{t.unitName || t.propertyUnit?.type?.name} · {t.propertyUnit?.property?.address}</p>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${statusColor[t.status]}`}>{t.status.replace('_', ' ')}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-6 bg-slate-50/50 rounded-2xl border border-slate-50">
        <InfoItem label="Monthly Rent" value={`Ksh ${t.monthlyRent?.toLocaleString()}`} />
        <InfoItem label="Deposit" value={`Ksh ${t.depositAmount?.toLocaleString()}`} />
        <InfoItem label="Due Day" value={`${t.paymentDeadlineDay}th of month`} />
        <InfoItem label="Move-in" value={new Date(t.moveInDate).toLocaleDateString()} />
      </div>

      {/* Tenancy Documentation Section */}
      <div className="mb-8 border-t border-slate-50 pt-8">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FileText size={14} /> Tenancy Documentation
        </h4>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between group hover:border-primary transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
                <FileText size={18} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">Signed Agreement</div>
                <div className="text-[10px] font-bold text-slate-400">
                  {t.signedAt ? `Signed on ${new Date(t.signedAt).toLocaleDateString()}` : 'Not signed yet'}
                </div>
              </div>
            </div>
            {t.agreementUrl ? (
              <a href={t.agreementUrl} target="_blank" rel="noreferrer" className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-800 transition-colors">View Document</a>
            ) : (
              <label className="cursor-pointer bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-blue-700 transition-colors">
                {isUploading ? 'Uploading...' : 'Sign & Upload'}
                <input type="file" className="hidden" onChange={handleSignAgreement} disabled={isUploading} />
              </label>
            )}
          </div>
          
          <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">Platform Verification</div>
                <div className="text-[10px] font-bold text-slate-400">Occupancy History Protected</div>
              </div>
            </div>
            <div className="w-6 h-6 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><Check size={14} /></div>
          </div>
        </div>
      </div>

      {t.vacationNotice && !t.vacationNotice.processed && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 mb-6">
          <div className="flex items-center gap-2 text-amber-600 font-black text-sm mb-1"><Bell size={16} /> Vacation Notice Active</div>
          <p className="text-amber-700 text-sm">You will vacate on <strong>{new Date(t.vacationNotice.vacationDate).toLocaleDateString()}</strong>.
            {(() => { const d = Math.ceil((new Date(t.vacationNotice.vacationDate).getTime() - Date.now()) / 86400000); return ` (${d} days remaining)`; })()}
          </p>
        </div>
      )}

      {t.status === 'ACTIVE' && (
        <div className="flex gap-4">
          <button onClick={() => onVacation(t.id)} className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-black text-sm border border-red-100 hover:bg-red-100 transition-colors">
            Give 30-Day Notice
          </button>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
      <div className="font-black text-slate-900 text-sm mt-1">{value}</div>
    </div>
  );
}
