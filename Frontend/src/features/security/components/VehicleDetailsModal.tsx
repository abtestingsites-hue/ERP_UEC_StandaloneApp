import React from 'react';
import { X, Clock, User, Car, FileText, CheckCircle, Package } from 'lucide-react';
import type { VehicleMovement } from '../types';
import { format } from 'date-fns';

interface VehicleDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    movement: VehicleMovement | null;
}

export function VehicleDetailsModal({ isOpen, onClose, movement }: VehicleDetailsModalProps) {
    if (!isOpen || !movement) return null;

    const renderActor = (user?: { firstName: string; lastName: string; email: string; staff?: { empId: string; designation: string } }) => {
        if (!user) return <span className="text-slate-400 italic">Unknown</span>;
        const name = `${user.firstName} ${user.lastName}`.trim();
        const role = user.staff?.designation || user.email;
        return (
            <div className="flex flex-col">
                <span className="font-medium text-slate-900">{name}</span>
                <span className="text-xs text-slate-500">{role}</span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <Car className="w-5 h-5 mr-2 text-primary-500" />
                            Vehicle Movement Details
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">ID: {movement.id}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8">
                    
                    {/* Status Badge */}
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="bg-primary-50 p-3 rounded-xl text-primary-600">
                                <Car className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{movement.vehicleNo}</h3>
                                <p className="text-sm font-medium text-slate-500">{movement.vehicleType || 'Unknown Type'}</p>
                            </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${movement.status === 'INSIDE' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                            {movement.status}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Vehicle Information */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center uppercase tracking-wider">
                                <User className="w-4 h-4 mr-2 text-slate-400" />
                                Driver Information
                            </h4>
                            <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Driver Name</p>
                                    <p className="font-medium text-slate-900">{movement.driverName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Driver Mobile</p>
                                    <p className="font-medium text-slate-900">{movement.driverMobile || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company / Organization</p>
                                    <p className="font-medium text-slate-900">{movement.companyName || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Visit Information */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center uppercase tracking-wider">
                                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                Visit Details
                            </h4>
                            <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Purpose</p>
                                    <p className="font-medium text-slate-900">{movement.purpose}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
                                        <Package className="w-3 h-3 mr-1" />
                                        Materials / Cargo
                                    </p>
                                    <p className="font-medium text-slate-900">{movement.materialDetails || 'None'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Remarks</p>
                                    <p className="font-medium text-slate-900">{movement.remarks || 'None'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline & Actor Tracking */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center uppercase tracking-wider">
                            <Clock className="w-4 h-4 mr-2 text-slate-400" />
                            Timeline & Activity
                        </h4>
                        
                        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                            <div className="p-4 flex items-start justify-between bg-white rounded-t-xl">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Vehicle Entry</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {format(new Date(movement.entryAt), 'MMM dd, yyyy • hh:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recorded By</p>
                                    {renderActor(movement.entryUser)}
                                </div>
                            </div>

                            <div className={`p-4 flex items-start justify-between ${movement.status === 'COMPLETED' ? 'bg-white rounded-b-xl' : 'bg-slate-50 rounded-b-xl'}`}>
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${movement.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-200 text-slate-400'}`}>
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${movement.status === 'COMPLETED' ? 'text-slate-900' : 'text-slate-500'}`}>
                                            Vehicle Exit
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {movement.exitAt 
                                                ? format(new Date(movement.exitAt), 'MMM dd, yyyy • hh:mm a') 
                                                : 'Pending...'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recorded By</p>
                                    {movement.status === 'COMPLETED' 
                                        ? renderActor(movement.exitUser)
                                        : <span className="text-slate-400 italic text-sm">-</span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
