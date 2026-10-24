import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'
import { ambulanceService } from '../services/ambulance'
import type { 
    AmbulanceRecordType, 
    AmbulanceVehicle, 
    AmbulanceTrip, 
    VehicleStatus, 
    TripStatus 
} from '../types'

const resolveErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback

// --- LEGACY HOOKS ---
export const ambulanceQueryKey = (type: AmbulanceRecordType) => ['ambulance-records', type]

export const useAmbulanceRecords = (type: AmbulanceRecordType) => {
    return useQuery({
        queryKey: ambulanceQueryKey(type),
        queryFn: () => ambulanceService.getRecords(type),
        retry: false
    })
}

export const useCreateAmbulanceRecord = (type: AmbulanceRecordType) => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ambulanceService.createRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ambulanceQueryKey(type) })
            toast({ type: 'success', title: 'Saved', message: 'Ambulance record saved successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Save Failed', message: resolveErrorMessage(error, 'Failed to save ambulance record') })
        }
    })
}

export const useUpdateAmbulanceStatus = (type: AmbulanceRecordType) => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ambulanceService.updateStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ambulanceQueryKey(type) })
            toast({ type: 'success', title: 'Updated', message: 'Ambulance status updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update ambulance status') })
        }
    })
}

// --- NEW VEHICLE HOOKS ---
export const vehiclesQueryKey = () => ['ambulance', 'vehicles']
export const vehicleQueryKey = (id: string) => ['ambulance', 'vehicle', id]

export const useVehicles = () => {
    return useQuery({
        queryKey: vehiclesQueryKey(),
        queryFn: ambulanceService.getVehicles,
        retry: false
    })
}

export const useVehicle = (id: string) => {
    return useQuery({
        queryKey: vehicleQueryKey(id),
        queryFn: () => ambulanceService.getVehicle(id),
        enabled: !!id,
        retry: false
    })
}

export const useCreateVehicle = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ambulanceService.createVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehiclesQueryKey() })
            toast({ type: 'success', title: 'Saved', message: 'Vehicle created successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Save Failed', message: resolveErrorMessage(error, 'Failed to create vehicle') })
        }
    })
}

export const useUpdateVehicle = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: Partial<AmbulanceVehicle> }) => ambulanceService.updateVehicle(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: vehiclesQueryKey() })
            queryClient.invalidateQueries({ queryKey: vehicleQueryKey(id) })
            toast({ type: 'success', title: 'Updated', message: 'Vehicle updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update vehicle') })
        }
    })
}

export const useUpdateVehicleStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, status }: { id: string, status: VehicleStatus }) => ambulanceService.updateVehicleStatus(id, status),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: vehiclesQueryKey() })
            queryClient.invalidateQueries({ queryKey: vehicleQueryKey(id) })
            toast({ type: 'success', title: 'Status Updated', message: 'Vehicle status updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update vehicle status') })
        }
    })
}

// --- NEW TRIP HOOKS ---
export const tripsQueryKey = () => ['ambulance', 'trips']
export const tripQueryKey = (id: string) => ['ambulance', 'trip', id]

export const useTrips = () => {
    return useQuery({
        queryKey: tripsQueryKey(),
        queryFn: ambulanceService.getTrips,
        retry: false
    })
}

export const useTrip = (id: string) => {
    return useQuery({
        queryKey: tripQueryKey(id),
        queryFn: () => ambulanceService.getTrip(id),
        enabled: !!id,
        retry: false
    })
}

export const useCreateTrip = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ambulanceService.createTrip,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tripsQueryKey() })
            toast({ type: 'success', title: 'Saved', message: 'Trip created successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Save Failed', message: resolveErrorMessage(error, 'Failed to create trip') })
        }
    })
}

export const useUpdateTrip = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: Partial<AmbulanceTrip> }) => ambulanceService.updateTrip(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: tripsQueryKey() })
            queryClient.invalidateQueries({ queryKey: tripQueryKey(id) })
            toast({ type: 'success', title: 'Updated', message: 'Trip updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update trip') })
        }
    })
}

export const useUpdateTripStatus = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: { status: TripStatus; [key: string]: any } }) => ambulanceService.updateTripStatus(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: tripsQueryKey() })
            queryClient.invalidateQueries({ queryKey: tripQueryKey(id) })
            queryClient.invalidateQueries({ queryKey: vehiclesQueryKey() }) // Invalidate vehicles too as status changes
            toast({ type: 'success', title: 'Status Updated', message: 'Trip status updated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Update Failed', message: resolveErrorMessage(error, 'Failed to update trip status') })
        }
    })
}

export const useGenerateAmbulanceInvoice = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (id: string) => ambulanceService.generateInvoice(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: tripsQueryKey() })
            queryClient.invalidateQueries({ queryKey: tripQueryKey(id) })
            toast({ type: 'success', title: 'Invoice Generated', message: 'Ambulance invoice generated successfully' })
        },
        onError: (error: any) => {
            toast({ type: 'error', title: 'Invoice Generation Failed', message: resolveErrorMessage(error, 'Failed to generate invoice') })
        }
    })
}

