import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 mb-4 shadow-xl">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The route you are trying to access does not exist in CRMApp standalone frontend.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={ArrowLeft}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
