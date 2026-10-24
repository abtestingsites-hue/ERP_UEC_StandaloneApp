import { AmbulanceRegisterPage, type AmbulanceRegisterConfig } from './AmbulanceRegisterPage'

const config: AmbulanceRegisterConfig = {
    type: 'EMERGENCY_CALL',
    title: 'Emergency Call Logs',
    subtitle: 'Live emergency call intake register for ambulance response tracking.',
    addLabel: 'Add Call Log',
    emptyMessage: 'No live emergency call logs found. Add a call log to start ambulance response.',
    initialStatus: 'LOGGED',
    statuses: ['LOGGED', 'BOOKING_CREATED', 'DISPATCHED', 'CLOSED'],
    fields: [
        { key: 'callerName', label: 'Caller Name', required: true },
        { key: 'mobile', label: 'Mobile', required: true },
        { key: 'emergencyType', label: 'Emergency Type', required: true, placeholder: 'Accident / Transfer / Oxygen support' },
        { key: 'location', label: 'Location', required: true },
        { key: 'patientName', label: 'Patient Name' },
        { key: 'notes', label: 'Notes' }
    ],
    columns: [
        { key: 'callerName', header: 'Caller' },
        { key: 'mobile', header: 'Mobile' },
        { key: 'emergencyType', header: 'Emergency' },
        { key: 'location', header: 'Location' },
        { key: 'patientName', header: 'Patient' }
    ]
}

export function EmergencyCallLogs() {
    return <AmbulanceRegisterPage config={config} />
}
