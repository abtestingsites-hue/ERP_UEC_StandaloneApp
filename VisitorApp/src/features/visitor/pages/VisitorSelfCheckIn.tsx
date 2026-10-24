import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { visitorService } from '../services';
import { formatVisitorCategory } from '../../../lib/utils';
import { CheckCircle, Phone, User, Briefcase, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';

export function VisitorSelfCheckIn() {
    const [searchParams] = useSearchParams();
    const verifyId = searchParams.get('verify');

    const [mobile, setMobile] = useState('');
    const [name, setName] = useState('');
    const [purpose, setPurpose] = useState('');
    const [hostName, setHostName] = useState('');
    
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [verifyData, setVerifyData] = useState<any>(null);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [verifyError, setVerifyError] = useState('');

    useEffect(() => {
        if (verifyId) {
            setVerifyLoading(true);
            visitorService.publicVerify(verifyId)
                .then(data => setVerifyData(data))
                .catch(err => setVerifyError(err.response?.data?.error || err.message || 'Invalid or expired pass'))
                .finally(() => setVerifyLoading(false));
        }
    }, [verifyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            setTimeout(() => {
                setSubmitted(true);
                setLoading(false);
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit check-in request.');
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] max-w-md w-full text-center space-y-6 border border-slate-100">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-emerald-500 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
                            <CheckCircle className="h-12 w-12" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">You're Checked In!</h1>
                        <p className="text-slate-500 mt-3 text-lg leading-relaxed">Thank you. Please wait at the reception area while we notify your host.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (verifyId) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] max-w-md w-full space-y-6 border border-slate-100">
                    {verifyLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 font-medium text-slate-500">Verifying Pass...</p>
                        </div>
                    ) : verifyError ? (
                        <div className="text-center py-8">
                            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid Pass</h2>
                            <p className="text-red-500/80">{verifyError}</p>
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
                                <div className="absolute top-[5rem] -left-4 w-8 h-8 bg-slate-50 rounded-full border-r border-slate-200"></div>
                                <div className="absolute top-[5rem] -right-4 w-8 h-8 bg-slate-50 rounded-full border-l border-slate-200"></div>

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
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Elder / Resident</p>
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

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] max-w-md w-full space-y-8 border border-slate-100">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">Welcome</h1>
                    <p className="text-slate-500 mt-2 font-medium">Please enter your details to register</p>
                </div>
                
                {error && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            required
                            type="tel"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="w-full rounded-2xl bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all text-base"
                            placeholder="Mobile Number"
                        />
                    </div>
                    
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-2xl bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all text-base"
                            placeholder="Full Name"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Briefcase className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            required
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="w-full rounded-2xl bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all text-base"
                            placeholder="Purpose of Visit"
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                            required
                            type="text"
                            value={hostName}
                            onChange={(e) => setHostName(e.target.value)}
                            className="w-full rounded-2xl bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all text-base"
                            placeholder="Elder / Resident Name"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full group rounded-2xl bg-indigo-600 py-4 px-6 font-bold text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 text-lg mt-6 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Register'}
                        {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
