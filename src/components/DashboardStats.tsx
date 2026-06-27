import React from 'react';
import { Users, FileText, Send, UserPlus, Search, Award } from 'lucide-react';
import { Patient } from '../types';

interface DashboardStatsProps {
  patients: Patient[];
  userRole: 'Doctor' | 'Staff';
  setActiveMenu: (menu: 'dashboard' | 'patients' | 'broadcast') => void;
  currentUser: any;
}

export default function DashboardStats({
  patients,
  userRole,
  setActiveMenu,
  currentUser
}: DashboardStatsProps) {
  const totalPatients = patients.length;

  return (
    <div className="space-y-6" id="dashboard-stats-root">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Patients Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-5 transition-all hover:shadow-md">
          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Total Kids Registered</p>
            <h3 className="text-4xl font-bold font-display text-slate-900 dark:text-slate-50 mt-1">{totalPatients}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active pediatric profiles synced</p>
          </div>
        </div>

        {/* EMR Modules Active Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-5 transition-all hover:shadow-md">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">EMR Clinical Console</p>
            <h3 className="text-2xl font-bold font-display text-slate-900 dark:text-slate-50 mt-1">Pediatrics EMR</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Growth chart tracking, immunizations & clinical encounters</p>
          </div>
        </div>
      </div>

      {/* Welcome & Quick Console Section */}
      <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-slate-900 dark:to-slate-800/80 rounded-2xl p-6 border border-teal-100/60 dark:border-slate-800/80">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <Award className="h-3.5 w-3.5" />
            <span>PediCare Pro Workspace</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Welcome to Pediatric EMR Console
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            PediCare Pro provides standard EMR pediatric profile management. Access chronological pediatric charts, immunizations, developmental milestones, and automatic campaign broadcasts from this centralized workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {/* Action 1 */}
          <button
            onClick={() => setActiveMenu('patients')}
            className="p-5 bg-white dark:bg-slate-900 hover:bg-teal-50/20 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-left transition-all hover:shadow-sm group"
          >
            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-lg flex items-center justify-center mb-4 font-bold group-hover:scale-105 transition-transform">
              <UserPlus className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Register New Patient</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
              Quick-add pediatric profiles with birth weight, parent details, and demographics.
            </p>
          </button>

          {/* Action 2 */}
          <button
            onClick={() => setActiveMenu('patients')}
            className="p-5 bg-white dark:bg-slate-900 hover:bg-teal-50/20 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-left transition-all hover:shadow-sm group"
          >
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center mb-4 font-bold group-hover:scale-105 transition-transform">
              <Search className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Search & View Charts</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
              Retrieve pediatric records, log growth metrics, and write new clinical encounter logs.
            </p>
          </button>

          {/* Action 3 */}
          <button
            onClick={() => setActiveMenu('broadcast')}
            className="p-5 bg-white dark:bg-slate-900 hover:bg-teal-50/20 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-left transition-all hover:shadow-sm group"
          >
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-4 font-bold group-hover:scale-105 transition-transform">
              <Send className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Communication Hub</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
              Launch SMS campaigns for immunizations, festive greetings, or pediatric checkups.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
