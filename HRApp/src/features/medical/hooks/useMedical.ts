import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/axios'

export const useMedicalAssignments = (params?: {
    search?: string
    status?: string
    staffId?: string
    patientId?: string
    allocationId?: string
    from?: string
    to?: string
    activeOnly?: boolean
}) => {
    return useQuery({
        queryKey: ['medical-assignments', params],
        queryFn: async () => {
            const res = await api.get('/medical/assignments', { params })
            return res.data.data || []
        },
        retry: false
    })
}
