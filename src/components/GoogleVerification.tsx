import React from 'react';
import { Shield, CheckCircle2, Globe, ExternalLink, Mail, Info, Terminal, Settings } from 'lucide-react';

export default function GoogleVerification() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/85 p-6 md:p-10 shadow-sm space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Shield size={24} />
            </span>
            Google OAuth Deployment Guide
          </h1>
          <p className="text-xs text-slate-500 font-medium">Production setup dashboard for PMS Basket deployment without Google review bottlenecks.</p>
        </div>
        <a 
          href="https://console.cloud.google.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all text-center"
        >
          <span>Google Cloud Console</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Main Announcement Alert: No verification required! */}
      <div className="p-6 bg-emerald-50/60 rounded-[2rem] border border-emerald-200/50 space-y-4">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl shrink-0">
            <CheckCircle2 size={24} className="animate-bounce" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Google Verification Bypassed (Not Required!)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We have successfully **disabled the Google Meet integration and retired all sensitive/restrictive scopes** (such as <code>meetings.space.created</code>). 
              Our application now relies exclusively on **standard, non-sensitive Google Sign-In scopes** for simple, secure login.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-16 pt-2">
          <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100/50 space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">OAuth Review Status</span>
            <span className="text-sm font-black text-slate-800">No Review or Audit Needed</span>
          </div>
          <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100/50 space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Time to Production</span>
            <span className="text-sm font-black text-slate-800">Instant (Go Live in 5 Mins)</span>
          </div>
        </div>
      </div>

      {/* Active Scopes Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Active Non-Sensitive Scopes</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Because these scopes are classified as basic identity details, Google permits immediate production usage without any compliance screening, video reviews, or audits.
        </p>

        <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-500 w-[40%]">Scope URI</th>
                <th className="px-4 py-3 font-bold text-slate-500 w-[25%]">Classification</th>
                <th className="px-4 py-3 font-bold text-slate-500 w-[35%]">Purpose in PMS Basket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              <tr>
                <td className="px-4 py-3 font-mono text-indigo-600">openid</td>
                <td className="px-4 py-3 text-emerald-600">Non-sensitive</td>
                <td className="px-4 py-3 text-slate-500">Associate user identity metadata</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-indigo-600">https://www.googleapis.com/.../userinfo.email</td>
                <td className="px-4 py-3 text-emerald-600">Non-sensitive</td>
                <td className="px-4 py-3 text-slate-500">Retrieve email address for secure authentication</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-indigo-600">https://www.googleapis.com/.../userinfo.profile</td>
                <td className="px-4 py-3 text-emerald-600">Non-sensitive</td>
                <td className="px-4 py-3 text-slate-500">Display user's name and profile photo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Deployment Launch Checklist */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">PMS Basket Production Launch Protocol</h3>
        </div>
        <p className="text-xs text-slate-500">Follow these 4 simple steps in your Google Cloud Developer Console to authorize Google login for your live product URL:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">1</span>
              Configure Authorized Domains
            </h4>
            <p className="text-xs text-slate-600 leading-normal">
              In the <strong>OAuth Consent Screen</strong> dashboard, add your deployed domain (e.g. <code>run.app</code> if utilizing Cloud Run, or your custom domain) to the <strong>Authorized Domains</strong> section.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">2</span>
              Set Credentials Redirect URIs
            </h4>
            <p className="text-xs text-slate-600 leading-normal">
              Navigate to <strong>Credentials</strong>, edit your Web Client ID, and insert your production Callback URLs under <strong>Authorized Redirect URIs</strong>. For Firebase Auth, enter:
              <code className="block bg-white text-[9.5px] p-2 mt-1.5 rounded-lg border border-slate-200 text-slate-700 font-mono select-all truncate">
                https://your-firebase-project.firebaseapp.com/__/auth/handler
              </code>
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">3</span>
              Update Privacy & Terms links
            </h4>
            <p className="text-xs text-slate-600 leading-normal">
              Input the live URL references for your Privacy Policy and Terms inside the Consent Screen form:
              <span className="block text-[10px] mt-1 text-indigo-600 font-mono">
                [Deploy URL]/#/privacy-policy<br />[Deploy URL]/#/terms-of-service
              </span>
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">4</span>
              Publish Application to Production
            </h4>
            <p className="text-xs text-slate-600 leading-normal">
              Switch the Publishing Status of your app from <strong>Testing</strong> to <strong>In Production</strong> inside the Google Consent screen. This guarantees that any user can log in without "unverified app" warnings!
            </p>
          </div>
        </div>
      </div>

      {/* Info Card alerting them about deployment URL setup */}
      <div className="flex gap-3 bg-indigo-50 border border-indigo-100/50 text-indigo-950 text-xs p-4 rounded-2xl leading-relaxed">
        <Info className="text-indigo-600 shrink-0 mt-0.5" size={18} />
        <div>
          <strong className="block font-bold">Self-Regulated Verification Exemption:</strong>
          Since you no longer have restricted integrations, your deployment can be completed instantly. You are fully exempt from recording compliance videos or scheduling review appointments with Google trust specialists.
        </div>
      </div>

      {/* Footer support details */}
      <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-1">
          <Globe size={14} className="text-slate-400" />
          <span>PMS Basket Deployment Hub</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Mail size={14} className="text-indigo-500" />
          <span>Deployment Inquiries: <strong>sunil.kawariya@gmail.com</strong></span>
        </div>
      </div>
    </div>
  );
}
