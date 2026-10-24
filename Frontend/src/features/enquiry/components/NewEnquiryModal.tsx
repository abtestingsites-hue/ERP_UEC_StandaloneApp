import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useAddEnquiry } from '../hooks/useEnquiry'

interface NewEnquiryModalProps {
    isOpen: boolean
    onClose: () => void
    defaultUnitId?: string
}

export function NewEnquiryModal({ isOpen, onClose, defaultUnitId = 'U-001' }: NewEnquiryModalProps) {
    const addEnquiry = useAddEnquiry()
    const [form, setForm] = useState({
        unitId: defaultUnitId,
        service: 'Home Care',
        mode: 'Call',
        clientName: '',
        mobile: '',
        email: '',
        comments: '',
        status: 'Open',
        leadQuality: 'Warm',
        enquiryIntent: 'Ready to start service',
        followUpPriority: 'Today',
        patientName: ''
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        addEnquiry.mutate(form as any, {
            onSuccess: () => onClose()
        })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-black">
                <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-white/10">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Add Enquiry</h2>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Client Name *</label>
                            <input
                                name="clientName"
                                value={form.clientName}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] dark:border-white/20 dark:bg-black dark:text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile *</label>
                            <input
                                name="mobile"
                                value={form.mobile}
                                onChange={handleChange}
                                required
                                minLength={10}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] dark:border-white/20 dark:bg-black dark:text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Service *</label>
                            <select
                                name="service"
                                value={form.service}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] dark:border-white/20 dark:bg-black dark:text-white"
                            >
                                <option value="Home Care">Home Care</option>
                                <option value="Clinical Care">Clinical Care</option>
                                <option value="In-House Care">In-House Care</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mode</label>
                            <select
                                name="mode"
                                value={form.mode}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] dark:border-white/20 dark:bg-black dark:text-white"
                            >
                                <option value="Call">Call</option>
                                <option value="Walk-in">Walk-in</option>
                                <option value="Website">Website</option>
                                <option value="Reference">Reference</option>
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Comments</label>
                            <textarea
                                name="comments"
                                value={form.comments}
                                onChange={handleChange}
                                rows={3}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#0F969C] focus:ring-1 focus:ring-[#0F969C] dark:border-white/20 dark:bg-black dark:text-white"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
                        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">
                            Cancel
                        </button>
                        <button type="submit" disabled={addEnquiry.isPending} className="rounded-lg bg-[#294D61] px-6 py-2 text-sm font-bold text-white shadow-md hover:bg-[#1a3442] disabled:opacity-50">
                            {addEnquiry.isPending ? 'Saving...' : 'Create Enquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
