import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ModalType = 'danger' | 'warning' | 'info' | 'success';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message?: React.ReactNode;
    type?: ModalType;
    size?: 'md' | 'lg' | 'xl';
    onConfirm?: () => void;
    confirmDisabled?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    children?: React.ReactNode;
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
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const icons = {
        danger: <AlertCircle className="h-6 w-6 text-rose-600" />,
        warning: <AlertCircle className="h-6 w-6 text-amber-600" />,
        info: <Info className="h-6 w-6 text-indigo-600" />,
        success: <CheckCircle2 className="h-6 w-6 text-emerald-600" />
    };

    const bgClasses = {
        danger: 'bg-rose-100',
        warning: 'bg-amber-100',
        info: 'bg-indigo-100',
        success: 'bg-emerald-100'
    };

    const btnClasses = {
        danger: 'bg-rose-600 hover:bg-rose-700 text-white',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white',
        info: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    };

    const sizeClasses = {
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className={cn("relative z-10 flex max-h-[calc(100vh-2rem)] transform flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl transition-all sm:my-8 sm:w-full", sizeClasses[size])}>
                <div className="min-h-0 flex-1 overflow-y-auto bg-white p-6 rounded-t-xl">
                    <div className="sm:flex sm:items-start">
                        <div className={cn("mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10", bgClasses[type])}>
                            {icons[type]}
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-extrabold tracking-tight text-slate-900" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2 text-sm text-slate-500">
                                {message && <p>{message}</p>}
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 bg-slate-50 border-t border-slate-100 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-xl">
                    {onConfirm && (
                        <button
                            type="button"
                            className={cn(
                                "inline-flex w-full justify-center rounded-xl border border-transparent px-5 py-2.5 text-sm font-bold shadow-sm transition-all focus:outline-none sm:ml-3 sm:w-auto",
                                confirmDisabled ? "cursor-not-allowed opacity-60" : "hover:shadow-md",
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
                        className="mt-3 inline-flex w-full justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 sm:mt-0 sm:ml-3 sm:w-auto transition-all"
                        onClick={onClose}
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
