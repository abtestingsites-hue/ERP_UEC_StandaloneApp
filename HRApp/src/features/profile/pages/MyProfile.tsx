import { PageHeader } from '../../../components/PageHeader'
import { User, Mail, Phone, Briefcase, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/axios'
import { useAuthStore } from '../../../store/authStore'

export function MyProfile() {
    const sessionUser = useAuthStore((state) => state.user)
    const { data, isLoading, isError } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await api.get('/profile/me')
            return res.data.data
        }
    })

    if (isLoading) {
        return (
            <div className="flex flex-col h-full space-y-6">
                <PageHeader title="My Profile" breadcrumbs={[{ label: 'Profile' }, { label: 'My Details' }]} />
                <div className="flex items-center justify-center p-12 text-gray-500">Loading your profile...</div>
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className="flex flex-col h-full space-y-6">
                <PageHeader title="My Profile" breadcrumbs={[{ label: 'Profile' }, { label: 'My Details' }]} />
                <div className="flex items-center justify-center p-12 text-red-500">Failed to load profile data.</div>
            </div>
        )
    }

    const profile = {
        empId: data.empId || sessionUser?.id?.split('-')?.[0] || 'N/A',
        name: data.name || sessionUser?.name || 'User',
        role: data.role || sessionUser?.role || 'Employee',
        department: data.department || data.role || sessionUser?.role || 'General',
        unitId: data.unitId || sessionUser?.unitId || 'N/A',
        phone: data.phone || 'N/A',
        email: data.email || sessionUser?.email || 'N/A'
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <PageHeader title="My Profile" breadcrumbs={[{ label: 'Profile' }, { label: 'My Details' }]} />

            <div className="bg-white shadow-sm border border-gray-200 rounded-lg max-w-3xl overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-400"></div>
                <div className="px-6 sm:px-10 pb-10 flex flex-col sm:flex-row gap-6 relative">

                    {/* Avatar Base */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center -mt-12 sm:-mt-16 bg-white shrink-0 overflow-hidden shadow-sm">
                        <User className="w-12 h-12 text-gray-400" />
                    </div>

                    <div className="flex-1 pt-2 sm:pt-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.name}</h2>
                        <p className="text-gray-500 font-medium">{profile.role} • {profile.department}</p>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                <span><strong className="text-gray-900 dark:text-gray-100 block">Employee ID</strong> {profile.empId}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span><strong className="text-gray-900 dark:text-gray-100 block">Base Unit</strong> {profile.unitId}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span><strong className="text-gray-900 dark:text-gray-100 block">Phone</strong> {profile.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span><strong className="text-gray-900 dark:text-gray-100 block">Email</strong> {profile.email}</span>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-gray-100 pt-6 flex gap-3">
                            <button className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 shadow-sm transition-colors">
                                Edit Profile
                            </button>
                            <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
