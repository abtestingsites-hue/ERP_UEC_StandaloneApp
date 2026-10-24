import React from 'react'
import { Modal } from '../../../components/Modal'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import type { StaffDailyMovement } from '../types'

interface StaffMovementDetailModalProps {
    movement: StaffDailyMovement | null
    onClose: () => void
}

const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export function StaffMovementDetailModal({ movement, onClose }: StaffMovementDetailModalProps) {
    if (!movement) return null

    return (
        <Modal isOpen={!!movement} onClose={onClose} title="Staff Movement Details" size="max-w-3xl">
            <div className="space-y-6">
                {/* Header Information */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Staff Information</h4>
                        <p className="text-lg font-extrabold text-slate-900">{movement.staff?.firstName} {movement.staff?.lastName}</p>
                        <p className="text-sm font-bold text-slate-600">ID: {movement.staff?.empId}</p>
                        <p className="text-sm text-slate-600">{movement.staff?.department} • {movement.staff?.designation}</p>
                    </div>
                    
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Daily Status</h4>
                        <div className="mb-2">
                            <StatusHighlighter value={movement.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="block font-bold text-slate-500">Initial Entry</span>
                                <span className="font-bold text-slate-900">{formatDateTime(movement.entryAt)}</span>
                            </div>
                            <div>
                                <span className="block font-bold text-slate-500">Final Exit</span>
                                <span className="font-bold text-slate-900">{formatDateTime(movement.finalExitAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Temporary Trips Timeline */}
                <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">Temporary Trips Timeline</h3>
                    
                    {movement.trips && movement.trips.length > 0 ? (
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {movement.trips.map((trip, index) => (
                                <div key={trip.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <span className="font-bold text-xs">{index + 1}</span>
                                    </div>
                                    
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <StatusHighlighter value={trip.status} />
                                            <span className="text-sm font-bold text-primary-600">{trip.reason}</span>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between border-b border-slate-50 pb-1">
                                                <span className="text-slate-500">Exit:</span>
                                                <span className="font-bold text-slate-900">{formatDateTime(trip.exitAt)}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1">
                                                <span className="text-slate-500">Expected:</span>
                                                <span className="font-bold text-slate-700">{formatDateTime(trip.expectedReturnAt)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Return:</span>
                                                <span className="font-bold text-slate-900">{formatDateTime(trip.returnAt)}</span>
                                            </div>
                                        </div>
                                        
                                        {trip.materials && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 text-sm">
                                                <span className="text-slate-500 block">Materials:</span>
                                                <span className="text-slate-700">{trip.materials.description}</span>
                                            </div>
                                        )}
                                        {trip.companionName && (
                                            <div className="mt-2 text-sm">
                                                <span className="text-slate-500">Companion: </span>
                                                <span className="text-slate-700">{trip.companionName} {trip.companionPhone && `(${trip.companionPhone})`}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <p className="text-sm font-bold text-slate-500">No temporary trips recorded for this movement.</p>
                        </div>
                    )}
                </div>

                {/* Audit Information */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-500">
                    <p>Movement ID: {movement.id}</p>
                    {movement.entryRecordedByUser && (
                        <p>Entry Recorded By: {movement.entryRecordedByUser.firstName} {movement.entryRecordedByUser.lastName} ({movement.entryRecordedByUser.email})</p>
                    )}
                    {movement.finalExitRecordedByUser && (
                        <p>Final Exit Recorded By: {movement.finalExitRecordedByUser.firstName} {movement.finalExitRecordedByUser.lastName} ({movement.finalExitRecordedByUser.email})</p>
                    )}
                </div>
            </div>
        </Modal>
    )
}
