import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Activity, Clock } from 'lucide-react';

export const ActiveEnquiriesPlaceholder: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Lead Pipeline"
        subtitle="Live scored lead pipeline, status filter, and lead qualification matrix"
        icon={Activity}
      />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Phase 38E Extraction Target</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The lead pipeline & scoring filter view (`ActiveEnquiries.tsx`) will be extracted and connected to backend scoring & intelligence services in Phase 38E.
        </p>
        <div className="inline-block px-3 py-1 bg-slate-800 text-xs font-mono text-indigo-300 rounded-lg border border-slate-700">
          Route: /crm/active-enquiries
        </div>
      </div>
    </div>
  );
};
