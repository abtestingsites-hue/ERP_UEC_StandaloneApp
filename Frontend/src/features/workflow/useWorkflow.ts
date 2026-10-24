import { useMemo } from 'react'
import type { WorkflowStatus } from './workflow.config'
import { workflows } from './workflow.config'

export function useWorkflow(workflowType: keyof typeof workflows, currentStatus: WorkflowStatus) {

    const config = workflows[workflowType]

    const availableTransitions = useMemo(() => {
        return config.transitions.filter(t => t.from === currentStatus)
    }, [config, currentStatus])

    const isTerminal = useMemo(() => {
        return config.terminal.includes(currentStatus)
    }, [config, currentStatus])

    const getNextStatus = (targetTo: string): string => {
        const match = availableTransitions.find(t => t.to === targetTo)
        if (!match) throw new Error(`Invalid transition to ${targetTo} from ${currentStatus}`)
        return match.to
    }

    return {
        initial: config.initial,
        availableTransitions,
        isTerminal,
        getNextStatus
    }
}
