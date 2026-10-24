import { X, Phone, Mail, MapPin, Calendar, User, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

interface EnquiryDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    enquiry: any;
    onConvertClick: () => void;
}

export function EnquiryDetailsDrawer({ isOpen, onClose, enquiry, onConvertClick }: EnquiryDetailsDrawerProps) {
    if (!isOpen || !enquiry) return null;

    const rawMeta = enquiry.rawMessage;
    let meta: any = {};
    if (typeof rawMeta === 'string') {
        try { meta = JSON.parse(rawMeta); } catch {}
    } else if (typeof rawMeta === 'object' && rawMeta !== null) {
        meta = rawMeta;
    }

    const reqs = enquiry.serviceRequirements || {};

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/50 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-white dark:bg-[#072E33] h-full shadow-2xl flex flex-col border-l border-gray-100 dark:border-[#6DA5C0]/15">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                    <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0F969C]/10 text-[#0F969C] font-bold">
                            {enquiry.refNo || enquiry.id}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                            {enquiry.client?.name || enquiry.clientName || 'Home Care Prospect'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status Badge & Actions */}
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15">
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-[#B8D9E8] uppercase">Enquiry Status</p>
                            <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-[#0F969C]/15 text-[#0F969C]">
                                {enquiry.status || 'Open'}
                            </span>
                        </div>
                        {!enquiry.isConverted && (
                            <button
                                onClick={onConvertClick}
                                className="flex items-center space-x-1.5 px-4 py-2 bg-[#0F969C] hover:bg-[#0C7075] text-white text-xs font-bold rounded-xl shadow transition-colors"
                            >
                                <UserCheck className="w-4 h-4" />
                                <span>Proceed to Admission</span>
                            </button>
                        )}
                    </div>

                    {/* Client Info */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider">Client Details</h4>
                        <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-[#6DA5C0]/15">
                            <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-200">
                                <User className="w-4 h-4 text-gray-400 shrink-0" />
                                <span>{enquiry.client?.name || 'N/A'}</span>
                            </div>
                            {enquiry.client?.mobile && (
                                <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-200">
                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>{enquiry.client.mobile}</span>
                                </div>
                            )}
                            {enquiry.client?.email && (
                                <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-200">
                                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>{enquiry.client.email}</span>
                                </div>
                            )}
                            {(enquiry.client?.address || meta.clientLocation) && (
                                <div className="flex items-start space-x-3 text-sm text-gray-700 dark:text-gray-200">
                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <span>{enquiry.client?.address || meta.clientLocation}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patient Info */}
                    {(meta.patientName || meta.patientHealthCondition) && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider">Patient Details</h4>
                            <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-[#6DA5C0]/15 text-sm text-gray-700 dark:text-gray-200">
                                <p><strong className="font-semibold text-gray-900 dark:text-white">Patient Name:</strong> {meta.patientName || 'N/A'}</p>
                                {meta.patientAge && <p><strong className="font-semibold text-gray-900 dark:text-white">Age:</strong> {meta.patientAge} years</p>}
                                {meta.patientGender && <p><strong className="font-semibold text-gray-900 dark:text-white">Gender:</strong> {meta.patientGender}</p>}
                                {meta.patientHealthCondition && <p><strong className="font-semibold text-gray-900 dark:text-white">Condition:</strong> {meta.patientHealthCondition}</p>}
                            </div>
                        </div>
                    )}

                    {/* Service Requirements */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider">Service Requirements</h4>
                        <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-[#6DA5C0]/15 text-sm text-gray-700 dark:text-gray-200">
                            <p><strong className="font-semibold text-gray-900 dark:text-white">Caregivers Required:</strong> {reqs.staffRequired || 1}</p>
                            <p><strong className="font-semibold text-gray-900 dark:text-white">Shift / Hours:</strong> {reqs.shift || '12 Hours Day'}</p>
                            <p><strong className="font-semibold text-gray-900 dark:text-white">Frequency:</strong> {reqs.frequency || 'Daily'}</p>
                            {reqs.specialInstructions && (
                                <p><strong className="font-semibold text-gray-900 dark:text-white">Special Instructions:</strong> {reqs.specialInstructions}</p>
                            )}
                        </div>
                    </div>

                    {/* Notes / Description */}
                    {enquiry.description && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider">Notes & Comments</h4>
                            <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-4 text-sm text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-[#6DA5C0]/15">
                                {enquiry.description}
                            </div>
                        </div>
                    )}

                    {/* Created Metadata */}
                    <div className="text-xs text-gray-400 flex items-center space-x-2 pt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Enquiry Date: {enquiry.createdAt ? format(new Date(enquiry.createdAt), 'PPP p') : 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
