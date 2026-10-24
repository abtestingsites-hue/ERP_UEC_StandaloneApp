import { X } from 'lucide-react'

export function FilterModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="fixed inset-0 z-40" onClick={onClose}></div>
            <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] bg-white dark:bg-[#1E1E1E] dark:border-white/10 rounded-[24px] shadow-[0_32px_64px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden relative z-50 flex flex-col scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-white/10 px-5 py-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-[16px]">Filter Recent Activities</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Activity Category</label>
                        <select className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-[12px] px-3 py-2.5 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30 appearance-none">
                            <option>All Categories</option>
                            <option>Home Care Assessment</option>
                            <option>Nurse Allocation</option>
                            <option>Follow-up Visit</option>
                            <option>Physio Session</option>
                            <option>Medical Supplies</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Status</label>
                        <select className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-[12px] px-3 py-2.5 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30 appearance-none">
                            <option>All Statuses</option>
                            <option>Completed</option>
                            <option>Pending</option>
                            <option>In Progress</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Min Value (₹)</label>
                            <input type="number" placeholder="0" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-[12px] px-3 py-2.5 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Max Value (₹)</label>
                            <input type="number" placeholder="100000" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-[12px] px-3 py-2.5 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-gray-700 dark:text-gray-300">Date Range</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-[12px] px-3 py-2.5 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30" />
                            <input type="date" className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-[12px] px-3 py-2.5 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30" />
                        </div>
                    </div>
                </div>

                <div className="shrink-0 px-5 py-4 bg-gray-50 dark:bg-black/10 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Clear</button>
                    <button onClick={onClose} className="px-6 py-2 rounded-[10px] text-[13px] font-bold text-white bg-primary-500 hover:bg-primary-600 transition-colors shadow-md">Apply Filters</button>
                </div>
            </div>
        </div>
    )
}
