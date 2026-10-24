import { useState } from 'react'
import { Activity, Brain, Moon, Users, ListPlus } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { api } from '../../../lib/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'

// Fetch hook
const useElderAdlRecords = () => {
    return useQuery({
        queryKey: ['elder-adl'],
        queryFn: async () => {
            const res = await api.get('/uec/adl')
            return res.data.data
        }
    })
}

// Mutation hook
const useSaveElderAdl = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post('/uec/adl', payload)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['elder-adl'] })
            toast({ type: 'success', title: 'Saved', message: 'Elder ADL saved successfully' })
        }
    })
}

export function ElderADL() {
    const [status, setStatus] = useState('ASSISTED')
    const [mood, setMood] = useState('CALM')
    const [socialActivity, setSocialActivity] = useState('PARTICIPATED')
    const [sleepQuality, setSleepQuality] = useState('GOOD')
    const [notes, setNotes] = useState('')
    const [patientId, setPatientId] = useState('123e4567-e89b-12d3-a456-426614174000') // Placeholder UUID for testing

    const { data: records = [], isLoading } = useElderAdlRecords()
    const saveAdl = useSaveElderAdl()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        saveAdl.mutate({
            patientId,
            status,
            mood,
            socialActivity,
            sleepQuality,
            notes
        })
    }

    return (
        <div className="w-full min-w-0 space-y-4 px-2 pb-6 sm:px-4 2xl:px-6">
            <PageHeader
                title="Elder ADL (Activities of Daily Living)"
                subtitle="Track resident recreation, mood, sleep, and physical assistance."
                breadcrumbs={[{ label: 'UEC' }, { label: 'In-House Care' }, { label: 'Elder ADL' }]}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Log New Record</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Record a resident's daily living metrics.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Patient ID</label>
                            <input
                                type="text"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                                <Activity className="inline h-4 w-4 mr-1 text-primary-500" /> Physical Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                <option value="INDEPENDENT">Independent</option>
                                <option value="ASSISTED">Assisted</option>
                                <option value="BEDRIDDEN">Bedridden</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                                <Brain className="inline h-4 w-4 mr-1 text-primary-500" /> Mood / Cognitive
                            </label>
                            <select
                                value={mood}
                                onChange={(e) => setMood(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                <option value="HAPPY">Happy / Engaged</option>
                                <option value="CALM">Calm</option>
                                <option value="ANXIOUS">Anxious / Restless</option>
                                <option value="SAD">Sad / Withdrawn</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                                <Users className="inline h-4 w-4 mr-1 text-primary-500" /> Social Activity
                            </label>
                            <select
                                value={socialActivity}
                                onChange={(e) => setSocialActivity(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                <option value="PARTICIPATED">Participated in Events</option>
                                <option value="OBSERVED">Observed Only</option>
                                <option value="REFUSED">Refused to Join</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
                                <Moon className="inline h-4 w-4 mr-1 text-primary-500" /> Sleep Quality
                            </label>
                            <select
                                value={sleepQuality}
                                onChange={(e) => setSleepQuality(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                <option value="EXCELLENT">Excellent (8+ hrs)</option>
                                <option value="GOOD">Good (6-8 hrs)</option>
                                <option value="DISTURBED">Disturbed</option>
                                <option value="POOR">Poor (insomnia)</option>
                            </select>
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Observation Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                rows={3}
                                placeholder="Dietary notes, behavioral changes, or general observations..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saveAdl.isPending}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-extrabold text-white transition hover:bg-primary-700 disabled:opacity-50"
                    >
                        <ListPlus className="h-4 w-4" />
                        Save Record
                    </button>
                </form>

                <div className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Recent ADL Logs</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">History of resident metrics.</p>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <p className="text-sm text-gray-500">Loading...</p>
                        ) : records.length === 0 ? (
                            <p className="text-sm font-bold text-gray-400">No records found.</p>
                        ) : (
                            records.map((record: any) => (
                                <div key={record.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-white/5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                                            {record.patient?.name || 'Unknown Resident'}
                                        </p>
                                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                                            {record.status}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{record.description}</p>
                                    <p className="mt-2 text-[11px] font-bold text-gray-400">{new Date(record.createdAt).toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
