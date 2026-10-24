import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Users, Clock } from 'lucide-react';

export const ClientsPlaceholder: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Master Directory"
        subtitle="Searchable directory of client profiles, contacts & inquiry history"
        icon={Users}
      />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Phase 38F Extraction Target</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          The client master directory view (`AllClients.tsx`) will be extracted in Phase 38F to provide read-only client history and contact details within CRMApp.
        </p>
        <div className="inline-block px-3 py-1 bg-slate-800 text-xs font-mono text-indigo-300 rounded-lg border border-slate-700">
          Route: /crm/clients
        </div>
      </div>
    </div>
  );
};
