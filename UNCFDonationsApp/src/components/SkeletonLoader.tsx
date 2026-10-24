export function SkeletonLoader() {
    return (
        <div className="w-full space-y-4 p-4 animate-pulse">
            <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
            <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
            <div className="grid gap-4 md:grid-cols-4 mt-6">
                <div className="h-24 bg-slate-200 rounded-xl"></div>
                <div className="h-24 bg-slate-200 rounded-xl"></div>
                <div className="h-24 bg-slate-200 rounded-xl"></div>
                <div className="h-24 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="h-64 bg-slate-200 rounded-xl mt-6"></div>
        </div>
    );
}
