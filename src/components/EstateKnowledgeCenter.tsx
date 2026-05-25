
import React, { useState } from 'react';
import { BookOpen, FileText, Users, Landmark, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const EstateKnowledgeCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'will' | 'trust' | 'huf'>('will');

  const content = {
    will: {
      title: 'Wills & Succession',
      icon: FileText,
      color: 'indigo',
      sections: [
        {
          title: 'What is a Will?',
          text: 'A Will is a legal declaration of the intention of a testator with respect to their property which they desire to be carried into effect after their death. In India, it is governed by the Indian Succession Act, 1925.',
        },
        {
          title: 'Essentials of a Valid Will',
          list: [
            'Testator must be of sound mind and not a minor.',
            'Must be signed by the testator in the presence of at least two witnesses.',
            'Witnesses must sign the Will in the presence of the testator.',
            'No specific format or stamp paper is required.',
            'Registration is optional but recommended to prevent disputes.'
          ]
        },
        {
          title: 'Types of Wills',
          list: [
            'Privileged Wills: Made by soldiers/airmen/mariners in active service (can be oral).',
            'Unprivileged Wills: Standard written Wills made by any person.',
            'Joint Wills: Made by two or more persons jointly.',
            'Mutual Wills: Two persons make reciprocal Wills.'
          ]
        }
      ],
      pitfalls: [
        'Not updating the Will after major life events like marriage, birth of a child, or acquisition of significant property.',
        'Appointing an Executor who is much older than the Testator or who may not be willing to serve.',
        'Failing to clearly identify assets, leading to ambiguity and potential family disputes.'
      ]
    },
    trust: {
      title: 'Trusts & Foundations',
      icon: Landmark,
      color: 'emerald',
      sections: [
        {
          title: 'What is a Trust?',
          text: 'A Trust is an obligation annexed to the ownership of property, arising out of a confidence reposed in and accepted by the owner (Settlor) for the benefit of another (Beneficiary). Governed by the Indian Trusts Act, 1882.',
        },
        {
          title: 'Key Parties',
          list: [
            'Settlor: The person who creates the trust.',
            'Trustee: The person who manages the trust property.',
            'Beneficiary: The person for whose benefit the trust is created.',
            'Trust Property: The subject matter of the trust.'
          ]
        },
        {
          title: 'Why Create a Private Trust?',
          list: [
            'Asset protection from creditors.',
            'Succession planning for minor or special-needs children.',
            'Avoiding probate process for distributed assets.',
            'Consolidated management of family wealth.'
          ]
        }
      ],
      pitfalls: [
        'Not transferring the legal title of assets to the Trustee, making the trust ineffective.',
        'Appointing a single Trustee without a succession plan, risking trust management if the Trustee dies.',
        'Vague trust deeds that don\'t clearly define the powers of the Trustee or the rights of the Beneficiaries.'
      ]
    },
    huf: {
      title: 'Hindu Undivided Family (HUF)',
      icon: Users,
      color: 'amber',
      sections: [
        {
          title: 'What is an HUF?',
          text: 'An HUF is a separate legal entity for tax purposes in India, consisting of all persons lineally descended from a common ancestor, including their wives and unmarried daughters.',
        },
        {
          title: 'Key Features',
          list: [
            'Karta: The head of the family who manages the HUF.',
            'Coparceners: Family members who have a birthright in the HUF property.',
            'Separate PAN: HUF has its own PAN card and is taxed separately from its members.',
            'Tax Benefits: Allows for additional tax deductions under Section 80C and separate basic exemption limits.'
          ]
        },
        {
          title: 'Setting up an HUF',
          list: [
            'Create an HUF Deed on stamp paper.',
            'Apply for a separate PAN card for the HUF.',
            'Open a bank account in the name of the HUF.',
            'Infuse capital through gifts or inheritance (subject to tax laws).'
          ]
        }
      ],
      pitfalls: [
        'Mixing personal funds with HUF funds without proper documentation, leading to tax complications.',
        'Not maintaining separate books of accounts or a separate bank account for the HUF.',
        'Failing to update the HUF deed when new members (like children or daughters-in-law) join the family.'
      ]
    }
  };

  const activeContent = content[activeTab];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Estate Knowledge Center</h3>
            <p className="text-slate-500 text-sm">Learn about legal structures and succession planning.</p>
          </div>
        </div>
        
        <div className="flex p-1 bg-white rounded-2xl border border-slate-200 shadow-sm self-start">
          {(['will', 'trust', 'huf'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab 
                  ? `bg-${content[tab].color}-600 text-white shadow-lg shadow-${content[tab].color}-200` 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${activeContent.color}-50 text-${activeContent.color}-600 rounded-lg`}>
                  <activeContent.icon size={20} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">{activeContent.title}</h4>
              </div>
              
              {activeContent.sections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${activeContent.color}-500`} />
                    {section.title}
                  </h5>
                  {section.text && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {section.text}
                    </p>
                  )}
                  {section.list && (
                    <ul className="space-y-2">
                      {section.list.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 size={14} className={`text-${activeContent.color}-500 shrink-0 mt-0.5`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className={`bg-${activeContent.color}-50 rounded-3xl p-6 border border-${activeContent.color}-100`}>
                <h5 className={`font-bold text-${activeContent.color}-900 mb-4 flex items-center gap-2`}>
                  <Info size={18} />
                  Expert Tip
                </h5>
                <p className={`text-sm text-${activeContent.color}-800 leading-relaxed`}>
                  {activeTab === 'will' && "Always appoint a 'Residuary Legatee' in your Will to ensure that any assets you acquire after making the Will or any assets you forgot to mention are also covered."}
                  {activeTab === 'trust' && "Private Trusts are excellent for protecting assets from potential future liabilities or business risks, as the legal ownership rests with the Trustee, not the Settlor."}
                  {activeTab === 'huf' && "An HUF can be created by a gift from a non-member or by inheritance. However, be mindful of Clubbing Provisions under the Income Tax Act when gifting to an HUF."}
                </p>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white">
                <h5 className="font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-400" />
                  Common Pitfalls
                </h5>
                <ul className="space-y-3">
                  {activeContent.pitfalls.map((pitfall, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-slate-500 mt-1.5 shrink-0" />
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EstateKnowledgeCenter;
