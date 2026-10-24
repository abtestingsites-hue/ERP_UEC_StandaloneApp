import { Eye, Search, UserRoundCheck, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Drawer } from '../../../components/Drawer'
import { PageHeader } from '../../../components/PageHeader'
import { StatusHighlighter } from '../../../components/StatusHighlighter'
import { useAdminUsers } from '../../super_admin/hooks/useSuperAdmin'
import type { AdminUser } from '../../super_admin/services/superAdmin'

const clientPortalRoles = new Set(['family member', 'client', 'client family member'])

const normalizeRole = (user: AdminUser) => String(user.role?.name || '').trim().toLowerCase()

const fullName = (user: AdminUser) =>
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email

const formatDate = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ClientPortalAccess() {
    const { data: users = [], isLoading } = useAdminUsers()
    const [search, setSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

    const portalUsers = useMemo(() => (
        users.filter((user) => clientPortalRoles.has(normalizeRole(user)))
    ), [users])

    const filteredUsers = useMemo(() => {
        const keyword = search.trim().toLowerCase()
        if (!keyword) return portalUsers

        return portalUsers.filter((user) => [
            fullName(user),
            user.email,
            user.mobile || '',
            user.role?.name || '',
            user.unit?.name || ''
        ].some((value) => value.toLowerCase().includes(keyword)))
    }, [portalUsers, search])

    const activeCount = portalUsers.filter((user) => user.isActive).length
    const inactiveCount = portalUsers.length - activeCount

    return (
        <div className="space-y-6">
            <PageHeader
                title="Client Portal Access"
                subtitle="Family and client login accounts created for portal access."
                breadcrumbs={[{ label: 'Client Portal' }, { label: 'Access Members' }]}
            />

            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                    <Users className="mb-4 h-5 w-5 text-primary-600" />
                    <p className="text-2xl font-extrabold">{portalUsers.length}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-gray-500">Total Portal Members</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                    <UserRoundCheck className="mb-4 h-5 w-5 text-emerald-700" />
                    <p className="text-2xl font-extrabold">{activeCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">Active Login Access</p>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 shadow-sm">
                    <UserRoundCheck className="mb-4 h-5 w-5 text-amber-700" />
                    <p className="text-2xl font-extrabold">{inactiveCount}</p>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Disabled Access</p>
                </div>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search member, email, mobile, or role..."
                        className="w-full bg-transparent text-sm outline-none"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3">S.No</th>
                                <th className="px-4 py-3">Member</th>
                                <th className="px-4 py-3">Login Email</th>
                                <th className="px-4 py-3">Mobile</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center font-semibold text-gray-500">Loading portal members...</td>
                                </tr>
                            ) : filteredUsers.length ? filteredUsers.map((user, index) => (
                                <tr key={user.id} className="border-b border-gray-100">
                                    <td className="px-4 py-4">{index + 1}</td>
                                    <td className="px-4 py-4 font-extrabold">{fullName(user)}</td>
                                    <td className="px-4 py-4 text-primary-700">{user.email}</td>
                                    <td className="px-4 py-4">{user.mobile || '-'}</td>
                                    <td className="px-4 py-4">{user.role?.name || '-'}</td>
                                    <td className="px-4 py-4"><StatusHighlighter value={user.isActive ? 'Active' : 'Inactive'} /></td>
                                    <td className="px-4 py-4">{formatDate(user.createdAt)}</td>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-xs font-extrabold text-white shadow-sm"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center font-semibold text-gray-500">No client portal login access found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Drawer
                isOpen={Boolean(selectedUser)}
                onClose={() => setSelectedUser(null)}
                title="Portal Member Details"
                size="lg"
            >
                {selectedUser ? (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                            <p className="text-lg font-extrabold text-gray-900">{fullName(selectedUser)}</p>
                            <p className="text-sm font-semibold text-primary-700">{selectedUser.role?.name || 'Client Portal Member'}</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Detail label="Login Email" value={selectedUser.email} />
                            <Detail label="Mobile" value={selectedUser.mobile || '-'} />
                            <Detail label="Unit" value={selectedUser.unit?.name || '-'} />
                            <Detail label="Status" value={selectedUser.isActive ? 'Active' : 'Inactive'} />
                            <Detail label="Created Date" value={formatDate(selectedUser.createdAt)} />
                            <Detail label="Last Updated" value={formatDate(selectedUser.updatedAt)} />
                        </div>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                            Portal services are linked using this member&apos;s email or mobile against live client records.
                        </div>
                    </div>
                ) : null}
            </Drawer>
        </div>
    )
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-2 text-sm font-bold text-gray-900">{value}</p>
        </div>
    )
}
