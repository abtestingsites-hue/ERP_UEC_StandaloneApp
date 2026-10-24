import { QRCodeSVG } from 'qrcode.react';
import { formatVisitorCategory } from '../../../lib/utils';

interface VisitorPassCardProps {
    pass: any;
    onReset: () => void;
}

export function VisitorPassCard({ pass, onReset }: VisitorPassCardProps) {
    const passId = pass.pass?.id || pass.id;
    const visitorName = pass.profile?.name || pass.visitor?.name || pass.name;
    const visitorCategory = pass.profile?.category || pass.visitor?.category || pass.category;
    const purpose = pass.pass?.purpose || pass.purpose;
    const hostName = pass.pass?.hostName || pass.hostName;
    const createdAt = pass.pass?.createdAt || pass.createdAt || new Date().toISOString();

    const facilityName = 'CARE FACILITY';

    return (
        <section className="rounded-2xl border border-indigo-100 bg-white p-8 md:p-12 shadow-sm flex flex-col items-center justify-center space-y-6">
            
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-visitor-pass, #printable-visitor-pass * {
                        visibility: visible;
                    }
                    #printable-visitor-pass {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: 100% !important;
                        margin: 0;
                        padding: 20px;
                        border: none !important;
                        box-shadow: none !important;
                        background: white;
                    }
                    @page {
                        margin: 0;
                    }
                }
            `}</style>

            <div className="print:hidden text-green-500 text-2xl font-bold mb-4">Pass Generated Successfully!</div>

            <div id="printable-visitor-pass" className="w-full max-w-[400px] border border-gray-200 rounded-2xl shadow-sm bg-white overflow-hidden flex flex-col">
                
                <div className="bg-indigo-900 text-white p-5 text-center">
                    <h2 className="text-xl font-bold tracking-wider">{facilityName}</h2>
                    <div className="text-sm font-semibold tracking-widest text-indigo-200 mt-1">VISITOR PASS</div>
                </div>

                <div className="p-6 flex flex-col items-center">
                    
                    <h3 className="font-extrabold text-2xl text-slate-900 text-center">{visitorName}</h3>
                    <p className="text-indigo-600 uppercase font-bold text-sm mt-1 text-center">{formatVisitorCategory(visitorCategory)}</p>

                    <div className="my-6 p-4 bg-white rounded-xl shadow-sm border border-slate-100 print:border-slate-300 print:shadow-none">
                        <QRCodeSVG value={`${window.location.origin}/visitor/verify/${passId}`} size={160} />
                    </div>
                    
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-6">
                        Present this pass at the security gate
                    </p>

                    <div className="w-full space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500 font-semibold">Purpose</span>
                            <span className="text-slate-900 font-bold text-right">{purpose || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500 font-semibold">Visiting</span>
                            <span className="text-slate-900 font-bold text-right">{hostName || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500 font-semibold">Date & Time</span>
                            <span className="text-slate-900 font-bold text-right">
                                {new Date(createdAt).toLocaleString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500 font-semibold">Approved By</span>
                            <span className="text-slate-900 font-bold text-right">{pass.approvedByUser?.firstName ? `${pass.approvedByUser.firstName} ${pass.approvedByUser.lastName || ''}`.trim() : (pass.approvedByUser?.name || 'System')}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500 font-semibold">Employee ID</span>
                            <span className="text-slate-900 font-bold text-right">{pass.approvedByUser?.staff?.empId || pass.approvedByUser?.employeeId || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-500 font-semibold">Designation</span>
                            <span className="text-slate-900 font-bold text-right">{pass.approvedByUser?.staff?.designation || pass.approvedByUser?.designation || '-'}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-slate-400 font-medium text-xs">Pass ID</span>
                            <span className="text-slate-400 font-medium text-xs font-mono">{pass.pass?.passId || pass.passId || passId?.split('-')[0] || '-'}</span>
                        </div>
                    </div>

                </div>
            </div>

            <div className="print:hidden flex gap-4 mt-6">
                <button 
                    type="button"
                    onClick={() => window.print()} 
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    aria-label="Print Visitor Pass"
                >
                    Print Pass
                </button>
                <button 
                    type="button"
                    onClick={onReset} 
                    className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                >
                    Enter Another Visitor
                </button>
            </div>

        </section>
    );
}
