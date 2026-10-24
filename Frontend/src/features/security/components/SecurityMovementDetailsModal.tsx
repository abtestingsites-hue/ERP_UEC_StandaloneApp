import { Modal } from '../../../components/Modal'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import type { UnifiedEntryEvent } from '../types'

interface SecurityMovementDetailsModalProps {
    event: UnifiedEntryEvent | null
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

const DetailBox = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-extrabold text-slate-900">{value || '-'}</p>
    </div>
)

const formatEventType = (type: string) => {
    const map: Record<string, string> = {
        'STAFF_ENTRY': 'Staff Entry',
        'TEMP_EXIT': 'Temporary Exit',
        'STAFF_RETURN': 'Returned',
        'STAFF_FINAL_EXIT': 'Final Exit',
        'VEHICLE_ENTRY': 'Vehicle Entry',
        'VEHICLE_EXIT': 'Vehicle Exit'
    }
    return map[type] || type
}

export function SecurityMovementDetailsModal({ event, onClose }: SecurityMovementDetailsModalProps) {
    if (!event) return null

    const isStaff = event.sourceType === 'STAFF'
    const isVehicle = event.sourceType === 'VEHICLE'

    return (
        <Modal
            isOpen={!!event}
            onClose={onClose}
            title={`${isStaff ? 'Staff' : isVehicle ? 'Vehicle' : 'Security'} Movement Details`}
            subtitle="Read-only view of physical gate timeline."
            size="lg"
        >
            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between rounded-xl bg-slate-100 p-4">
                    <div>
                        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Event Time</p>
                        <p className="text-lg font-extrabold text-slate-900">{formatDateTime(event.timestamp)}</p>
                    </div>
                    <div className="text-right">
                        <StatusHighlighter value={formatEventType(event.eventType)} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Common / Actor Section */}
                    <DetailBox label="Recorded By" value={event.actor?.name || event.actor?.email} />
                    {event.actor?.empId && <DetailBox label="Recorder Emp ID" value={event.actor.empId} />}

                    {/* Staff Section */}
                    {isStaff && event.staff && (
                        <>
                            <DetailBox label="Staff Name" value={event.staff.name} />
                            <DetailBox label="Employee ID" value={event.staff.empId} />
                            <DetailBox label="Department" value={event.staff.department} />
                            <DetailBox label="Designation" value={event.staff.designation} />
                        </>
                    )}

                    {/* Vehicle Section */}
                    {isVehicle && event.vehicle && (
                        <>
                            <DetailBox label="Vehicle No" value={event.vehicle.vehicleNo} />
                            <DetailBox label="Driver Name" value={event.vehicle.driverName} />
                            <DetailBox label="Vehicle Type" value={event.vehicle.vehicleType} />
                            <DetailBox label="Company" value={event.vehicle.companyName} />
                        </>
                    )}

                    {/* Trip Details (Reason, etc.) */}
                    {event.tripDetails?.reason && (
                        <div className="col-span-2">
                            <DetailBox label="Reason / Purpose" value={event.tripDetails.reason} />
                        </div>
                    )}
                    {event.tripDetails?.expectedReturnAt && (
                        <DetailBox label="Expected Return" value={formatDateTime(event.tripDetails.expectedReturnAt)} />
                    )}
                    
                    {event.tripDetails?.materials && (
                        <div className="col-span-2">
                            <DetailBox 
                                label="Materials / Cargo" 
                                value={typeof event.tripDetails.materials === 'string' ? event.tripDetails.materials : JSON.stringify(event.tripDetails.materials, null, 2)} 
                            />
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    )
}
