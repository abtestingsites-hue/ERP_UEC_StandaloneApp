import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { cn } from '../lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastMessage {
    id: string
    type: ToastType
    title: string
    message?: string
}

interface ToastContextType {
    toast: (toast: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([])

    const toast = useCallback(({ type, title, message }: Omit<ToastMessage, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts((prev) => [...prev, { id, type, title, message }])

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 5000)
    }, [])

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all",
                            "transform ease-out duration-300 translate-y-0 opacity-100 sm:translate-x-0"
                        )}
                    >
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {t.type === 'success' && <CheckCircle className="h-6 w-6 text-green-400" />}
                                    {t.type === 'error' && <AlertCircle className="h-6 w-6 text-red-400" />}
                                    {t.type === 'warning' && <AlertCircle className="h-6 w-6 text-yellow-400" />}
                                    {t.type === 'info' && <Info className="h-6 w-6 text-blue-400" />}
                                </div>
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.title}</p>
                                    {t.message && <p className="mt-1 text-sm text-gray-500">{t.message}</p>}
                                </div>
                                <div className="ml-4 flex flex-shrink-0">
                                    <button
                                        type="button"
                                        className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                        onClick={() => removeToast(t.id)}
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
