import { PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneOff, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { connectRealtimeSocket, realtimeSocket } from '../lib/realtimeSocket'
import { cn } from '../lib/utils'

type LiveCall = {
    conversationId?: string | null
    messageId?: string | null
    callSid?: string | null
    from?: string | null
    to?: string | null
    direction?: string | null
    status?: string | null
    acceptedAt?: number | null
    endedAt?: number | null
}

const TERMINAL_CALL_STATUSES = new Set([
    'BUSY',
    'CANCELED',
    'COMPLETED',
    'ENDED',
    'FAILED',
    'NO_ANSWER',
    'REJECTED'
])

const normalizeCallStatus = (value?: string | null) =>
    String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_')

const isTerminalCallStatus = (value?: string | null) =>
    TERMINAL_CALL_STATUSES.has(normalizeCallStatus(value))

const formatCallDuration = (elapsedSeconds: number) => {
    const minutes = Math.floor(elapsedSeconds / 60)
    const seconds = elapsedSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const getStatusLabel = (status?: string | null) => {
    switch (normalizeCallStatus(status)) {
        case 'QUEUED':
            return 'Queued'
        case 'RINGING':
            return 'Ringing'
        case 'IN_PROGRESS':
        case 'CONNECTED':
            return 'Connected'
        case 'COMPLETED':
            return 'Completed'
        case 'FAILED':
            return 'Failed'
        case 'BUSY':
            return 'Busy'
        case 'NO_ANSWER':
            return 'No answer'
        case 'CANCELED':
            return 'Canceled'
        case 'REJECTED':
            return 'Rejected'
        case 'ENDED':
            return 'Ended'
        default:
            return 'Active'
    }
}

const getStatusClassName = (status?: string | null) => {
    switch (normalizeCallStatus(status)) {
        case 'FAILED':
        case 'BUSY':
        case 'NO_ANSWER':
        case 'CANCELED':
        case 'REJECTED':
            return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
        case 'COMPLETED':
        case 'IN_PROGRESS':
        case 'CONNECTED':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
        default:
            return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
    }
}

const mergeLiveCall = (current: LiveCall | null, incoming: LiveCall) => {
    const nextStatus = normalizeCallStatus(incoming.status || current?.status || (incoming.direction === 'INBOUND' ? 'RINGING' : 'QUEUED'))
    const sameCall = Boolean(
        current
        && (
            (incoming.callSid && current.callSid === incoming.callSid)
            || (!incoming.callSid && incoming.conversationId && current.conversationId === incoming.conversationId)
        )
    )

    const base = sameCall && current ? { ...current, ...incoming } : { ...incoming }
    const acceptedAt = sameCall && current?.acceptedAt
        ? current.acceptedAt
        : (nextStatus === 'IN_PROGRESS' ? Date.now() : null)

    return {
        ...base,
        status: nextStatus,
        acceptedAt,
        endedAt: isTerminalCallStatus(nextStatus)
            ? (sameCall && current?.endedAt ? current.endedAt : Date.now())
            : null
    }
}

export function CallNotificationCenter() {
    const [liveCall, setLiveCall] = useState<LiveCall | null>(null)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    useEffect(() => {
        connectRealtimeSocket()

        const handleIncomingCall = (payload: LiveCall) => {
            setLiveCall((current) => mergeLiveCall(current, {
                ...payload,
                direction: payload.direction || 'INBOUND',
                status: payload.status || 'RINGING'
            }))
        }

        const handleOutgoingCall = (payload: LiveCall) => {
            setLiveCall((current) => mergeLiveCall(current, {
                ...payload,
                direction: payload.direction || 'OUTBOUND',
                status: payload.status || 'QUEUED'
            }))
        }

        const handleCallStatus = (payload: LiveCall) => {
            setLiveCall((current) => mergeLiveCall(current, payload))
        }

        realtimeSocket.on('INCOMING_CALL', handleIncomingCall)
        realtimeSocket.on('OUTGOING_CALL', handleOutgoingCall)
        realtimeSocket.on('CALL_STATUS', handleCallStatus)

        return () => {
            realtimeSocket.off('INCOMING_CALL', handleIncomingCall)
            realtimeSocket.off('OUTGOING_CALL', handleOutgoingCall)
            realtimeSocket.off('CALL_STATUS', handleCallStatus)
        }
    }, [])

    useEffect(() => {
        if (!liveCall?.acceptedAt || isTerminalCallStatus(liveCall.status)) {
            return
        }

        const updateElapsedTime = () => {
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - (liveCall.acceptedAt || Date.now())) / 1000)))
        }

        updateElapsedTime()
        const timerId = window.setInterval(updateElapsedTime, 1000)

        return () => {
            window.clearInterval(timerId)
        }
    }, [liveCall?.acceptedAt, liveCall?.status])

    const direction = normalizeCallStatus(liveCall?.direction)
    const statusLabel = useMemo(() => getStatusLabel(liveCall?.status), [liveCall?.status])
    const otherParty = direction === 'INBOUND' ? liveCall?.from : liveCall?.to

    if (!liveCall) return null

    return (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[70] w-full max-w-sm px-4 sm:px-0">
            <div className="pointer-events-auto overflow-hidden rounded-[30px] border border-slate-200 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-[#11161f]/95">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                            {direction === 'INBOUND' ? <PhoneIncoming className="h-5 w-5" /> : <PhoneOutgoing className="h-5 w-5" />}
                        </div>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                                {direction === 'INBOUND' ? 'Incoming Call' : 'Outgoing Call'}
                            </p>
                            <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                                {otherParty || 'Unknown number'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setLiveCall(null)}
                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <span className={cn(
                            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
                            getStatusClassName(liveCall.status)
                        )}>
                            <PhoneCall className="h-3.5 w-3.5" />
                            {statusLabel}
                        </span>

                        {liveCall.acceptedAt ? (
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {formatCallDuration(elapsedSeconds)}
                            </span>
                        ) : null}
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {direction === 'INBOUND'
                            ? 'Open the thread to review the customer history while the phone leg is active.'
                            : 'The agent leg is being connected first. Keep the thread open for live status changes.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (liveCall.conversationId) {
                                    window.dispatchEvent(new CustomEvent('omnichannel:open-chat', {
                                        detail: { conversationId: liveCall.conversationId }
                                    }))
                                }
                            }}
                            disabled={!liveCall.conversationId}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        >
                            <PhoneCall className="h-4 w-4" />
                            Open Thread
                        </button>

                        {direction === 'INBOUND' && !liveCall.acceptedAt && !isTerminalCallStatus(liveCall.status) ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLiveCall((current) => current ? {
                                            ...current,
                                            acceptedAt: Date.now(),
                                            status: 'CONNECTED'
                                        } : current)

                                        if (liveCall.conversationId) {
                                            window.dispatchEvent(new CustomEvent('omnichannel:open-chat', {
                                                detail: { conversationId: liveCall.conversationId }
                                            }))
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                                >
                                    <PhoneIncoming className="h-4 w-4" />
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLiveCall(null)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-extrabold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                                >
                                    <PhoneOff className="h-4 w-4" />
                                    Reject
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    if (isTerminalCallStatus(liveCall.status)) {
                                        setLiveCall(null)
                                        return
                                    }

                                    setLiveCall((current) => current ? {
                                        ...current,
                                        status: 'ENDED',
                                        endedAt: Date.now()
                                    } : current)
                                }}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                                <PhoneOff className="h-4 w-4" />
                                {isTerminalCallStatus(liveCall.status) ? 'Dismiss' : 'End'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
