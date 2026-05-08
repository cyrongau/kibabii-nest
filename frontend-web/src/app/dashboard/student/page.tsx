'use client';

import React from 'react';
import { Home, Calendar, MessageSquare, User, LogOut, Search, MapPin, Star, ShieldCheck } from 'lucide-react';

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 sticky top-0 h-screen">
        <div className="text-2xl font-black text-primary tracking-tighter mb-12">Kibabii Nest</div>
        
        <nav className="flex-1 space-y-2">
          <NavItem icon={<Home size={20} />} label="Overview" active />
          <NavItem icon={<Calendar size={20} />} label="My Bookings" />
          <NavItem icon={<MessageSquare size={20} />} label="Messages" />
          <NavItem icon={<Search size={20} />} label="Explore More" />
          <NavItem icon={<User size={20} />} label="Profile" />
        </nav>

        <button className="flex items-center gap-4 p-4 text-slate-400 font-bold hover:text-red-500 transition-colors mt-auto">
          <LogOut size={20} />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, Student!</h1>
            <p className="text-slate-500 font-medium mt-1">Manage your housing and bookings here.</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-2xl border-2 border-white shadow-sm flex items-center justify-center text-primary font-black">S</div>
        </header>

        {/* Current Booking */}
        <section className="mb-12">
          <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-widest text-[10px]">Active Booking</h2>
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-10 items-center">
            <div className="w-48 aspect-square rounded-[2rem] overflow-hidden shrink-0">
              <img src="/hostels/hostel-1.png" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Active Stay</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Royal Plaza Residency</h3>
              <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                <div className="flex items-center gap-1"><MapPin size={16} /> Near Main Gate</div>
                <div className="w-px h-4 bg-slate-200"></div>
                <div>Room 4B</div>
              </div>
              <div className="pt-4 flex gap-4">
                <button className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-black shadow-lg shadow-blue-100">View Agreement</button>
                <button className="bg-slate-50 text-slate-600 px-8 py-3 rounded-xl text-sm font-black border border-slate-100">Contact Host</button>
              </div>
            </div>
            <div className="text-right p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shrink-0 min-w-[200px]">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Payment</div>
              <div className="text-xl font-black text-slate-900 tracking-tight">Sept 1st, 2026</div>
              <div className="text-primary font-black mt-1 text-sm">KES 4,500</div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <ActionCard title="Report Issue" desc="Maintenance or safety concerns." color="bg-orange-50 text-orange-600" />
           <ActionCard title="Request Transfer" desc="Move to another room or hostel." color="bg-blue-50 text-blue-600" />
           <ActionCard title="Extend Stay" desc="Renew for the next semester." color="bg-green-50 text-green-600" />
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-primary text-white shadow-xl shadow-blue-100 font-black' : 'text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-600'}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ActionCard({ title, desc, color }: { title: string, desc: string, color: string }) {
  return (
    <div className={`p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2 bg-white hover:shadow-md transition-all cursor-pointer group`}>
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition-transform`}>!</div>
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="text-sm font-medium text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}
