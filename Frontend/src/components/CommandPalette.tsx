import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { Search, PhoneCall, CheckCircle, Users, ShieldAlert, FileText, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function CommandPalette() {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
            ></div>
            <Command
                className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] bg-white/95 backdrop-blur-xl rounded-[24px] shadow-[0_32px_64px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden relative z-50 flex flex-col scale-100 animate-in zoom-in-95 duration-200"
            >
                <div className="flex shrink-0 items-center border-b border-gray-100 px-5">
                    <Search className="w-5 h-5 text-gray-400 shrink-0" />
                    <Command.Input
                        placeholder="What do you need to do? (e.g. Add Enquiry, Create Client)"
                        className="w-full bg-transparent border-0 outline-none focus:ring-0 text-[16px] py-5 px-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 font-medium"
                        autoFocus
                    />
                    <div className="hidden sm:flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-[10px] font-bold text-gray-400 shrink-0 border border-gray-200">
                        <kbd>ESC</kbd>
                    </div>
                </div>

                <Command.List className="min-h-0 flex-1 overflow-y-auto p-3 custom-scrollbar">
                    <Command.Empty className="py-8 text-center text-[13px] font-medium text-gray-500">No workflows found. Try "Add Enquiry".</Command.Empty>

                    <Command.Group heading="CORE WORKFLOWS" className="px-2 py-3 text-[10px] font-bold text-gray-400 tracking-wider">
                        <Command.Item onSelect={() => { navigate('/enquiry/add'); setOpen(false) }} className="flex items-center gap-3 px-4 py-3.5 rounded-[16px] cursor-pointer hover:bg-[#ffb733]/10 aria-selected:bg-[#ffb733]/10 text-gray-700 dark:text-gray-300 hover:text-[#ffb733] aria-selected:text-[#ffb733] transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-[#ffb733]/10 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-[#ffb733]/20 shadow-sm transition-all"><PhoneCall className="w-4 h-4" /></div>
                            <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Add Enquiry</span>
                            <span className="text-[12px] font-medium text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">Record a new lead</span>
                        </Command.Item>

                        <Command.Item onSelect={() => { navigate('/tasks/assign'); setOpen(false) }} className="flex items-center gap-3 px-4 py-3.5 rounded-[16px] cursor-pointer hover:bg-[#0F969C]/10 aria-selected:bg-[#0F969C]/10 text-gray-700 dark:text-gray-300 hover:text-[#0F969C] aria-selected:text-[#0F969C] transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-[#0F969C]/10 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-[#0F969C]/20 shadow-sm transition-all"><CheckCircle className="w-4 h-4" /></div>
                            <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Assign Task</span>
                            <span className="text-[12px] font-medium text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">Delegate to team</span>
                        </Command.Item>

                        <Command.Item onSelect={() => { navigate('/clients/new'); setOpen(false) }} className="flex items-center gap-3 px-4 py-3.5 rounded-[16px] cursor-pointer hover:bg-[#0F969C]/10 aria-selected:bg-[#0F969C]/10 text-gray-700 dark:text-gray-300 hover:text-[#0F969C] aria-selected:text-[#0F969C] transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-[#0F969C]/10 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-[#0F969C]/20 shadow-sm transition-all"><Users className="w-4 h-4" /></div>
                            <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Create Client Profile</span>
                            <span className="text-[12px] font-medium text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">Onboard new patient</span>
                        </Command.Item>
                    </Command.Group>

                    <div className="h-px w-full bg-gray-100 my-2"></div>

                    <Command.Group heading="NAVIGATION & REPORTS" className="px-2 py-3 text-[10px] font-bold text-gray-400 tracking-wider">
                        <Command.Item onSelect={() => { navigate('/dashboard'); setOpen(false) }} className="flex items-center gap-3 px-4 py-3 rounded-[16px] cursor-pointer hover:bg-gray-50 aria-selected:bg-gray-50 text-gray-600 transition-colors group">
                            <Activity className="w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:text-gray-300" /> <span className="text-[13px] font-bold group-hover:text-gray-900 dark:text-gray-100">Dashboard Overview</span>
                        </Command.Item>
                        <Command.Item onSelect={() => { navigate('/reports/generate'); setOpen(false) }} className="flex items-center gap-3 px-4 py-3 rounded-[16px] cursor-pointer hover:bg-gray-50 aria-selected:bg-gray-50 text-gray-600 transition-colors group">
                            <FileText className="w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:text-gray-300" /> <span className="text-[13px] font-bold group-hover:text-gray-900 dark:text-gray-100">Generate Report</span>
                        </Command.Item>
                        <Command.Item onSelect={() => { navigate('/complaints'); setOpen(false) }} className="flex items-center gap-3 px-4 py-3 rounded-[16px] cursor-pointer hover:bg-[#ffb733]/10 aria-selected:bg-[#ffb733]/10 text-gray-600 transition-colors group">
                            <ShieldAlert className="w-4 h-4 text-gray-400 group-hover:text-[#ffb733]" /> <span className="text-[13px] font-bold group-hover:text-[#ffb733] transition-colors">Incident Hub</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>

                <div className="shrink-0 px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">Pro tip: Press <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-200 ml-1">⌘</kbd> <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-200">K</kbd> to access anywhere</span>
                </div>
            </Command>
        </div>
    )
}
