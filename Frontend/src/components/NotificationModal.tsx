import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Bell, CheckCircle, AlertTriangle } from 'lucide-react'
import { api } from '../lib/axios'
import { connectRealtimeSocket, realtimeSocket } from '../lib/realtimeSocket'
import { useAuthStore } from '../store/authStore'

export function NotificationModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const navigate = useNavigate()
    const currentUserId = useAuthStore((state) => state.user?.id)
    const [notifications, setNotifications] = useState<Array<{
        id: string
        title: string
        message: string
        type?: string
        createdAt?: string
        targetUrl?: string | null
        isRead?: boolean
    }>>([])

    const getTitle = (type?: string) => {
        if (type === 'TASK_APPROVAL_REQUIRED') return 'Task Approval Required'
        if (type === 'ENQUIRY_FOLLOW_UP_ASSIGNED') return 'New Enquiry Follow-up'
        if (type === 'MEDICINE_DOSE_GIVEN') return 'Medicine Dose Given'
        return 'New Notification'
    }

    const formatTime = (value?: string) => {
        const date = value ? new Date(value) : null
        return date && !Number.isNaN(date.getTime())
            ? date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : 'Just now'
    }

    useEffect(() => {
        if (!isOpen || !currentUserId) return
        let ignore = false

        api.get('/notifications')
            .then((response) => {
                if (ignore) return
                const saved = Array.isArray(response.data?.data) ? response.data.data : []
                setNotifications(saved.slice(0, 10).map((item: any) => ({
                    id: item.id,
                    title: getTitle(item.type),
                    message: item.message || '',
                    type: item.type,
                    createdAt: item.createdAt,
                    targetUrl: item.targetUrl || null,
                    isRead: Boolean(item.isRead)
                })))
            })
            .catch(() => {
                if (!ignore) setNotifications([])
            })

        return () => {
            ignore = true
        }
    }, [currentUserId, isOpen])

    useEffect(() => {
        if (!currentUserId) return
        connectRealtimeSocket()

        const handleNotification = (payload: {
            userId?: string
            message: string
            type?: string
            createdAt?: string
            targetUrl?: string | null
        }) => {
            if (payload.userId !== currentUserId) return
            setNotifications((prev) => [{
                id: `live-${payload.createdAt || Date.now()}`,
                title: getTitle(payload.type),
                message: payload.message,
                type: payload.type,
                createdAt: payload.createdAt,
                targetUrl: payload.targetUrl || null,
                isRead: false
            }, ...prev].slice(0, 10))
        }

        realtimeSocket.on('notification:new', handleNotification)
        return () => {
            realtimeSocket.off('notification:new', handleNotification)
        }
    }, [currentUserId])

    const openNotification = (notification: { id: string; targetUrl?: string | null }) => {
        if (!notification.id.startsWith('live-')) {
            api.patch(`/notifications/${notification.id}/read`).catch(() => undefined)
        }
        if (notification.targetUrl) {
            navigate(notification.targetUrl)
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-gray-900/10 backdrop-blur-[1px] p-4 sm:p-6 sm:pr-20 sm:pt-20 animate-in fade-in duration-200">
            <div className="fixed inset-0 z-40" onClick={onClose}></div>
            <div className="w-full max-w-sm bg-white dark:bg-[#1E1E1E] dark:border-white/10 rounded-[24px] shadow-[0_32px_64px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden relative z-50 flex flex-col max-h-[80vh] scale-100 animate-in slide-in-from-right-10 duration-200">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-5 py-4 shrink-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-[16px] flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary-500" /> Notifications
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col">
                        {notifications.map((notification) => {
                            const isApproval = notification.type === 'TASK_APPROVAL_REQUIRED'
                            const Icon = isApproval ? AlertTriangle : notification.type === 'MEDICINE_DOSE_GIVEN' ? CheckCircle : Bell
                            return (
                                <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() => openNotification(notification)}
                                    className="px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-50/50 dark:border-white/5 cursor-pointer flex gap-3 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isApproval ? 'bg-accent/10 text-accent' : 'bg-primary-500/10 text-primary-500'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">{notification.title}</span>
                                        <span className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{notification.message}</span>
                                        <span className="text-[10px] font-bold text-gray-400 mt-1">{formatTime(notification.createdAt)}</span>
                                        {notification.targetUrl && <span className="mt-1 text-[10px] font-extrabold uppercase text-primary-500">Open step</span>}
                                    </div>
                                </button>
                            )
                        })}
                        {notifications.length === 0 && (
                            <div className="px-5 py-10 text-center text-sm font-semibold text-gray-500">
                                No notifications available.
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 text-center shrink-0">
                    <button onClick={() => navigate('/profile/notifications')} className="text-[12px] font-bold text-primary-500 hover:text-primary-600 transition-colors">View all notifications</button>
                </div>
            </div>
        </div>
    )
}
