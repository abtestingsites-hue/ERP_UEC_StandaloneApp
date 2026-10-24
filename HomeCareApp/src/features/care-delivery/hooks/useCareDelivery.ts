import { useMutation, useQueryClient } from '@tanstack/react-query';
import { careDeliveryApi } from '../api/careDeliveryApi';
import type { SaveVitalsPayload, SaveCareNotesPayload } from '../api/careDeliveryApi';

export function useCareDelivery() {
    const queryClient = useQueryClient();

    const recordVitalsMutation = useMutation({
        mutationFn: (payload: SaveVitalsPayload) => careDeliveryApi.recordVitals(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['nursing-care', 'vitals'] });
        }
    });

    const recordNotesMutation = useMutation({
        mutationFn: (payload: SaveCareNotesPayload) => careDeliveryApi.recordDailyNotes(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patient-care', 'adl-records'] });
        }
    });

    return {
        recordVitals: recordVitalsMutation.mutateAsync,
        isRecordingVitals: recordVitalsMutation.isPending,
        vitalsSuccess: recordVitalsMutation.isSuccess,

        recordDailyNotes: recordNotesMutation.mutateAsync,
        isRecordingNotes: recordNotesMutation.isPending,
        notesSuccess: recordNotesMutation.isSuccess
    };
}
