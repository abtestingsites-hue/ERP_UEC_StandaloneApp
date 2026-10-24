import { useMemo, useState } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { FilterSection } from '../../../components/FilterSection'
import { useStaff } from '../hooks/useHR'
import { useMedicalAssignments } from '../../medical/hooks/useMedical'
import { useHomeCareAllocations, useOthersAllocations } from '../../allocation/hooks/useAllocation'
import { AssignmentModal } from '../components/AssignmentModal'

export function ShiftRoster() {
    const [searchQuery, setSearchQuery] = useState('')
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    })

    const endDate = useMemo(() => {
        const d = new Date(startDate)
        d.setDate(d.getDate() + 6) // 7 day view
        d.setHours(23, 59, 59, 999)
        return d
    }, [startDate])

    const { data: staffList = [] } = useStaff()
    const { data: assignments = [] } = useMedicalAssignments({
        from: startDate.toISOString(),
        to: endDate.toISOString()
    })

    const { data: homeCareAllocations = [] } = useHomeCareAllocations()
    const { data: otherAllocations = [] } = useOthersAllocations()
    const allAllocations = useMemo(() => [...homeCareAllocations, ...otherAllocations], [homeCareAllocations, otherAllocations])

    const filteredStaff = useMemo(() => {
        return staffList.filter((s) =>
            (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.empId || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [staffList, searchQuery])

    const dates = useMemo(() => {
        const result = []
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate)
            d.setDate(d.getDate() + i)
            result.push(d)
        }
        return result
    }, [startDate])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)
    const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(undefined)
    const [selectedAssignment, setSelectedAssignment] = useState<any | undefined>(undefined)

    const handleCellClick = (staffId: string, date: Date) => {
        setSelectedStaffId(staffId)
        setSelectedDate(date.toISOString().split('T')[0])
        setSelectedAssignment(undefined)
        setIsModalOpen(true)
    }

    const handleAssignmentClick = (e: React.MouseEvent, assignment: any) => {
        e.stopPropagation()
        setSelectedAssignment(assignment)
        setSelectedStaffId(undefined)
        setSelectedDate(undefined)
        setIsModalOpen(true)
    }

    const nextWeek = () => {
        const d = new Date(startDate)
        d.setDate(d.getDate() + 7)
        setStartDate(d)
    }

    const prevWeek = () => {
        const d = new Date(startDate)
        d.setDate(d.getDate() - 7)
        setStartDate(d)
    }

    const getAssignmentsForStaffAndDate = (staffId: string, dateStr: string) => {
        return assignments.filter((a: any) => {
            if (a.staffId !== staffId || a.status === 'CANCELLED') return false
            const aStart = new Date(a.startAt).toISOString().split('T')[0]
            const aEnd = a.endAt ? new Date(a.endAt).toISOString().split('T')[0] : aStart
            return dateStr >= aStart && dateStr <= aEnd
        })
    }

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex flex-col h-full space-y-6 bg-transparent dark:bg-black">
            <PageHeader
                title="Shift Roster"
                subtitle="Assign staff shifts, view capacity and resolve scheduling gaps."
                breadcrumbs={[{ label: 'Human Resource' }, { label: 'Shift Roster' }]}
            />
            
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <FilterSection searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} searchPlaceholder="Search staff..." />
                
                <div className="flex items-center space-x-4">
                    <button onClick={prevWeek} className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                        Previous
                    </button>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button onClick={nextWeek} className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                        Next
                    </button>
                    <button onClick={() => { setSelectedStaffId(undefined); setSelectedDate(undefined); setSelectedAssignment(undefined); setIsModalOpen(true); }} className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        + Assign Staff
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                        <tr>
                            <th className="sticky top-0 left-0 z-20 bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">
                                Staff Member
                            </th>
                            {dates.map(date => (
                                <th key={date.toISOString()} className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 text-center min-w-[150px]">
                                    <div className="font-semibold text-gray-900 dark:text-white">{date.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStaff.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    No staff members found matching "{searchQuery}"
                                </td>
                            </tr>
                        ) : (
                            filteredStaff.map((staff: any) => (
                                <tr key={staff.id} className="group border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-800/50 border-r border-gray-100 dark:border-gray-800 p-3 align-top">
                                        <div className="font-medium text-gray-900 dark:text-white">{staff.name || 'Unnamed Staff'}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {staff.empId && <span className="font-medium mr-1">{staff.empId}</span>}
                                            {staff.role || staff.department || 'Staff'}
                                        </div>
                                        <div className="mt-1 text-xs px-2 py-0.5 inline-flex bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
                                            Workload: {staff.currentWorkload || 0}
                                        </div>
                                    </td>
                                    {dates.map(date => {
                                        const dateStr = date.toISOString().split('T')[0]
                                        const dayAssignments = getAssignmentsForStaffAndDate(staff.id, dateStr)
                                        
                                        return (
                                            <td 
                                                key={dateStr} 
                                                onClick={() => handleCellClick(staff.id, date)}
                                                className="p-2 border-r border-gray-100 dark:border-gray-800 align-top min-h-[100px] cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors relative"
                                            >
                                                <div className="flex flex-col gap-2 min-h-[80px]">
                                                    {dayAssignments.map((a: any) => (
                                                        <div 
                                                            key={a.id} 
                                                            onClick={(e) => handleAssignmentClick(e, a)}
                                                            className={`p-2 text-xs rounded-md border shadow-sm cursor-pointer transition-transform hover:scale-[1.02] ${
                                                                a.dutyType === 'SHIFT' 
                                                                    ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' 
                                                                    : (a.dutyType === 'ROUND' || a.dutyType === 'VISIT')
                                                                        ? 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300'
                                                                        : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
                                                            }`}
                                                        >
                                                            <div className="font-semibold truncate mb-1 flex items-center justify-between">
                                                                <span>{a.dutyType === 'ROUND' ? 'Medical Round' : a.dutyType === 'SHIFT' ? 'Shift Duty' : a.dutyType === 'VISIT' ? 'Visit' : a.dutyType}</span>
                                                                {a.priority && <span className="text-[10px] uppercase tracking-wider opacity-75">{a.priority}</span>}
                                                            </div>
                                                            {(a.patient?.name || a.allocation?.enquiry?.client?.name) && (
                                                                <div className="text-[11px] truncate opacity-90 mb-0.5">
                                                                    👤 {a.patient?.name || a.allocation?.enquiry?.client?.name}
                                                                </div>
                                                            )}
                                                            {a.location && (
                                                                <div className="text-[11px] truncate opacity-90 mb-0.5">
                                                                    📍 {a.location}
                                                                </div>
                                                            )}
                                                            <div className="text-[11px] font-medium opacity-80 mt-1 bg-white/40 dark:bg-black/20 rounded px-1.5 py-0.5 inline-block border border-black/5 dark:border-white/5">
                                                                {formatTime(a.startAt)} {a.endAt && `- ${formatTime(a.endAt)}`}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <AssignmentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialDate={selectedDate}
                    initialStaffId={selectedStaffId}
                    existingAssignment={selectedAssignment}
                    assignmentId={selectedAssignment?.id}
                    allocations={allAllocations}
                />
            )}
        </div>
    )
}
