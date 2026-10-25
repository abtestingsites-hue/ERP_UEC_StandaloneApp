import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

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
        danger: <AlertCircle className="h-6 w-6 text-red-600" />,
        warning: <AlertCircle className="h-6 w-6 text-orange-600" />,
        info: <Info className="h-6 w-6 text-blue-600" />,
        success: <CheckCircle2 className="h-6 w-6 text-green-600" />
    };

    const bgClasses = {
        danger: 'bg-red-100',
        warning: 'bg-orange-100',
        info: 'bg-blue-100',
        success: 'bg-green-100'
    };

    const btnClasses = {
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-orange-600 hover:bg-orange-700 text-white',
        info: 'bg-blue-600 hover:bg-blue-700 text-white',
        success: 'bg-green-600 hover:bg-green-700 text-white'
    };

    const sizeClasses = {
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className={`relative z-10 flex max-h-[calc(100vh-2rem)] transform flex-col overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-h-[calc(100vh-4rem)] ${sizeClasses[size]}`}>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${bgClasses[type]}`}>
                            {icons[type]}
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-bold text-gray-900">
                                {title}
                            </h3>
                            <div className="mt-2 text-sm text-gray-500">
                                {message && <p>{message}</p>}
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    {onConfirm && (
                        <button
                            type="button"
                            className={`inline-flex w-full justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto ${confirmDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${btnClasses[type]}`}
                            disabled={confirmDisabled}
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </button>
                    )}
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto transition-all"
                        onClick={onClose}
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
