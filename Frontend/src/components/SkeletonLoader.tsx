import { Loader2 } from 'lucide-react'

export function SkeletonLoader() {
    return (
        <div className="flex flex-col flex-1 p-8 w-full h-full min-h-[500px] animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-32"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>

            {/* Filter / Action Bar Skeleton */}
            <div className="flex gap-4 mb-6">
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded w-48"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>

            {/* Content Area Skeleton */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 p-6">
                <div className="space-y-4">
                    {/* Table Header */}
                    <div className="h-12 bg-gray-100 rounded-lg flex items-center px-4 mb-4 gap-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>

                    {/* Table Rows rows */}
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-16 border-b border-gray-50 flex items-center px-4 gap-4">
                            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-white/80 p-4 rounded-full shadow-lg backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            </div>
        </div>
    )
}

export function GlobalSpinner() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        </div>
    )
}
