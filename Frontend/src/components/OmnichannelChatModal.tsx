import { Download, Mail, MessageSquare, Phone, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOutgoing, PhoneOff, Play, RotateCcw, Search, Send, Sparkles, User, X } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState, useRef } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { ChannelBadge, getChannelMeta } from '../features/conversation/components/ChannelBadge'
import { useChat } from '../features/conversation/hooks/useChat'
import { useInternalConversation, useInternalStaff, useSendInternalMessage } from '../features/conversation/hooks/useInternalChat'
import { chatService } from '../features/conversation/services/chat.service'
import { cn } from '../lib/utils'
import { useToast } from './Toast'
import { StatusHighlighter } from './StatusHighlighter'
import { callsSocket, connectCallsSocket, connectRealtimeSocket, realtimeSocket } from '../lib/realtimeSocket'
import { useCallCenterStore } from '../store/callCenterStore'
import { useAuthStore } from '../store/authStore'
import { WebRTCService } from '../features/conversation/services/webrtc.service'

const normalizeDirection = (value?: string) => String(value || '').trim().toUpperCase()
const normalizeChannel = (value?: string) => String(value || '').trim().toLowerCase()
const normalizeStatus = (message: any) => String(message?.deliveryStatus || message?.status || '').trim().toUpperCase()
const getMessageText = (message: any) => String(message?.body ?? message?.text ?? '').trim()
const CLIENT_REPLY_CHANNELS = new Set(['whatsapp', 'email', 'sms'])
const isClientReplyChannel = (channel?: string) => CLIENT_REPLY_CHANNELS.has(normalizeChannel(channel))
const formatStatusLabel = (value?: string) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase())

const formatCallDuration = (seconds?: number | null) => {
    const totalSeconds = Math.max(0, Number(seconds || 0))
    const minutes = Math.floor(totalSeconds / 60)
    const remainder = totalSeconds % 60
    if (!minutes) return `${remainder}s`
    return `${minutes}m ${remainder.toString().padStart(2, '0')}s`
}

const getCallRecordingUrl = (message: any) =>
    String(message?.metadata?.recordingUrl || message?.recordingUrl || '').trim()

const getCallHistoryRecordingUrl = (call: any) => String(call?.recordingUrl || '').trim()

const isLiveCallStatus = (status?: string) => ['ringing', 'answered', 'in progress', 'in-progress', 'connected', 'queued', 'ongoing'].includes(
    String(status || '').trim().toLowerCase().replace(/_/g, ' ')
)

const isAnsweredCallStatus = (status?: string) => ['answered', 'completed', 'connected', 'in progress', 'in-progress', 'ongoing', 'ended'].includes(
    String(status || '').trim().toLowerCase().replace(/_/g, ' ')
)

const isMissedCallStatus = (status?: string) => ['missed', 'no answer', 'no-answer', 'rejected', 'failed', 'busy', 'canceled'].includes(
    String(status || '').trim().toLowerCase().replace(/_/g, ' ')
)

const getCallStartedAt = (call: any) => new Date(call?.startedAt || call?.createdAt || Date.now())

const isSameCalendarDay = (date: Date, offsetDays = 0) => {
    const target = new Date()
    target.setDate(target.getDate() - offsetDays)
    return date.toDateString() === target.toDateString()
}

const getDeliveryMeta = (message: any) => {
    const normalized = normalizeStatus(message)
    const normalizedChannel = normalizeChannel(message?.channel)

    if (normalizedChannel === 'call') {
        switch (normalized) {
            case 'QUEUED':
                return { indicator: '...', label: 'Queued', className: 'text-amber-100 dark:text-amber-200', failed: false }
            case 'RINGING':
                return { indicator: '...', label: 'Ringing', className: 'text-amber-100 dark:text-amber-200', failed: false }
            case 'IN_PROGRESS':
            case 'CONNECTED':
                return { indicator: 'Live', label: 'Connected', className: 'text-emerald-100 dark:text-emerald-200', failed: false }
            case 'COMPLETED':
            case 'ENDED':
                return { indicator: 'Done', label: 'Ended', className: 'text-emerald-100 dark:text-emerald-200', failed: false }
            case 'BUSY':
            case 'NO_ANSWER':
            case 'CANCELED':
            case 'REJECTED':
            case 'FAILED':
                return { indicator: formatStatusLabel(normalized), label: formatStatusLabel(normalized), className: 'text-red-100 dark:text-red-200', failed: false }
            default:
                return normalized
                    ? { indicator: formatStatusLabel(normalized), label: formatStatusLabel(normalized), className: 'text-white/80 dark:text-slate-300', failed: false }
                    : null
        }
    }

    switch (normalized) {
        case 'READ':
            return { indicator: '\u{1F441}', label: 'Read', className: 'text-emerald-100 dark:text-emerald-200', failed: false }
        case 'DELIVERED':
            return { indicator: '\u2713\u2713', label: 'Delivered', className: 'text-emerald-100 dark:text-emerald-200', failed: false }
        case 'SENT':
            return { indicator: '\u2713', label: 'Sent', className: 'text-white/80 dark:text-white/80', failed: false }
        case 'FAILED':
            return { indicator: '\u274C', label: 'Failed', className: 'text-red-100 dark:text-red-200', failed: true }
        case 'RETRYING':
            return { indicator: '...', label: 'Retrying', className: 'text-amber-100 dark:text-amber-200', failed: false }
        case 'QUEUED':
            return { indicator: '...', label: 'Queued', className: 'text-white/80 dark:text-slate-300', failed: false }
        default:
            return normalized
                ? { indicator: normalized, label: formatStatusLabel(normalized), className: 'text-white/80 dark:text-slate-300', failed: false }
                : null
    }
}

const getConversationName = (conversation: any) =>
    conversation?.client?.name
    || conversation?.subject
    || conversation?.enquiry?.clientName
    || 'Customer'

const getConversationPreview = (conversation: any) => {
    const latestMessage = conversation?.messages?.[0]
    if (normalizeChannel(latestMessage?.channel) === 'call') {
        const direction = normalizeDirection(latestMessage?.direction) === 'OUTBOUND' ? 'Outgoing' : 'Incoming'
        const status = formatStatusLabel(latestMessage?.deliveryStatus || latestMessage?.status || latestMessage?.metadata?.callStatus)
        const duration = Number(latestMessage?.metadata?.duration || 0)
        const durationLabel = duration > 0 ? ` - ${formatCallDuration(duration)}` : ''
        return `${direction} call${status ? ` ${status.toLowerCase()}` : ''}${durationLabel}`
    }

    return getMessageText(latestMessage) || 'No messages yet'
}

const getIdentityForChannel = (conversation: any, channel?: string) => {
    const normalizedChannel = normalizeChannel(channel)
    return conversation?.channelIdentities?.find((identity: any) => normalizeChannel(identity?.channel) === normalizedChannel) || null
}

const isSyntheticMobile = (value?: string) => String(value || '').toLowerCase().startsWith('email:')

const getLatestMessageExternalUserId = (conversation: any, channel?: string) => {
    const normalizedChannel = normalizeChannel(channel)
    const messages = Array.isArray(conversation?.messages) ? conversation.messages : []
    let latestMessage: any = null

    messages.forEach((message: any) => {
        if (normalizeChannel(message?.channel) !== normalizedChannel) return
        if (!String(message?.externalUserId || '').trim()) return

        if (!latestMessage) {
            latestMessage = message
            return
        }

        if (new Date(message?.createdAt || 0).getTime() >= new Date(latestMessage?.createdAt || 0).getTime()) {
            latestMessage = message
        }
    })

    const externalUserId = String(latestMessage?.externalUserId || '').trim()

    if (normalizedChannel === 'email') return externalUserId.toLowerCase()
    if (normalizedChannel === 'whatsapp' || normalizedChannel === 'sms') return externalUserId.replace(/[^\d]/g, '')
    return externalUserId || ''
}

const getWhatsAppExternalUserId = (conversation: any) => {
    const directValue = String(conversation?.client?.mobile || '').trim()
    if (directValue && !isSyntheticMobile(directValue)) return directValue
    return String(
        getIdentityForChannel(conversation, 'whatsapp')?.externalUserId
        || getLatestMessageExternalUserId(conversation, 'whatsapp')
        || ''
    ).trim()
}

const getCallExternalUserId = (conversation: any) =>
    String(
        getIdentityForChannel(conversation, 'call')?.externalUserId
        || getIdentityForChannel(conversation, 'sms')?.externalUserId
        || getLatestMessageExternalUserId(conversation, 'call')
        || getLatestMessageExternalUserId(conversation, 'sms')
        || getWhatsAppExternalUserId(conversation)
        || ''
    ).trim()

const getSmsExternalUserId = (conversation: any) =>
    String(
        getIdentityForChannel(conversation, 'sms')?.externalUserId
        || getLatestMessageExternalUserId(conversation, 'sms')
        || getWhatsAppExternalUserId(conversation)
        || getCallExternalUserId(conversation)
        || ''
    ).trim()

const getEmailExternalUserId = (conversation: any) =>
    String(
        conversation?.client?.email
        || getIdentityForChannel(conversation, 'email')?.externalUserId
        || getLatestMessageExternalUserId(conversation, 'email')
        || ''
    ).trim().toLowerCase()

const getCustomerPhone = (conversation: any) => {
    return getCallExternalUserId(conversation) || 'N/A'
}

const getCustomerEmail = (conversation: any) =>
    getEmailExternalUserId(conversation) || 'N/A'

const getExternalUserIdForChannel = (conversation: any, channel?: string) => {
    const normalizedChannel = normalizeChannel(channel)

    if (normalizedChannel === 'email') {
        return getEmailExternalUserId(conversation) || null
    }

    if (normalizedChannel === 'whatsapp') {
        return getWhatsAppExternalUserId(conversation) || null
    }

    if (normalizedChannel === 'call') {
        return getCallExternalUserId(conversation) || null
    }

    if (normalizedChannel === 'sms') {
        return getSmsExternalUserId(conversation) || null
    }

    return getIdentityForChannel(conversation, normalizedChannel)?.externalUserId
        || getLatestMessageExternalUserId(conversation, normalizedChannel)
        || null
}

const getAvailableReplyChannels = (conversation: any, preferredChannel?: string) => {
    const channels = ['whatsapp', 'sms', 'email'].filter((channel) =>
        Boolean(getExternalUserIdForChannel(conversation, channel))
    )

    if (preferredChannel && channels.includes(preferredChannel)) {
        return [preferredChannel, ...channels.filter((channel) => channel !== preferredChannel)]
    }

    return channels
}

const getMessageSender = (message: any, conversation: any) => {
    if (normalizeDirection(message?.direction) === 'OUTBOUND') return message?.sender || 'Agent'
    return message?.sender || getConversationName(conversation)
}

const getBubbleClassName = (channel?: string, outbound?: boolean) => {
    const meta = getChannelMeta(channel)

    if (outbound) {
        return 'border-primary-500 bg-primary-600 text-white shadow-[0_18px_40px_rgba(15,150,156,0.25)]'
    }

    return cn('border bg-white text-slate-900 dark:bg-[#171717] dark:text-slate-100', meta.surfaceClassName)
}

const buildThreadItems = (messages: any[]) => {
    const items: Array<any> = []
    let activeDayKey = ''
    let previousTimestamp = 0

    messages.forEach((message) => {
        const timestamp = new Date(message?.createdAt || Date.now())
        if (Number.isNaN(timestamp.getTime())) return

        const dayKey = format(timestamp, 'yyyy-MM-dd')
        if (dayKey !== activeDayKey) {
            items.push({ type: 'day', key: `day-${dayKey}`, label: format(timestamp, 'EEE, MMM d') })
            activeDayKey = dayKey
            previousTimestamp = 0
        }

        if (!previousTimestamp || timestamp.getTime() - previousTimestamp > 1000 * 60 * 20) {
            items.push({ type: 'time', key: `time-${message.id}`, label: format(timestamp, 'p') })
        }

        items.push({ type: 'message', key: message.id, message })
        previousTimestamp = timestamp.getTime()
    })

    return items
}

type ChatModalProps = {
    isOpen: boolean
    onClose: () => void
    entityType?: string
    entityId?: string
    focusConversationId?: string | null
    openCallCenter?: boolean
}

export function ChatModal({ isOpen, onClose, entityType, entityId, focusConversationId, openCallCenter = false }: ChatModalProps) {
    const [chatType, setChatType] = useState<'client' | 'internal'>('client')
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
    const [internalCallTargetStaff, setInternalCallTargetStaff] = useState<any>(null)
    const [internalCallState, setInternalCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle')
    const [incomingCallPayload, setIncomingCallPayload] = useState<any>(null)
    const [webrtcServiceInstance, setWebrtcServiceInstance] = useState<WebRTCService | null>(null)
    const currentUser = useAuthStore((state) => state.user)
    const [draft, setDraft] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [replyChannel, setReplyChannel] = useState('whatsapp')
    const [manualChannel, setManualChannel] = useState(false)
    const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null)
    const [leadScore, setLeadScore] = useState<any>(null)
    const [loadingScore, setLoadingScore] = useState(false)
    const [callModalOpen, setCallModalOpen] = useState(false)
    const [callFilter, setCallFilter] = useState('today')
    const [callSearchQuery, setCallSearchQuery] = useState('')
    const [startingCall, setStartingCall] = useState(false)
    const [pendingFocusConversationId, setPendingFocusConversationId] = useState<string | null>(null)
    const [callHistory, setCallHistory] = useState<any[]>([])
    const [callContext, setCallContext] = useState<any>(null)
    const [callAnalytics, setCallAnalytics] = useState<any>(null)
    const [loadingCalls, setLoadingCalls] = useState(false)
    const [callTicker, setCallTicker] = useState(0)

    const isGlobalMode = openCallCenter && !focusConversationId

    const deferredSearch = useDeferredValue(searchQuery)
    const { conversations, activeConversation, selectConversation, sendMessage, loading, sending, typingUsers, emitTypingStart, emitTypingStop } = useChat(entityType, entityId, isOpen && chatType === 'client')
    const { data: staff = [], isLoading: loadingStaff } = useInternalStaff()
    const { data: internalConversation, messages: internalMessages, isLoading: loadingInternalMessages } = useInternalConversation(selectedStaffId)
    const sendInternal = useSendInternalMessage()
    const { toast } = useToast()
    const setCallStoreCalls = useCallCenterStore((state) => state.setCalls)
    const setCallStoreAnalytics = useCallCenterStore((state) => state.setAnalytics)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [activeConversation?.messages?.length, internalMessages?.length, typingUsers, activeConversation?.id])

    const clientMessages = [...(activeConversation?.messages || [])].sort((left: any, right: any) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    )
    const lastInbound = clientMessages.filter((message: any) => normalizeDirection(message?.direction) === 'INBOUND').slice(-1)[0]
    const preferredChannel = [
        lastInbound?.channel,
        activeConversation?.lastInboundChannel,
        activeConversation?.channel
    ].map((channel) => normalizeChannel(channel)).find((channel) => isClientReplyChannel(channel))
    const availableChannels = activeConversation
        ? getAvailableReplyChannels(activeConversation, preferredChannel)
        : []
    const defaultChannel = preferredChannel && availableChannels.includes(preferredChannel)
        ? preferredChannel
        : (availableChannels[0] || 'whatsapp')
    const fallbackChannels = availableChannels.length ? availableChannels : [defaultChannel]
    const isReplyChannelAvailable = fallbackChannels.includes(replyChannel)
    const selectedReplyChannel = replyChannel || defaultChannel
    const selectedIdentity = getIdentityForChannel(activeConversation, selectedReplyChannel)
    const selectedExternalUserId = getExternalUserIdForChannel(activeConversation, selectedReplyChannel) || selectedIdentity?.externalUserId || undefined
    const hasSelectedReplyRecipient = Boolean(selectedExternalUserId)
    const selectedStaff = staff.find((person: any) => person.userId === selectedStaffId)
    const conversationDisplayChannel = normalizeChannel(
        lastInbound?.channel
        || activeConversation?.lastInboundChannel
        || activeConversation?.channel
        || selectedReplyChannel
        || 'whatsapp'
    ) || 'whatsapp'
    const visibleChannel = hasSelectedReplyRecipient ? selectedReplyChannel : conversationDisplayChannel
    const activeChannelMeta = getChannelMeta(visibleChannel)
    const lastInteractionAt = activeConversation?.lastMessageAt || clientMessages[clientMessages.length - 1]?.createdAt
    const customerCallTarget = getCallExternalUserId(activeConversation)
    const customerPhone = getCustomerPhone(activeConversation)
    const customerEmail = getCustomerEmail(activeConversation)
    const canStartCall = Boolean(activeConversation?.id && customerCallTarget && !startingCall)
    const normalizedSearch = deferredSearch.trim().toLowerCase()
    const filteredConversations = chatType === 'client'
        ? conversations.filter((conversation: any) => {
            if (!normalizedSearch) return true
            return [
                getConversationName(conversation),
                getConversationPreview(conversation),
                conversation?.client?.mobile,
                conversation?.client?.email,
                conversation?.subject
            ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch))
        })
        : staff.filter((person: any) => {
            if (!normalizedSearch) return true
            return [
                `${person.firstName || ''} ${person.lastName || ''}`,
                person.designation,
                person.email
            ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch))
        })

    useEffect(() => {
        if (chatType !== 'client') return
        setManualChannel(false)
    }, [activeConversation?.id, chatType])

    useEffect(() => {
        if (chatType !== 'client' || manualChannel) return
        setReplyChannel(defaultChannel)
    }, [chatType, defaultChannel, manualChannel])

    useEffect(() => {
        if (chatType !== 'client') return
        if (isReplyChannelAvailable) return
        setReplyChannel(defaultChannel)
    }, [chatType, defaultChannel, isReplyChannelAvailable])

    useEffect(() => {
        if (!isOpen) return
        setPendingFocusConversationId(focusConversationId || null)
    }, [focusConversationId, isOpen])

    useEffect(() => {
        if (!isOpen || chatType !== 'client' || !activeConversation?.id) {
            setCallModalOpen(false)
        }
    }, [activeConversation?.id, chatType, isOpen])

    useEffect(() => {
        if (!isOpen || !openCallCenter || chatType !== 'client' || !activeConversation?.id) return
        setCallModalOpen(true)
    }, [activeConversation?.id, chatType, isOpen, openCallCenter])

    useEffect(() => {
        if (!isOpen || !pendingFocusConversationId) return

        if (chatType !== 'client') {
            setChatType('client')
            return
        }

        if (activeConversation?.id === pendingFocusConversationId) {
            setPendingFocusConversationId(null)
            return
        }

        let cancelled = false

        selectConversation(pendingFocusConversationId)
            .finally(() => {
                if (!cancelled) {
                    setPendingFocusConversationId(null)
                }
            })

        return () => {
            cancelled = true
        }
    }, [activeConversation?.id, chatType, isOpen, pendingFocusConversationId, selectConversation])

    useEffect(() => {
        let cancelled = false
        const leadEntityId = activeConversation?.enquiryId || activeConversation?.enquiry?.id || (String(entityType || '').toUpperCase() === 'ENQUIRY' ? entityId : '')

        if (!isOpen || chatType !== 'client' || !activeConversation || !leadEntityId) {
            setLeadScore(null)
            setLoadingScore(false)
            return
        }

        setLoadingScore(true)
        chatService.getLeadScore(leadEntityId)
            .then((data) => {
                if (!cancelled) setLeadScore(data)
            })
            .catch(() => {
                if (!cancelled) setLeadScore(null)
            })
            .finally(() => {
                if (!cancelled) setLoadingScore(false)
            })

        return () => {
            cancelled = true
        }
    }, [activeConversation, chatType, entityId, entityType, isOpen])

    useEffect(() => {
        let cancelled = false

        if (!isOpen || !callModalOpen || chatType !== 'client' || (!isGlobalMode && !activeConversation?.id)) {
            if (!isOpen || !callModalOpen) {
                setCallHistory([])
                setCallContext(null)
                setCallAnalytics(null)
                setLoadingCalls(false)
            }
            return
        }

        setLoadingCalls(true)
        const historyPromise = isGlobalMode
            ? chatService.getGlobalCallHistory({ limit: 200 })
            : chatService.getCallHistory({ conversationId: activeConversation.id, customerPhone: customerCallTarget || undefined, phone: customerCallTarget || undefined, limit: 200 })

        const analyticsPromise = isGlobalMode
            ? chatService.getGlobalCallAnalytics({})
            : chatService.getCallAnalytics({ conversationId: activeConversation.id })

        const contextPromise = isGlobalMode
            ? Promise.resolve(null)
            : chatService.getCallContext({ conversationId: activeConversation.id, customerPhone: customerCallTarget || undefined })

        Promise.all([historyPromise, analyticsPromise, contextPromise])
            .then(([history, analytics, context]) => {
                if (cancelled) return
                const nextHistory = Array.isArray(history) ? history : []
                setCallHistory(nextHistory)
                setCallStoreCalls(nextHistory)
                setCallContext(context || null)
                setCallAnalytics(analytics || null)
                setCallStoreAnalytics(analytics || null)
            })
            .catch(() => {
                if (cancelled) return
                setCallHistory([])
                setCallContext(null)
                setCallAnalytics(null)
            })
            .finally(() => {
                if (!cancelled) setLoadingCalls(false)
            })

        return () => {
            cancelled = true
        }
    }, [activeConversation?.id, callModalOpen, chatType, customerCallTarget, isOpen, setCallStoreAnalytics, setCallStoreCalls, isGlobalMode])

    useEffect(() => {
        if (!isOpen || !callModalOpen || chatType !== 'client' || (!isGlobalMode && !activeConversation?.id)) return

        connectRealtimeSocket()
        connectCallsSocket()

        if (isGlobalMode) {
            realtimeSocket.emit('join:global:calls')
            callsSocket.emit('join:global:calls')
        } else {
            realtimeSocket.emit('join:conversation', activeConversation.id)
            callsSocket.emit('join:conversation', activeConversation.id)
        }

        const mergeCall = (payload: any) => {
            const nextCall = payload?.callHistory || payload?.call || payload
            if (!nextCall || (!nextCall.id && !nextCall.callSid)) return

            if (!isGlobalMode) {
                if (nextCall.conversationId && nextCall.conversationId !== activeConversation.id) return
                if (!nextCall.conversationId) {
                    const eventPhone = String(nextCall.customerPhone || nextCall.to || nextCall.from || '').replace(/[^\d]/g, '')
                    const activePhone = String(customerCallTarget || customerPhone || '').replace(/[^\d]/g, '')
                    if (eventPhone && activePhone && !eventPhone.endsWith(activePhone) && !activePhone.endsWith(eventPhone)) return
                }
            }
            useCallCenterStore.getState().upsertCall(payload)

            setCallHistory((current) => {
                const normalizedCall = { ...nextCall, startedAt: nextCall.startedAt || nextCall.createdAt || new Date().toISOString() }
                const index = current.findIndex((call) =>
                    (normalizedCall.id && call.id === normalizedCall.id)
                    || (normalizedCall.callSid && call.callSid === normalizedCall.callSid)
                )
                if (index < 0) return [normalizedCall, ...current]
                const updated = [...current]
                updated[index] = { ...updated[index], ...normalizedCall }
                return updated.sort((left, right) => getCallStartedAt(right).getTime() - getCallStartedAt(left).getTime())
            })
            setCallContext((current: any) => current ? { ...current, lastCall: nextCall, callStatus: nextCall.status } : current)
        }

        const handleCallAnalytics = (payload: any) => {
            if (!isGlobalMode && payload?.conversationId && payload.conversationId !== activeConversation.id) return
            setCallAnalytics(payload?.analytics || payload || null)
            useCallCenterStore.getState().setAnalytics(payload?.analytics || payload || null)
        }

        realtimeSocket.on('call:new', mergeCall)
        realtimeSocket.on('call:update', mergeCall)
        realtimeSocket.on('call:active', mergeCall)
        realtimeSocket.on('call:analytics', handleCallAnalytics)
        callsSocket.on('call:new', mergeCall)
        callsSocket.on('call:update', mergeCall)
        callsSocket.on('call:active', mergeCall)
        callsSocket.on('call:ended', mergeCall)
        callsSocket.on('call:analytics', handleCallAnalytics)

        return () => {
            if (isGlobalMode) {
                realtimeSocket.emit('leave:global:calls')
                callsSocket.emit('leave:global:calls')
            } else {
                realtimeSocket.emit('leave:conversation', activeConversation.id)
                callsSocket.emit('leave:conversation', activeConversation.id)
            }
            realtimeSocket.off('call:new', mergeCall)
            realtimeSocket.off('call:update', mergeCall)
            realtimeSocket.off('call:active', mergeCall)
            realtimeSocket.off('call:analytics', handleCallAnalytics)
            callsSocket.off('call:new', mergeCall)
            callsSocket.off('call:update', mergeCall)
            callsSocket.off('call:active', mergeCall)
            callsSocket.off('call:ended', mergeCall)
            callsSocket.off('call:analytics', handleCallAnalytics)
        }
    }, [activeConversation?.id, callModalOpen, chatType, customerCallTarget, isOpen, isGlobalMode, setCallStoreAnalytics, setCallStoreCalls])

    useEffect(() => {
        if (!isOpen || !currentUser?.id) return

        connectCallsSocket()
        callsSocket.emit('join:agent', currentUser.id)

        const handleIncomingOffer = (payload: any) => {
            console.log('📥 Incoming internal WebRTC voice call offer:', payload)
            setIncomingCallPayload(payload)
            setInternalCallState('incoming')
        }

        const handleCallEnded = () => {
            setInternalCallState('idle')
            setIncomingCallPayload(null)
            setWebrtcServiceInstance((current) => {
                if (current) current.destroy()
                return null
            })
        }

        callsSocket.on('webrtc:offer', handleIncomingOffer)
        callsSocket.on('webrtc:end', handleCallEnded)

        return () => {
            callsSocket.off('webrtc:offer', handleIncomingOffer)
            callsSocket.off('webrtc:end', handleCallEnded)
        }
    }, [isOpen, currentUser?.id])

    const handleStartInternalCall = async (staffMember: any) => {
        if (!currentUser?.id || !staffMember?.userId) return

        try {
            setInternalCallTargetStaff(staffMember)
            setInternalCallState('calling')

            const service = new WebRTCService(currentUser.id, staffMember.userId)
            setWebrtcServiceInstance(service)

            service.onCallEnded(() => {
                setInternalCallState('idle')
                setWebrtcServiceInstance(null)
            })

            await service.startCall()
            setInternalCallState('connected')

            toast({
                type: 'success',
                title: 'Calling Voice',
                message: `Ringing ${staffMember.firstName || 'Staff'} via WebRTC P2P.`
            })
        } catch (err: any) {
            setInternalCallState('idle')
            setWebrtcServiceInstance(null)
            toast({
                type: 'error',
                title: 'Microphone Error',
                message: err?.message || 'Could not access microphone for WebRTC call.'
            })
        }
    }

    const handleAcceptInternalCall = async () => {
        if (!incomingCallPayload || !currentUser?.id) return

        try {
            setInternalCallState('connected')
            const callerUserId = incomingCallPayload.callerUserId || incomingCallPayload.caller?.replace('agent:', '')
            const service = new WebRTCService(currentUser.id, callerUserId)
            setWebrtcServiceInstance(service)

            service.onCallEnded(() => {
                setInternalCallState('idle')
                setIncomingCallPayload(null)
                setWebrtcServiceInstance(null)
            })

            await service.answerCall(incomingCallPayload)

            toast({
                type: 'success',
                title: 'Connected',
                message: 'WebRTC P2P Voice Call established securely.'
            })
        } catch (err: any) {
            setInternalCallState('idle')
            setIncomingCallPayload(null)
            toast({
                type: 'error',
                title: 'Answer Failed',
                message: err?.message || 'Could not access microphone to answer.'
            })
        }
    }

    const handleDeclineOrEndInternalCall = () => {
        if (webrtcServiceInstance) {
            webrtcServiceInstance.endCall(true)
            webrtcServiceInstance.destroy()
            setWebrtcServiceInstance(null)
        } else if (incomingCallPayload) {
            const callerUserId = incomingCallPayload.callerUserId || incomingCallPayload.caller?.replace('agent:', '')
            callsSocket.emit('webrtc:end', { target: `agent:${callerUserId}` })
        }
        setInternalCallState('idle')
        setIncomingCallPayload(null)
    }

    const handleSend = async () => {
        const body = draft.trim()
        if (!body) return

        if (chatType === 'client') {
            const queuedMessage = await sendMessage({
                body,
                channel: selectedReplyChannel,
                externalUserId: selectedExternalUserId,
                subject: activeConversation?.subject || undefined
            })

            if (queuedMessage) setDraft('')
            return
        }

        if (!selectedStaffId || !internalConversation) return
        await sendInternal.mutateAsync({ conversationId: internalConversation.id, body })
        setDraft('')
    }

    const handleStartCall = async () => {
        if (!activeConversation?.id || !customerCallTarget || startingCall) return

        try {
            setStartingCall(true)
            await chatService.startCall({
                conversationId: activeConversation.id,
                to: customerCallTarget
            })

            toast({
                type: 'success',
                title: 'Calling',
                message: `Connecting ${customerCallTarget} through Exotel now.`
            })
        } catch (error: any) {
            toast({
                type: 'error',
                title: 'Call failed',
                message: error?.response?.data?.message || error?.message || 'Could not start the Exotel call.'
            })
        } finally {
            setStartingCall(false)
        }
    }

    const handleRetry = async (message: any) => {
        const body = getMessageText(message)
        if (!body) return

        try {
            setRetryingMessageId(message.id)
            await sendMessage({
                body,
                channel: normalizeChannel(message?.channel || replyChannel),
                externalUserId: message?.externalUserId || getExternalUserIdForChannel(activeConversation, message?.channel) || selectedExternalUserId,
                retryMessageId: message.id,
                subject: message?.metadata?.subject || activeConversation?.subject || undefined
            })
        } finally {
            setRetryingMessageId(null)
        }
    }

    const threadItems = buildThreadItems(clientMessages)
    const latestCall = callContext?.lastCall || callHistory[0] || null
    const latestCallStatus = latestCall?.status || 'none'
    const liveCall = latestCall && isLiveCallStatus(latestCallStatus) && !latestCall?.endedAt ? latestCall : null
    const activeCalls = useMemo(() => callHistory.filter((call) => isLiveCallStatus(call?.status) && !call?.endedAt), [callHistory])
    useEffect(() => {
        if (!callModalOpen || activeCalls.length === 0) return
        const interval = window.setInterval(() => setCallTicker((value) => value + 1), 1000)
        return () => window.clearInterval(interval)
    }, [activeCalls.length, callModalOpen])
    const filteredCallHistory = useMemo(() => {
        const query = callSearchQuery.trim().toLowerCase()
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - 6)
        weekStart.setHours(0, 0, 0, 0)

        return callHistory.filter((call) => {
            const callDate = getCallStartedAt(call)
            const direction = normalizeDirection(call?.direction)
            const status = String(call?.status || '').toLowerCase()

            const matchesFilter =
                callFilter === 'today' ? isSameCalendarDay(callDate) :
                    callFilter === 'yesterday' ? isSameCalendarDay(callDate, 1) :
                        callFilter === 'week' ? callDate >= weekStart :
                            callFilter === 'missed' ? isMissedCallStatus(status) :
                                callFilter === 'outgoing' ? direction === 'OUTBOUND' :
                                    callFilter === 'incoming' ? direction === 'INBOUND' :
                                        callFilter === 'completed' ? status === 'ENDED' :
                                            callFilter === 'failed' ? isMissedCallStatus(status) :
                                                callFilter === 'exotel' ? String(call.provider || '').toLowerCase() === 'exotel' :
                                                    callFilter === 'twilio' ? String(call.provider || '').toLowerCase() === 'twilio' :
                                                        true

            if (!matchesFilter) return false
            if (!query) return true

            return [
                call?.customerName,
                call?.customerPhone,
                call?.from,
                call?.to,
                call?.agentName,
                call?.agentEmail,
                call?.provider,
                call?.status,
                call?.direction
            ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
        })
    }, [callFilter, callHistory, callSearchQuery])
    const answeredCalls = callAnalytics?.answeredCalls ?? callHistory.filter((call) => isAnsweredCallStatus(call?.status)).length
    const missedCalls = callAnalytics?.missedCalls ?? callHistory.filter((call) => isMissedCallStatus(call?.status)).length
    const totalCalls = callContext?.totalCalls ?? callAnalytics?.totalCalls ?? callHistory.length
    const callMetrics = [
        { label: 'Total Calls', value: totalCalls },
        { label: 'Answered', value: answeredCalls },
        { label: 'Missed', value: missedCalls },
        { label: 'Avg Duration', value: formatCallDuration(callContext?.averageCallDuration ?? callAnalytics?.averageDuration ?? 0) },
        { label: 'Success Rate', value: `${Math.round(Number(callAnalytics?.successRate ?? (totalCalls ? (answeredCalls / totalCalls) * 100 : 0)))}%` }
    ]

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/55 p-2 backdrop-blur-md sm:p-4">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative z-10 mx-auto flex h-[calc(100dvh-1rem)] w-full max-w-none flex-col overflow-hidden rounded-[24px] border border-white/15 bg-[#F7FAFC] shadow-[0_40px_120px_rgba(15,23,42,0.28)] dark:bg-[#0d1117] sm:h-[calc(100dvh-2rem)] lg:flex-row lg:rounded-[30px]">
                <aside className="flex max-h-[42dvh] w-full shrink-0 flex-col border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#11161f]/95 lg:max-h-none lg:w-[clamp(280px,22vw,360px)] lg:border-b-0 lg:border-r">
                    <div className="border-b border-slate-200/80 px-4 py-4 dark:border-white/10">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Inbox</p>
                                <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">Omnichannel</h2>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white lg:hidden"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-slate-100 p-1 dark:bg-black/30">
                            <button
                                type="button"
                                onClick={() => setChatType('client')}
                                className={cn(
                                    'rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all',
                                    chatType === 'client'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                )}
                            >
                                Client Inbox
                            </button>
                            <button
                                type="button"
                                onClick={() => setChatType('internal')}
                                className={cn(
                                    'rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all',
                                    chatType === 'internal'
                                        ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                )}
                            >
                                Internal
                            </button>
                        </div>

                        <div className="relative mt-4">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={chatType === 'client' ? 'Search customers, phone, email...' : 'Search staff...'}
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                            />
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {(chatType === 'client' ? loading : loadingStaff) ? (
                            <div className="flex h-28 items-center justify-center">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-transparent dark:border-slate-500 dark:border-t-transparent" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nothing matched this search.</p>
                                <p className="mt-1 text-xs text-slate-400">Try a different name, channel, or contact detail.</p>
                            </div>
                        ) : chatType === 'client' ? (
                            filteredConversations.map((conversation: any) => {
                                const previewChannel = getChannelMeta(conversation?.lastInboundChannel || conversation?.channel)
                                return (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        onClick={() => selectConversation(conversation.id)}
                                        className={cn(
                                            'w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50/90 dark:border-white/5 dark:hover:bg-white/5',
                                            activeConversation?.id === conversation.id ? 'bg-primary-50/50 border-l-4 border-l-primary-500 pl-3 dark:bg-primary-900/20' : 'bg-transparent border-l-4 border-l-transparent pl-3'
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-extrabold text-white dark:bg-white/10">
                                                {getConversationName(conversation).charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{getConversationName(conversation)}</p>
                                                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{getConversationPreview(conversation)}</p>
                                                    </div>
                                                    <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                                                        {conversation?.lastMessageAt ? format(new Date(conversation.lastMessageAt), 'p') : ''}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <ChannelBadge channel={previewChannel.value} className="shrink-0" />
                                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:bg-white/10 dark:text-slate-300">
                                                        {conversation?.status || 'Open'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        ) : (
                            filteredConversations.map((person: any) => (
                                <button
                                    key={person.id}
                                    type="button"
                                    onClick={() => setSelectedStaffId(person.userId)}
                                    className={cn(
                                        'w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50/90 dark:border-white/5 dark:hover:bg-white/5',
                                        selectedStaffId === person.userId ? 'bg-slate-100/70 dark:bg-white/5' : 'bg-transparent'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-extrabold text-white shadow-md dark:from-primary-600 dark:to-primary-800">
                                            {(person.firstName || 'S').charAt(0)}{(person.lastName || '').charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{person.firstName} {person.lastName}</p>
                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{person.designation || 'Staff member'}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </aside>
                <section className="flex min-h-0 min-w-0 flex-1">
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.98))] dark:bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.8),_transparent_35%),linear-gradient(180deg,_rgba(13,17,23,0.98),_rgba(7,11,16,0.98))]">
                        {chatType === 'client' ? (
                            activeConversation ? (
                                <>
                                    <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 backdrop-blur-xl dark:border-white/10">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-extrabold text-white dark:bg-white/10">
                                                {getConversationName(activeConversation).charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                     <h3 className="truncate text-base font-extrabold text-slate-900 dark:text-white">{getConversationName(activeConversation)}</h3>
                                                     <ChannelBadge channel={visibleChannel} />
                                                     {liveCall ? <StatusHighlighter value={liveCall.status} className="min-w-0" /> : null}
                                                 </div>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {lastInteractionAt
                                                        ? `Last interaction ${formatDistanceToNow(new Date(lastInteractionAt), { addSuffix: true })}`
                                                        : 'No interaction history yet'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setCallModalOpen(true)}
                                                className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 lg:inline-flex"
                                            >
                                                <PhoneCall className="h-3.5 w-3.5 text-primary-600 dark:text-primary-300" />
                                                Call
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="hidden rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white lg:inline-flex"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                                        {threadItems.length === 0 ? (
                                            <div className="flex h-full flex-col items-center justify-center text-center">
                                                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
                                                    <MessageSquare className="h-8 w-8" />
                                                </div>
                                                <h4 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">Start the first reply</h4>
                                                <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">Messages and call events from WhatsApp, email, and Exotel voice will appear together here with live status updates.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {threadItems.map((item) => {
                                                    if (item.type === 'day') {
                                                        return (
                                                            <div key={item.key} className="flex justify-center py-2">
                                                                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                                                                    {item.label}
                                                                </span>
                                                            </div>
                                                        )
                                                    }

                                                    if (item.type === 'time') {
                                                        return (
                                                            <div key={item.key} className="flex justify-center py-1">
                                                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{item.label}</span>
                                                            </div>
                                                        )
                                                    }

                                                    const message = item.message
                                                    const isOutbound = normalizeDirection(message?.direction) === 'OUTBOUND'
                                                    const channelMeta = getChannelMeta(message?.channel)
                                                    const deliveryMeta = isOutbound ? getDeliveryMeta(message) : null

                                                    return (
                                                        <div key={item.key} className={cn('flex animate-in fade-in slide-in-from-bottom-2 duration-300', isOutbound ? 'justify-end' : 'justify-start')}>
                                                            <div
                                                                title={`${format(new Date(message.createdAt), 'PPpp')} via ${channelMeta.label}`}
                                                                className={cn(
                                                                    'group max-w-[88%] rounded-[26px] border px-4 py-3 sm:max-w-[78%]',
                                                                    isOutbound ? 'rounded-br-md' : 'rounded-bl-md',
                                                                    getBubbleClassName(message?.channel, isOutbound)
                                                                )}
                                                            >
                                                                <div className="mb-2 flex items-start justify-between gap-3">
                                                                    <p className={cn('text-[11px] font-bold uppercase tracking-[0.22em]', isOutbound ? 'text-white/75' : 'text-slate-500 dark:text-slate-300')}>
                                                                        {getMessageSender(message, activeConversation)}
                                                                    </p>
                                                                    <ChannelBadge channel={message?.channel} className="shrink-0" />
                                                                </div>
                                                                 <p className={cn('whitespace-pre-wrap text-[14px] leading-6', isOutbound ? 'text-white' : 'text-slate-900 dark:text-slate-100')}>
                                                                     {getMessageText(message)}
                                                                 </p>
                                                                 {normalizeChannel(message?.channel) === 'call' && getCallRecordingUrl(message) ? (
                                                                     <div className={cn('mt-3 flex flex-wrap items-center gap-2', isOutbound ? 'justify-end' : 'justify-start')}>
                                                                         <a
                                                                             href={getCallRecordingUrl(message)}
                                                                             target="_blank"
                                                                             rel="noreferrer"
                                                                             className={cn(
                                                                                 'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold transition',
                                                                                 isOutbound
                                                                                     ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                                                                                     : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                                                                             )}
                                                                         >
                                                                             <Play className="h-3.5 w-3.5" />
                                                                             Play Recording
                                                                         </a>
                                                                         <a
                                                                             href={getCallRecordingUrl(message)}
                                                                             download
                                                                             className={cn(
                                                                                 'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold transition',
                                                                                 isOutbound
                                                                                     ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                                                                                     : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                                                                             )}
                                                                         >
                                                                             <Download className="h-3.5 w-3.5" />
                                                                             Download
                                                                         </a>
                                                                     </div>
                                                                 ) : null}
                                                                 <div className={cn('mt-3 flex items-center gap-2 text-[11px]', isOutbound ? 'justify-end text-white/80' : 'text-slate-400 dark:text-slate-500')}>
                                                                    <span>{format(new Date(message.createdAt), 'p')}</span>
                                                                    {deliveryMeta ? (
                                                                        <span className={cn('inline-flex items-center gap-1 font-bold', deliveryMeta.className)} title={deliveryMeta.label}>
                                                                            <span>{deliveryMeta.indicator}</span>
                                                                            <span className="hidden sm:inline">{deliveryMeta.label}</span>
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                                {deliveryMeta?.failed && normalizeChannel(message?.channel) !== 'call' ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRetry(message)}
                                                                        disabled={retryingMessageId === message.id}
                                                                        className="mt-3 inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                                                                    >
                                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                                        {retryingMessageId === message.id ? 'Retrying...' : 'Retry'}
                                                                    </button>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {activeConversation?.id && typingUsers[activeConversation.id]?.size > 0 ? (
                                                    <div className="flex animate-in fade-in duration-300 justify-start">
                                                        <div className="rounded-[26px] border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#171717]">
                                                            <div className="flex items-center gap-1">
                                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                                    <div className="flex h-24 w-24 items-center justify-center rounded-[30px] border border-dashed border-slate-300 bg-white/80 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
                                        <MessageSquare className="h-10 w-10" />
                                    </div>
                                    <h3 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white">Select a conversation</h3>
                                    <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">Pick a customer thread to reply through the most recent inbound channel, switch channels when needed, and watch delivery status update in real time.</p>
                                </div>
                            )
                        ) : selectedStaffId ? (
                            <>
                                <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 backdrop-blur-xl dark:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-extrabold text-white shadow-md dark:from-primary-600 dark:to-primary-800">
                                            {(selectedStaff?.firstName || 'S').charAt(0)}{(selectedStaff?.lastName || '').charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedStaff?.firstName} {selectedStaff?.lastName}</h3>
                                                {internalCallState !== 'idle' ? (
                                                    <span className="animate-pulse rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                                                        {internalCallState}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedStaff?.designation || 'Staff member'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleStartInternalCall(selectedStaff)}
                                            disabled={internalCallState !== 'idle'}
                                            className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 lg:inline-flex"
                                        >
                                            <PhoneCall className="h-3.5 w-3.5 text-primary-600 dark:text-primary-300" />
                                            Call
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="hidden rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white lg:inline-flex"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                                    {loadingInternalMessages ? (
                                        <div className="flex h-full items-center justify-center">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-transparent dark:border-slate-500 dark:border-t-transparent" />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {internalMessages.map((message: any) => {
                                                const isOutbound = message?.metadata?.senderId !== selectedStaffId
                                                return (
                                                    <div key={message.id} className={cn('flex animate-in fade-in slide-in-from-bottom-2 duration-300', isOutbound ? 'justify-end' : 'justify-start')}>
                                                        <div className={cn(
                                                            'max-w-[88%] rounded-[26px] border px-4 py-3 sm:max-w-[78%]',
                                                            isOutbound
                                                                ? 'rounded-br-md border-primary-500 bg-primary-600 text-white shadow-[0_18px_40px_rgba(15,150,156,0.25)] dark:border-primary-500/30 dark:bg-primary-600/90'
                                                                : 'rounded-bl-md border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-[#171717] dark:text-slate-100'
                                                        )}>
                                                            <p className="whitespace-pre-wrap text-[14px] leading-6">{message.body}</p>
                                                            <div className={cn('mt-3 text-[11px]', isOutbound ? 'text-right text-white/80' : 'text-slate-400 dark:text-slate-500')}>
                                                                {format(new Date(message.createdAt), 'p')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {internalConversation?.id && typingUsers[internalConversation.id]?.size > 0 ? (
                                                <div className="flex animate-in fade-in duration-300 justify-start">
                                                    <div className="rounded-[26px] border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#171717]">
                                                        <div className="flex items-center gap-1">
                                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]"></span>
                                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]"></span>
                                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500"></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                                <div className="flex h-24 w-24 items-center justify-center rounded-[30px] border border-dashed border-slate-300 bg-white/80 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500">
                                    <User className="h-10 w-10" />
                                </div>
                                <h3 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white">Internal staff chat</h3>
                                <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">Select a staff member from the left to start or continue an internal handoff conversation.</p>
                            </div>
                        )}

                        {(activeConversation || (chatType === 'internal' && selectedStaffId)) ? (
                            <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f141c]/95 sm:px-5">
                                {chatType === 'client' ? (
                                    <div className="mb-3 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Reply Channel</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                Defaulting to the latest inbound platform: {getChannelMeta(defaultChannel).label}
                                            </p>
                                            {!hasSelectedReplyRecipient ? (
                                                <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-300">
                                                    Add a customer email, WhatsApp number, or SMS number to enable external replies on this thread, or use the call action for voice follow-ups.
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ChannelBadge channel={visibleChannel} />
                                            <select
                                                value={replyChannel}
                                                onChange={(event) => {
                                                    setManualChannel(true)
                                                    setReplyChannel(event.target.value)
                                                }}
                                                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70 dark:border-white/10 dark:bg-[#11161f] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                                            >
                                                {fallbackChannels.map((channel) => (
                                                    <option key={channel} value={channel}>
                                                        {getChannelMeta(channel).label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : null}

                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault()
                                        handleSend()
                                    }}
                                    className="flex items-end gap-3"
                                >
                                    <textarea
                                        value={draft}
                                        onChange={(event) => {
                                            const nextValue = event.target.value
                                            setDraft(nextValue)
                                            if (nextValue.trim() && !draft.trim()) {
                                                if (chatType === 'client') emitTypingStart()
                                                else if (internalConversation?.id) realtimeSocket.emit('typing:start', { conversationId: internalConversation.id })
                                            } else if (!nextValue.trim()) {
                                                if (chatType === 'client') emitTypingStop()
                                                else if (internalConversation?.id) realtimeSocket.emit('typing:stop', { conversationId: internalConversation.id })
                                            }
                                        }}
                                        onBlur={() => {
                                            if (chatType === 'client') emitTypingStop()
                                            else if (internalConversation?.id) realtimeSocket.emit('typing:stop', { conversationId: internalConversation.id })
                                        }}
                                        rows={1}
                                        placeholder={chatType === 'client'
                                            ? `Reply on ${activeChannelMeta.label}...`
                                            : `Message ${selectedStaff?.firstName || 'staff'}...`}
                                        className="max-h-36 min-h-[54px] flex-1 resize-none rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70 dark:border-white/10 dark:bg-[#11161f] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!draft.trim() || sending || sendInternal.isPending || (chatType === 'client' && !hasSelectedReplyRecipient)}
                                        className={cn(
                                            'inline-flex h-[54px] items-center gap-2 rounded-[22px] px-5 text-sm font-extrabold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50',
                                            'bg-primary-600 hover:bg-primary-700'
                                        )}
                                    >
                                        <Send className="h-4 w-4" />
                                        Send
                                    </button>
                                </form>
                            </div>
                        ) : null}
                    </div>
                    {chatType === 'client' && activeConversation ? (
                        <aside className="hidden w-[clamp(260px,20vw,340px)] shrink-0 border-l border-slate-200/80 bg-white/85 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#11161f]/95 xl:flex xl:flex-col">
                            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(226,232,240,0.9))] p-4 dark:border-white/10 dark:bg-[linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(30,41,59,0.75))]">
                                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Customer Context</p>
                                <h4 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{getConversationName(activeConversation)}</h4>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Channel-aware inbox with live delivery feedback.</p>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                                        <Phone className="h-3.5 w-3.5" />
                                        Phone
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{customerPhone}</p>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                                        <Mail className="h-3.5 w-3.5" />
                                        Email
                                    </div>
                                    <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{customerEmail}</p>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Active Channel
                                    </div>
                                    <div className="mt-3">
                                        <ChannelBadge channel={visibleChannel} />
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                                        <User className="h-3.5 w-3.5" />
                                        Last Interaction
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                        {lastInteractionAt ? format(new Date(lastInteractionAt), 'PPpp') : 'No messages yet'}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {lastInteractionAt ? formatDistanceToNow(new Date(lastInteractionAt), { addSuffix: true }) : 'Waiting for the first touchpoint'}
                                    </p>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Lead Score
                                    </div>
                                    {loadingScore ? (
                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading score...</p>
                                    ) : leadScore ? (
                                        <>
                                            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{leadScore.score ?? leadScore.value ?? 0}</p>
                                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                                                {leadScore.label || leadScore.priority || 'Scored lead'}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Lead score is not available for this conversation yet.</p>
                                    )}
                                </div>
                            </div>
                        </aside>
                    ) : null}
                </section>
            </div>
            {callModalOpen && (activeConversation || isGlobalMode) ? (
                <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:items-center sm:p-6">
                    <div className="absolute inset-0" onClick={() => setCallModalOpen(false)} />
                    <div className="relative flex max-h-[92dvh] w-full max-w-none flex-col overflow-hidden rounded-[24px] border border-white/20 bg-white/90 shadow-[0_34px_110px_rgba(15,23,42,0.34)] backdrop-blur-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 dark:bg-[#0f141c]/95 lg:rounded-[30px]">
                        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-5 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-600 dark:text-primary-300">Enterprise Call Center</p>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                        {isGlobalMode ? 'Enterprise Operations' : getConversationName(activeConversation)}
                                    </h3>
                                    {liveCall ? <StatusHighlighter value={liveCall.status} className="min-w-0" /> : null}
                                </div>
                                {isGlobalMode ? (
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monitoring all realtime voice activity across providers</p>
                                ) : (
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{customerPhone} · {customerEmail}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleStartCall}
                                    disabled={!canStartCall}
                                    className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-400/30 dark:bg-primary-400/10 dark:text-primary-200 dark:hover:bg-primary-400/20"
                                >
                                    <PhoneCall className="h-3.5 w-3.5" />
                                    {startingCall ? 'Calling...' : 'Start Call'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCallModalOpen(false)}
                                    className="rounded-full border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            <div className="grid gap-4 lg:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.55fr)]">
                                <div className="space-y-4">
                                    <div className="rounded-[26px] border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Current Active Calls</p>
                                                <h4 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">Live Call Panel</h4>
                                            </div>
                                            {loadingCalls ? <span className="text-xs font-bold text-slate-400">Syncing...</span> : null}
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {(activeCalls.length ? activeCalls : liveCall ? [liveCall] : []).length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-black/20 dark:text-slate-400">No active call right now.</div>
                                            ) : (activeCalls.length ? activeCalls : [liveCall]).filter(Boolean).map((call: any) => (
                                                <div key={call.id || call.callSid || call.startedAt} className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4 dark:border-primary-400/20 dark:bg-primary-400/10">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                                                                {call.customerName || (isGlobalMode ? (call.to || call.from || 'Customer') : getConversationName(activeConversation))}
                                                            </p>
                                                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                                                                {call.customerPhone || call.to || call.from || (isGlobalMode ? 'No Number' : customerPhone)}
                                                            </p>
                                                        </div>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                                            Ongoing
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 flex h-6 items-center gap-1 text-primary-500 dark:text-primary-300" aria-hidden="true">
                                                        {[0, 1, 2, 3, 4].map((bar) => (
                                                            <span
                                                                key={bar}
                                                                className="w-1 rounded-full bg-current opacity-70"
                                                                style={{ height: `${8 + ((bar + callTicker) % 3) * 5}px`, transition: 'height 180ms ease' }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                                        <div><p className="font-bold uppercase tracking-[0.16em] text-slate-400">Status</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{formatStatusLabel(call.status)}</p></div>
                                                        <div><p className="font-bold uppercase tracking-[0.16em] text-slate-400">Duration</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{formatCallDuration(Math.max(0, Math.floor((Date.now() - getCallStartedAt(call).getTime()) / 1000)))}</p></div>
                                                        <div><p className="font-bold uppercase tracking-[0.16em] text-slate-400">Agent</p><p className="mt-1 truncate font-semibold text-slate-800 dark:text-slate-100">{call.agentName || call.agentEmail || callContext?.lastAgent || 'Unassigned'}</p></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-[26px] border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Quick Actions</p>
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            {[
                                                { label: 'Start Call', icon: PhoneCall, action: handleStartCall, disabled: !canStartCall },
                                                { label: 'Redial', icon: RotateCcw, action: handleStartCall, disabled: !canStartCall },
                                                { label: 'Open Conversation', icon: MessageSquare, action: () => setCallModalOpen(false) },
                                                { label: 'Play Recording', icon: Play, href: getCallHistoryRecordingUrl(callHistory.find((call) => getCallHistoryRecordingUrl(call))) },
                                                { label: 'Download Recording', icon: Download, href: getCallHistoryRecordingUrl(callHistory.find((call) => getCallHistoryRecordingUrl(call))), download: true }
                                            ].map((action) => {
                                                const Icon = action.icon
                                                const disabled = action.disabled || (!action.action && !action.href)
                                                const className = "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                                                return action.href ? (
                                                    <a key={action.label} href={action.href} download={action.download} target={action.download ? undefined : '_blank'} rel={action.download ? undefined : 'noreferrer'} className={className}>
                                                        <Icon className="h-3.5 w-3.5" />
                                                        {action.label}
                                                    </a>
                                                ) : (
                                                    <button key={action.label} type="button" onClick={action.action} disabled={disabled} className={className}>
                                                        <Icon className="h-3.5 w-3.5" />
                                                        {action.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="rounded-[26px] border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Call Analytics</p>
                                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                                            {callMetrics.map((metric) => (
                                                <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-black/20">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{metric.label}</p>
                                                    <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">{metric.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[26px] border border-slate-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Call History</p>
                                            <h4 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">Timeline</h4>
                                        </div>
                                        <div className="relative w-full xl:w-72">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                value={callSearchQuery}
                                                onChange={(event) => setCallSearchQuery(event.target.value)}
                                                placeholder="Search customer or number..."
                                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/70 dark:border-white/10 dark:bg-[#11161f] dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {[
                                            ['today', 'Today'],
                                            ['yesterday', 'Yesterday'],
                                            ['week', 'This Week'],
                                            ['missed', 'Missed'],
                                            ['outgoing', 'Outgoing'],
                                            ['incoming', 'Incoming'],
                                            ['completed', 'Completed'],
                                            ['failed', 'Failed']
                                        ].map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setCallFilter(value)}
                                                className={cn(
                                                    'rounded-full border px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] transition',
                                                    callFilter === value
                                                        ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-400/30 dark:bg-primary-400/10 dark:text-primary-200'
                                                        : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white'
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-4 max-h-[min(52dvh,620px)] space-y-3 overflow-y-auto pr-1">
                                        {filteredCallHistory.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-black/20 dark:text-slate-400">No calls match this view.</div>
                                        ) : filteredCallHistory.slice(0, 80).map((call) => {
                                            const direction = normalizeDirection(call.direction)
                                            const recordingUrl = getCallHistoryRecordingUrl(call)
                                            const DirectionIcon = direction === 'OUTBOUND' ? PhoneOutgoing : direction === 'INBOUND' ? PhoneIncoming : isMissedCallStatus(call.status) ? PhoneMissed : PhoneOff
                                            return (
                                                <div key={call.id || call.callSid} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-black/20">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm dark:bg-white/10 dark:text-primary-300">
                                                                <DirectionIcon className="h-4 w-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                                                                    {call.customerName || (isGlobalMode ? (call.to || call.from || 'Customer') : getConversationName(activeConversation))}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    {call.customerPhone || call.to || call.from || (isGlobalMode ? 'No Number' : customerPhone)} · {format(getCallStartedAt(call), 'PP p')} · {formatCallDuration(call.duration)}
                                                                </p>
                                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                                    <span className="rounded-full bg-white px-2 py-1 dark:bg-white/10">Voice Call</span>
                                                                    <span>{call.agentName || call.agentEmail || 'Unassigned'}</span>
                                                                    {recordingUrl ? (
                                                                        <>
                                                                            <a href={recordingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-primary-700 dark:text-primary-200"><Play className="h-3 w-3" /> Play</a>
                                                                            <a href={recordingUrl} download className="inline-flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300"><Download className="h-3 w-3" /> Download</a>
                                                                        </>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <StatusHighlighter value={call.status} className="min-w-0" />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {incomingCallPayload || internalCallState === 'calling' || internalCallState === 'connected' ? (
                <div className="absolute top-4 right-4 z-50 flex w-[min(20rem,calc(100vw-2rem))] animate-in fade-in slide-in-from-top-4 flex-col gap-3 rounded-3xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 animate-bounce items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 font-extrabold shadow-md">
                            📞
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400">
                                {internalCallState === 'incoming' ? 'Incoming Voice Call' : internalCallState === 'calling' ? 'Calling...' : 'Live Call'}
                            </p>
                            <p className="truncate text-sm font-extrabold">
                                {incomingCallPayload ? `Agent #${incomingCallPayload.callerUserId || 'Staff'}` : internalCallTargetStaff ? `${internalCallTargetStaff.firstName} ${internalCallTargetStaff.lastName}` : 'Internal Voice'}
                            </p>
                            <p className="text-xs text-slate-400">WebRTC Secure P2P</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                        {internalCallState === 'incoming' ? (
                            <button
                                type="button"
                                onClick={handleAcceptInternalCall}
                                className="flex-1 rounded-full bg-emerald-600 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition hover:bg-emerald-500"
                            >
                                Accept
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={handleDeclineOrEndInternalCall}
                            className="flex-1 rounded-full bg-red-600 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg transition hover:bg-red-500"
                        >
                            {internalCallState === 'incoming' ? 'Decline' : 'End Call'}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
