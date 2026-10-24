import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chat.service';
import { connectRealtimeSocket, realtimeSocket } from '../../../lib/realtimeSocket';

const MESSAGE_EVENT_NAMES = [
    'NEW_MESSAGE',
    'MESSAGE_QUEUED',
    'MESSAGE_SENT',
    'MESSAGE_DELIVERED',
    'MESSAGE_READ',
    'MESSAGE_FAILED',
    'MESSAGE_RETRYING',
    'MESSAGE_UPDATED',
    'INCOMING_CALL',
    'CALL_STATUS',
    'OUTGOING_CALL',
    'call:started',
    'call:updated',
    'call:ended'
];

const normalizeDirection = (value?: string) => String(value || '').trim().toUpperCase();
const normalizeChannel = (value?: string) => String(value || '').trim().toLowerCase();
const normalizeStatus = (message: any) => String(message?.deliveryStatus || message?.status || '').trim().toUpperCase();

const sortMessages = (messages: any[], order: 'asc' | 'desc' = 'asc') => {
    const direction = order === 'asc' ? 1 : -1;
    return [...messages].sort((left, right) =>
        (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * direction
    );
};

const mergeMessage = (currentMessage: any, nextMessage: any) => {
    const merged = {
        ...currentMessage,
        ...nextMessage,
        isOptimistic: false
    };

    if (currentMessage?.isOptimistic && normalizeDirection(nextMessage?.direction) === 'OUTBOUND') {
        const nextStatus = normalizeStatus(nextMessage);

        if (nextStatus === 'QUEUED') {
            merged.status = currentMessage.status || 'SENT';
            merged.deliveryStatus = currentMessage.deliveryStatus || 'SENT';
        }
    }

    return merged;
};

const isOptimisticCandidate = (message: any, nextMessage: any) => {
    if (!message?.isOptimistic) return false;

    const isSameDirection = normalizeDirection(message.direction) === normalizeDirection(nextMessage.direction);
    const isSameChannel = normalizeChannel(message.channel) === normalizeChannel(nextMessage.channel);
    const isSameBody = String(message.body || '') === String(nextMessage.body || '');
    const isSameRecipient = String(message.externalUserId || '') === String(nextMessage.externalUserId || '');
    const isCloseInTime = Math.abs(
        new Date(message.createdAt).getTime() - new Date(nextMessage.createdAt).getTime()
    ) < 60_000;

    return isSameDirection && isSameChannel && isSameBody && isSameRecipient && isCloseInTime;
};

const upsertMessage = (messages: any[], nextMessage: any, order: 'asc' | 'desc' = 'asc') => {
    const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
    if (existingIndex === -1) {
        const optimisticIndex = messages.findIndex((message) => isOptimisticCandidate(message, nextMessage));

        if (optimisticIndex !== -1) {
            const updated = [...messages];
            updated[optimisticIndex] = mergeMessage(updated[optimisticIndex], nextMessage);
            return sortMessages(updated, order);
        }

        return sortMessages([...messages, nextMessage], order);
    }

    const updated = [...messages];
    updated[existingIndex] = mergeMessage(updated[existingIndex], nextMessage);

    return sortMessages(updated, order);
};

const sortConversations = (conversations: any[]) => [...conversations].sort((left, right) =>
    new Date(right.lastMessageAt || 0).getTime() - new Date(left.lastMessageAt || 0).getTime()
);

const updateConversationSummary = (conversation: any, nextMessage: any) => {
    const nextDirection = normalizeDirection(nextMessage?.direction);
    const summaryMessages = upsertMessage(conversation?.messages || [], nextMessage, 'desc').slice(0, 20);

    return {
        ...conversation,
        messages: summaryMessages,
        lastMessageAt: nextMessage?.createdAt || conversation?.lastMessageAt,
        channel: nextMessage?.channel || conversation?.channel,
        lastInboundChannel: nextDirection === 'INBOUND'
            ? normalizeChannel(nextMessage?.channel) || conversation?.lastInboundChannel
            : conversation?.lastInboundChannel
    };
};

const upsertConversation = (conversations: any[], payload: any, activeConversation: any) => {
    if (!payload?.conversationId || !payload?.message) return conversations;

    const existingIndex = conversations.findIndex((conversation) => conversation.id === payload.conversationId);
    if (existingIndex === -1) {
        if (activeConversation?.id !== payload.conversationId) {
            return conversations;
        }

        return sortConversations([
            updateConversationSummary(activeConversation, payload.message),
            ...conversations
        ]);
    }

    const updated = [...conversations];
    updated[existingIndex] = updateConversationSummary(updated[existingIndex], payload.message);
    return sortConversations(updated);
};

export function useChat(entityType?: string, entityId?: string, enabled = true) {
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});

    const fetchConversations = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);
        try {
            const data = await chatService.getConversations({ entityType, entityId });
            setConversations(data);
            setActiveConversation((current: any) => {
                if (!current) return data[0] ?? null;

                const matchingConversation = data.find((conversation: any) => conversation.id === current.id);
                if (!matchingConversation) {
                    return data[0] ?? null;
                }

                return {
                    ...matchingConversation,
                    messages: current.messages?.length ? current.messages : matchingConversation.messages
                };
            });
        } catch (err: any) {
            setError(err.message || 'Failed to fetch conversations');
        } finally {
            setLoading(false);
        }
    }, [enabled, entityType, entityId]);

    const selectConversation = async (id: string) => {
        try {
            const data = await chatService.getConversation(id);
            setActiveConversation(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch conversation');
        }
    };

    const sendMessage = async ({
        body,
        channel = 'whatsapp',
        externalUserId,
        retryMessageId,
        subject
    }: {
        body: string;
        channel?: string;
        externalUserId?: string;
        retryMessageId?: string;
        subject?: string;
    }) => {
        if (!activeConversation) return;

        const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const optimisticMessage = {
            id: optimisticId,
            body,
            channel,
            direction: 'OUTBOUND',
            deliveryStatus: 'SENT',
            status: 'SENT',
            createdAt: new Date().toISOString(),
            sender: 'You',
            recipient: externalUserId || null,
            externalUserId: externalUserId || null,
            metadata: subject ? { subject } : null,
            isOptimistic: true
        };

        setError(null);
        setSending(true);
        setActiveConversation((prev: any) => prev ? ({
            ...prev,
            messages: upsertMessage(prev.messages || [], optimisticMessage)
        }) : prev);
        setConversations((current) => upsertConversation(current, {
            conversationId: activeConversation.id,
            message: optimisticMessage
        }, activeConversation));

        try {
            const normalizedChannel = normalizeChannel(channel);
            const { message } = normalizedChannel === 'sms'
                ? await chatService.sendSMS({
                    conversationId: activeConversation.id,
                    to: externalUserId,
                    externalUserId,
                    message: body
                })
                : await chatService.sendMessage({
                    conversationId: activeConversation.id,
                    body,
                    channel,
                    externalUserId,
                    retryMessageId,
                    subject
                });

            setActiveConversation((prev: any) => prev ? ({
                ...prev,
                messages: upsertMessage(prev?.messages || [], message)
            }) : prev);
            setConversations((current) => upsertConversation(current, {
                conversationId: activeConversation.id,
                message
            }, activeConversation));

            return message;
        } catch (err: any) {
            const failedOptimisticMessage = {
                ...optimisticMessage,
                deliveryStatus: 'FAILED',
                status: 'FAILED',
                isOptimistic: false,
                metadata: {
                    ...(optimisticMessage.metadata || {}),
                    errorMessage: err.message || 'Failed to send message'
                }
            };

            setActiveConversation((prev: any) => prev ? ({
                ...prev,
                messages: upsertMessage(prev?.messages || [], failedOptimisticMessage)
            }) : prev);
            setConversations((current) => upsertConversation(current, {
                conversationId: activeConversation.id,
                message: failedOptimisticMessage
            }, activeConversation));
            setError(err.message || 'Failed to send message');
            return null;
        } finally {
            setSending(false);
        }
    };

    const emitTypingStart = useCallback(() => {
        if (!activeConversation?.id) return;
        realtimeSocket.emit('typing:start', { conversationId: activeConversation.id });
    }, [activeConversation?.id]);

    const emitTypingStop = useCallback(() => {
        if (!activeConversation?.id) return;
        realtimeSocket.emit('typing:stop', { conversationId: activeConversation.id });
    }, [activeConversation?.id]);

    useEffect(() => {
        if (!enabled) return;
        fetchConversations();
    }, [enabled, fetchConversations]);

    useEffect(() => {
        if (!enabled) return;
        connectRealtimeSocket();
    }, [enabled]);

    useEffect(() => {
        if (!enabled || !activeConversation?.id) return;

        const currentId = activeConversation.id;
        realtimeSocket.emit("join", currentId);
        realtimeSocket.emit("join:conversation", currentId);

        return () => {
            realtimeSocket.emit("leave", currentId);
            realtimeSocket.emit("leave:conversation", currentId);
        };
    }, [activeConversation?.id, enabled]);

    useEffect(() => {
        if (!enabled) return;

        const handleConversationEvent = (payload: any) => {
            if (!payload?.conversationId) return;

            if (payload.conversationId === activeConversation?.id && payload.message) {
                setActiveConversation((current: any) => current ? ({
                    ...current,
                    messages: upsertMessage(current.messages || [], payload.message)
                }) : current);
            }

            setConversations((current) => upsertConversation(current, payload, activeConversation));
        };

        MESSAGE_EVENT_NAMES.forEach((eventName) => {
            realtimeSocket.on(eventName, handleConversationEvent);
        });
        realtimeSocket.on('conversation:update', handleConversationEvent);

        const handleTypingStart = (payload: any) => {
            if (!payload?.conversationId) return;
            setTypingUsers((prev) => {
                const current = new Set(prev[payload.conversationId] || []);
                current.add(payload.userId || 'User');
                return { ...prev, [payload.conversationId]: current };
            });
        };

        const handleTypingStop = (payload: any) => {
            if (!payload?.conversationId) return;
            setTypingUsers((prev) => {
                const current = new Set(prev[payload.conversationId] || []);
                current.delete(payload.userId || 'User');
                return { ...prev, [payload.conversationId]: current };
            });
        };

        realtimeSocket.on('typing:start', handleTypingStart);
        realtimeSocket.on('typing:stop', handleTypingStop);

        return () => {
            MESSAGE_EVENT_NAMES.forEach((eventName) => {
                realtimeSocket.off(eventName, handleConversationEvent);
            });
            realtimeSocket.off('conversation:update', handleConversationEvent);
            realtimeSocket.off('typing:start', handleTypingStart);
            realtimeSocket.off('typing:stop', handleTypingStop);
        };
    }, [activeConversation, enabled]);

    return {
        conversations,
        activeConversation,
        loading,
        sending,
        error,
        typingUsers,
        selectConversation,
        sendMessage,
        emitTypingStart,
        emitTypingStop,
        refresh: fetchConversations
    };
}
