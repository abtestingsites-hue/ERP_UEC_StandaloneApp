import React, { useState } from 'react'
import { PageHeader } from '../../../components/PageHeader'
import { User, Mail, Phone, Briefcase, MapPin, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/axios'
import { useAuthStore } from '../../../store/authStore'
import { useNavigate } from 'react-router-dom'

export function MyProfile() {
    const sessionUser = useAuthStore((state) => state.user)
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editPhone, setEditPhone] = useState('')

    const { data, isLoading, isError } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await api.get('/profile/me')
            return res.data.data
        }
    })

    const updateProfileMutation = useMutation({
        mutationFn: async (payload: { phone: string }) => {
            const res = await api.patch('/profile/me', payload)
            return res.data.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            setIsEditModalOpen(false)
        }
    })

    const handleOpenEditModal = () => {
        setEditPhone(data?.phone || sessionUser?.phone || '')
        setIsEditModalOpen(true)
    }

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault()
        updateProfileMutation.mutate({ phone: editPhone })
    }

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

            <div className="bg-white shadow-sm border border-gray-200 rounded-lg max-w-3xl overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-400"></div>
                <div className="px-6 sm:px-10 pb-10 flex flex-col sm:flex-row gap-6 relative">

                    {/* Avatar Base */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center -mt-12 sm:-mt-16 shrink-0 overflow-hidden shadow-sm">
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
                            <button 
                                onClick={handleOpenEditModal}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 shadow-sm transition-colors"
                            >
                                Edit Profile
                            </button>
                            <button 
                                onClick={() => navigate('/auth/change-password')}
                                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-semibold text-lg text-gray-900">Edit Profile</h3>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="Enter your phone number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Other profile fields (Name, Role, Email) must be updated by HR.
                                </p>
                            </div>
                            
                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateProfileMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
