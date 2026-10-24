import { AmbulanceRegisterPage, type AmbulanceRegisterConfig } from './AmbulanceRegisterPage'

const config: AmbulanceRegisterConfig = {
    type: 'MAINTENANCE',
    title: 'Ambulance Maintenance',
    subtitle: 'Live ambulance service, repair, and maintenance register.',
    addLabel: 'Add Maintenance',
    emptyMessage: 'No live ambulance maintenance records found. Add a vehicle maintenance ticket.',
    initialStatus: 'OPEN',
    statuses: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
    fields: [
        { key: 'vehicleNo', label: 'Vehicle No.', required: true },
        { key: 'issue', label: 'Issue / Service Need', required: true },
        { key: 'serviceVendor', label: 'Vendor / Workshop' },
        { key: 'estimatedCost', label: 'Estimated Cost', type: 'number' },
        { key: 'dueDate', label: 'Due Date', type: 'datetime-local' },
        { key: 'remarks', label: 'Remarks' }
    ],
    columns: [
        { key: 'vehicleNo', header: 'Vehicle' },
        { key: 'issue', header: 'Issue' },
        { key: 'serviceVendor', header: 'Vendor' },
        { key: 'estimatedCost', header: 'Cost' },
        { key: 'dueDate', header: 'Due' }
    ]
}

export function AmbulanceMaintenance() {
    return <AmbulanceRegisterPage config={config} />
}
