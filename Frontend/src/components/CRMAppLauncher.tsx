import React, { useEffect } from 'react';
import { Headset } from 'lucide-react';

export function CRMAppLauncher({ customPath }: { customPath?: string }) {
    useEffect(() => {
        const crmUrl = import.meta.env.VITE_CRM_APP_URL || 'http://127.0.0.1:5181';
        const pathname = customPath || window.location.pathname;
        const search = window.location.search;

        let targetPath = pathname;

        if (pathname === '/enquiry/new') {
            targetPath = '/crm/new-enquiry';
        } else if (pathname === '/enquiry/follow-up') {
            targetPath = '/crm/enquiry-follow-up';
        } else if (pathname.startsWith('/enquiry/follow-up/')) {
            const id = pathname.replace('/enquiry/follow-up/', '');
            targetPath = `/crm/enquiry-follow-up/${id}`;
        } else if (pathname === '/customer-care/complaints') {
            targetPath = '/crm/customer-care/complaints';
        } else if (pathname === '/customer-care/pending-feedback' || pathname === '/crm/feedback') {
            targetPath = '/crm/customer-care/pending-feedback';
        } else if (pathname === '/customer-care/service-history') {
            targetPath = '/crm/customer-care/service-history';
        } else if (pathname === '/business/welcome-call') {
            targetPath = '/crm/customer-care/welcome-calls';
        } else if (!pathname.startsWith('/crm')) {
            targetPath = '/crm/dashboard';
        }

        window.location.href = `${crmUrl}${targetPath}${search}`;
    }, [customPath]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse">
                <Headset className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Launching CRM & Customer Care Application...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Transferring session to the dedicated Standalone CRMApp.
            </p>
        </div>
    );
}

export default CRMAppLauncher;
