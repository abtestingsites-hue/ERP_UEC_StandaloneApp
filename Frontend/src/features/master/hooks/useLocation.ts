import { useMutation, useQuery } from '@tanstack/react-query'
import { locationService } from '../services/location'
import { useToast } from '../../../components/Toast'

const resolveLocationErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback

export const useLocationSearch = (query: string) => {
    return useQuery({
        queryKey: ['location-search', query],
        queryFn: () => locationService.searchLocations(query),
        enabled: query.trim().length >= 2,
        staleTime: 60_000,
        retry: false
    })
}

export const useCreateLocation = () => {
    const { toast } = useToast()

    return useMutation({
        mutationFn: locationService.createLocation,
        onSuccess: () => {
            toast({ type: 'success', title: 'Success', message: 'Location created successfully' })
        },
        onError: (error: any) => {
            toast({
                type: 'error',
                title: 'Error',
                message: resolveLocationErrorMessage(error, 'Failed to create location')
            })
        }
    })
}
