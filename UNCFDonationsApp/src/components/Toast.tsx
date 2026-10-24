import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface ToastMessage {
    id: string;
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

interface ToastContextType {
    toast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const toast = useCallback(({ title, message, type = 'info' }: Omit<ToastMessage, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm animate-in slide-in-from-bottom-2 duration-200 ${
                            t.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : t.type === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-900'
                                : 'bg-slate-900 border-slate-800 text-white'
                        }`}
                    >
                        {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
                        {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />}
                        {t.type === 'info' && <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                            {t.title && <p className="font-bold">{t.title}</p>}
                            <p className="font-medium text-xs mt-0.5">{t.message}</p>
                        </div>
                        <button onClick={() => removeToast(t.id)} className="shrink-0 p-1 opacity-70 hover:opacity-100">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
