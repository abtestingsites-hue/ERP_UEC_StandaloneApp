import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { visitorService } from '../services';
import { formatVisitorCategory } from '../../../lib/utils';
import { ShieldCheck, XCircle } from 'lucide-react';

export function VisitorPassVerification() {
    const { id } = useParams<{ id: string }>();
    const [verifyData, setVerifyData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            setLoading(true);
            visitorService.publicVerify(id)
                .then(data => setVerifyData(data))
                .catch(err => setError(err.response?.data?.error || err.message || 'Invalid or expired pass'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] max-w-md w-full space-y-6 border border-slate-100">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 font-medium text-slate-500">Verifying Digital Pass...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <XCircle className="h-16 w-16 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid Pass</h2>
                        <p className="text-rose-500/80">{error}</p>
                    </div>
                ) : verifyData ? (
                    <div className="space-y-4">
                        <div className="text-center pt-2">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4 shadow-sm border border-emerald-100 relative">
                                <ShieldCheck className="h-8 w-8 text-emerald-500" />
                                <div className="absolute -top-1 -right-1 flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Digital Pass Verified</h2>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${verifyData.status === 'ACTIVE' || verifyData.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                {verifyData.status || 'ACTIVE'}
                            </span>
                        </div>
                        
                        <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm mt-8 relative">
                            <div className="p-6 border-b border-dashed border-slate-200 flex items-center gap-4 relative z-10">
                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-slate-800 flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
                                    {verifyData.visitor?.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Visitor Details</p>
                                    <p className="text-slate-800 font-extrabold text-xl truncate tracking-tight">{verifyData.visitor?.name || 'Unknown'}</p>
                                    <p className="text-slate-500 text-sm font-medium mt-0.5">{verifyData.visitor?.mobile || '-'}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/50 space-y-5 relative z-10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Category</p>
                                        <p className="text-indigo-900 font-bold">{formatVisitorCategory(verifyData.visitor?.category)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Host / Resident</p>
                                        <p className="text-slate-800 font-bold">{verifyData.hostName || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Purpose of Visit</p>
                                    <p className="text-slate-700 text-sm font-medium bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm leading-relaxed">{verifyData.purpose || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
