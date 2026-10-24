import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from 'lucide-react'
import { PageHeader } from '../../../components/PageHeader'
import { api } from '../../../lib/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/Toast'

const useUecEvents = () => {
    return useQuery({
        queryKey: ['uec-events'],
        queryFn: async () => {
            const res = await api.get('/uec/events')
            return res.data.data || []
        }
    })
}

const useCreateUecEvent = () => {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    return useMutation({
        mutationFn: async (payload: any) => {
            const res = await api.post('/uec/events', payload)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['uec-events'] })
            toast({ type: 'success', title: 'Success', message: 'Event scheduled successfully' })
        }
    })
}

export function EventCalendar() {
    const { data: events = [], isLoading } = useUecEvents()
    const createEvent = useCreateUecEvent()

    const [view, setView] = useState<'LIST' | 'GRID'>('LIST')
    
    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [category, setCategory] = useState('RECREATION')
    const [location, setLocation] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createEvent.mutate({
            title, description, date, startTime, endTime, category, location
        }, {
            onSuccess: () => {
                setTitle('')
                setDescription('')
                setDate('')
                setStartTime('')
                setEndTime('')
                setLocation('')
            }
        })
    }

    const groupedEvents = useMemo(() => {
        const groups: Record<string, any[]> = {}
        events.forEach((ev: any) => {
            if (!groups[ev.date]) groups[ev.date] = []
            groups[ev.date].push(ev)
        })
        return groups
    }, [events])

    const sortedDates = Object.keys(groupedEvents).sort()

    return (
        <div className="w-full min-w-0 space-y-4 px-2 pb-6 sm:px-4 2xl:px-6">
            <PageHeader
                title="Event & Activity Calendar"
                subtitle="Schedule and track resident recreation, therapy sessions, and community events."
                breadcrumbs={[{ label: 'UEC' }, { label: 'In-House Care' }, { label: 'Event Calendar' }]}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Schedule Event</h2>
                            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Plan a new activity.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Event Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    required
                                    placeholder="e.g. Morning Yoga"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Start Time</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">End Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                >
                                    <option value="RECREATION">Recreation (Games/Arts)</option>
                                    <option value="FITNESS">Fitness & Wellness</option>
                                    <option value="THERAPY">Therapy (Group/Solo)</option>
                                    <option value="OUTING">Outing / Trip</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    placeholder="e.g. Garden Area"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={createEvent.isPending}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-extrabold text-white transition hover:bg-primary-700 disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            Schedule Event
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-lg border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-black">
                        <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-white/10">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Upcoming Events</h2>
                                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Chronological list of scheduled activities.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setView('LIST')}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-bold ${view === 'LIST' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    List
                                </button>
                                <button
                                    onClick={() => setView('GRID')}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-bold ${view === 'GRID' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    Grid
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {isLoading ? (
                                <p className="text-sm text-gray-500">Loading calendar...</p>
                            ) : sortedDates.length === 0 ? (
                                <div className="py-12 text-center">
                                    <CalendarIcon className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                                    <p className="mt-4 text-sm font-bold text-gray-400">No events scheduled.</p>
                                </div>
                            ) : view === 'LIST' ? (
                                <div className="space-y-8">
                                    {sortedDates.map(date => (
                                        <div key={date}>
                                            <h3 className="mb-4 text-sm font-extrabold text-gray-900 dark:text-gray-100">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                            <div className="space-y-3">
                                                {groupedEvents[date].map(ev => (
                                                    <div key={ev.id} className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:border-primary-100 hover:bg-primary-50/50 dark:border-white/5 dark:hover:border-primary-900/50 dark:hover:bg-primary-900/10">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{ev.category}</span>
                                                                <h4 className="text-sm font-extrabold text-gray-900 dark:text-gray-100">{ev.title}</h4>
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                    {ev.startTime} - {ev.endTime}
                                                                </span>
                                                                {ev.location && (
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="h-3.5 w-3.5" />
                                                                        {ev.location}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {ev.description && (
                                                                <p className="mt-2 text-xs text-gray-500 line-clamp-2">{ev.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                     {events.map((ev: any) => (
                                         <div key={ev.id} className="rounded-lg border border-gray-100 p-4 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{ev.category}</span>
                                            <h4 className="mt-2 text-sm font-extrabold text-gray-900 dark:text-gray-100">{ev.title}</h4>
                                            <p className="mt-1 text-xs font-bold text-primary-600 dark:text-primary-400">{new Date(ev.date).toLocaleDateString()} at {ev.startTime}</p>
                                            {ev.location && <p className="mt-1 text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.location}</p>}
                                         </div>
                                     ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
