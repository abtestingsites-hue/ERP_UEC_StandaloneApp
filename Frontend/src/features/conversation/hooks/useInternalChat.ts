import { useQuery, useMutation } from '@tanstack/react-query'
import { internalChatService, type InternalMessage } from '../services/internalChat'
import { useEffect, useState } from 'react'
import { realtimeSocket } from '../../../lib/realtimeSocket'

export const useInternalStaff = () => {
    return useQuery({
        queryKey: ['internalStaff'],
        queryFn: internalChatService.getStaff
    })
}

export const useInternalConversation = (targetUserId: string | null) => {
    const [messages, setMessages] = useState<InternalMessage[]>([]);

    const query = useQuery({
        queryKey: ['internalConversation', targetUserId],
        queryFn: () => internalChatService.getOrCreateConversation(targetUserId!),
        enabled: !!targetUserId,
    });

    useEffect(() => {
        if (query.data) {
            setMessages(query.data.messages);

            const conversationId = query.data.id;
            const eventName = `chat:${conversationId}`;

            const handleNewMessage = (payload: any) => {
                if (payload.type === 'NEW_MESSAGE') {
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.find(m => m.id === payload.message.id)) return prev;
                        return [...prev, payload.message];
                    });
                }
            };

            realtimeSocket.on(eventName, handleNewMessage);
            return () => {
                realtimeSocket.off(eventName, handleNewMessage);
            };
        }
    }, [query.data, targetUserId]);

    return { ...query, messages };
}

export const useSendInternalMessage = () => {
    return useMutation({
        mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
            internalChatService.sendMessage(conversationId, body)
    })
}
