import React from 'react'
import { PageHeader } from './PageHeader'

export function NursingAppLauncher({ customPath }: { customPath?: string }) {
    const nursingUrl = import.meta.env.VITE_NURSING_APP_URL || 'http://127.0.0.1:5174'
    const targetUrl = customPath ? `${nursingUrl}${customPath}` : `${nursingUrl}${window.location.pathname}`

    return (
        <div className="flex min-h-full flex-col px-2 pb-6 sm:px-4 2xl:px-6">
            <PageHeader
                title="Nursing Care Workspace"
                subtitle="Detailed clinical nursing operations are managed in the dedicated Nursing application."
                breadcrumbs={[{ label: 'Nursing' }, { label: 'Standalone Application' }]}
            />
            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        Standalone Application Active
                    </span>
                    <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                        Nursing Operations Hub
                    </h2>
                    <p className="mt-2 text-slate-600 font-medium leading-relaxed">
                        All detailed clinical tasks including medication scheduling, medicine requests, vitals monitoring, and patient ADL are managed in the Nursing Workspace. Main ERP retains visibility of critical patients and cross-domain workflow summaries.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                        >
                            Open Nursing Workspace
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function HomeCareAppLauncher({ customPath }: { customPath?: string }) {
    const homeCareUrl = import.meta.env.VITE_HOME_CARE_APP_URL || 'http://127.0.0.1:5175'
    const targetUrl = customPath ? `${homeCareUrl}${customPath}` : `${homeCareUrl}${window.location.pathname}`

    return (
        <div className="flex min-h-full flex-col px-2 pb-6 sm:px-4 2xl:px-6">
            <PageHeader
                title="Home Care Workspace"
                subtitle="Detailed home care operations are managed in the dedicated Home Care application."
                breadcrumbs={[{ label: 'Home Care' }, { label: 'Standalone Application' }]}
            />
            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                        <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                        Standalone Application Active
                    </span>
                    <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                        Home Care Operations Hub
                    </h2>
                    <p className="mt-2 text-slate-600 font-medium leading-relaxed">
                        All detailed home care tasks including service requirements, client directory, service contracts, and detailed staff allocation are managed in the Home Care Workspace. Main ERP retains core allocation and cross-domain workflow summaries.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition-all"
                        >
                            Open Home Care Workspace
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function VisitorAppLauncher({ customPath }: { customPath?: string }) {
    const visitorUrl = import.meta.env.VITE_VISITOR_APP_URL || 'http://127.0.0.1:5176'
    const targetUrl = customPath ? `${visitorUrl}${customPath}` : `${visitorUrl}${window.location.pathname}`

    return (
        <div className="flex min-h-full flex-col px-2 pb-6 sm:px-4 2xl:px-6">
            <PageHeader
                title="Visitor Management Workspace"
                subtitle="Detailed visitor operations are managed in the dedicated Visitor application."
                breadcrumbs={[{ label: 'Visitor' }, { label: 'Standalone Application' }]}
            />
            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                        <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        Standalone Application Active
                    </span>
                    <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                        Visitor Operations Hub
                    </h2>
                    <p className="mt-2 text-slate-600 font-medium leading-relaxed">
                        All detailed visitor tasks including visitor pass creation, gate management, and check-in workflows are managed in the Visitor Workspace. Main ERP retains visitor reporting and monitoring visibility.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-700 transition-all"
                        >
                            Open Visitor Workspace
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function InventoryAppLauncher({ customPath }: { customPath?: string }) {
    const inventoryUrl = import.meta.env.VITE_INVENTORY_APP_URL || 'http://127.0.0.1:5179';
    const targetUrl = customPath ? `${inventoryUrl}${customPath}` : `${inventoryUrl}/app/dashboard`;

    return (
        <div className="flex min-h-full flex-col px-2 pb-6 sm:px-4 2xl:px-6">
            <PageHeader
                title="Inventory & Logistics Workspace"
                subtitle="Centralized stock management, purchase orders, goods receipts, and valuation are managed in the standalone Inventory application."
                breadcrumbs={[{ label: 'Inventory' }, { label: 'Standalone Application' }]}
            />
            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Standalone Application Active &bull; Dedicated Port 5179
                    </span>
                    <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                        Inventory Operations Hub
                    </h2>
                    <p className="mt-2 text-slate-600 font-medium leading-relaxed">
                        All dedicated inventory logistics including multi-item purchase orders, goods receipt notes (GRN), stock issue requisitions, supplier returns, physical stock reconciliation, and stock valuation are managed in the standalone Inventory Workspace.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 items-center">
                        <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
                        >
                            Open Inventory Workspace
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                        <a
                            href="/inventory/legacy"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                            Access Legacy In-Tree View
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

