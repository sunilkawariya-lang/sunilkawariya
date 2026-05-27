import React from 'react';
import { Shield, Lock, Eye, RefreshCw, Mail, Globe } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 shadow-sm space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-100 pb-8 space-y-3">
        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <Shield size={28} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-slate-500 font-medium">Last Updated: May 22, 2026</p>
      </div>

      {/* Summary section */}
      <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100/50 space-y-3">
        <h3 className="font-bold text-indigo-900 text-base flex items-center gap-2">
          <Lock size={18} className="text-indigo-600 shrink-0" />
          Our Commitment to Your Privacy
        </h3>
        <p className="text-indigo-950 text-sm leading-relaxed">
          At PMS Basket, we take your private personal and financial details exceptionally seriously. We employ institutional-grade 256-bit encryption and secure database controls. This Privacy Policy is designed to clearly detail how we collect, store, utilize, and protect your information, including information accessed via Google OAuth services.
        </p>
      </div>

      {/* Point 1 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">1</span>
          Information We Collect
        </h3>
        <div className="pl-9 space-y-2 text-slate-600 text-sm leading-relaxed">
          <p>We may collect and process the following categories of information to provide our premium wealth management suite:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li><strong>Personal Identity Detail:</strong> Display Name, Google Account Email address, and profile pictures when you authorize via Google Sign-In.</li>
            <li><strong>Financial Portfolio Data:</strong> Asset categories, stocks, mutual funds, PMS, liabilities, investment targets, and historical metrics manually added or imported.</li>
            <li><strong>Interactions & Advisory Logs:</strong> Records of consultancy bookings, expert feedback, and meeting summary notes.</li>
          </ul>
        </div>
      </div>

      {/* Point 2: Google API / OAuth Scope compliance */}
      <div className="space-y-3 border-l-4 border-indigo-500 pl-6 bg-slate-50/50 py-4 pr-6 rounded-r-2xl">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <Globe size={20} className="text-indigo-600 shrink-0" />
          Google API User Data & OAuth Policy
        </h3>
        <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
          <p>
            Our application integrates with Google Workspace APIs to enable seamless coordination. Specifically, we utilize the <strong>Google Meet REST API</strong> to dynamically generate secure video conference spaces when you list, schedule, or confirm your 1-on-1 premium wealth advisor advisory sessions.
          </p>
          <p className="font-semibold text-slate-800">How we handle Google user data:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>API Permissions:</strong> We only request the minimum required permissions (specifically the <code>https://www.googleapis.com/auth/meetings.space.created</code> or <code>https://www.googleapis.com/auth/meet</code> scopes) necessary to negotiate meeting appointments and create dynamic space locations on your behalf.</li>
            <li><strong>Transfer & Sharing:</strong> PMS Basket's use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold">Google API Services User Data Policy</a>, including the Limited Use requirements.</li>
            <li><strong>No Sale, Sharing, or Advertising:</strong> We never sell, share, trade, or analyze your Google-derived data with advertising networks, third parties, or marketing databases.</li>
            <li><strong>Data Retention:</strong> Google tokens and meeting references are safely stored solely in your client-side memory or securely encrypted Firestore database instance. They can be deleted instantly by logging out or terminating your linked account profile.</li>
          </ul>
        </div>
      </div>

      {/* Point 3 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">2</span>
          How We Use Your Data
        </h3>
        <div className="pl-9 space-y-2 text-slate-600 text-sm leading-relaxed">
          <p>We process collected data to uphold the following user-centric operations:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Refining, balancing, and forecasting investment asset allocations.</li>
            <li>Automating high-precision calculators, legacy estates, visual charts, and tax planner workflows.</li>
            <li>Providing instant, AI-driven advisory feedback using securely proxied models.</li>
            <li>Creating dynamic video conferencing spaces for direct member consultancy.</li>
          </ul>
        </div>
      </div>

      {/* Point 4 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">3</span>
          Security Measures
        </h3>
        <div className="pl-9 text-slate-600 text-sm leading-relaxed">
          <p>
            We implement strict physical, electronic, and procedural controls to retain data safety. This includes standard 256-bit Secure Sockets Layer (SSL) transmission security, sandboxed browser sessionStorage/localStorage handling, strictly enforced Firestore Security Rules, and isolated server-side processes.
          </p>
        </div>
      </div>

      {/* Point 5 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">4</span>
          User Choices & Data Deletion
        </h3>
        <div className="pl-9 text-slate-600 text-sm leading-relaxed">
          <p>
            You have complete sovereignty over your data. You may delete any transactions, portfolios, target goals, or personal accounts at any time through our interactive UI dashboard or by contacting support directly. Once requested, your personal data will be purged permanent from active storage.
          </p>
        </div>
      </div>

      {/* Footer support details */}
      <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-1">
          <Eye size={14} className="text-slate-400" />
          <span>General Privacy Compliance Guarantee</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Mail size={14} className="text-indigo-500" />
          <span>Support Contact: <strong>sunil.kawariya@gmail.com</strong></span>
        </div>
      </div>
    </div>
  );
}
