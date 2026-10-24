import { X, Phone, User } from 'lucide-react';

interface ClientDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    client: any;
}

export function ClientDetailsDrawer({ isOpen, onClose, client }: ClientDetailsDrawerProps) {
    if (!isOpen || !client) return null;

    const item = client.raw || client;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/50 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-white dark:bg-[#072E33] h-full shadow-2xl flex flex-col border-l border-gray-100 dark:border-[#6DA5C0]/15">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-[#6DA5C0]/15 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                    <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0F969C]/10 text-[#0F969C] font-bold">
                            {client.type === 'ADMISSION' ? 'ADMISSION' : 'HOME CARE'}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                            {client.clientName}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status & Service */}
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-[#6DA5C0]/15 space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-gray-500 dark:text-[#B8D9E8] uppercase">Service Status</p>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0F969C]/15 text-[#0F969C]">
                                {client.status}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {client.service}
                        </p>
                    </div>

                    {/* Client Information */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider">Client & Contact</h4>
                        <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-[#6DA5C0]/15 text-sm text-gray-700 dark:text-gray-200">
                            <div className="flex items-center space-x-3">
                                <User className="w-4 h-4 text-gray-400 shrink-0" />
                                <span>{client.clientName}</span>
                            </div>
                            {client.mobile && client.mobile !== '-' && (
                                <div className="flex items-center space-x-3">
                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span>{client.mobile}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patient & Caregiver */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider">Patient & Caregiver Assignment</h4>
                        <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-[#6DA5C0]/15 text-sm text-gray-700 dark:text-gray-200">
                            <p><strong className="font-semibold text-gray-900 dark:text-white">Patient Name:</strong> {client.patientName}</p>
                            <p><strong className="font-semibold text-gray-900 dark:text-white">Assigned Caregiver:</strong> {client.staffName}</p>
                            <p><strong className="font-semibold text-gray-900 dark:text-white">Contract Info:</strong> {client.contract}</p>
                        </div>
                    </div>

                    {/* Allocation Details if available */}
                    {item.allocationRef && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-[#0F969C] uppercase tracking-wider">Allocation Reference</h4>
                            <div className="bg-gray-50/50 dark:bg-white/5 rounded-2xl p-4 text-sm text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-[#6DA5C0]/15">
                                <p><strong className="font-semibold text-gray-900 dark:text-white">Allocation Ref:</strong> {item.allocationRef}</p>
                                {item.enquiryRef && <p><strong className="font-semibold text-gray-900 dark:text-white">Enquiry Ref:</strong> {item.enquiryRef}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
