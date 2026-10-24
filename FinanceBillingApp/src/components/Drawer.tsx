import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

interface DrawerProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    size?: 'md' | 'lg' | 'xl'
}

export function Drawer({ isOpen, onClose, title, children, size = 'md' }: DrawerProps) {
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

    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-2xl 2xl:max-w-3xl',
        xl: 'max-w-4xl 2xl:max-w-6xl',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <div
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />
            <div className={cn("relative flex max-h-[92dvh] flex-col overflow-hidden rounded-[32px] border border-white/20 dark:border-white/5 bg-white dark:bg-black text-left shadow-2xl transition-all w-full z-10 p-2", sizeClasses[size])}>
                <div className="flex flex-col bg-white dark:bg-black dark:border-white/10 overflow-hidden rounded-[24px] h-full relative shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50">
                    <div className="px-5 py-5 sm:px-6 border-b border-gray-100/80 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[18px] font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{title}</h2>
                            <div className="ml-3 flex h-7 items-center">
                                <button
                                    type="button"
                                    className="rounded-md bg-white dark:bg-transparent text-gray-400 hover:text-[#0F969C] focus:outline-none focus:ring-2 focus:ring-[#0F969C]/30 transition-colors"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close panel</span>
                                    <X className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="relative flex-1 px-5 py-5 sm:px-6 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
