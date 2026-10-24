import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../lib/utils'

export type ModalType = 'danger' | 'warning' | 'info' | 'success'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message?: React.ReactNode
    type?: ModalType
    size?: 'md' | 'lg' | 'xl'
    onConfirm?: () => void
    confirmDisabled?: boolean
    confirmLabel?: string
    cancelLabel?: string
    children?: React.ReactNode
}

export function Modal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    size = 'md',
    onConfirm,
    confirmDisabled = false,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    children
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    const icons = {
        danger: <AlertCircle className="h-6 w-6 text-red-600" />,
        warning: <AlertCircle className="h-6 w-6 text-orange-600" />,
        info: <Info className="h-6 w-6 text-primary-600" />,
        success: <CheckCircle2 className="h-6 w-6 text-green-600" />
    }

    const bgClasses = {
        danger: 'bg-red-100 dark:bg-red-900/30',
        warning: 'bg-orange-100 dark:bg-orange-900/30',
        info: 'bg-primary-100 dark:bg-primary-900/30',
        success: 'bg-green-100 dark:bg-green-900/30'
    }

    const btnClasses = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
        warning: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white',
        info: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white',
        success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white'
    }

    const sizeClasses = {
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl'
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal panel */}
            <div className={cn("relative z-10 flex max-h-[calc(100dvh-2rem)] transform flex-col overflow-hidden rounded-[32px] border border-white/20 bg-white p-2 text-left shadow-2xl transition-all dark:border-white/5 dark:bg-black sm:my-8 sm:w-full sm:max-h-[calc(100dvh-4rem)]", sizeClasses[size])}>
                <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-black dark:border-white/10 border border-gray-50 shadow-[0_2px_12px_rgba(0,0,0,0.02)] px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-[24px]">
                    <div className="sm:flex sm:items-start">
                        <div className={cn("mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10", bgClasses[type])}>
                            {icons[type]}
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-[18px] leading-6 font-extrabold tracking-tight text-gray-900 dark:text-gray-100" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2 text-sm text-gray-500">
                                {message && <p>{message}</p>}
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 bg-gray-50/50 dark:bg-black/20 border-x border-b border-gray-50 dark:border-white/10 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-[24px]">
                    {onConfirm && (
                        <button
                            type="button"
                            className={cn(
                                "inline-flex w-full justify-center rounded-xl border border-transparent px-5 py-2.5 text-[13.5px] font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto active:scale-95",
                                confirmDisabled
                                    ? "cursor-not-allowed opacity-60"
                                    : "hover:shadow-md hover:-translate-y-0.5",
                                btnClasses[type]
                            )}
                            disabled={confirmDisabled}
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </button>
                    )}
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent px-4 py-2.5 text-[13.5px] font-bold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0F969C]/20 focus:border-[#0F969C] sm:mt-0 sm:ml-3 sm:w-auto transition-all active:scale-95"
                        onClick={onClose}
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
