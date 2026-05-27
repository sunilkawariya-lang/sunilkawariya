import React from 'react';
import { Scale, ShieldAlert, CheckCircle, Mail, MapPin } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 shadow-sm space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-100 pb-8 space-y-3">
        <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-2xl">
          <Scale size={28} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-slate-500 font-medium">Last Updated: May 22, 2026</p>
      </div>

      {/* Summary section */}
      <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100/50 space-y-3">
        <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
          <ShieldAlert size={18} className="text-amber-600 shrink-0" />
          Agreement of Utilization
        </h3>
        <p className="text-amber-950 text-sm leading-relaxed">
          Welcome to PMS Basket. By accessing, establishing an account with, or utilizing any of our automated portfolio, strategic advisory, or expert consultancy services, you agree to be bound by these Terms of Service. Please read them thoroughly.
        </p>
      </div>

      {/* Terms Point 1 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">1</span>
          Scope of Service & Disclaimer
        </h3>
        <div className="pl-9 text-slate-600 text-sm leading-relaxed space-y-2">
          <p>
            PMS Basket is a technological financial workspace providing premium dashboards, automated tracking, real-time index references, dynamic estimators, and diagnostic tools to help users analyze and optimize their investments.
          </p>
          <p className="text-rose-600 font-semibold">
            CRITICAL DISCLAIMER: All AI recommendations, indices tracking, asset allocation calculators, and wealth logs are provided strictly for educational and self-directed intelligence. We do NOT act as a licensed SEBI registered broker, certified legal estate planner, or tax auditor. Consultation sessions represent personal professional tips; final transactions carry systemic market risks.
          </p>
        </div>
      </div>

      {/* Terms Point 2 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">2</span>
          Interactive Google Meet Integration
        </h3>
        <div className="pl-9 text-slate-600 text-sm leading-relaxed space-y-2">
          <p>
            Our expert consultation suite supports interactive video conferencing links powered by your connected Google Meet credentials.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>You agree to utilize Google Meet links solely for direct advisory consultation.</li>
            <li>You must not recorded, streams, or broadcast the video discussions without explicit, bilateral verbal consent from the host representative.</li>
            <li>Use of Google Meet is also bound by the standard <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">Google Terms of Service</a>.</li>
          </ul>
        </div>
      </div>

      {/* Terms Point 3 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">3</span>
          Subscription Billing & Refunds
        </h3>
        <div className="pl-9 text-slate-600 text-sm leading-relaxed space-y-2">
          <p>
            Some premium features (like 1-on-1 advisor briefings or exclusive investment baskets) may cost professional charges. Payments are processed securely via sandboxed payment flows. Any requested cancellation is covered under our 100% unconditional refund policy if you file an email request within 24 hours of scheduled completion.
          </p>
        </div>
      </div>

      {/* Terms Point 4 */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">4</span>
          Limitation of Liability
        </h3>
        <div className="pl-9 text-slate-600 text-sm leading-relaxed">
          <p>
            In no event shall PMS Basket, its affiliates, or operational agents be held liable for any investment losses, portfolio declines, regulatory penalties, or unforeseen systems outages arising from dynamic calculation models.
          </p>
        </div>
      </div>

      {/* Footer support details */}
      <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-1">
          <CheckCircle size={14} className="text-amber-500" />
          <span>Legally binding digital user agreement</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Mail size={14} className="text-amber-600 animate-pulse" />
          <span>Legal Desk: <strong>sunil.kawariya@gmail.com</strong></span>
        </div>
      </div>
    </div>
  );
}
