import { create } from 'zustand'

type CallRecord = Record<string, any>

interface CallCenterState {
    calls: CallRecord[]
    activeCalls: CallRecord[]
    analytics: any
    lastEventId: string
    presence: Record<string, string>
    upsertCall: (call: CallRecord) => void
    removeActiveCall: (call: CallRecord) => void
    setCalls: (calls: CallRecord[]) => void
    setActiveCalls: (calls: CallRecord[]) => void
    setAnalytics: (analytics: any) => void
    setLastEventId: (eventId?: string) => void
    setPresence: (userId: string, status: string) => void
}

const getCallKey = (call: CallRecord) => String(call?.callSid || call?.id || '')
const isLiveStatus = (status?: string) => ['QUEUED', 'RINGING', 'ONGOING'].includes(String(status || '').toUpperCase())

export const useCallCenterStore = create<CallCenterState>((set) => ({
    calls: [],
    activeCalls: [],
    analytics: null,
    lastEventId: '',
    presence: {},
    upsertCall: (incoming) => set((state) => {
        const call = incoming?.callHistory || incoming?.call || incoming
        const key = getCallKey(call)
        if (!key) return state

        const existingIndex = state.calls.findIndex((item) => getCallKey(item) === key)
        const calls = existingIndex >= 0
            ? state.calls.map((item, index) => index === existingIndex ? { ...item, ...call } : item)
            : [call, ...state.calls]

        const activeCalls = isLiveStatus(call.status)
            ? (() => {
                const index = state.activeCalls.findIndex((item) => getCallKey(item) === key)
                return index >= 0
                    ? state.activeCalls.map((item, itemIndex) => itemIndex === index ? { ...item, ...call } : item)
                    : [call, ...state.activeCalls]
            })()
            : state.activeCalls.filter((item) => getCallKey(item) !== key)

        return {
            calls,
            activeCalls,
            lastEventId: String(incoming?.eventId || state.lastEventId || '')
        }
    }),
    removeActiveCall: (call) => set((state) => ({
        activeCalls: state.activeCalls.filter((item) => getCallKey(item) !== getCallKey(call))
    })),
    setCalls: (calls) => set({ calls }),
    setActiveCalls: (activeCalls) => set({ activeCalls }),
    setAnalytics: (analytics) => set({ analytics }),
    setLastEventId: (lastEventId = '') => set({ lastEventId }),
    setPresence: (userId, status) => set((state) => ({ presence: { ...state.presence, [userId]: status } }))
}))
