import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { PlusCircle, Clock } from 'lucide-react';

export const NewEnquiryPlaceholder: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Lead & Enquiry Capture"
        subtitle="Create new client inquiry with lead qualification & auto-client linking"
        icon={PlusCircle}
      />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Phase 38D Extraction Target</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The lead capture component (`NewEnquiry.tsx`) and service requirement selector modal will be extracted and wired to `POST /api/v1/enquiry` in Phase 38D.
        </p>
        <div className="inline-block px-3 py-1 bg-slate-800 text-xs font-mono text-indigo-300 rounded-lg border border-slate-700">
          Route: /crm/new-enquiry
        </div>
      </div>
    </div>
  );
};
