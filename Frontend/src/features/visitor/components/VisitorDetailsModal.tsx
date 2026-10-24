import React from 'react';
import { formatVisitorCategory } from '../../../lib/utils';

interface VisitorDetailsModalProps {
    viewingPass: any;
    onClose: () => void;
}

export function VisitorDetailsModal({ viewingPass, onClose }: VisitorDetailsModalProps) {
    if (!viewingPass) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">Visitor Details</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto app-scrollbar">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Name</span>
                            <p className="font-bold text-slate-800">{viewingPass.visitor?.name || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Mobile</span>
                            <p className="font-bold text-slate-800">{viewingPass.visitor?.mobile || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Category</span>
                            <p className="font-bold text-slate-800">{formatVisitorCategory(viewingPass.visitor?.category)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Purpose</span>
                            <p className="font-bold text-slate-800">{viewingPass.purpose || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Host / Resident</span>
                            <p className="font-bold text-slate-800">{viewingPass.hostName || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Status</span>
                            <p className="font-bold text-slate-800">
                                {viewingPass.checkOutAt ? (
                                    <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">Checked Out</span>
                                ) : (
                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">Currently Inside</span>
                                )}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Check-In Time</span>
                            <p className="font-bold text-slate-800">{viewingPass.checkInAt ? new Date(viewingPass.checkInAt).toLocaleString() : '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Check-Out Time</span>
                            <p className="font-bold text-slate-800">{viewingPass.checkOutAt ? new Date(viewingPass.checkOutAt).toLocaleString() : '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Duration</span>
                            <p className="font-bold text-slate-800">
                                {viewingPass.checkInAt && viewingPass.checkOutAt 
                                    ? (() => {
                                        const diff = new Date(viewingPass.checkOutAt).getTime() - new Date(viewingPass.checkInAt).getTime();
                                        const hours = Math.floor(diff / (1000 * 60 * 60));
                                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                        return `${hours}h ${minutes}m`;
                                    })()
                                    : '-'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="font-semibold text-slate-500 block">Pass ID</span>
                            <p className="font-bold text-slate-800 text-xs truncate" title={viewingPass.passId || viewingPass.id}>{viewingPass.passId || viewingPass.id || '-'}</p>
                        </div>
                    </div>

                    {/* Approved By Card */}
                    <div className="mt-6 border border-slate-200 rounded-xl bg-slate-50 p-4">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Approved By</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="font-semibold text-slate-500 block">Name</span>
                                <span className="font-bold text-slate-800">
                                    {viewingPass.approvedByUser?.firstName ? `${viewingPass.approvedByUser.firstName} ${viewingPass.approvedByUser.lastName || ''}`.trim() : (viewingPass.approvedByUser?.name || 'System')}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <span className="font-semibold text-slate-500 block">Employee ID</span>
                                <span className="font-bold text-slate-800">{viewingPass.approvedByUser?.staff?.empId || viewingPass.approvedByUser?.employeeId || '-'}</span>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <span className="font-semibold text-slate-500 block">Designation</span>
                                <span className="font-bold text-slate-800">{viewingPass.approvedByUser?.staff?.designation || viewingPass.approvedByUser?.designation || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button type="button" onClick={onClose} className="px-5 py-2 font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">Close</button>
                </div>
            </div>
        </div>
    );
}
