
import React from 'react';
import { 
  CreditCard, 
  ExternalLink, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Clock,
  ArrowRight,
  Zap,
  Landmark
} from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentLink {
  id: string;
  title: string;
  description: string;
  icon: any;
  url: string;
  category: string;
  color: string;
}

const PAYMENT_LINKS: PaymentLink[] = [
  {
    id: 'income-tax',
    title: 'Income Tax Payment',
    description: 'Pay your advance tax, self-assessment tax, or outstanding demand directly via e-Portal.',
    icon: FileText,
    url: 'https://eportal.incometax.gov.in/iec/foservices/#/login/bl-login',
    category: 'Taxation',
    color: 'bg-blue-50 text-blue-600 border-blue-100'
  },
  {
    id: 'nps-contribution',
    title: 'NPS Contribution',
    description: 'Make voluntary contributions to your Tier I or Tier II NPS accounts online.',
    icon: Clock,
    url: 'https://enps.nsdl.com/eNPS/LandingPage.html',
    category: 'Retirement',
    color: 'bg-orange-50 text-orange-600 border-orange-100'
  },
  {
    id: 'insurance-premium',
    title: 'Insurance Premium',
    description: 'Pay premiums for Life, Health, or General insurance policies across major providers.',
    icon: ShieldCheck,
    url: 'https://www.google.com/search?q=pay+insurance+premium+online',
    category: 'Protection',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  },
  {
    id: 'property-tax',
    title: 'Property Tax',
    description: 'Pay municipal property taxes for your residential or commercial real estate assets.',
    icon: Building2,
    url: 'https://www.google.com/search?q=pay+property+tax+online',
    category: 'Real Estate',
    color: 'bg-purple-50 text-purple-600 border-purple-100'
  },
  {
    id: 'utility-bills',
    title: 'Utility & Bills',
    description: 'Quick access to pay electricity, water, gas, and broadband bills.',
    icon: Zap,
    url: 'https://www.bbps.org.in/',
    category: 'Utilities',
    color: 'bg-amber-50 text-amber-600 border-amber-100'
  },
  {
    id: 'gst-payment',
    title: 'GST Payment',
    description: 'Direct link to the GST portal for business tax payments and filings.',
    icon: Landmark,
    url: 'https://www.gst.gov.in/',
    category: 'Business',
    color: 'bg-slate-50 text-slate-600 border-slate-100'
  }
];

const QuickPayments: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-serif text-4xl font-medium text-slate-900 tracking-tight">Payment Portal</h2>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Direct links to essential financial payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PAYMENT_LINKS.map((link, index) => (
          <motion.a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="premium-card group hover:border-wealth-navy/30 transition-all overflow-hidden flex flex-col"
          >
            <div className="p-6 flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${link.color} group-hover:bg-wealth-navy group-hover:text-wealth-gold transition-all`}>
                  <link.icon size={24} />
                </div>
                <div className="p-2 rounded-full bg-slate-50 text-slate-400 group-hover:bg-wealth-navy group-hover:text-white transition-all">
                  <ExternalLink size={14} />
                </div>
              </div>

              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{link.category}</p>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-wealth-navy transition-colors">{link.title}</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {link.description}
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-wealth-navy/5 transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proceed to Payment</span>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-wealth-navy group-hover:translate-x-1 transition-all" />
            </div>
          </motion.a>
        ))}
      </div>

      <div className="p-8 bg-wealth-navy rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-wealth-navy/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-wealth-gold/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-wealth-gold text-[10px] font-bold uppercase tracking-[0.2em]">
              <ShieldCheck size={16} />
              Secure Transactions
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Need assistance with payments?</h3>
            <p className="text-sm text-slate-300 max-w-md">
              Our wealth architects can guide you through complex tax filings or premium optimizations. Schedule a call for personalized support.
            </p>
          </div>
          <button className="px-8 py-4 bg-wealth-gold text-wealth-navy rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-black/20">
            Contact Specialist
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickPayments;
