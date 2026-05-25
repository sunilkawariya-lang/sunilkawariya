
import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Download,
  Lock,
  Eye,
  FileCheck,
  ShieldAlert,
  Server,
  Globe,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserActivity, SecurityLog, ComplianceCheck } from '../types';

interface BackofficeProps {
  activities: UserActivity[];
  securityLogs: SecurityLog[];
  complianceChecks: ComplianceCheck[];
}

const Backoffice: React.FC<BackofficeProps> = ({ activities, securityLogs, complianceChecks }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'security' | 'compliance'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Total Active Users', value: '1,284', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Security Alerts', value: '2', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Compliance Score', value: '98%', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'System Uptime', value: '99.99%', icon: Server, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Master Backoffice</h2>
          <p className="text-slate-500 mt-1">Organizational security, compliance, and user tracking hub.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Download size={16} />
            Export Audit Log
          </button>
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2">
            <Shield size={16} />
            System Secure
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-2xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'User Tracking', icon: Users },
          { id: 'security', label: 'Security Logs', icon: Lock },
          { id: 'compliance', label: 'Compliance Tracker', icon: CheckCircle2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === tab.id 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {activeSubTab === 'overview' && (
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Security Alerts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="text-rose-500" size={20} />
                    Critical Security Alerts
                  </h3>
                  <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {securityLogs.filter(log => log.level === 'Critical').map((log) => (
                    <div key={log.id} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                      <div className="bg-white p-2 rounded-lg text-rose-600 shadow-sm">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-rose-900">{log.event}</p>
                          <span className="text-[10px] font-bold text-rose-400 uppercase">{log.timestamp}</span>
                        </div>
                        <p className="text-xs text-rose-700 mt-1">Source: {log.source}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-[10px] font-bold rounded uppercase">
                            {log.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Summary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    Compliance Status
                  </h3>
                  <button className="text-xs font-bold text-emerald-600 hover:underline">Full Audit</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {complianceChecks.slice(0, 4).map((check) => (
                    <div key={check.id} className="p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{check.category}</span>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{check.title}</p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">{check.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="pt-8 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Activity className="text-blue-500" size={20} />
                Global System Health
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">API Latency</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-900">42ms</span>
                    <span className="text-xs text-emerald-600 font-bold mb-1">Optimal</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Database Load</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-900">12%</span>
                    <span className="text-xs text-emerald-600 font-bold mb-1">Low</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Auth Success Rate</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-900">99.9%</span>
                    <span className="text-xs text-emerald-600 font-bold mb-1">Stable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'users' && (
          <div className="p-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search user activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-500">
                  <Filter size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-500">User</th>
                    <th className="px-6 py-4 font-bold text-slate-500">Action</th>
                    <th className="px-6 py-4 font-bold text-slate-500">Device/IP</th>
                    <th className="px-6 py-4 font-bold text-slate-500">Timestamp</th>
                    <th className="px-6 py-4 font-bold text-slate-500 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                            {activity.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{activity.userName}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{activity.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          activity.action.includes('Login') ? 'bg-blue-100 text-blue-700' :
                          activity.action.includes('Delete') ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {activity.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            {activity.device?.includes('Mobile') ? <Smartphone size={12} /> : <Globe size={12} />}
                            <span className="text-xs">{activity.ipAddress}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {activity.timestamp}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'security' && (
          <div className="p-8">
            <div className="space-y-6">
              {securityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-6 p-6 border border-slate-100 rounded-3xl hover:shadow-md transition-all">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    log.level === 'Critical' ? 'bg-rose-50 text-rose-600' :
                    log.level === 'Warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    <Shield size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-slate-900">{log.event}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.level === 'Critical' ? 'bg-rose-100 text-rose-700' :
                          log.level === 'Warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.level}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{log.source}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          log.status === 'Resolved' ? 'bg-emerald-500' :
                          log.status === 'Investigating' ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`} />
                        <span className="text-xs font-bold text-slate-700">{log.status}</span>
                      </div>
                      <button className="text-xs font-bold text-emerald-600 hover:underline">View Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'compliance' && (
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complianceChecks.map((check) => (
                <div key={check.id} className="p-6 border border-slate-100 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                        <FileCheck size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{check.category}</p>
                        <h4 className="font-bold text-slate-900">{check.title}</h4>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      check.status === 'Compliant' ? 'bg-emerald-100 text-emerald-700' :
                      check.status === 'Pending Review' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {check.status}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{check.description}</p>
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Last Checked: {check.lastChecked}</span>
                    <span>Next Review: {check.nextReview}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Backoffice;
