'use client';

import React from 'react';
import { Lock, Eye, Database, ShieldCheck, UserCheck, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-teal-500/10 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground font-medium">Last Updated: May 6, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-card rounded-[40px] p-12 card-shadow border border-border space-y-12">
          <section>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <Eye className="text-teal-600" size={24} />
              1. Information We Collect
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">We collect information to provide a better experience and ensure platform security:</p>
              <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                <li><strong>Identity Data:</strong> Name, email, phone number, and student/landlord verification documents.</li>
                <li><strong>Transaction Data:</strong> Booking history, marketplace listings, and payment confirmations.</li>
                <li><strong>Communication Data:</strong> In-app chat logs and support tickets.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <Database className="text-teal-600" size={24} />
              2. How We Use Your Data
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is used to verify identities (KYC), facilitate bookings, and moderate the marketplace. We use automated keyword processing to flag prohibited items and ensure a safe environment for all students.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <ShieldCheck className="text-teal-600" size={24} />
              3. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard encryption and security measures to protect your documents and personal information. Identity documents are stored securely and only accessible by authorized administrators for verification purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <UserCheck className="text-teal-600" size={24} />
              4. Third-Party Sharing
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal data. We may share information with landlords only after a booking is confirmed to facilitate your tenancy. Marketplace contact information is shared only when you choose to initiate communication.
            </p>
          </section>

          <div className="pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/support" className="text-sm font-black text-teal-600 hover:underline flex items-center gap-2">
              <Mail size={16} />
              Contact Privacy Team
            </Link>
            <Link href="/legal/terms" className="text-sm font-black text-muted-foreground hover:text-teal-600 transition-all">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
