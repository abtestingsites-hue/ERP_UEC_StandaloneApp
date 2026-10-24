import type { User } from '../../../store/authStore'
import type { WorkflowTimeline } from '../services/workflowTimeline'

export type WorkflowActionItem = {
    id: string
    title: string
    description: string
    owner: string
    severity: 'high' | 'medium' | 'low'
    href: string
    workflowRef: string
    clientName: string
}

const normalizeRole = (role: User['role'] | undefined) => {
    if (!role) return ''
    if (typeof role === 'string') return role.trim().toLowerCase().replace(/_/g, ' ')
    return String(role.name || '').trim().toLowerCase().replace(/_/g, ' ')
}

const hasRoleSignal = (role: string, signals: string[]) => signals.some((signal) => role.includes(signal))

const getStage = (workflow: WorkflowTimeline, key: string) => workflow.stages.find((stage) => stage.key === key)

const makeItem = (
    workflow: WorkflowTimeline,
    id: string,
    title: string,
    description: string,
    owner: string,
    severity: WorkflowActionItem['severity'],
    href = '/workflow/timeline'
): WorkflowActionItem => ({
    id: `${workflow.id}-${id}`,
    title,
    description,
    owner,
    severity,
    href,
    workflowRef: workflow.refNo,
    clientName: workflow.clientName
})

export const getRoleWorkflowActionItems = (workflows: WorkflowTimeline[], user: User | null | undefined) => {
    const role = normalizeRole(user?.role)
    const isAllAccess = Boolean(user?.permissions?.includes('ALL_ACCESS') && !user?.staffId)

    const isEnquiryRole = isAllAccess || hasRoleSignal(role, ['enquiry', 'admission', 'follow-up', 'customer relations'])
    const isAllocationRole = isAllAccess || hasRoleSignal(role, ['allocation', 'patient care', 'medical monitor', 'elder care', 'uhc admin'])
    const isStaffRole = Boolean(user?.staffId) || hasRoleSignal(role, ['profile task'])
    const isApprovalRole = isAllAccess || hasRoleSignal(role, ['task log', 'admin', 'coordinator'])
    const isFinanceRole = isAllAccess || hasRoleSignal(role, ['finance', 'billing'])

    const items = workflows.flatMap((workflow) => {
        const admission = getStage(workflow, 'admission')
        const followUp = getStage(workflow, 'follow-up')
        const allocation = getStage(workflow, 'allocation')
        const staffExecution = getStage(workflow, 'staff-execution')
        const healthcareMonitoring = getStage(workflow, 'healthcare-monitoring')
        const billing = getStage(workflow, 'billing')
        const customerCare = getStage(workflow, 'customer-care')
        const workflowItems: WorkflowActionItem[] = []

        if (isEnquiryRole && !followUp?.complete) {
            workflowItems.push(makeItem(
                workflow,
                'follow-up-needed',
                'Complete follow-up',
                'Enquiry is created but follow-up is not completed.',
                'Enquiry Desk',
                'high',
                followUp?.nextRoute || '/crm/enquiry-follow-up'
            ))
        }

        if (isEnquiryRole && followUp?.complete && !admission?.complete) {
            workflowItems.push(makeItem(
                workflow,
                'enquiry-conversion',
                'Convert to admission',
                'Follow-up is completed but admission is not created.',
                'Enquiry Desk',
                'high',
                admission?.nextRoute || '/crm/active-enquiries'
            ))
        }

        if (isAllocationRole && admission?.complete && !allocation?.complete) {
            workflowItems.push(makeItem(
                workflow,
                'allocation-needed',
                'Create care allocation',
                'Admission exists but care allocation is not completed.',
                'Care Allocation',
                'high',
                allocation?.nextRoute || '/allocation/clinical-care'
            ))
        }

        if ((isAllocationRole || isStaffRole) && allocation?.complete && !staffExecution?.complete) {
            workflowItems.push(makeItem(
                workflow,
                'duty-pending',
                isStaffRole ? 'Complete assigned duty' : 'Monitor staff duty',
                'Care allocation exists but staff duty is not completed.',
                isStaffRole ? 'Assigned Staff' : 'Care Allocation',
                'medium',
                isStaffRole ? (staffExecution?.nextRoute || '/profile/tasks') : (allocation?.nextRoute || '/allocation/clinical-care')
            ))
        }

        if (isApprovalRole && staffExecution?.complete && !healthcareMonitoring?.complete) {
            workflowItems.push(makeItem(
                workflow,
                'healthcare-pending',
                'Check healthcare monitoring',
                'Staff execution is complete and healthcare monitoring needs review.',
                'Healthcare',
                'medium',
                healthcareMonitoring?.nextRoute || '/healthcare/patient-dashboard'
            ))
        }

        if (isFinanceRole && healthcareMonitoring?.complete && !billing?.complete) {
            workflowItems.push(makeItem(
                workflow,
                'billing-pending',
                'Complete billing',
                'Care workflow is ready for invoice posting or payment collection.',
                'Finance',
                'high',
                billing?.nextRoute || '/finance/invoice'
            ))
        }

        if (isEnquiryRole && billing?.complete && !customerCare?.complete) {
            workflowItems.push(makeItem(
                workflow,
                'customer-care-pending',
                'Collect feedback',
                'Billing is complete but customer care follow-up is pending.',
                'Customer Care',
                'medium',
                customerCare?.nextRoute || '/customer-care/pending-feedback'
            ))
        }

        return workflowItems
    })

    return items.slice(0, 8)
}
