import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { CalendarCheck, Clock } from 'lucide-react';

export const EnquiryFollowUpPlaceholder: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-Up Call Queue"
        subtitle="Coordinator follow-up schedule, call notes log & renewal outcomes"
        icon={CalendarCheck}
      />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Phase 38D Extraction Target</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The follow-up queue management (`EnquiryFollowUp.tsx` & `FollowUpView.tsx`) will be extracted and integrated with `/enquiry/:id/follow-up` in Phase 38D.
        </p>
        <div className="inline-block px-3 py-1 bg-slate-800 text-xs font-mono text-indigo-300 rounded-lg border border-slate-700">
          Route: /crm/enquiry-follow-up
        </div>
      </div>
    </div>
  );
};
