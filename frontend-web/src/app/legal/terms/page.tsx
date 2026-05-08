'use client';

import React from 'react';
import { Shield, FileText, Scale, Lock, Globe, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText size={40} />
          </div>
          <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground font-medium">Last Updated: May 6, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-card rounded-[40px] p-12 card-shadow border border-border space-y-12">
          <section>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <Globe className="text-primary" size={24} />
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Kibabii Nest, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service. We provide a platform connecting students with landlords and peer-to-peer marketplace services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <Shield className="text-primary" size={24} />
              2. User Conduct & Responsibilities
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">Users are responsible for maintaining the confidentiality of their account and password. You agree to:</p>
              <ul className="list-disc ml-6 text-muted-foreground space-y-2">
                <li>Provide accurate and complete information during registration.</li>
                <li>Not engage in any fraudulent or illegal activity on the platform.</li>
                <li>Respect the privacy and safety of other community members.</li>
                <li>Adhere to the marketplace rules regarding genuine listings.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <Scale className="text-primary" size={24} />
              3. Marketplace & Transactions
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Kibabii Nest acts as a facilitator for peer-to-peer transactions. We do not own, sell, or inspect items listed in the marketplace. Users are encouraged to follow our Safety Tips, meet in public places, and verify products before payment. Kibabii Nest is not liable for disputes arising from marketplace transactions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
              <Lock className="text-primary" size={24} />
              4. Termination of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate our terms, engage in harassment, or post prohibited content (including but not limited to alcohol, drugs, or illegal goods).
            </p>
          </section>

          <div className="pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/support" className="text-sm font-black text-primary hover:underline">Contact Support</Link>
            <Link href="/legal/privacy" className="text-sm font-black text-muted-foreground hover:text-primary transition-all">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
