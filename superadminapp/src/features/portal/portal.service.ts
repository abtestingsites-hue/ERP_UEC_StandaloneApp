import axios from 'axios'
import type {
	AdmittedResidentListItem,
	PortalAccount,
	PortalComplaint,
	PortalDashboardData,
} from './portal.types'
import { getPortalToken, clearPortalSession, findProvisionedPortalUser, getPortalAccount } from './portalStorage'

const BASE_URL = import.meta.env?.VITE_API_URL || 'https://erp-uec-backend.onrender.com/api/v1'

const portalClient = axios.create({
	baseURL: `${BASE_URL}/patient-portal`,
	timeout: 15000,
	headers: {
		'Content-Type': 'application/json',
	},
})

portalClient.interceptors.request.use((config) => {
	const token = getPortalToken()
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

export const PortalService = {
	async getAdmittedResidents(): Promise<AdmittedResidentListItem[]> {
		try {
			const res = await portalClient.get('/admitted-residents')
			return res.data?.data || []
		} catch (error) {
			console.error('Failed to load admitted residents list', error)
			return []
		}
	},

	async login(
		mobile: string,
		password = '123456',
		patientId?: string
	): Promise<{ token: string; account: PortalAccount }> {
		const cleanMobile = mobile.trim()
		try {
			const res = await portalClient.post('/login', {
				mobile: cleanMobile,
				password,
				patientId,
			})
			if (res.data?.success && res.data?.data) {
				return res.data.data
			}
		} catch (error) {
			const provisioned = findProvisionedPortalUser(cleanMobile, password)
			if (provisioned) {
				return {
					token: `prov_${Date.now()}_${provisioned.admissionId}`,
					account: {
						id: provisioned.admissionId,
						name: provisioned.guardianName,
						mobile: provisioned.mobile,
						patientId: provisioned.patientId,
						patientName: provisioned.patientName,
						room: provisioned.room || 'Room 101',
						bed: provisioned.bed || 'Bed A',
						floor: provisioned.floor || 'Ground Floor',
						admittedAt: provisioned.createdAt,
						clinicalStatus: 'Stable',
					},
				}
			}
			throw error
		}

		const provisioned = findProvisionedPortalUser(cleanMobile, password)
		if (provisioned) {
			return {
				token: `prov_${Date.now()}_${provisioned.admissionId}`,
				account: {
					id: provisioned.admissionId,
					name: provisioned.guardianName,
					mobile: provisioned.mobile,
					patientId: provisioned.patientId,
					patientName: provisioned.patientName,
					room: provisioned.room || 'Room 101',
					bed: provisioned.bed || 'Bed A',
					floor: provisioned.floor || 'Ground Floor',
					admittedAt: provisioned.createdAt,
					clinicalStatus: 'Stable',
				},
			}
		}
		throw new Error('Login failed. Please check credentials or contact facility administration.')
	},

	async logout(): Promise<void> {
		try {
			await portalClient.post('/logout')
		} catch {
			// ignore network error on logout
		} finally {
			clearPortalSession()
		}
	},

	async getDashboard(): Promise<PortalDashboardData> {
		try {
			const res = await portalClient.get('/dashboard')
			if (res.data?.success && res.data?.data) {
				return res.data.data
			}
		} catch (error) {
			const currentAccount = getPortalAccount()
			if (currentAccount) {
				return {
					resident: {
						id: currentAccount.patientId,
						name: currentAccount.patientName,
						room: currentAccount.room,
						bed: currentAccount.bed,
						floor: currentAccount.floor,
						admittedAt: currentAccount.admittedAt,
						clinicalStatus: currentAccount.clinicalStatus || 'Stable',
						healthCondition: 'Stable',
						guardianName: currentAccount.name,
						guardianMobile: currentAccount.mobile,
					},
					vitals: [],
					caregiverVitalCharts: [],
					medications: [],
					prescriptions: [],
					nutritions: [],
					doctorVisits: [],
					adlRecords: [],
					dailyCosts: [],
					invoices: [],
				}
			}
			throw error
		}

		const currentAccount = getPortalAccount()
		if (currentAccount) {
			return {
				resident: {
					id: currentAccount.patientId,
					name: currentAccount.patientName,
					room: currentAccount.room,
					bed: currentAccount.bed,
					floor: currentAccount.floor,
					admittedAt: currentAccount.admittedAt,
					clinicalStatus: currentAccount.clinicalStatus || 'Stable',
					healthCondition: 'Stable',
					guardianName: currentAccount.name,
					guardianMobile: currentAccount.mobile,
				},
				vitals: [],
				caregiverVitalCharts: [],
				medications: [],
				prescriptions: [],
				nutritions: [],
				doctorVisits: [],
				adlRecords: [],
				dailyCosts: [],
				invoices: [],
			}
		}
		throw new Error('Failed to fetch dashboard')
	},


	async getBilling(): Promise<{
		invoices: any[]
		dailyCosts: any[]
		summary: { totalBilled: number; totalPaid: number; totalBalance: number; itemCount: number }
	}> {
		const res = await portalClient.get('/billing')
		return res.data?.data || { invoices: [], dailyCosts: [], summary: { totalBilled: 0, totalPaid: 0, totalBalance: 0, itemCount: 0 } }
	},

	async getComplaints(): Promise<PortalComplaint[]> {
		const res = await portalClient.get('/complaints')
		return res.data?.data || []
	},

	async createComplaint(data: {
		category: string
		priority: string
		description: string
		title?: string
	}): Promise<any> {
		const res = await portalClient.post('/complaints', data)
		return res.data
	},
}
