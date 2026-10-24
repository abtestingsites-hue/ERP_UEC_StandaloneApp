import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '../../../components/Toast';
import { api } from '../../../lib/axios';

export interface Room {
    id: string;
    code: string;
    status: boolean;
    [key: string]: any;
}

export const roomService = {
    getAll: async (): Promise<Room[]> => {
        const res = await api.get('/master/room');
        return res.data.data;
    },
    create: async (data: any): Promise<Room> => {
        const res = await api.post('/master/room', data);
        return res.data.data;
    },
    update: async (id: string, data: any): Promise<Room> => {
        const res = await api.put(`/master/room/${id}`, data);
        return res.data.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/master/room/${id}`);
    }
};

export function useRooms() {
    return useQuery({
        queryKey: ['rooms'],
        queryFn: roomService.getAll
    });
}

export function useCreateRoom() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: roomService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            toast({ type: 'success', title: 'Success', message: 'Room added successfully' });
        },
        onError: (error) => {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || 'Failed to add room'
                : 'Failed to add room';
            toast({ type: 'error', title: 'Error', message });
        }
    });
}

export function useUpdateRoom() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => roomService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            toast({ type: 'success', title: 'Success', message: 'Room updated successfully' });
        },
        onError: (error) => {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || 'Failed to update room'
                : 'Failed to update room';
            toast({ type: 'error', title: 'Error', message });
        }
    });
}

export function useDeleteRoom() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: roomService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            toast({ type: 'success', title: 'Success', message: 'Room deleted successfully' });
        },
        onError: (error) => {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || 'Failed to delete room'
                : 'Failed to delete room';
            toast({ type: 'error', title: 'Error', message });
        }
    });
}
