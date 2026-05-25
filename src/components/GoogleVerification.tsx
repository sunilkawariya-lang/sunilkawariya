import React, { useState } from 'react';
import { Chrome, Shield, CheckCircle, FileText, Video, Eye, ArrowRight, HelpCircle, AlertTriangle, ExternalLink, Key, Users } from 'lucide-react';

export default function GoogleVerification() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: 'Prerequisites & Setup',
      description: 'Prepare your domain and cloud project assets',
      icon: Chrome
    },
    {
      id: 2,
      title: 'OAuth Consent Screen',
      description: 'Configure branding, scopes, and domains',
      icon: Shield
    },
    {
      id: 3,
      title: 'Define Restrictive Scopes',
      description: 'Select Google Meet & Google Workspace scopes',
      icon: Key
    },
    {
      id: 4,
      title: 'Submit & Video Demo',
      description: 'Submit for review with required screen recordings',
      icon: Video
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/85 p-6 md:p-10 shadow-sm space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Shield size={24} />
            </span>
            Google OAuth Verification Guide
          </h1>
          <p className="text-xs text-slate-500 font-medium">A step-by-step operational protocol to approve the application for production use with Google APIs.</p>
        </div>
        <a 
          href="https://console.cloud.google.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <span>Google Cloud Console</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Navigation horizontal progress steps */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {steps.map((s) => {
          const StepIcon = s.icon;
          const isActive = s.id === activeStep;
          const isCompleted = s.id < activeStep;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                isActive 
                  ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900' 
                  : isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/20 text-slate-700' 
                    : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                isActive 
                  ? 'bg-indigo-600 text-white' 
                  : isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 text-slate-500'
              }`}>
                {isCompleted ? <CheckCircle size={16} /> : <StepIcon size={16} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold block">Step {s.id}: {s.title}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{s.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="border border-slate-100 rounded-2xl p-6 md:p-8 bg-slate-50/40 space-y-6">
        {activeStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-black font-mono">01</span>
              <h2 className="text-lg font-bold text-slate-900">Configure Cloud Project & Domains</h2>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              Verify that you have a verified, active domain nameserver before submitting your Google Cloud Console project. Your current workspace operates on Cloud Run. Let's establish these items:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink size={14} className="text-indigo-600" />
                  Your Privacy Policy Link
                </h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Your Privacy Policy is dynamic and deployed inside the app. Ensure Google has access to this exact URL:
                </p>
                <code className="block bg-slate-50 text-[10px] p-2 rounded-lg text-indigo-700 font-mono select-all truncate mt-1">
                  {window.location.origin}/#/privacy-policy
                </code>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-indigo-600" />
                  Your Terms of Service Link
                </h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Google expects a Terms of Service URL matching the OAuth Authorized Domains list:
                </p>
                <code className="block bg-slate-50 text-[10px] p-2 rounded-lg text-indigo-700 font-mono select-all truncate mt-1">
                  {window.location.origin}/#/terms-of-service
                </code>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900 text-xs leading-relaxed">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="block font-bold">Authorized Domain Matching:</strong>
                Your Authorized Domains in Google Cloud MUST include the root domain of your hosting provider (e.g. if the hosting URL is <code>https://your-app.run.app</code>, add <code>run.app</code> as an authorized domain).
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-black font-mono">02</span>
              <h2 className="text-lg font-bold text-slate-900">OAuth Consent Screen Settings</h2>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Navigate to the <strong>APIs & Services &gt; OAuth Consent Screen</strong> menu option in your Google Cloud platform console. Configure these values explicitly:
            </p>

            <ul className="space-y-3.5">
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold shrink-0 mt-0.5">A</span>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-950 font-bold block">User Type:</strong>
                  Choose <strong>External</strong> so that users from any organization or personal Google accounts can access and link their financial accounts for custom session summaries.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold shrink-0 mt-0.5">B</span>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-950 font-bold block">App Information:</strong>
                  Provide your App Name (e.g., <strong>RH Wealth</strong> or <strong>Investment Vault</strong>), support email, and a high-resolution logo.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold shrink-0 mt-0.5">C</span>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-950 font-bold block">Developer Contact Details:</strong>
                  Set contact variables and your support email (such as <code>sunil.kawariya@gmail.com</code>).
                </p>
              </li>
            </ul>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-black font-mono">03</span>
              <h2 className="text-lg font-bold text-slate-900">Manage Sensitive & Restrictive Scopes</h2>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              This application utilizes Google OAuth to schedule 1-on-1 advisor sessions using Google Meet. In the <strong>Scopes</strong> screen step, declare the following configurations:
            </p>

            <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500 w-[50%]">Scope URI</th>
                    <th className="px-4 py-3 font-bold text-slate-500 w-[20%]">Type</th>
                    <th className="px-4 py-3 font-bold text-slate-500 w-[30%]">Purpose in RH Wealth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-mono text-indigo-600 select-all">openid</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">Non-sensitive</td>
                    <td className="px-4 py-3 text-slate-500">Associate user identity details with profile</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-indigo-600 select-all">.../auth/userinfo.email</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">Non-sensitive</td>
                    <td className="px-4 py-3 text-slate-500">User authentication email verification</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-indigo-600 select-all">.../auth/meetings.space.created</td>
                    <td className="px-4 py-3 font-semibold text-amber-600 bg-amber-50/40">Sensitive</td>
                    <td className="px-4 py-3 text-slate-500">Dynamic Google Meet video conference scheduler</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 bg-indigo-50 border border-indigo-100 text-indigo-950 text-xs p-4 rounded-2xl leading-relaxed">
              <HelpCircle className="text-indigo-600 shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="block font-bold">Why is this classified as a "Sensitive" Scope?</strong>
                Because generating meeting locations interacts directly with calendar metadata to guarantee security, Google enforces review steps to protect account owners.
              </div>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-black font-mono">04</span>
              <h2 className="text-lg font-bold text-slate-900">Submit Verification Form & Demo Recording</h2>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              When submitting, Google requires you to upload a <strong>vivid YouTube screencast video demonstration</strong> showing exactly how your application uses the requested scopes.
            </p>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3 shadow-inner">
              <h4 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
                <Video size={16} />
                YouTube Demo Requirements Checklist:
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 pl-4 list-decimal">
                <li>Show the Google Sign-in screen. Highlight the browser navigation search address bar which MUST clearly show your Google Cloud Client ID.</li>
                <li>Proceed through the Google login flows and click consent scopes permissions checkboxes.</li>
                <li>Navigate to the direct Consultancy section of our app.</li>
                <li>Book a session, and show the resulting meeting popup displaying the real <code>https://meet.google.com/...</code> join url successfully generated via API.</li>
                <li>Make the YouTube video <strong>Unlisted</strong> or Public (do not set as Private, as Google's auditing bots cannot view Private links).</li>
              </ul>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              After submitting, you will receive an confirmation email thread from Google Trust & Safety (usually within 24-72 hours) requesting confirmation of domain registration details. Confirm quickly to speed up verification.
            </p>
          </div>
        )}
      </div>

      {/* Button navigation triggers */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-6">
        <button
          onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
          disabled={activeStep === 1}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeStep === 1 ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          Previous Step
        </button>

        <span className="text-xs text-slate-400 font-semibold">Step {activeStep} of 4</span>

        <button
          onClick={() => setActiveStep(prev => Math.min(4, prev + 1))}
          disabled={activeStep === 4}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeStep === 4 ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
          }`}
        >
          <span>Next Step</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
